import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const truthy=value=>String(value||'').toLowerCase()==='true';

async function ensureSchema(env){
 if(!env?.DB)return;
 const statements=[
  `CREATE TABLE IF NOT EXISTS telecom_numbers (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,e164 TEXT NOT NULL,label TEXT NOT NULL DEFAULT '',country_code TEXT NOT NULL DEFAULT '',source_kind TEXT NOT NULL DEFAULT 'wholesale',upstream_ref TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'reserved',capabilities_json TEXT NOT NULL DEFAULT '{}',emergency_status TEXT NOT NULL DEFAULT 'disabled',stir_shaken_status TEXT NOT NULL DEFAULT 'not_configured',assigned_user_id TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,e164))`,
  `CREATE TABLE IF NOT EXISTS telecom_interconnects (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'sip_trunk',endpoint_ref TEXT NOT NULL DEFAULT '',secret_binding_name TEXT NOT NULL DEFAULT '',priority INTEGER NOT NULL DEFAULT 100,active INTEGER NOT NULL DEFAULT 1,health_status TEXT NOT NULL DEFAULT 'unknown',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_port_requests (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,number_e164 TEXT NOT NULL,losing_carrier TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',foc_at INTEGER,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_emergency_locations (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,number_id TEXT,country TEXT NOT NULL DEFAULT '',address_line1 TEXT NOT NULL DEFAULT '',address_line2 TEXT NOT NULL DEFAULT '',city TEXT NOT NULL DEFAULT '',region TEXT NOT NULL DEFAULT '',postal_code TEXT NOT NULL DEFAULT '',validation_status TEXT NOT NULL DEFAULT 'unverified',provider_reference TEXT NOT NULL DEFAULT '',enabled INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_rating_ledger (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,call_id TEXT NOT NULL DEFAULT '',direction TEXT NOT NULL DEFAULT '',destination TEXT NOT NULL DEFAULT '',units REAL NOT NULL DEFAULT 0,unit_name TEXT NOT NULL DEFAULT 'minute',rate REAL NOT NULL DEFAULT 0,cost REAL NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'USD',rated_at INTEGER NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}')`,
  `CREATE TABLE IF NOT EXISTS telecom_compliance_controls (tenant_id TEXT NOT NULL,jurisdiction TEXT NOT NULL DEFAULT 'global',control_key TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'not_started',evidence_ref TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,jurisdiction,control_key))`
 ];
 for(const sql of statements){try{await env.DB.prepare(sql).run()}catch(error){console.error('telecom schema repair failed',error)}}
}

async function count(env,sql,...bind){
 try{return Number((await env.DB.prepare(sql).bind(...bind).first())?.n||0)}catch{return 0}
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
  const [numbers,interconnects,ports,emergencyLocations,ratedCalls]=await Promise.all([
   count(env,'SELECT COUNT(*) n FROM telecom_numbers WHERE tenant_id=?',tenant),
   count(env,'SELECT COUNT(*) n FROM telecom_interconnects WHERE tenant_id=? AND active=1',tenant),
   count(env,"SELECT COUNT(*) n FROM telecom_port_requests WHERE tenant_id=? AND status NOT IN ('completed','cancelled','rejected')",tenant),
   count(env,'SELECT COUNT(*) n FROM telecom_emergency_locations WHERE tenant_id=? AND enabled=1',tenant),
   count(env,'SELECT COUNT(*) n FROM telecom_rating_ledger WHERE tenant_id=?',tenant)
  ]);
  return json({
   identity:'Magnanimous Telecom',
   parent_brand:'I AM MAGNANIMOUS WAY™',
   brain:'Magnanimous AI',
   architecture:'integrated-and-standalone',
   provider_disclosure:'hidden-from-customer-ui',
   readiness:state,
   gates:gates(state),
   inventory:{numbers,active_interconnects:interconnects,open_port_requests:ports,enabled_emergency_locations:emergencyLocations,rated_calls:ratedCalls}
  });
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
  const evidence=String(body.evidence_ref||'').trim().slice(0,500),notes=String(body.notes||'').trim().slice(0,2000),ts=Math.floor(Date.now()/1000);
  await env.DB.prepare(`INSERT INTO telecom_compliance_controls(tenant_id,jurisdiction,control_key,status,evidence_ref,notes,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(tenant_id,jurisdiction,control_key) DO UPDATE SET status=excluded.status,evidence_ref=excluded.evidence_ref,notes=excluded.notes,updated_at=excluded.updated_at`).bind(tenant,jurisdiction,controlKey,status,evidence,notes,ts).run();
  return json({ok:true,jurisdiction,control_key:controlKey,status});
 }

 return json({detail:'Magnanimous Telecom endpoint not found.'},404);
}
