import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const truthy=value=>String(value||'').toLowerCase()==='true';
const now=()=>Math.floor(Date.now()/1000);

async function ensureSchema(env){
 if(!env?.DB)return;
 const statements=[
  `CREATE TABLE IF NOT EXISTS telecom_numbers (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,e164 TEXT NOT NULL,label TEXT NOT NULL DEFAULT '',country_code TEXT NOT NULL DEFAULT '',source_kind TEXT NOT NULL DEFAULT 'wholesale',upstream_ref TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'reserved',capabilities_json TEXT NOT NULL DEFAULT '{}',emergency_status TEXT NOT NULL DEFAULT 'disabled',stir_shaken_status TEXT NOT NULL DEFAULT 'not_configured',assigned_user_id TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,e164))`,
  `CREATE TABLE IF NOT EXISTS telecom_interconnects (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'sip_trunk',endpoint_ref TEXT NOT NULL DEFAULT '',secret_binding_name TEXT NOT NULL DEFAULT '',priority INTEGER NOT NULL DEFAULT 100,active INTEGER NOT NULL DEFAULT 1,health_status TEXT NOT NULL DEFAULT 'unknown',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_port_requests (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,number_e164 TEXT NOT NULL,losing_carrier TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',foc_at INTEGER,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_emergency_locations (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,number_id TEXT,country TEXT NOT NULL DEFAULT '',address_line1 TEXT NOT NULL DEFAULT '',address_line2 TEXT NOT NULL DEFAULT '',city TEXT NOT NULL DEFAULT '',region TEXT NOT NULL DEFAULT '',postal_code TEXT NOT NULL DEFAULT '',validation_status TEXT NOT NULL DEFAULT 'unverified',provider_reference TEXT NOT NULL DEFAULT '',enabled INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_rating_ledger (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,call_id TEXT NOT NULL DEFAULT '',direction TEXT NOT NULL DEFAULT '',destination TEXT NOT NULL DEFAULT '',units REAL NOT NULL DEFAULT 0,unit_name TEXT NOT NULL DEFAULT 'minute',rate REAL NOT NULL DEFAULT 0,cost REAL NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'USD',rated_at INTEGER NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}')`,
  `CREATE TABLE IF NOT EXISTS telecom_compliance_controls (tenant_id TEXT NOT NULL,jurisdiction TEXT NOT NULL DEFAULT 'global',control_key TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'not_started',evidence_ref TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,jurisdiction,control_key))`,
  `CREATE TABLE IF NOT EXISTS telecom_customers (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,display_name TEXT NOT NULL,email TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'prospect',billing_currency TEXT NOT NULL DEFAULT 'USD',metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_service_plans (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',monthly_price REAL NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'USD',included_minutes REAL NOT NULL DEFAULT 0,features_json TEXT NOT NULL DEFAULT '{}',active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_subscriptions (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,customer_id TEXT NOT NULL,plan_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'trial',started_at INTEGER NOT NULL,renews_at INTEGER,ended_at INTEGER,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_caller_identities (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,number_id TEXT,display_name TEXT NOT NULL DEFAULT '',verification_status TEXT NOT NULL DEFAULT 'unverified',stir_shaken_attestation TEXT NOT NULL DEFAULT '',cnam_status TEXT NOT NULL DEFAULT 'not_configured',metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_fraud_policies (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,daily_spend_limit REAL NOT NULL DEFAULT 0,max_call_minutes REAL NOT NULL DEFAULT 0,international_enabled INTEGER NOT NULL DEFAULT 0,blocked_prefixes_json TEXT NOT NULL DEFAULT '[]',active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_audit_events (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,actor_user_id TEXT NOT NULL DEFAULT '',event_type TEXT NOT NULL,subject_type TEXT NOT NULL DEFAULT '',subject_id TEXT NOT NULL DEFAULT '',detail_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`
 ];
 for(const sql of statements){try{await env.DB.prepare(sql).run()}catch(error){console.error('telecom schema repair failed',error)}}
}

async function count(env,sql,...bind){
 try{return Number((await env.DB.prepare(sql).bind(...bind).first())?.n||0)}catch{return 0}
}

async function audit(env,tenant,user,eventType,subjectType='',subjectId='',detail={}){
 try{
  await env.DB.prepare('INSERT INTO telecom_audit_events(tenant_id,actor_user_id,event_type,subject_type,subject_id,detail_json,created_at) VALUES(?,?,?,?,?,?,?)')
   .bind(tenant,String(user?.id||user?.user_id||''),eventType,subjectType,subjectId,JSON.stringify(detail||{}),now()).run();
 }catch(error){console.error('telecom audit write failed',error)}
}

function readiness(env){
 const pstnBridge=Boolean(String(env?.VOIP_PROVIDER_URL||'').trim()&&String(env?.VOIP_PROVIDER_TOKEN||'').trim());
 const publicNumber=Boolean(String(env?.VOIP_CALLER_ID||'').trim());
 const inboundWebhook=Boolean(String(env?.VOIP_WEBHOOK_SECRET||'').trim());
 const emergencyLive=truthy(env?.TELECOM_EMERGENCY_LIVE);
 const directNumbering=truthy(env?.TELECOM_DIRECT_NUMBERING_AUTHORIZED);
 const carrierAuthorized=truthy(env?.TELECOM_CARRIER_AUTHORIZED);
 return{
  internal_voice:true,
  pstn_bridge:pstnBridge,
  public_number:publicNumber,
  inbound_events:inboundWebhook,
  emergency_calling:emergencyLive,
  direct_numbering:directNumbering,
  carrier_authorized:carrierAuthorized
 };
}

function gates(state){
 return[
  {key:'public_pstn',label:'Public PSTN calling',ready:state.pstn_bridge&&state.public_number,detail:state.pstn_bridge&&state.public_number?'Configured through the Magnanimous carrier abstraction.':'Requires an authorized PSTN interconnect and assigned number.'},
  {key:'emergency',label:'Emergency calling',ready:state.emergency_calling,detail:state.emergency_calling?'Explicitly enabled after external emergency-service validation.':'Deliberately disabled until E911/emergency routing and location validation are configured and tested.'},
  {key:'direct_numbering',label:'Direct numbering authority',ready:state.direct_numbering,detail:state.direct_numbering?'Authorization flag is enabled.':'Use replaceable wholesale numbering until direct numbering authorization is obtained.'},
  {key:'carrier_authority',label:'Facilities/carrier authority',ready:state.carrier_authorized,detail:state.carrier_authorized?'Carrier authorization flag is enabled.':'Legal authorization is external to the software and must be obtained before claiming direct-carrier status.'}
 ];
}

export async function handleMagnanimousTelecom(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/telecom'))return null;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'}});
 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in to Magnanimous Telecom.'},401);
 await ensureSchema(env);
 const tenant=String(user.tenant_id||'');

 if(path==='/api/telecom/overview'&&request.method==='GET'){
  const state=readiness(env);
  const [numbers,interconnects,ports,emergencyLocations,ratedCalls,customers,plans,subscriptions,callerIdentities,fraudPolicies,auditEvents]=await Promise.all([
   count(env,'SELECT COUNT(*) n FROM telecom_numbers WHERE tenant_id=?',tenant),
   count(env,'SELECT COUNT(*) n FROM telecom_interconnects WHERE tenant_id=? AND active=1',tenant),
   count(env,"SELECT COUNT(*) n FROM telecom_port_requests WHERE tenant_id=? AND status NOT IN ('completed','cancelled','rejected')",tenant),
   count(env,'SELECT COUNT(*) n FROM telecom_emergency_locations WHERE tenant_id=? AND enabled=1',tenant),
   count(env,'SELECT COUNT(*) n FROM telecom_rating_ledger WHERE tenant_id=?',tenant),
   count(env,"SELECT COUNT(*) n FROM telecom_customers WHERE tenant_id=? AND status NOT IN ('closed','suspended')",tenant),
   count(env,'SELECT COUNT(*) n FROM telecom_service_plans WHERE tenant_id=? AND active=1',tenant),
   count(env,"SELECT COUNT(*) n FROM telecom_subscriptions WHERE tenant_id=? AND status IN ('trial','active')",tenant),
   count(env,"SELECT COUNT(*) n FROM telecom_caller_identities WHERE tenant_id=? AND verification_status='verified'",tenant),
   count(env,'SELECT COUNT(*) n FROM telecom_fraud_policies WHERE tenant_id=? AND active=1',tenant),
   count(env,'SELECT COUNT(*) n FROM telecom_audit_events WHERE tenant_id=?',tenant)
  ]);
  return json({
   identity:'Magnanimous Telecom',
   parent_brand:'I AM MAGNANIMOUS WAY™',
   brain:'Magnanimous AI',
   architecture:'integrated-and-standalone',
   provider_disclosure:'hidden-from-customer-ui',
   readiness:state,
   gates:gates(state),
   inventory:{numbers,active_interconnects:interconnects,open_port_requests:ports,enabled_emergency_locations:emergencyLocations,rated_calls:ratedCalls},
   commercial:{customers,active_plans:plans,active_subscriptions:subscriptions,verified_caller_identities:callerIdentities,active_fraud_policies:fraudPolicies,audit_events:auditEvents}
  });
 }

 if(path==='/api/telecom/commercial'&&request.method==='GET'){
  const [plansResult,policiesResult]=await Promise.all([
   env.DB.prepare('SELECT id,name,description,monthly_price,currency,included_minutes,features_json,active,updated_at FROM telecom_service_plans WHERE tenant_id=? ORDER BY active DESC,name').bind(tenant).all(),
   env.DB.prepare('SELECT id,name,daily_spend_limit,max_call_minutes,international_enabled,blocked_prefixes_json,active,updated_at FROM telecom_fraud_policies WHERE tenant_id=? ORDER BY active DESC,name').bind(tenant).all()
  ]);
  return json({plans:plansResult.results||[],fraud_policies:policiesResult.results||[]});
 }

 if(path==='/api/telecom/audit'&&request.method==='GET'){
  if(user.role!=='owner')return json({detail:'Owner access required.'},403);
  const limit=Math.max(1,Math.min(200,Number(url.searchParams.get('limit')||50)));
  const {results}=await env.DB.prepare('SELECT id,actor_user_id,event_type,subject_type,subject_id,detail_json,created_at FROM telecom_audit_events WHERE tenant_id=? ORDER BY id DESC LIMIT ?').bind(tenant,limit).all();
  return json({events:results||[]});
 }

 if(path==='/api/telecom/compliance'&&request.method==='GET'){
  const {results}=await env.DB.prepare('SELECT jurisdiction,control_key,status,evidence_ref,notes,updated_at FROM telecom_compliance_controls WHERE tenant_id=? ORDER BY jurisdiction,control_key').bind(tenant).all();
  return json({controls:results||[],gates:gates(readiness(env))});
 }

 if(path==='/api/telecom/compliance'&&request.method==='PUT'){
  if(user.role!=='owner')return json({detail:'Owner access required.'},403);
  const body=await request.json().catch(()=>({}));
  const jurisdiction=String(body.jurisdiction||'global').trim().slice(0,80)||'global';
  const controlKey=String(body.control_key||'').trim().slice(0,120);
  const status=String(body.status||'not_started').trim().slice(0,40);
  if(!controlKey)return json({detail:'control_key is required.'},400);
  if(!['not_started','planned','in_progress','blocked','ready','verified'].includes(status))return json({detail:'Unsupported compliance status.'},400);
  const evidence=String(body.evidence_ref||'').trim().slice(0,500),notes=String(body.notes||'').trim().slice(0,2000),ts=now();
  await env.DB.prepare(`INSERT INTO telecom_compliance_controls(tenant_id,jurisdiction,control_key,status,evidence_ref,notes,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(tenant_id,jurisdiction,control_key) DO UPDATE SET status=excluded.status,evidence_ref=excluded.evidence_ref,notes=excluded.notes,updated_at=excluded.updated_at`).bind(tenant,jurisdiction,controlKey,status,evidence,notes,ts).run();
  await audit(env,tenant,user,'compliance.control.updated','compliance_control',`${jurisdiction}:${controlKey}`,{status,evidence_ref:evidence});
  return json({ok:true,jurisdiction,control_key:controlKey,status});
 }

 return json({detail:'Magnanimous Telecom endpoint not found.'},404);
}
