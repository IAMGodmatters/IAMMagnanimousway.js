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
  `CREATE TABLE IF NOT EXISTS telecom_network_events (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,actor_user_id TEXT NOT NULL DEFAULT '',event_type TEXT NOT NULL,provider_key TEXT NOT NULL DEFAULT '',jurisdiction TEXT NOT NULL DEFAULT '',detail_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_mobile_home_identities (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,label TEXT NOT NULL DEFAULT 'Magnanimous Home Network',country_code TEXT NOT NULL DEFAULT '',mcc TEXT NOT NULL DEFAULT '',mnc TEXT NOT NULL DEFAULT '',hni TEXT NOT NULL DEFAULT '',identity_type TEXT NOT NULL DEFAULT 'mvno',assignment_status TEXT NOT NULL DEFAULT 'planned',authority_reference TEXT NOT NULL DEFAULT '',evidence_reference TEXT NOT NULL DEFAULT '',provider_contract_reference TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,hni))`,
  `CREATE TABLE IF NOT EXISTS telecom_mobile_wholesale_agreements (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,provider_key TEXT NOT NULL,agreement_type TEXT NOT NULL DEFAULT 'host_mno',status TEXT NOT NULL DEFAULT 'planned',home_identity_id TEXT,services_json TEXT NOT NULL DEFAULT '[]',countries_json TEXT NOT NULL DEFAULT '[]',effective_from INTEGER,effective_to INTEGER,evidence_reference TEXT NOT NULL DEFAULT '',pricing_reference TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_mobile_roaming_coverage (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,agreement_id TEXT NOT NULL,country_code TEXT NOT NULL,network_code TEXT NOT NULL DEFAULT '',network_label TEXT NOT NULL DEFAULT '',services_json TEXT NOT NULL DEFAULT '[]',access_json TEXT NOT NULL DEFAULT '[]',status TEXT NOT NULL DEFAULT 'planned',breakout_region TEXT NOT NULL DEFAULT '',quality_score REAL NOT NULL DEFAULT 50,latency_ms INTEGER NOT NULL DEFAULT 0,data_cost_micros_per_mb INTEGER NOT NULL DEFAULT 0,voice_cost_micros_per_minute INTEGER NOT NULL DEFAULT 0,sms_cost_micros INTEGER NOT NULL DEFAULT 0,origin_currency TEXT NOT NULL DEFAULT 'USD',origin_cost_reference TEXT NOT NULL DEFAULT '',origin_cost_verified_at INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,agreement_id,country_code,network_code))`,
  `CREATE TABLE IF NOT EXISTS telecom_mobile_access_policies (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL DEFAULT 'Global mobile default',primary_sim_id TEXT NOT NULL DEFAULT '',backup_sim_id TEXT NOT NULL DEFAULT '',selection_mode TEXT NOT NULL DEFAULT 'balanced',manual_network_selection INTEGER NOT NULL DEFAULT 1,max_data_cost_micros_per_mb INTEGER NOT NULL DEFAULT 0,max_voice_cost_micros_per_minute INTEGER NOT NULL DEFAULT 0,max_sms_cost_micros INTEGER NOT NULL DEFAULT 0,max_latency_ms INTEGER NOT NULL DEFAULT 0,min_quality_score REAL NOT NULL DEFAULT 0,preferred_breakout_regions_json TEXT NOT NULL DEFAULT '[]',fallback_order_json TEXT NOT NULL DEFAULT '["primary","backup","app_dialer"]',status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`
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


const MOBILE_SERVICES=['data','voice','sms'];
const MOBILE_AGREEMENT_TYPES=['host_mno','roaming_hub','direct_roaming','smdp','esim_platform'];
const MOBILE_AGREEMENT_STATES=['planned','negotiating','executed','verified','suspended','retired'];
const MOBILE_IDENTITY_STATES=['planned','applied','assigned','verified','rejected','retired'];
const MOBILE_SELECTION_MODES=['balanced','least_cost','quality','priority'];
const ORIGIN_RATE_FRESHNESS_SECONDS=30*86400;

function arrayJson(value){return JSON.stringify(Array.isArray(value)?value:[])}
function cleanCountry(value){return String(value||'').trim().toUpperCase().replace(/[^A-Z]/g,'').slice(0,2)}
function nonNegativeInt(value){const n=Number(value);return Number.isSafeInteger(n)&&n>=0?n:null}
function parsedArray(value){try{const out=JSON.parse(value||'[]');return Array.isArray(out)?out:[]}catch{return[]}}
function mobileUnitCost(row,service){
 if(service==='voice')return Number(row.voice_cost_micros_per_minute||0);
 if(service==='sms')return Number(row.sms_cost_micros||0);
 return Number(row.data_cost_micros_per_mb||0);
}
function verifiedOriginPrice(row,service){
 const origin=mobileUnitCost(row,service),verifiedAt=Number(row.origin_cost_verified_at||0),reference=String(row.origin_cost_reference||'').trim();
 const fresh=Boolean(reference&&verifiedAt&&verifiedAt>=now()-ORIGIN_RATE_FRESHNESS_SECONDS);
 return{origin_cost_micros:origin,origin_cost_reference:reference||null,origin_cost_verified_at:verifiedAt||null,origin_cost_fresh:fresh,customer_price_micros:fresh?Math.ceil(origin*1.2):null,markup_percent:fresh?20:null,billable:fresh};
}
async function globalMobileSummary(env,tenant){
 const [identity,agreements,coverage,policies]=await Promise.all([
  env.DB.prepare("SELECT COUNT(*) n,SUM(CASE WHEN assignment_status IN ('assigned','verified') AND evidence_reference<>'' THEN 1 ELSE 0 END) verified FROM telecom_mobile_home_identities WHERE tenant_id=?").bind(tenant).first(),
  env.DB.prepare("SELECT COUNT(*) n,SUM(CASE WHEN status IN ('executed','verified') AND evidence_reference<>'' THEN 1 ELSE 0 END) verified FROM telecom_mobile_wholesale_agreements WHERE tenant_id=?").bind(tenant).first(),
  env.DB.prepare("SELECT COUNT(DISTINCT country_code) countries,SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) active FROM telecom_mobile_roaming_coverage WHERE tenant_id=?").bind(tenant).first(),
  env.DB.prepare("SELECT COUNT(*) n,SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) active FROM telecom_mobile_access_policies WHERE tenant_id=?").bind(tenant).first()
 ]);
 const agreementReady=Number(agreements?.verified||0)>0,coverageReady=Number(coverage?.active||0)>0;
 return{
  software_control_ready:true,
  home_network_identity_ready:Number(identity?.verified||0)>0,
  wholesale_agreement_ready:agreementReady,
  roaming_coverage_ready:coverageReady,
  roaming_coverage_countries:Number(coverage?.countries||0),
  active_access_policy:Number(policies?.active||0)>0,
  global_mobile_live:truthy(env?.TELECOM_GLOBAL_MOBILE_LIVE)&&agreementReady&&coverageReady,
  pricing_policy:'verified exact origin cost + 20%; no customer price when origin rate evidence is absent or stale',
  origin_rate_freshness_seconds:ORIGIN_RATE_FRESHNESS_SECONDS,
  primary_backup_strategy:'primary eSIM/SIM + backup eSIM/SIM + app/VoIP fallback, controlled by Magnanimous policy',
  data_breakout_strategy:'prefer configured regional breakout to reduce roaming hairpin latency; never claim local breakout unless the agreement/coverage record proves it',
  truth_boundary:'Software, HNI metadata and route planning do not create an MVNO contract, roaming agreement, spectrum right or regulator authorization. Global mobile stays NOT LIVE until external agreements, coverage and live verification exist.'
 };
}
async function globalMobilePlan(env,tenant,country,service='data',mode='balanced',policyId=''){
 const cc=cleanCountry(country),svc=MOBILE_SERVICES.includes(String(service))?String(service):'data',selection=MOBILE_SELECTION_MODES.includes(String(mode))?String(mode):'balanced';
 if(!cc)return{error:'A two-letter country code is required.'};
 const policy=policyId
  ?await env.DB.prepare("SELECT * FROM telecom_mobile_access_policies WHERE tenant_id=? AND id=?").bind(tenant,String(policyId)).first()
  :await env.DB.prepare("SELECT * FROM telecom_mobile_access_policies WHERE tenant_id=? AND status='active' ORDER BY updated_at DESC LIMIT 1").bind(tenant).first();
 const {results=[]}=await env.DB.prepare(`SELECT c.*,a.provider_key,a.agreement_type,a.status agreement_status,a.evidence_reference agreement_evidence,a.pricing_reference
 FROM telecom_mobile_roaming_coverage c JOIN telecom_mobile_wholesale_agreements a ON a.id=c.agreement_id AND a.tenant_id=c.tenant_id
 WHERE c.tenant_id=? AND c.country_code=? AND c.status='active' AND a.status IN ('executed','verified') AND a.evidence_reference<>'' ORDER BY c.quality_score DESC,c.latency_ms ASC,c.id ASC`).bind(tenant,cc).all();
 const maxCost=svc==='voice'?Number(policy?.max_voice_cost_micros_per_minute||0):svc==='sms'?Number(policy?.max_sms_cost_micros||0):Number(policy?.max_data_cost_micros_per_mb||0);
 const maxLatency=Number(policy?.max_latency_ms||0),minQuality=Number(policy?.min_quality_score||0),preferred=parsedArray(policy?.preferred_breakout_regions_json);
 const eligible=results.map(row=>{
  const services=parsedArray(row.services_json),access=parsedArray(row.access_json),price=verifiedOriginPrice(row,svc),cost=price.origin_cost_micros,quality=Number(row.quality_score||0),latency=Number(row.latency_ms||0),breakout=String(row.breakout_region||'');
  const supports=!services.length||services.includes(svc),underCost=!maxCost||cost<=maxCost,underLatency=!maxLatency||!latency||latency<=maxLatency,qualityOk=!minQuality||quality>=minQuality;
  const preferredBreakout=preferred.includes(breakout);
  return{coverage_id:row.id,agreement_id:row.agreement_id,provider_key:row.provider_key,agreement_type:row.agreement_type,country_code:row.country_code,network_code:row.network_code,network_label:row.network_label,services,access,breakout_region:breakout,quality_score:quality,latency_ms:latency,...price,eligible:supports&&underCost&&underLatency&&qualityOk,policy_checks:{supports_service:supports,under_cost_cap:underCost,under_latency_cap:underLatency,min_quality_met:qualityOk,preferred_breakout:preferredBreakout}};
 }).filter(x=>x.eligible);
 const sorter=(a,b)=>{
  if(selection==='least_cost')return a.origin_cost_micros-b.origin_cost_micros||b.quality_score-a.quality_score||a.latency_ms-b.latency_ms;
  if(selection==='quality')return b.quality_score-a.quality_score||a.latency_ms-b.latency_ms||a.origin_cost_micros-b.origin_cost_micros;
  if(selection==='priority')return Number(b.policy_checks.preferred_breakout)-Number(a.policy_checks.preferred_breakout)||b.quality_score-a.quality_score||a.origin_cost_micros-b.origin_cost_micros;
  const aScore=a.quality_score-(a.latency_ms?Math.min(a.latency_ms,1000)/50:0)-(a.origin_cost_micros/1000000),bScore=b.quality_score-(b.latency_ms?Math.min(b.latency_ms,1000)/50:0)-(b.origin_cost_micros/1000000);
  return bScore-aScore;
 };
 eligible.sort(sorter);const selected=eligible[0]||null;
 const summary=await globalMobileSummary(env,tenant);
 return{country_code:cc,service:svc,selection_mode:selection,policy_id:policy?.id||null,selected,eligible_routes:eligible.length,global_mobile_live:summary.global_mobile_live,execution_authorized:Boolean(summary.global_mobile_live&&selected?.billable),execution_note:'This control-plane route plan does not itself attach to a radio network. Live execution requires a verified host/roaming agreement, authorized provisioning adapter, active coverage, verified fresh origin pricing and TELECOM_GLOBAL_MOBILE_LIVE=true.',pricing_note:'Customer unit price is generated only from a verified fresh origin cost and is exactly origin cost + 20%.'};
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
    selected_route_execution:{native_telecom_core:true,generic_byoc:false,twilio_compatibility:true,plivo_compatibility:true},
    execution_note:'Explicit Twilio and Plivo route types now execute only when selected by the Magnanimous planner and pass authenticated account-health checks. The protected Magnanimous Telecom Core keeps its authenticated Asterisk route gate. Generic BYOC plus no-route legacy compatibility fallbacks remain outside full planner authority, so all-live-route authority remains false.',
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
   global_mobile:await globalMobileSummary(env,tenant),
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


 if(path==='/api/telecom/network/global-mobile/home-identities'&&request.method==='GET'){
  const{results=[]}=await env.DB.prepare('SELECT * FROM telecom_mobile_home_identities WHERE tenant_id=? ORDER BY updated_at DESC').bind(tenant).all();return json({identities:results});
 }
 if(path==='/api/telecom/network/global-mobile/home-identities'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),country=cleanCountry(body.country_code),mcc=String(body.mcc||'').replace(/\D/g,'').slice(0,3),mnc=String(body.mnc||'').replace(/\D/g,'').slice(0,3),hni=String(body.hni||((mcc&&mnc)?`${mcc}-${mnc}`:'')).trim().slice(0,16),status=String(body.assignment_status||'planned');
  if(!country||!mcc||!mnc||!hni)return json({detail:'country_code, MCC, MNC and HNI are required.'},422);
  if(!MOBILE_IDENTITY_STATES.includes(status))return json({detail:'Unsupported home-network identity status.'},422);
  const authority=String(body.authority_reference||'').trim().slice(0,500),evidence=String(body.evidence_reference||'').trim().slice(0,500);
  if(['assigned','verified'].includes(status)&&(!authority||!evidence))return json({detail:'Assigned/verified HNI status requires authority_reference and evidence_reference.'},409);
  const ts=now(),identityId=id('hni');
  await env.DB.prepare(`INSERT INTO telecom_mobile_home_identities(id,tenant_id,label,country_code,mcc,mnc,hni,identity_type,assignment_status,authority_reference,evidence_reference,provider_contract_reference,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,hni) DO UPDATE SET label=excluded.label,country_code=excluded.country_code,mcc=excluded.mcc,mnc=excluded.mnc,identity_type=excluded.identity_type,assignment_status=excluded.assignment_status,authority_reference=excluded.authority_reference,evidence_reference=excluded.evidence_reference,provider_contract_reference=excluded.provider_contract_reference,notes=excluded.notes,updated_at=excluded.updated_at`).bind(identityId,tenant,String(body.label||'Magnanimous Home Network').trim().slice(0,120),country,mcc,mnc,hni,String(body.identity_type||'mvno').trim().slice(0,40),status,authority,evidence,String(body.provider_contract_reference||'').trim().slice(0,500),String(body.notes||'').trim().slice(0,2000),ts,ts).run();
  await event(env,tenant,user,'global_mobile.home_identity.updated','',country,{hni,status});return json({ok:true,hni,assignment_status:status},201);
 }
 if(path==='/api/telecom/network/global-mobile/agreements'&&request.method==='GET'){
  const{results=[]}=await env.DB.prepare('SELECT * FROM telecom_mobile_wholesale_agreements WHERE tenant_id=? ORDER BY updated_at DESC').bind(tenant).all();return json({agreements:results.map(row=>({...row,services:parsedArray(row.services_json),countries:parsedArray(row.countries_json)}))});
 }
 if(path==='/api/telecom/network/global-mobile/agreements'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),providerKey=String(body.provider_key||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,80),type=String(body.agreement_type||'host_mno'),status=String(body.status||'planned'),evidence=String(body.evidence_reference||'').trim().slice(0,500);
  if(!providerKey)return json({detail:'provider_key is required.'},422);
  if(!MOBILE_AGREEMENT_TYPES.includes(type)||!MOBILE_AGREEMENT_STATES.includes(status))return json({detail:'Unsupported agreement type or status.'},422);
  if(['executed','verified'].includes(status)&&!evidence)return json({detail:'Executed/verified wholesale agreements require an evidence_reference.'},409);
  const homeIdentity=String(body.home_identity_id||'').trim();if(homeIdentity){const found=await env.DB.prepare('SELECT id FROM telecom_mobile_home_identities WHERE tenant_id=? AND id=?').bind(tenant,homeIdentity).first();if(!found)return json({detail:'home_identity_id was not found for this tenant.'},404)}
  const ts=now(),agreementId=id('mobagr');
  await env.DB.prepare(`INSERT INTO telecom_mobile_wholesale_agreements(id,tenant_id,provider_key,agreement_type,status,home_identity_id,services_json,countries_json,effective_from,effective_to,evidence_reference,pricing_reference,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(agreementId,tenant,providerKey,type,status,homeIdentity||null,arrayJson(body.services),arrayJson((body.countries||[]).map(cleanCountry).filter(Boolean)),body.effective_from?Number(body.effective_from):null,body.effective_to?Number(body.effective_to):null,evidence,String(body.pricing_reference||'').trim().slice(0,500),String(body.notes||'').trim().slice(0,2000),ts,ts).run();
  await event(env,tenant,user,'global_mobile.agreement.created',providerKey,'',{agreement_id:agreementId,type,status});return json({ok:true,id:agreementId,status},201);
 }
 if(path==='/api/telecom/network/global-mobile/coverage'&&request.method==='GET'){
  const country=cleanCountry(url.searchParams.get('country'));const bind=country?[tenant,country]:[tenant],where=country?'tenant_id=? AND country_code=?':'tenant_id=?';
  const{results=[]}=await env.DB.prepare(`SELECT * FROM telecom_mobile_roaming_coverage WHERE ${where} ORDER BY country_code,quality_score DESC,latency_ms ASC`).bind(...bind).all();return json({coverage:results.map(row=>({...row,services:parsedArray(row.services_json),access:parsedArray(row.access_json)}))});
 }
 if(path==='/api/telecom/network/global-mobile/coverage'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),agreementId=String(body.agreement_id||'').trim(),country=cleanCountry(body.country_code),status=String(body.status||'planned');
  if(!agreementId||!country)return json({detail:'agreement_id and country_code are required.'},422);
  if(!['planned','testing','active','suspended','retired'].includes(status))return json({detail:'Unsupported coverage status.'},422);
  const agreement=await env.DB.prepare('SELECT id,status,evidence_reference FROM telecom_mobile_wholesale_agreements WHERE tenant_id=? AND id=?').bind(tenant,agreementId).first();if(!agreement)return json({detail:'Wholesale agreement not found.'},404);
  if(status==='active'&&(!['executed','verified'].includes(String(agreement.status))||!String(agreement.evidence_reference||'').trim()))return json({detail:'Active roaming coverage requires an executed/verified wholesale agreement with evidence.'},409);
  const dataCost=nonNegativeInt(body.data_cost_micros_per_mb??0),voiceCost=nonNegativeInt(body.voice_cost_micros_per_minute??0),smsCost=nonNegativeInt(body.sms_cost_micros??0);if([dataCost,voiceCost,smsCost].some(v=>v===null))return json({detail:'Origin costs must be non-negative integer micros.'},422);
  const originRef=String(body.origin_cost_reference||'').trim().slice(0,500),verifiedAt=body.origin_cost_verified_at?Number(body.origin_cost_verified_at):null;
  if((dataCost||voiceCost||smsCost)&&(!originRef||!verifiedAt))return json({detail:'Any non-zero origin cost requires origin_cost_reference and origin_cost_verified_at.'},409);
  const ts=now(),coverageId=id('cov');
  await env.DB.prepare(`INSERT INTO telecom_mobile_roaming_coverage(id,tenant_id,agreement_id,country_code,network_code,network_label,services_json,access_json,status,breakout_region,quality_score,latency_ms,data_cost_micros_per_mb,voice_cost_micros_per_minute,sms_cost_micros,origin_currency,origin_cost_reference,origin_cost_verified_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,agreement_id,country_code,network_code) DO UPDATE SET network_label=excluded.network_label,services_json=excluded.services_json,access_json=excluded.access_json,status=excluded.status,breakout_region=excluded.breakout_region,quality_score=excluded.quality_score,latency_ms=excluded.latency_ms,data_cost_micros_per_mb=excluded.data_cost_micros_per_mb,voice_cost_micros_per_minute=excluded.voice_cost_micros_per_minute,sms_cost_micros=excluded.sms_cost_micros,origin_currency=excluded.origin_currency,origin_cost_reference=excluded.origin_cost_reference,origin_cost_verified_at=excluded.origin_cost_verified_at,updated_at=excluded.updated_at`).bind(coverageId,tenant,agreementId,country,String(body.network_code||'').trim().slice(0,32),String(body.network_label||'').trim().slice(0,120),arrayJson((body.services||[]).filter(x=>MOBILE_SERVICES.includes(String(x)))),arrayJson(body.access),status,String(body.breakout_region||'').trim().slice(0,80),Math.max(0,Math.min(100,Number(body.quality_score??50))),Math.max(0,Number(body.latency_ms||0)),dataCost,voiceCost,smsCost,String(body.origin_currency||'USD').trim().toUpperCase().slice(0,8),originRef,verifiedAt,ts,ts).run();
  await event(env,tenant,user,'global_mobile.coverage.updated','',country,{agreement_id:agreementId,status,network_code:String(body.network_code||'')});return json({ok:true,id:coverageId,country_code:country,status},201);
 }
 if(path==='/api/telecom/network/global-mobile/policies'&&request.method==='GET'){
  const{results=[]}=await env.DB.prepare('SELECT * FROM telecom_mobile_access_policies WHERE tenant_id=? ORDER BY status DESC,updated_at DESC').bind(tenant).all();return json({policies:results.map(row=>({...row,preferred_breakout_regions:parsedArray(row.preferred_breakout_regions_json),fallback_order:parsedArray(row.fallback_order_json)}))});
 }
 if(path==='/api/telecom/network/global-mobile/policies'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),mode=String(body.selection_mode||'balanced'),status=String(body.status||'draft');if(!MOBILE_SELECTION_MODES.includes(mode))return json({detail:'Unsupported mobile selection mode.'},422);if(!['draft','active','retired'].includes(status))return json({detail:'Unsupported policy status.'},422);
  const costs=['max_data_cost_micros_per_mb','max_voice_cost_micros_per_minute','max_sms_cost_micros'].map(k=>nonNegativeInt(body[k]??0));if(costs.some(v=>v===null))return json({detail:'Mobile policy cost caps must be non-negative integer micros.'},422);
  const ts=now(),policyId=id('mobpol');if(status==='active')await env.DB.prepare("UPDATE telecom_mobile_access_policies SET status='retired',updated_at=? WHERE tenant_id=? AND status='active'").bind(ts,tenant).run();
  await env.DB.prepare(`INSERT INTO telecom_mobile_access_policies(id,tenant_id,name,primary_sim_id,backup_sim_id,selection_mode,manual_network_selection,max_data_cost_micros_per_mb,max_voice_cost_micros_per_minute,max_sms_cost_micros,max_latency_ms,min_quality_score,preferred_breakout_regions_json,fallback_order_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(policyId,tenant,String(body.name||'Global mobile default').trim().slice(0,120),String(body.primary_sim_id||'').trim().slice(0,120),String(body.backup_sim_id||'').trim().slice(0,120),mode,body.manual_network_selection===false?0:1,costs[0],costs[1],costs[2],Math.max(0,Number(body.max_latency_ms||0)),Math.max(0,Math.min(100,Number(body.min_quality_score||0))),arrayJson(body.preferred_breakout_regions),arrayJson(Array.isArray(body.fallback_order)?body.fallback_order:['primary','backup','app_dialer']),status,ts,ts).run();
  await event(env,tenant,user,'global_mobile.policy.created','', '',{policy_id:policyId,status,selection_mode:mode});return json({ok:true,id:policyId,status},201);
 }
 if(path==='/api/telecom/network/global-mobile/route-plan'&&request.method==='GET'){
  return json(await globalMobilePlan(env,tenant,url.searchParams.get('country'),url.searchParams.get('service')||'data',url.searchParams.get('mode')||'balanced',url.searchParams.get('policy_id')||''));
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
