import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const uid=prefix=>`${prefix}_${crypto.randomUUID()}`;
const ownerOnly=user=>user?.role==='owner';
const bool=value=>value===true||String(value).toLowerCase()==='true';
const finite=(value,fallback=0)=>{const n=Number(value);return Number.isFinite(n)&&n>=0?n:fallback};
const objectJson=value=>JSON.stringify(value&&typeof value==='object'&&!Array.isArray(value)?value:{});
const listJson=value=>JSON.stringify(Array.isArray(value)?value:[]);
const services=new Set(['voice','sms','data','roaming_voice','roaming_sms','roaming_data','call_center','other']);

async function locked(env,tenant){
 const row=await env.DB.prepare('SELECT * FROM telecom_provider_policy WHERE tenant_id=?').bind(tenant).first().catch(()=>null);
 return !!row&&row.provider_identity==='Magnanimous Telecom'&&row.brain_identity==='Magnanimous AI'&&Number(row.white_label_allowed)===0&&Number(row.reseller_allowed)===0&&Number(row.subcarrier_allowed)===0&&Number(row.customer_number_resale_allowed)===0&&Number(row.external_provider_brand_override_allowed)===0;
}

async function audit(env,tenant,user,action,type,objectId,detail={}){
 try{await env.DB.prepare(`INSERT INTO telecom_operations_events(tenant_id,actor_user_id,event_type,subject_type,subject_id,detail_json,created_at) VALUES(?,?,?,?,?,?,?)`).bind(tenant,String(user?.id||user?.user_id||''),action,type,objectId,JSON.stringify(detail),now()).run()}catch{}
}

async function quote(env,tenant,service,destination,requestedUnits){
 const ts=now();
 const rows=await env.DB.prepare(`SELECT r.*,d.currency,d.id rate_deck_id FROM telecom_rate_rules r JOIN telecom_rate_decks d ON d.tenant_id=r.tenant_id AND d.id=r.rate_deck_id WHERE r.tenant_id=? AND r.service_type=? AND d.status='active' AND (d.effective_from IS NULL OR d.effective_from<=?) AND (d.effective_to IS NULL OR d.effective_to>?) ORDER BY r.priority ASC`).bind(tenant,service,ts,ts).all().catch(()=>({results:[]}));
 const matches=(rows.results||[]).filter(row=>!row.destination_prefix||String(destination||'').startsWith(String(row.destination_prefix)));
 matches.sort((a,b)=>String(b.destination_prefix||'').length-String(a.destination_prefix||'').length||Number(a.priority||100)-Number(b.priority||100));
 const rule=matches[0];if(!rule)return null;
 const size=Math.max(Number(rule.unit_size||1),0.000001),units=Math.ceil(requestedUnits/size)*size,blocks=units/size;
 const raw=Number(rule.connection_charge||0)+(blocks*Number(rule.unit_rate||0)),charge=Math.max(Number(rule.minimum_charge||0),raw);
 return {rate_deck_id:rule.rate_deck_id,rate_rule_id:rule.id,service_type:service,destination_prefix:String(rule.destination_prefix||''),requested_units:requestedUnits,rated_units:units,unit_name:rule.unit_name,unit_size:size,charge:Number(charge.toFixed(6)),currency:rule.currency||'USD'};
}

export async function handleMagnanimousTelecomBssAdmin(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/telecom/bss'))return null;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'}});
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to Magnanimous Telecom.'},401);if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
 const tenant=String(user.tenant_id||'');if(!tenant)return json({detail:'Tenant context required.'},400);if(!await locked(env,tenant))return json({detail:'Magnanimous Telecom provider identity lock is not satisfied.'},409);

 if(path==='/api/telecom/bss/policy-profiles'&&request.method==='GET'){
  const rows=await env.DB.prepare('SELECT * FROM telecom_policy_profiles WHERE tenant_id=? ORDER BY status,name').bind(tenant).all();return json({identity:'Magnanimous Telecom',brain:'Magnanimous AI',profiles:rows.results||[]});
 }
 if(path==='/api/telecom/bss/policy-profiles'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),service=String(body.service_type||'data');if(!services.has(service))return json({detail:'Unsupported service_type.'},400);const profileId=uid('tpp'),ts=now(),status=body.status==='active'?'active':'draft';
  await env.DB.prepare(`INSERT INTO telecom_policy_profiles(id,tenant_id,name,plan_id,service_type,roaming_allowed,international_allowed,premium_rate_allowed,require_sim_registration,max_event_units,max_daily_units,max_daily_spend,max_event_charge,fair_use_units,throttle_kbps,block_risk_score,blocked_destinations_json,allowed_destinations_json,qos_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(profileId,tenant,String(body.name||`${service} policy`),body.plan_id?String(body.plan_id):null,service,bool(body.roaming_allowed)?1:0,bool(body.international_allowed)?1:0,bool(body.premium_rate_allowed)?1:0,bool(body.require_sim_registration)?1:0,finite(body.max_event_units),finite(body.max_daily_units),finite(body.max_daily_spend),finite(body.max_event_charge),finite(body.fair_use_units),Math.floor(finite(body.throttle_kbps)),finite(body.block_risk_score),listJson(body.blocked_destinations),listJson(body.allowed_destinations),objectJson(body.qos),status,ts,ts).run();
  await audit(env,tenant,user,'telecom_policy_profile_created','policy_profile',profileId,{service_type:service,status});return json({id:profileId,service_type:service,status,identity:'Magnanimous Telecom'},201);
 }

 if(path==='/api/telecom/bss/rate-decks'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),deckId=uid('trd'),ts=now(),ccy=String(body.currency||'USD').toUpperCase();if(!/^[A-Z]{3}$/.test(ccy))return json({detail:'currency must be a three-letter code.'},400);const status=['draft','active','retired'].includes(String(body.status))?String(body.status):'draft';
  await env.DB.prepare(`INSERT INTO telecom_rate_decks(id,tenant_id,name,currency,region,source_kind,source_ref,effective_from,effective_to,status,customer_visible,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,0,?,?)`).bind(deckId,tenant,String(body.name||'Internal rate deck'),ccy,String(body.region||''),['internal','wholesale','interconnect','roaming'].includes(String(body.source_kind))?String(body.source_kind):'internal',String(body.source_ref||''),body.effective_from?Number(body.effective_from):null,body.effective_to?Number(body.effective_to):null,status,ts,ts).run();
  await audit(env,tenant,user,'telecom_rate_deck_created','rate_deck',deckId,{status,region:String(body.region||'')});return json({id:deckId,status,currency:ccy,customer_visible:false},201);
 }
 if(path==='/api/telecom/bss/rate-rules'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),deckId=String(body.rate_deck_id||''),deck=await env.DB.prepare('SELECT id FROM telecom_rate_decks WHERE tenant_id=? AND id=?').bind(tenant,deckId).first();if(!deck)return json({detail:'Rate deck not found.'},404);const service=String(body.service_type||'');if(!services.has(service))return json({detail:'Unsupported service_type.'},400);const size=Number(body.unit_size||1);if(!Number.isFinite(size)||size<=0)return json({detail:'unit_size must be a finite positive number.'},400);for(const key of ['unit_rate','connection_charge','minimum_charge']){if(body[key]!==undefined&&(!Number.isFinite(Number(body[key]))||Number(body[key])<0))return json({detail:`${key} must be a finite non-negative number.`},400)}const ruleId=uid('trr'),ts=now();
  await env.DB.prepare(`INSERT INTO telecom_rate_rules(id,tenant_id,rate_deck_id,service_type,destination_prefix,destination_zone,unit_name,unit_size,unit_rate,connection_charge,minimum_charge,priority,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(ruleId,tenant,deckId,service,String(body.destination_prefix||''),String(body.destination_zone||''),String(body.unit_name||'unit'),size,finite(body.unit_rate),finite(body.connection_charge),finite(body.minimum_charge),Math.max(1,Math.floor(finite(body.priority,100)||100)),objectJson(body.metadata),ts,ts).run();
  await audit(env,tenant,user,'telecom_rate_rule_created','rate_rule',ruleId,{service_type:service,destination_prefix:String(body.destination_prefix||'')});return json({id:ruleId,rate_deck_id:deckId,service_type:service},201);
 }
 if(path==='/api/telecom/bss/rate-quote'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),service=String(body.service_type||''),requested=Number(body.requested_units);if(!services.has(service)||!Number.isFinite(requested)||requested<=0)return json({detail:'Valid service_type and positive finite requested_units are required.'},400);const result=await quote(env,tenant,service,String(body.destination||''),requested);if(!result)return json({detail:'No active internal rate rule matched this usage. Keep charging blocked or use an explicit unrated policy until a rate deck is configured.',identity:'Magnanimous Telecom'},404);return json({identity:'Magnanimous Telecom',brain:'Magnanimous AI',quote:result,provider_source_exposed:false});
 }

 const networkPolicy=path.match(/^\/api\/telecom\/bss\/line-network-policy\/([^/]+)$/);
 if(networkPolicy&&request.method==='PUT'){
  const lineId=decodeURIComponent(networkPolicy[1]),line=await env.DB.prepare('SELECT id FROM telecom_customer_lines WHERE tenant_id=? AND id=?').bind(tenant,lineId).first();if(!line)return json({detail:'Customer line not found.'},404);const body=await request.json().catch(()=>({})),ts=now();await env.DB.prepare(`INSERT INTO telecom_line_network_policies(tenant_id,line_id,apn_profile_id,roaming_enabled,international_calling_enabled,sms_enabled,mms_enabled,rcs_enabled,wifi_calling_enabled,volte_enabled,vonr_enabled,data_cap_mb,throttle_kbps,qos_json,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,line_id) DO UPDATE SET apn_profile_id=excluded.apn_profile_id,roaming_enabled=excluded.roaming_enabled,international_calling_enabled=excluded.international_calling_enabled,sms_enabled=excluded.sms_enabled,mms_enabled=excluded.mms_enabled,rcs_enabled=excluded.rcs_enabled,wifi_calling_enabled=excluded.wifi_calling_enabled,volte_enabled=excluded.volte_enabled,vonr_enabled=excluded.vonr_enabled,data_cap_mb=excluded.data_cap_mb,throttle_kbps=excluded.throttle_kbps,qos_json=excluded.qos_json,updated_at=excluded.updated_at`).bind(tenant,lineId,body.apn_profile_id?String(body.apn_profile_id):null,bool(body.roaming_enabled)?1:0,bool(body.international_calling_enabled)?1:0,body.sms_enabled===false?0:1,body.mms_enabled===false?0:1,bool(body.rcs_enabled)?1:0,bool(body.wifi_calling_enabled)?1:0,bool(body.volte_enabled)?1:0,bool(body.vonr_enabled)?1:0,finite(body.data_cap_mb),Math.floor(finite(body.throttle_kbps)),objectJson(body.qos),ts).run();await audit(env,tenant,user,'telecom_line_network_policy_updated','customer_line',lineId,{roaming_enabled:bool(body.roaming_enabled),international_calling_enabled:bool(body.international_calling_enabled)});return json({line_id:lineId,status:'updated',public_network_action:false});
 }

 const sim=path.match(/^\/api\/telecom\/bss\/sim-registration\/([^/]+)$/);
 if(sim&&request.method==='PUT'){
  const simId=decodeURIComponent(sim[1]),body=await request.json().catch(()=>({})),state=String(body.registration_state||'pending');if(!['unregistered','pending','verified','rejected','expired','not_required'].includes(state))return json({detail:'Unsupported registration_state.'},400);if(state==='verified'&&!String(body.verification_reference||'').trim())return json({detail:'verified state requires an opaque verification_reference; raw identity documents do not belong in this operational record.'},400);const ts=now();await env.DB.prepare(`INSERT INTO telecom_sim_registration_state(tenant_id,sim_id,line_id,jurisdiction,registration_state,verification_reference,registered_at,expires_at,retention_until,notes,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,sim_id) DO UPDATE SET line_id=excluded.line_id,jurisdiction=excluded.jurisdiction,registration_state=excluded.registration_state,verification_reference=excluded.verification_reference,registered_at=excluded.registered_at,expires_at=excluded.expires_at,retention_until=excluded.retention_until,notes=excluded.notes,updated_at=excluded.updated_at`).bind(tenant,simId,body.line_id?String(body.line_id):null,String(body.jurisdiction||'').toUpperCase(),state,String(body.verification_reference||''),state==='verified'?Number(body.registered_at||ts):null,body.expires_at?Number(body.expires_at):null,body.retention_until?Number(body.retention_until):null,String(body.notes||''),ts).run();await audit(env,tenant,user,'telecom_sim_registration_state_updated','sim',simId,{registration_state:state,jurisdiction:String(body.jurisdiction||'')});return json({sim_id:simId,registration_state:state,raw_identity_documents_stored:false,network_activation_performed:false});
 }

 if(path==='/api/telecom/bss/devices'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),deviceId=uid('tdv'),ts=now(),status=['unknown','compatible','limited','blocked','retired'].includes(String(body.status))?String(body.status):'unknown';await env.DB.prepare(`INSERT INTO telecom_devices(id,tenant_id,customer_id,line_id,imei_hash,tac,manufacturer,model,device_type,esim_capable,volte_capable,vonr_capable,wifi_calling_capable,rcs_capable,capabilities_json,status,first_seen_at,last_seen_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(deviceId,tenant,body.customer_id?String(body.customer_id):null,body.line_id?String(body.line_id):null,String(body.imei_hash||''),String(body.tac||'').slice(0,8),String(body.manufacturer||''),String(body.model||''),['phone','tablet','router','iot','modem','other'].includes(String(body.device_type))?String(body.device_type):'other',bool(body.esim_capable)?1:0,bool(body.volte_capable)?1:0,bool(body.vonr_capable)?1:0,bool(body.wifi_calling_capable)?1:0,bool(body.rcs_capable)?1:0,objectJson(body.capabilities),status,ts,ts,ts,ts).run();await audit(env,tenant,user,'telecom_device_recorded','device',deviceId,{line_id:body.line_id||null,tac:String(body.tac||'').slice(0,8)});return json({id:deviceId,status,raw_imei_stored:false},201);
 }

 if(path==='/api/telecom/bss/apn-profiles'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),apn=String(body.apn||'').trim();if(!apn)return json({detail:'apn is required.'},400);const apnId=uid('tapn'),ts=now(),pdp=['IPv4','IPv6','IPv4v6'].includes(String(body.pdp_type))?String(body.pdp_type):'IPv4v6',status=['draft','lab','active','retired'].includes(String(body.status))?String(body.status):'draft';await env.DB.prepare(`INSERT INTO telecom_apn_profiles(id,tenant_id,name,apn,pdp_type,roaming_apn,provider_ref,qos_json,status,customer_visible,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,0,?,?)`).bind(apnId,tenant,String(body.name||apn),apn,pdp,String(body.roaming_apn||''),String(body.provider_ref||''),objectJson(body.qos),status,ts,ts).run();await audit(env,tenant,user,'telecom_apn_profile_created','apn_profile',apnId,{status});return json({id:apnId,status,pdp_type:pdp,customer_visible:false},201);
 }

 return json({detail:'Magnanimous Telecom BSS administration endpoint not found.'},404);
}
