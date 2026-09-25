import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clip=(v,n=4000)=>String(v??'').trim().slice(0,n);
const STAGES=['software-provider','voip-reseller','interconnected-voip','direct-numbering','direct-interconnect'];
const INTERCONNECT_TYPES=['sip-trunk','byoc-bridge','inkbox','twilio','telnyx','plivo','bandwidth','signalwire','vonage','infobip','peer','direct-pstn'];

function manager(user){return ['owner','admin'].includes(String(user?.role||'').toLowerCase())}
function e164(v){const s=clip(v,32);return /^\+[1-9]\d{1,14}$/.test(s)?s:null}
function bool(v){return v===true||v===1||v==='1'||String(v).toLowerCase()==='true'}

async function schema(env){
 if(!env?.DB)throw new Error('Magnanimous Carrier Core requires D1.');
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_carrier_profile(
  tenant_id TEXT PRIMARY KEY, public_name TEXT NOT NULL DEFAULT 'Magnanimous Carrier', operating_stage TEXT NOT NULL DEFAULT 'software-provider',
  jurisdiction_json TEXT NOT NULL DEFAULT '[]', regulatory_json TEXT NOT NULL DEFAULT '{}', compliance_json TEXT NOT NULL DEFAULT '{}',
  emergency_json TEXT NOT NULL DEFAULT '{}', stir_shaken_json TEXT NOT NULL DEFAULT '{}', numbering_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL, updated_by TEXT NOT NULL DEFAULT ''
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_carrier_interconnects(
  id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL,
  endpoint TEXT NOT NULL DEFAULT '', credential_ref TEXT NOT NULL DEFAULT '', priority INTEGER NOT NULL DEFAULT 100,
  inbound INTEGER NOT NULL DEFAULT 1, outbound INTEGER NOT NULL DEFAULT 1, enabled INTEGER NOT NULL DEFAULT 1,
  countries_json TEXT NOT NULL DEFAULT '[]', rate_json TEXT NOT NULL DEFAULT '{}', health_status TEXT NOT NULL DEFAULT 'unknown',
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_carrier_numbers(
  e164 TEXT PRIMARY KEY, owner_tenant_id TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'upstream', interconnect_id INTEGER,
  status TEXT NOT NULL DEFAULT 'inventory', assigned_tenant_id TEXT NOT NULL DEFAULT '', label TEXT NOT NULL DEFAULT '',
  voice_enabled INTEGER NOT NULL DEFAULT 1, sms_enabled INTEGER NOT NULL DEFAULT 0, emergency_registered INTEGER NOT NULL DEFAULT 0,
  porting_status TEXT NOT NULL DEFAULT '', metadata_json TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_carrier_routes(
  id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, name TEXT NOT NULL, destination_prefix TEXT NOT NULL DEFAULT '',
  interconnect_id INTEGER NOT NULL, priority INTEGER NOT NULL DEFAULT 100, enabled INTEGER NOT NULL DEFAULT 1,
  max_rate REAL, jurisdiction TEXT NOT NULL DEFAULT '', policy_json TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_carrier_cdr(
  id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, call_id TEXT NOT NULL, provider_call_id TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT 'outbound', from_number TEXT NOT NULL DEFAULT '', to_number TEXT NOT NULL DEFAULT '',
  interconnect_id INTEGER, route_id INTEGER, status TEXT NOT NULL DEFAULT '', started_at INTEGER, answered_at INTEGER, ended_at INTEGER,
  duration_seconds INTEGER NOT NULL DEFAULT 0, billable_seconds INTEGER NOT NULL DEFAULT 0, wholesale_cost REAL NOT NULL DEFAULT 0,
  customer_charge REAL NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'USD', stir_attestation TEXT NOT NULL DEFAULT '',
  emergency_call INTEGER NOT NULL DEFAULT 0, metadata_json TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL,
  UNIQUE(tenant_id,call_id)
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_carrier_audit(
  id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL, action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '', detail TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
 )`).run();
}
async function audit(env,user,action,target='',detail=''){try{await env.DB.prepare('INSERT INTO magnanimous_carrier_audit(tenant_id,user_id,action,target,detail,created_at) VALUES(?,?,?,?,?,?)').bind(String(user.tenant_id),String(user.id),clip(action,120),clip(target,200),clip(detail,1200),now()).run()}catch{}}
async function profile(env,user){
 let row=await env.DB.prepare('SELECT * FROM magnanimous_carrier_profile WHERE tenant_id=?').bind(String(user.tenant_id)).first();
 if(!row){const ts=now();await env.DB.prepare('INSERT INTO magnanimous_carrier_profile(tenant_id,updated_at,updated_by) VALUES(?,?,?)').bind(String(user.tenant_id),ts,String(user.id)).run();row=await env.DB.prepare('SELECT * FROM magnanimous_carrier_profile WHERE tenant_id=?').bind(String(user.tenant_id)).first()}
 const parse=v=>{try{return JSON.parse(v||'{}')}catch{return{}}};
 return {...row,jurisdictions:parse(row.jurisdiction_json),regulatory:parse(row.regulatory_json),compliance:parse(row.compliance_json),emergency:parse(row.emergency_json),stir_shaken:parse(row.stir_shaken_json),numbering:parse(row.numbering_json)};
}
function readiness(p){
 const c=p.compliance||{},e=p.emergency||{},s=p.stir_shaken||{},n=p.numbering||{},r=p.regulatory||{};
 return {
  software_provider:true,
  reseller_ready:Boolean(c.customer_terms&&c.privacy&&c.abuse_response),
  interconnected_voip_ready:Boolean(r.provider_registration&&e.e911_program&&c.cdr_retention&&c.lawful_process),
  direct_numbering_ready:Boolean(n.authorization&&n.facilities_readiness&&c.numbering_reporting),
  direct_interconnect_ready:Boolean(n.authorization&&s.robocall_mitigation&&s.stir_shaken&&e.e911_program&&c.interconnect_agreements)
 };
}
async function interconnects(env,user){const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_carrier_interconnects WHERE tenant_id=? ORDER BY enabled DESC,priority,id').bind(String(user.tenant_id)).all();return results.map(x=>({...x,inbound:!!x.inbound,outbound:!!x.outbound,enabled:!!x.enabled,countries:(()=>{try{return JSON.parse(x.countries_json)}catch{return[]}})(),rate:(()=>{try{return JSON.parse(x.rate_json)}catch{return{}}})()}))}
function parsedObject(value){try{const x=JSON.parse(value||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return{}}}
function numericRate(rate,route){
 const values=[route?.estimated_rate,rate?.outbound_per_minute,rate?.per_minute,rate?.rate,rate?.cost_per_minute].map(Number).filter(Number.isFinite);
 return values.length?Math.max(0,values[0]):null;
}
function measuredQuality(rows){
 const attempts=rows.length;
 if(!attempts)return{sample_count:0,answered:0,asr:null,acd_seconds:null,pdd_ms:null,network_failure_rate:null,measured_quality_score:null,latest_at:null,fresh:false};
 const answeredRows=rows.filter(x=>Number(x.answered_at||0)>0||['answered','completed','complete'].includes(String(x.status||'').toLowerCase()));
 const networkFailures=rows.filter(x=>['failed','error','congestion','unavailable','chanunavail','network-error'].includes(String(x.status||'').toLowerCase()));
 const durations=answeredRows.map(x=>Number(x.duration_seconds||0)).filter(x=>Number.isFinite(x)&&x>=0);
 const pdds=answeredRows.map(x=>Number(x.answered_at||0)&&Number(x.started_at||0)?Math.max(0,(Number(x.answered_at)-Number(x.started_at))*1000):null).filter(Number.isFinite);
 const asr=answeredRows.length/attempts,networkFailureRate=networkFailures.length/attempts;
 const acd=durations.length?durations.reduce((a,b)=>a+b,0)/durations.length:null,pdd=pdds.length?pdds.reduce((a,b)=>a+b,0)/pdds.length:null;
 const networkScore=(1-networkFailureRate)*50,pddScore=pdd==null?12.5:Math.max(0,1-Math.min(pdd,8000)/8000)*25,asrScore=asr*20,acdScore=acd==null?2.5:Math.min(1,acd/180)*5;
 const latest=rows.reduce((n,x)=>Math.max(n,Number(x.created_at||x.ended_at||x.started_at||0)),0)||null;
 return{sample_count:attempts,answered:answeredRows.length,asr:Number(asr.toFixed(4)),acd_seconds:acd==null?null:Number(acd.toFixed(1)),pdd_ms:pdd==null?null:Math.round(pdd),network_failure_rate:Number(networkFailureRate.toFixed(4)),measured_quality_score:Number((networkScore+pddScore+asrScore+acdScore).toFixed(1)),latest_at:latest,fresh:Boolean(latest&&latest>=now()-604800)};
}
async function routePlan(env,user,to,mode='balanced'){
 const destination=e164(to);if(!destination)return{error:'A valid E.164 destination is required.'};
 const selectionMode=['balanced','least-cost','priority'].includes(String(mode))?String(mode):'balanced';
 const [{results=[]},{results:cdrRows=[]}]=await Promise.all([
  env.DB.prepare(`SELECT r.*,i.name interconnect_name,i.type interconnect_type,i.endpoint,i.health_status,i.enabled interconnect_enabled,i.priority interconnect_priority,i.rate_json
 FROM magnanimous_carrier_routes r JOIN magnanimous_carrier_interconnects i ON i.id=r.interconnect_id AND i.tenant_id=r.tenant_id
 WHERE r.tenant_id=? AND r.enabled=1 AND i.enabled=1 AND i.outbound=1 ORDER BY LENGTH(r.destination_prefix) DESC,r.priority ASC,i.priority ASC,r.id ASC`).bind(String(user.tenant_id)).all(),
  env.DB.prepare('SELECT interconnect_id,status,started_at,answered_at,ended_at,duration_seconds,to_number,created_at FROM magnanimous_carrier_cdr WHERE tenant_id=? AND interconnect_id IS NOT NULL ORDER BY id DESC LIMIT 500').bind(String(user.tenant_id)).all()
 ]);
 const matches=results.filter(x=>!x.destination_prefix||destination.startsWith(String(x.destination_prefix))).map(x=>{
  const policy=parsedObject(x.policy_json),rate=parsedObject(x.rate_json),estimatedRate=numericRate(rate,policy),configuredQuality=Math.max(0,Math.min(100,Number(policy.quality_score??rate.quality_score??50)));
  const routePrefix=String(x.destination_prefix||''),samples=cdrRows.filter(c=>Number(c.interconnect_id)===Number(x.interconnect_id)&&(!routePrefix||String(c.to_number||'').startsWith(routePrefix))).slice(0,100),observed=measuredQuality(samples);
  const measuredEligible=observed.fresh&&observed.sample_count>=10&&observed.measured_quality_score!=null;
  const quality=measuredEligible?observed.measured_quality_score:configuredQuality,maxRate=x.max_rate==null?null:Number(x.max_rate),overRateCap=maxRate!=null&&estimatedRate!=null&&estimatedRate>maxRate;
  return{route_id:x.id,route:x.name,destination_prefix:routePrefix,interconnect_id:x.interconnect_id,interconnect:x.interconnect_name,type:x.interconnect_type,endpoint:String(x.endpoint||''),health:x.health_status,max_rate:maxRate,estimated_rate:estimatedRate,over_rate_cap:overRateCap,quality_score:quality,quality_source:measuredEligible?'measured':'configured',configured_quality_score:configuredQuality,observed,priority:Number(x.priority||100),interconnect_priority:Number(x.interconnect_priority||100),jurisdiction:x.jurisdiction,policy};
 });
 const longest=matches.reduce((n,x)=>Math.max(n,x.destination_prefix.length),0),specific=matches.filter(x=>x.destination_prefix.length===longest);
 const healthy=specific.filter(x=>!['down','unavailable','failed'].includes(String(x.health||'').toLowerCase())&&!x.over_rate_cap),pool=healthy;
 const rateValue=x=>x.estimated_rate==null?Number.POSITIVE_INFINITY:Number(x.estimated_rate);
 const sorted=pool.slice().sort((a,b)=>{
  if(selectionMode==='least-cost')return rateValue(a)-rateValue(b)||b.quality_score-a.quality_score||a.priority-b.priority||a.interconnect_priority-b.interconnect_priority;
  if(selectionMode==='priority')return a.priority-b.priority||a.interconnect_priority-b.interconnect_priority||rateValue(a)-rateValue(b)||b.quality_score-a.quality_score;
  return b.quality_score-a.quality_score||rateValue(a)-rateValue(b)||a.priority-b.priority||a.interconnect_priority-b.interconnect_priority;
 });
 const selected=sorted[0]||null;
 return{destination,selection_mode:selectionMode,matches,selected,eligible_routes:sorted.length,telemetry_policy:{sample_floor:10,freshness_seconds:604800,window_per_route:100,signals:['network_failure_rate','PDD','ASR','ACD'],fallback:'configured quality score until measured evidence is fresh and sufficient'},policy:'longest destination prefix first; down/unavailable/failed routes and routes above max_rate are excluded; balanced mode prefers fresh measured quality then rate; least-cost prefers rate then quality; priority mode honors configured priorities first'};
}

export async function planCarrierRoute(env,user,to,mode='balanced'){
 await schema(env);
 return routePlan(env,user,to,mode);
}

export async function handleMagnanimousCarrierCore(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/magnanimous/carrier'))return null;
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);await schema(env);
 if(request.method==='GET'&&path==='/api/magnanimous/carrier/status'){
  const p=await profile(env,user),ics=await interconnects(env,user);const nums=await env.DB.prepare('SELECT COUNT(*) n,SUM(CASE WHEN status=\'assigned\' THEN 1 ELSE 0 END) assigned FROM magnanimous_carrier_numbers WHERE owner_tenant_id=?').bind(String(user.tenant_id)).first();
  return json({identity:'Magnanimous Carrier',operator:'Magnanimous AI',stage:p.operating_stage,readiness:readiness(p),jurisdictions:p.jurisdictions,regulatory:p.regulatory,compliance:p.compliance,emergency:p.emergency,stir_shaken:p.stir_shaken,numbering:p.numbering,interconnects:ics.length,numbers:Number(nums?.n||0),assigned_numbers:Number(nums?.assigned||0),architecture:{control_plane:'Magnanimous-owned',switching:'SIP/SBC/media infrastructure required for direct carrier stage',upstreams:'replaceable during provider/reseller stages',customer_ownership:'Magnanimous',routing_policy:'Magnanimous',cdr_and_billing:'Magnanimous'},truth:'Software can make Magnanimous carrier-ready, but regulated carrier status, telephone-number authority and PSTN interconnection exist only after the applicable external approvals and agreements are actually granted.'});
 }
 if(request.method==='GET'&&path==='/api/magnanimous/carrier/profile')return json({profile:await profile(env,user)});
 if(request.method==='PUT'&&path==='/api/magnanimous/carrier/profile'){
  if(!manager(user))return json({detail:'Owner or admin role required.'},403);const b=await request.json().catch(()=>({}));const stage=STAGES.includes(String(b.operating_stage))?String(b.operating_stage):'software-provider';const p=await profile(env,user);
  const jurisdictions=Array.isArray(b.jurisdictions)?b.jurisdictions:p.jurisdictions;const regulatory=b.regulatory&&typeof b.regulatory==='object'?b.regulatory:p.regulatory;const compliance=b.compliance&&typeof b.compliance==='object'?b.compliance:p.compliance;const emergency=b.emergency&&typeof b.emergency==='object'?b.emergency:p.emergency;const stir=b.stir_shaken&&typeof b.stir_shaken==='object'?b.stir_shaken:p.stir_shaken;const numbering=b.numbering&&typeof b.numbering==='object'?b.numbering:p.numbering;
  await env.DB.prepare(`UPDATE magnanimous_carrier_profile SET public_name=?,operating_stage=?,jurisdiction_json=?,regulatory_json=?,compliance_json=?,emergency_json=?,stir_shaken_json=?,numbering_json=?,updated_at=?,updated_by=? WHERE tenant_id=?`).bind(clip(b.public_name||p.public_name,120),stage,JSON.stringify(jurisdictions).slice(0,12000),JSON.stringify(regulatory).slice(0,12000),JSON.stringify(compliance).slice(0,12000),JSON.stringify(emergency).slice(0,12000),JSON.stringify(stir).slice(0,12000),JSON.stringify(numbering).slice(0,12000),now(),String(user.id),String(user.tenant_id)).run();await audit(env,user,'profile.update',stage);return json({ok:true,profile:await profile(env,user)});
 }
 if(request.method==='GET'&&path==='/api/magnanimous/carrier/interconnects')return json({interconnects:await interconnects(env,user)});
 if(request.method==='POST'&&path==='/api/magnanimous/carrier/interconnects'){
  if(!manager(user))return json({detail:'Owner or admin role required.'},403);const b=await request.json().catch(()=>({}));const type=INTERCONNECT_TYPES.includes(String(b.type))?String(b.type):'sip-trunk';const ts=now();const result=await env.DB.prepare(`INSERT INTO magnanimous_carrier_interconnects(tenant_id,name,type,endpoint,credential_ref,priority,inbound,outbound,enabled,countries_json,rate_json,health_status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(String(user.tenant_id),clip(b.name||type,120),type,clip(b.endpoint,500),clip(b.credential_ref,120),Math.max(0,Number(b.priority||100)),b.inbound===false?0:1,b.outbound===false?0:1,b.enabled===false?0:1,JSON.stringify(Array.isArray(b.countries)?b.countries:[]).slice(0,6000),JSON.stringify(b.rate&&typeof b.rate==='object'?b.rate:{}).slice(0,6000),clip(b.health_status||'unknown',32),ts,ts).run();await audit(env,user,'interconnect.create',String(result.meta?.last_row_id||''),type);return json({ok:true,id:result.meta?.last_row_id||null},201);
 }
 if(request.method==='GET'&&path==='/api/magnanimous/carrier/numbers'){
  const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_carrier_numbers WHERE owner_tenant_id=? ORDER BY e164 LIMIT 1000').bind(String(user.tenant_id)).all();return json({numbers:results.map(x=>({...x,voice_enabled:!!x.voice_enabled,sms_enabled:!!x.sms_enabled,emergency_registered:!!x.emergency_registered}))});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/carrier/numbers'){
  if(!manager(user))return json({detail:'Owner or admin role required.'},403);const b=await request.json().catch(()=>({})),number=e164(b.e164);if(!number)return json({detail:'A valid E.164 number is required.'},400);const ts=now();await env.DB.prepare(`INSERT INTO magnanimous_carrier_numbers(e164,owner_tenant_id,source,interconnect_id,status,assigned_tenant_id,label,voice_enabled,sms_enabled,emergency_registered,porting_status,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(e164) DO UPDATE SET source=excluded.source,interconnect_id=excluded.interconnect_id,status=excluded.status,assigned_tenant_id=excluded.assigned_tenant_id,label=excluded.label,voice_enabled=excluded.voice_enabled,sms_enabled=excluded.sms_enabled,emergency_registered=excluded.emergency_registered,porting_status=excluded.porting_status,metadata_json=excluded.metadata_json,updated_at=excluded.updated_at`).bind(number,String(user.tenant_id),clip(b.source||'upstream',80),b.interconnect_id?Number(b.interconnect_id):null,clip(b.status||'inventory',40),clip(b.assigned_tenant_id,120),clip(b.label,120),b.voice_enabled===false?0:1,bool(b.sms_enabled)?1:0,bool(b.emergency_registered)?1:0,clip(b.porting_status,80),JSON.stringify(b.metadata&&typeof b.metadata==='object'?b.metadata:{}).slice(0,8000),ts,ts).run();await audit(env,user,'number.upsert',number,clip(b.source||'upstream',80));return json({ok:true,e164:number});
 }
 if(request.method==='GET'&&path==='/api/magnanimous/carrier/routes'){
  const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_carrier_routes WHERE tenant_id=? ORDER BY priority,id').bind(String(user.tenant_id)).all();return json({routes:results.map(x=>({...x,enabled:!!x.enabled,policy:(()=>{try{return JSON.parse(x.policy_json)}catch{return{}}})()}))});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/carrier/routes'){
  if(!manager(user))return json({detail:'Owner or admin role required.'},403);const b=await request.json().catch(()=>({}));const interconnectId=Number(b.interconnect_id||0);if(!interconnectId)return json({detail:'interconnect_id is required.'},400);const ic=await env.DB.prepare('SELECT id FROM magnanimous_carrier_interconnects WHERE tenant_id=? AND id=?').bind(String(user.tenant_id),interconnectId).first();if(!ic)return json({detail:'Interconnect not found.'},404);const ts=now();const r=await env.DB.prepare(`INSERT INTO magnanimous_carrier_routes(tenant_id,name,destination_prefix,interconnect_id,priority,enabled,max_rate,jurisdiction,policy_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(String(user.tenant_id),clip(b.name||'Carrier route',120),clip(b.destination_prefix,32),interconnectId,Math.max(0,Number(b.priority||100)),b.enabled===false?0:1,b.max_rate==null?null:Number(b.max_rate),clip(b.jurisdiction,80),JSON.stringify(b.policy&&typeof b.policy==='object'?b.policy:{}).slice(0,8000),ts,ts).run();await audit(env,user,'route.create',String(r.meta?.last_row_id||''),String(interconnectId));return json({ok:true,id:r.meta?.last_row_id||null},201);
 }
 if(request.method==='GET'&&path==='/api/magnanimous/carrier/route-plan')return json(await planCarrierRoute(env,user,url.searchParams.get('to'),url.searchParams.get('mode')||'balanced'));
 if(request.method==='POST'&&path==='/api/magnanimous/carrier/cdr'){
  if(!manager(user))return json({detail:'Owner or admin role required.'},403);const b=await request.json().catch(()=>({})),callId=clip(b.call_id,160);if(!callId)return json({detail:'call_id is required.'},400);await env.DB.prepare(`INSERT INTO magnanimous_carrier_cdr(tenant_id,call_id,provider_call_id,direction,from_number,to_number,interconnect_id,route_id,status,started_at,answered_at,ended_at,duration_seconds,billable_seconds,wholesale_cost,customer_charge,currency,stir_attestation,emergency_call,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,call_id) DO UPDATE SET provider_call_id=excluded.provider_call_id,status=excluded.status,answered_at=excluded.answered_at,ended_at=excluded.ended_at,duration_seconds=excluded.duration_seconds,billable_seconds=excluded.billable_seconds,wholesale_cost=excluded.wholesale_cost,customer_charge=excluded.customer_charge,stir_attestation=excluded.stir_attestation,metadata_json=excluded.metadata_json`).bind(String(user.tenant_id),callId,clip(b.provider_call_id,160),clip(b.direction||'outbound',20),clip(b.from_number,32),clip(b.to_number,32),b.interconnect_id?Number(b.interconnect_id):null,b.route_id?Number(b.route_id):null,clip(b.status,40),b.started_at?Number(b.started_at):null,b.answered_at?Number(b.answered_at):null,b.ended_at?Number(b.ended_at):null,Math.max(0,Number(b.duration_seconds||0)),Math.max(0,Number(b.billable_seconds||0)),Math.max(0,Number(b.wholesale_cost||0)),Math.max(0,Number(b.customer_charge||0)),clip(b.currency||'USD',8),clip(b.stir_attestation,8),bool(b.emergency_call)?1:0,JSON.stringify(b.metadata&&typeof b.metadata==='object'?b.metadata:{}).slice(0,12000),now()).run();await audit(env,user,'cdr.upsert',callId,clip(b.status,40));return json({ok:true,call_id:callId});
 }
 if(request.method==='GET'&&path==='/api/magnanimous/carrier/cdr'){
  const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_carrier_cdr WHERE tenant_id=? ORDER BY id DESC LIMIT 500').bind(String(user.tenant_id)).all();return json({cdr:results});
 }
 if(request.method==='GET'&&path==='/api/magnanimous/carrier/audit'){
  if(!manager(user))return json({detail:'Owner or admin role required.'},403);const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_carrier_audit WHERE tenant_id=? ORDER BY id DESC LIMIT 300').bind(String(user.tenant_id)).all();return json({audit:results});
 }
 return json({detail:'Magnanimous Carrier Core route not found.'},404);
}
