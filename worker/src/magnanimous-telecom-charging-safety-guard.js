import { currentUser } from './integrations.js';

const json=(data,status=400)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const riskyPaths=new Set(['/api/telecom/charging/policy/evaluate','/api/telecom/charging/sessions/reserve']);
const numericFields=['requested_units','estimated_charge','final_charge','committed_units'];
const truthy=value=>value===true||String(value).toLowerCase()==='true';
const parseList=value=>{try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed:[]}catch{return[]}};
const prefixMatch=(destination,prefixes)=>prefixes.some(prefix=>String(destination||'').startsWith(String(prefix||'')));

function validateFinite(body,fields=numericFields){
 for(const field of fields){
  if(body[field]===undefined||body[field]===null||body[field]==='')continue;
  const value=Number(body[field]);
  if(!Number.isFinite(value)||value<0)return `${field} must be a finite non-negative number.`;
 }
 return '';
}

export async function handleMagnanimousTelecomChargingSafetyGuard(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/telecom/charging')||request.method!=='POST')return null;
 const body=await request.clone().json().catch(()=>({}));

 if(path==='/api/telecom/charging/buckets'){
  const error=validateFinite(body,['units','starts_at','expires_at']);
  if(error)return json({detail:error,identity:'Magnanimous Telecom',policy:'charging_input_guard'});
  return null;
 }
 if(!riskyPaths.has(path))return null;
 const error=validateFinite(body);
 if(error)return json({detail:error,identity:'Magnanimous Telecom',policy:'charging_input_guard'});

 const roaming=truthy(body.roaming),international=truthy(body.international),premium=truthy(body.premium_rate);
 const destination=String(body.destination||'');
 const service=String(body.service_type||'');
 if(!roaming&&!international&&!premium&&!destination)return null;

 const user=await currentUser(request,env);
 if(!user)return null;
 const tenant=String(user.tenant_id||'');
 const lineId=String(body.line_id||'');
 if(!tenant||!lineId)return null;
 const line=await env.DB.prepare('SELECT id,plan_id FROM telecom_customer_lines WHERE tenant_id=? AND id=?').bind(tenant,lineId).first().catch(()=>null);
 if(!line)return null;
 const profile=await env.DB.prepare(`SELECT * FROM telecom_policy_profiles WHERE tenant_id=? AND service_type=? AND status='active' AND (plan_id=? OR plan_id IS NULL OR plan_id='') ORDER BY CASE WHEN plan_id=? THEN 0 ELSE 1 END,updated_at DESC LIMIT 1`).bind(tenant,service,line.plan_id,line.plan_id).first().catch(()=>null);
 const linePolicy=await env.DB.prepare('SELECT * FROM telecom_line_network_policies WHERE tenant_id=? AND line_id=?').bind(tenant,lineId).first().catch(()=>null);
 const fraud=await env.DB.prepare('SELECT * FROM telecom_fraud_controls WHERE tenant_id=?').bind(tenant).first().catch(()=>null);

 let reason='';
 if(roaming&&(!profile||Number(profile.roaming_allowed)!==1||!linePolicy||Number(linePolicy.roaming_enabled)!==1))reason='roaming_requires_explicit_plan_and_line_permission';
 else if(international&&(!profile||Number(profile.international_allowed)!==1||!linePolicy||Number(linePolicy.international_calling_enabled)!==1||!fraud||Number(fraud.international_enabled)!==1))reason='international_requires_explicit_plan_line_and_fraud_permission';
 else if(premium&&(!profile||Number(profile.premium_rate_allowed)!==1||!fraud||Number(fraud.premium_rate_enabled)!==1))reason='premium_rate_requires_explicit_plan_and_fraud_permission';
 else if(destination&&profile){
  const blocked=parseList(profile.blocked_destinations_json),allowed=parseList(profile.allowed_destinations_json);
  if(blocked.length&&prefixMatch(destination,blocked))reason='destination_blocked_by_policy';
  else if(allowed.length&&!prefixMatch(destination,allowed))reason='destination_not_in_allowed_policy';
 }
 if(!reason)return null;

 try{await env.DB.prepare(`INSERT INTO telecom_operations_events(tenant_id,actor_user_id,event_type,subject_type,subject_id,detail_json,created_at) VALUES(?,?,?,?,?,?,?)`).bind(tenant,String(user.id||user.user_id||''),'charging_sensitive_usage_blocked','customer_line',lineId,JSON.stringify({reason,service_type:service,roaming,international,premium_rate:premium}),Math.floor(Date.now()/1000)).run()}catch{}
 return json({detail:'Sensitive usage is blocked until explicit Magnanimous Telecom policy permission is active.',identity:'Magnanimous Telecom',brain:'Magnanimous AI',decision:'block',reason_code:reason,default_deny:true},409);
}
