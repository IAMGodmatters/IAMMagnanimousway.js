import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const id=prefix=>`${prefix}_${crypto.randomUUID()}`;
const truthy=value=>String(value||'').toLowerCase()==='true';
const ownerOnly=user=>user?.role==='owner';

const US_CASES=[
 ['fcc_frn','FCC Registration Number (FRN)'],
 ['fcc_499','FCC Form 499 registration/reporting'],
 ['robocall_mitigation','Robocall Mitigation Database filing'],
 ['e911','911/E911 service and registered-location compliance'],
 ['direct_numbering','Direct access to NANP numbering resources'],
 ['state_authority','State-specific telecom/VoIP authority review']
];
const PH_CASES=[
 ['ntc_voip_vas','NTC VoIP/VAS provider or reseller registration'],
 ['network_lease','Authorized facilities/network lease'],
 ['interconnection','Authorized interconnection agreement'],
 ['vno_mvno_hosting','VNO/MVNO host-network agreement'],
 ['sim_registration','SIM Registration Act operating compliance'],
 ['franchise_cpcn','Congressional franchise + CPCN for facilities-based public telecom']
];

async function ensureSchema(env){
 if(!env?.DB)return;
 const statements=[
  `CREATE TABLE IF NOT EXISTS telecom_network_providers (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,provider_key TEXT NOT NULL,display_name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'wholesale',status TEXT NOT NULL DEFAULT 'planned',capabilities_json TEXT NOT NULL DEFAULT '{}',secret_binding_name TEXT NOT NULL DEFAULT '',account_reference TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,provider_key,role))`,
  `CREATE TABLE IF NOT EXISTS telecom_regulatory_cases (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,jurisdiction TEXT NOT NULL,authority_key TEXT NOT NULL,authority_name TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'not_started',application_reference TEXT NOT NULL DEFAULT '',evidence_reference TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,jurisdiction,authority_key))`,
  `CREATE TABLE IF NOT EXISTS telecom_network_events (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,actor_user_id TEXT NOT NULL DEFAULT '',event_type TEXT NOT NULL,provider_key TEXT NOT NULL DEFAULT '',jurisdiction TEXT NOT NULL DEFAULT '',detail_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`
 ];
 for(const sql of statements){try{await env.DB.prepare(sql).run()}catch(error){console.error('telecom network schema repair failed',error)}}
}

async function seedCases(env,tenant){
 const ts=now();
 for(const [jurisdiction,cases] of [['US',US_CASES],['PH',PH_CASES]]){
  for(const [key,name] of cases){
   try{
    await env.DB.prepare(`INSERT OR IGNORE INTO telecom_regulatory_cases(id,tenant_id,jurisdiction,authority_key,authority_name,status,created_at,updated_at) VALUES(?,?,?,?,?,'not_started',?,?)`)
     .bind(id('reg'),tenant,jurisdiction,key,name,ts,ts).run();
   }catch(error){console.error('regulatory readiness seed failed',error)}
  }
 }
}

async function event(env,tenant,user,eventType,providerKey='',jurisdiction='',detail={}){
 try{
  await env.DB.prepare('INSERT INTO telecom_network_events(tenant_id,actor_user_id,event_type,provider_key,jurisdiction,detail_json,created_at) VALUES(?,?,?,?,?,?,?)')
   .bind(tenant,String(user?.id||user?.user_id||''),eventType,providerKey,jurisdiction,JSON.stringify(detail||{}),now()).run();
 }catch(error){console.error('telecom network event failed',error)}
}

function providerReadiness(env){
 return{
  wholesale_voice:Boolean(String(env?.VOIP_PROVIDER_URL||'').trim()&&String(env?.VOIP_PROVIDER_TOKEN||'').trim()),
  telnyx:Boolean(String(env?.TELNYX_API_KEY||'').trim()),
  gigs:Boolean(String(env?.GIGS_API_TOKEN||'').trim()&&String(env?.GIGS_PROJECT_ID||'').trim()),
  emergency_enabled:truthy(env?.TELECOM_EMERGENCY_LIVE),
  direct_numbering_authorized:truthy(env?.TELECOM_DIRECT_NUMBERING_AUTHORIZED),
  carrier_authorized:truthy(env?.TELECOM_CARRIER_AUTHORIZED),
  native_webrtc_live:truthy(env?.TELECOM_NATIVE_WEBRTC_LIVE),
  purchases_enabled:truthy(env?.TELECOM_PURCHASE_ACTIONS_ENABLED),
  regulated_actions_enabled:truthy(env?.TELECOM_REGULATED_ACTIONS_ENABLED)
 };
}

async function telnyx(env,path,{method='GET',body}={}){
 const token=String(env?.TELNYX_API_KEY||'').trim();
 if(!token)throw Object.assign(new Error('TELNYX_API_KEY is not configured in runtime secrets.'),{status:503});
 const response=await fetch(`https://api.telnyx.com/v2${path}`,{
  method,
  headers:{Authorization:`Bearer ${token}`,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},
  body:body?JSON.stringify(body):undefined
 });
 const text=await response.text();let data;try{data=JSON.parse(text)}catch{data={detail:text}}
 if(!response.ok){const error=new Error(data?.errors?.[0]?.detail||data?.detail||`Telnyx request failed (${response.status}).`);error.status=response.status;throw error}
 return data;
}

async function gigs(env,path){
 const token=String(env?.GIGS_API_TOKEN||'').trim();
 const project=String(env?.GIGS_PROJECT_ID||'').trim();
 if(!token||!project)throw Object.assign(new Error('GIGS_API_TOKEN and GIGS_PROJECT_ID are not configured in runtime secrets.'),{status:503});
 const response=await fetch(`https://api.gigs.com/projects/${encodeURIComponent(project)}${path}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
 const text=await response.text();let data;try{data=JSON.parse(text)}catch{data={detail:text}}
 if(!response.ok){const error=new Error(data?.message||data?.detail||`Gigs request failed (${response.status}).`);error.status=response.status;throw error}
 return data;
}

function requirePurchaseGate(env,body){
 if(!truthy(env?.TELECOM_PURCHASE_ACTIONS_ENABLED))return 'Paid telecom actions are locked. Set TELECOM_PURCHASE_ACTIONS_ENABLED=true only when the owner is ready for purchases.';
 if(body?.confirm_purchase!==true)return 'Explicit confirm_purchase=true is required for a paid telecom action.';
 return '';
}
function requireRegulatedGate(env,body){
 if(!truthy(env?.TELECOM_REGULATED_ACTIONS_ENABLED))return 'Regulated telecom actions are locked. Set TELECOM_REGULATED_ACTIONS_ENABLED=true only after the applicable compliance path is ready.';
 if(body?.confirm_regulated_action!==true)return 'Explicit confirm_regulated_action=true is required.';
 return '';
}

export async function handleMagnanimousTelecomNetwork(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/telecom/network'))return null;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'}});
 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in to Magnanimous Telecom.'},401);
 if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
 await ensureSchema(env);
 const tenant=String(user.tenant_id||'');
 await seedCases(env,tenant);

 if(path==='/api/telecom/network/overview'&&request.method==='GET'){
  const [providers,cases]=await Promise.all([
   env.DB.prepare('SELECT id,provider_key,display_name,role,status,capabilities_json,secret_binding_name,account_reference,notes,updated_at FROM telecom_network_providers WHERE tenant_id=? ORDER BY provider_key,role').bind(tenant).all(),
   env.DB.prepare('SELECT id,jurisdiction,authority_key,authority_name,status,application_reference,evidence_reference,notes,updated_at FROM telecom_regulatory_cases WHERE tenant_id=? ORDER BY jurisdiction,authority_name').bind(tenant).all()
  ]);
  return json({
   identity:'Magnanimous Telecom',brain:'Magnanimous AI',architecture:'Magnanimous-owned PBX/SIP core with replaceable upstream interconnects',
   readiness:providerReadiness(env),
   routing_policy:{
    order:['free-browser','magnanimous-asterisk-pbx','workspace-byoc-primary','workspace-byoc-secondary','metered-compatibility'],
    route_planner_enabled:true,
    measured_quality_signals:['ASR','ACD','PDD','network_failure_rate'],
    max_rate_enforced:true,
    live_execution_uses_route_planner:false,
    selected_route_execution:{native_telecom_core:true,generic_byoc_requires_bridge_confirmation:true,twilio_compatibility:false,plivo_compatibility:false},
    execution_note:'The Magnanimous Telecom Core now executes an explicit planner-selected SIP route only after validating the endpoint and authenticated Asterisk health. Generic BYOC bridges receive the route request but are counted as applied only if the bridge confirms it. Twilio/Plivo compatibility adapters are not yet behind this contract, so all-live-route authority remains false.',
    failover_boundary:'A secondary SIP interconnect is used only for network-unavailable or congestion outcomes; real busy/no-answer results are not redialed through another carrier.'
   },
   owned_service_core:{provider_key:'magnanimous-telecom',role:'PBX, SIP registrar, routing, policy, CDR and contact-center control',native_pbx:'Asterisk',provider_owned_identity:true},
   preferred_upstream_candidate:{provider_key:'telnyx',role:'default benchmark SIP/number/API candidate',connected:Boolean(String(env?.TELNYX_API_KEY||'').trim()),note:'A strong programmable candidate where destination economics, coverage and measured quality fit; it is not hard-wired as universally best. Credentials alone do not make it a live voice route.'},
   upstream_candidates:[
    {provider_key:'telnyx',role:'programmable SIP, numbers, network APIs',adapter_state:'implemented for regulated-network API actions; voice-route activation still requires a real interconnect',connected:Boolean(String(env?.TELNYX_API_KEY||'').trim())},
    {provider_key:'bandwidth',role:'direct-network/BYOC benchmark, especially U.S. and supported international numbering',adapter_state:'candidate; no dedicated Magnanimous adapter is claimed live',connected:false},
    {provider_key:'plivo',role:'SIP/API route candidate, useful where destination rates and coverage fit',adapter_state:'compatibility carrier adapter exists',connected:Boolean(String(env?.PLIVO_AUTH_ID||'').trim()&&String(env?.PLIVO_AUTH_TOKEN||'').trim())},
    {provider_key:'signalwire',role:'SIP/WebRTC benchmark for supported geographies',adapter_state:'candidate; no dedicated Magnanimous adapter is claimed live',connected:false},
    {provider_key:'twilio',role:'broad compatibility and browser Voice SDK fallback',adapter_state:'compatibility softphone/voice adapter exists',connected:Boolean(String(env?.TWILIO_ACCOUNT_SID||'').trim()&&String(env?.TWILIO_AUTH_TOKEN||'').trim())}
   ],
   native_browser_target:{provider_key:'magnanimous-asterisk-webrtc',role:'owned browser-agent signaling/media target',live:truthy(env?.TELECOM_NATIVE_WEBRTC_LIVE),truth_boundary:'Source readiness is not live readiness; live requires TLS/WSS plus successful browser registration and two-way media verification.'},
   secondary_upstream_candidate:{provider_key:'plivo',role:'secondary SIP/API candidate',connected:Boolean(String(env?.PLIVO_AUTH_ID||'').trim()&&String(env?.PLIVO_AUTH_TOKEN||'').trim()),note:'Use only where route economics, coverage and quality beat the primary path.'},
   compatibility_upstream:{provider_key:'twilio',role:'browser Voice SDK / compatibility carrier',connected:Boolean(String(env?.TWILIO_ACCOUNT_SID||'').trim()&&String(env?.TWILIO_AUTH_TOKEN||'').trim()),note:'Retained for compatibility and browser-agent transport while the native Asterisk WebRTC desk is completed.'},
   mobile_alternative:{provider_key:'gigs',role:'MVNO/mobile subscription adapter',capabilities:['physical_sim','esim','mobile_plans','subscriptions']},
   providers:providers.results||[],regulatory_cases:cases.results||[],
   authority_note:'Software readiness is not regulatory authority. External approvals and provider contracts remain required until completed.'
  });
 }

 if(path==='/api/telecom/network/providers'&&request.method==='POST'){
  const body=await request.json().catch(()=>({}));
  const providerKey=String(body.provider_key||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,80);
  const displayName=String(body.display_name||'').trim().slice(0,120);
  const role=String(body.role||'wholesale').trim().slice(0,80);
  if(!providerKey||!displayName)return json({detail:'provider_key and display_name are required.'},400);
  if(body.api_key||body.token||body.secret||body.password)return json({detail:'Do not submit provider credentials here. Store them only in encrypted runtime secrets and save the binding name.'},400);
  const status=String(body.status||'planned').trim().slice(0,40),binding=String(body.secret_binding_name||'').trim().slice(0,120),accountRef=String(body.account_reference||'').trim().slice(0,200),notes=String(body.notes||'').trim().slice(0,2000),caps=JSON.stringify(body.capabilities||{}),ts=now(),providerId=id('net');
  await env.DB.prepare(`INSERT INTO telecom_network_providers(id,tenant_id,provider_key,display_name,role,status,capabilities_json,secret_binding_name,account_reference,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,provider_key,role) DO UPDATE SET display_name=excluded.display_name,status=excluded.status,capabilities_json=excluded.capabilities_json,secret_binding_name=excluded.secret_binding_name,account_reference=excluded.account_reference,notes=excluded.notes,updated_at=excluded.updated_at`).bind(providerId,tenant,providerKey,displayName,role,status,caps,binding,accountRef,notes,ts,ts).run();
  await event(env,tenant,user,'network.provider.updated',providerKey,'',{role,status,binding});
  return json({ok:true,provider_key:providerKey,role,status},201);
 }

 if(path==='/api/telecom/network/regulatory'&&request.method==='PUT'){
  const body=await request.json().catch(()=>({}));
  const jurisdiction=String(body.jurisdiction||'').trim().toUpperCase().slice(0,20),key=String(body.authority_key||'').trim().slice(0,120),status=String(body.status||'not_started').trim().slice(0,40);
  if(!jurisdiction||!key)return json({detail:'jurisdiction and authority_key are required.'},400);
  if(!['not_started','researching','planned','applying','submitted','pending','blocked','approved','verified','not_applicable'].includes(status))return json({detail:'Unsupported regulatory status.'},400);
  const appRef=String(body.application_reference||'').trim().slice(0,500),evidence=String(body.evidence_reference||'').trim().slice(0,500),notes=String(body.notes||'').trim().slice(0,2000),ts=now();
  const existing=await env.DB.prepare('SELECT id,authority_name FROM telecom_regulatory_cases WHERE tenant_id=? AND jurisdiction=? AND authority_key=?').bind(tenant,jurisdiction,key).first();
  if(!existing)return json({detail:'Unknown regulatory readiness item.'},404);
  await env.DB.prepare('UPDATE telecom_regulatory_cases SET status=?,application_reference=?,evidence_reference=?,notes=?,updated_at=? WHERE id=?').bind(status,appRef,evidence,notes,ts,existing.id).run();
  await event(env,tenant,user,'regulatory.case.updated','',jurisdiction,{authority_key:key,status});
  return json({ok:true,jurisdiction,authority_key:key,status});
 }

 if(path==='/api/telecom/network/telnyx/number-search'&&request.method==='POST'){
  const body=await request.json().catch(()=>({}));
  const country=String(body.country_code||'US').trim().toUpperCase().replace(/[^A-Z]/g,'').slice(0,2);
  const area=String(body.area_code||'').trim().replace(/\D/g,'').slice(0,8);
  const params=new URLSearchParams();params.set('filter[country_code]',country||'US');params.set('filter[limit]','10');
  if(area)params.set('filter[national_destination_code]',area);
  if(body.emergency_capable===true)params.set('filter[features]','emergency');
  try{return json(await telnyx(env,`/available_phone_numbers?${params.toString()}`))}catch(error){return json({detail:error.message},error.status||502)}
 }

 if(path==='/api/telecom/network/telnyx/number-order'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),gate=requirePurchaseGate(env,body);if(gate)return json({detail:gate},409);
  const phone=String(body.phone_number||'').trim();if(!/^\+[1-9]\d{6,14}$/.test(phone))return json({detail:'A valid E.164 phone_number is required.'},422);
  try{const result=await telnyx(env,'/number_orders',{method:'POST',body:{phone_numbers:[{phone_number:phone}]}});await event(env,tenant,user,'telnyx.number.ordered','telnyx','',{phone_number:phone});return json(result,201)}catch(error){return json({detail:error.message},error.status||502)}
 }

 if(path==='/api/telecom/network/telnyx/sim-order-preview'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),addressId=String(body.address_id||'').trim(),quantity=Math.max(1,Math.min(500,Number(body.quantity||1)));if(!addressId)return json({detail:'address_id is required.'},400);
  try{return json(await telnyx(env,'/sim_card_order_preview',{method:'POST',body:{address_id:addressId,quantity}}))}catch(error){return json({detail:error.message},error.status||502)}
 }

 if(path==='/api/telecom/network/telnyx/esim-purchase'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),gate=requirePurchaseGate(env,body);if(gate)return json({detail:gate},409);
  const amount=Math.max(1,Math.min(100,Number(body.amount||1)));const payload={amount};if(body.sim_card_group_id)payload.sim_card_group_id=String(body.sim_card_group_id);if(Array.isArray(body.tags))payload.tags=body.tags.map(String).slice(0,20);
  try{const result=await telnyx(env,'/actions/purchase/esims',{method:'POST',body:payload});await event(env,tenant,user,'telnyx.esim.purchased','telnyx','',{amount});return json(result,202)}catch(error){return json({detail:error.message},error.status||502)}
 }

 if(path==='/api/telecom/network/telnyx/emergency-address'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),gate=requireRegulatedGate(env,body);if(gate)return json({detail:gate},409);
  const allowed=['house_number','street_pre_directional','street_name','street_suffix','street_post_directional','extended_address','locality','administrative_area','postal_code','country_code'];const payload={};for(const key of allowed){if(body[key]!==undefined)payload[key]=String(body[key]).trim()}
  if(!payload.house_number||!payload.street_name||!payload.locality||!payload.administrative_area||!payload.postal_code||!['US','CA','PR'].includes(String(payload.country_code||'').toUpperCase()))return json({detail:'A complete supported emergency address is required (US, CA, or PR).'},422);
  try{const result=await telnyx(env,'/dynamic_emergency_addresses',{method:'POST',body:payload});await event(env,tenant,user,'telnyx.emergency_address.created','telnyx',String(payload.country_code),{locality:payload.locality,administrative_area:payload.administrative_area});return json(result,201)}catch(error){return json({detail:error.message},error.status||502)}
 }

 if(path==='/api/telecom/network/gigs/sims'&&request.method==='GET'){
  try{return json(await gigs(env,'/sims'))}catch(error){return json({detail:error.message},error.status||502)}
 }

 return json({detail:'Magnanimous regulated-network endpoint not found.'},404);
}
