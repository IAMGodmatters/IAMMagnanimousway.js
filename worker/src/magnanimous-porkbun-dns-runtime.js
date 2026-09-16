import { getProviderRuntimeEnv } from './provider-runtime-env.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clip=(value,n=8000)=>String(value??'').trim().slice(0,n);
const now=()=>Math.floor(Date.now()/1000);
const BASE='https://api.porkbun.com/api/json/v3';
const CONFIRM_TTL_SECONDS=900;
const DNS_TYPES=new Set(['A','AAAA','MX','CNAME','ALIAS','TXT','NS','SRV','TLSA','CAA','SSHFP','HTTPS','SVCB']);
const ACTIONS=new Set(['create-record','edit-record','delete-record','update-nameservers']);

function isOwner(user){return String(user?.role||'').toLowerCase()==='owner';}
function normalizeDomain(value){
 const name=clip(value,253).toLowerCase().replace(/\.$/,'');
 if(!name||name.includes('://')||name.includes('/')||name.includes('\\')||name.includes('@')||name.includes(' ')||!name.includes('.'))return'';
 const labels=name.split('.');
 if(labels.some(label=>!label||label.length>63||!/^[a-z0-9-]+$/.test(label)||label.startsWith('-')||label.endsWith('-')))return'';
 return name;
}
function normalizeSubdomain(value){
 const name=clip(value,253).toLowerCase().replace(/\.$/,'');
 if(!name)return'';
 if(name==='*')return'*';
 const labels=name.split('.');
 if(labels.some(label=>!label||label.length>63||!/^[a-z0-9_*\-]+$/.test(label)||label.startsWith('-')||label.endsWith('-')))return null;
 return name;
}
function normalizeType(value){const type=clip(value,10).toUpperCase();return DNS_TYPES.has(type)?type:'';}
function numericId(value){const id=clip(value,32);return/^\d+$/.test(id)?id:'';}
function normalizeNs(value){const name=clip(value,253).toLowerCase().replace(/\.$/,'');if(!name||!name.includes('.'))return'';const labels=name.split('.');return labels.every(label=>label&&label.length<=63&&/^[a-z0-9-]+$/.test(label)&&!label.startsWith('-')&&!label.endsWith('-'))?name:'';}
function timeoutSignal(ms=15000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort('timeout'),ms);return{signal:controller.signal,done:()=>clearTimeout(timer)};}
async function ensureSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_dns_provider_actions (
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,provider TEXT NOT NULL,action TEXT NOT NULL,domain TEXT NOT NULL,
  status TEXT NOT NULL,payload_json TEXT NOT NULL DEFAULT '{}',preview_json TEXT NOT NULL DEFAULT '{}',result_json TEXT NOT NULL DEFAULT '{}',
  error_text TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_magnanimous_dns_provider_actions_tenant ON magnanimous_dns_provider_actions(tenant_id,created_at DESC)').run();
}
async function runtimeCredentials(env){
 const runtime=await getProviderRuntimeEnv(env);
 const apiKey=clip(runtime?.PORKBUN_API_KEY,500),secret=clip(runtime?.PORKBUN_SECRET_API_KEY,500);
 return{runtime,apiKey,secret,configured:Boolean(apiKey&&secret),sandbox:apiKey.startsWith('pk1_sb_')};
}
async function requestJson(path,{env,method='GET',body=null,auth=true,idempotencyKey=''}={}){
 const creds=await runtimeCredentials(env);
 if(auth&&!creds.configured)throw Object.assign(new Error('Registrar credentials are not configured in the Magnanimous credential vault.'),{code:'REGISTRAR_CONNECTION_REQUIRED',httpStatus:409});
 const url=new URL(path,BASE+'/');
 if(url.origin!==new URL(BASE).origin||!url.pathname.startsWith('/api/json/v3/'))throw new Error('Blocked registrar path.');
 const headers={accept:'application/json'};
 if(auth){headers['X-API-Key']=creds.apiKey;headers['X-Secret-API-Key']=creds.secret;}
 if(body!==null)headers['content-type']='application/json';
 if(idempotencyKey)headers['Idempotency-Key']=clip(idempotencyKey,255);
 const t=timeoutSignal();
 try{
  const response=await fetch(url.toString(),{method,headers,body:body===null?undefined:JSON.stringify(body),signal:t.signal,redirect:'error'});
  const text=await response.text();let data={};
  try{data=text?JSON.parse(text):{};}catch{throw new Error('Registrar returned an unreadable response.');}
  if(!response.ok||String(data?.status||'').toUpperCase()==='ERROR'){
   const error=new Error(clip(data?.message||`Registrar returned HTTP ${response.status}.`,1000));
   error.code=clip(data?.code||'REGISTRAR_REQUEST_FAILED',100);error.httpStatus=response.status>=400&&response.status<500?response.status:502;error.provider=data;throw error;
  }
  return{data,apiVersion:response.headers.get('x-api-version')||'',requestId:response.headers.get('x-request-id')||data?.requestId||'',sandbox:creds.sandbox||Boolean(data?.sandbox)};
 }finally{t.done();}
}
function cleanRecord(body,{forEdit=false}={}){
 const type=normalizeType(body?.type);if(!type)throw new Error('A supported DNS record type is required.');
 const content=clip(body?.content,65000);if(!content)throw new Error('DNS record content is required.');
 const name=normalizeSubdomain(body?.name);if(name===null)throw new Error('The DNS record subdomain is invalid.');
 const record={type,content};if(name!==''||!forEdit)record.name=name||'';
 if(body?.ttl!==undefined){const ttl=Number(body.ttl);if(!Number.isInteger(ttl)||ttl<0||ttl>2147483647)throw new Error('TTL must be a non-negative integer.');record.ttl=ttl;}
 if(body?.prio!==undefined||body?.priority!==undefined){const prio=Number(body.prio??body.priority);if(!Number.isInteger(prio)||prio<0||prio>65535)throw new Error('Priority must be from 0 to 65535.');record.prio=prio;}
 if(body?.notes!==undefined)record.notes=clip(body.notes,1000);
 return record;
}
function buildAction(body,{dryRun=false}={}){
 const action=clip(body?.action,50),domain=normalizeDomain(body?.domain);if(!ACTIONS.has(action))throw new Error('Unsupported registrar DNS action.');if(!domain)throw new Error('A valid registered domain is required.');
 let path='',payload={};
 if(action==='create-record'){path=`dns/create/${encodeURIComponent(domain)}`;payload=cleanRecord(body?.record||{});}
 if(action==='edit-record'){
  const id=numericId(body?.record_id);if(!id)throw new Error('A numeric record_id is required.');path=`dns/edit/${encodeURIComponent(domain)}/${id}`;payload=cleanRecord(body?.record||{},{forEdit:true});
 }
 if(action==='delete-record'){
  const id=numericId(body?.record_id);if(!id)throw new Error('A numeric record_id is required.');path=`dns/delete/${encodeURIComponent(domain)}/${id}`;payload={};
 }
 if(action==='update-nameservers'){
  const values=Array.isArray(body?.nameservers)?body.nameservers:[];const ns=values.map(normalizeNs);if(ns.length<2||ns.length>12||ns.some(v=>!v))throw new Error('Provide 2 to 12 valid nameserver hostnames.');path=`domain/updateNs/${encodeURIComponent(domain)}`;payload={ns};
 }
 if(dryRun)payload.dryRun=true;
 return{action,domain,path,payload,destructive:action==='delete-record'||action==='update-nameservers'};
}
async function previewAction(body,env){const built=buildAction(body,{dryRun:true});const result=await requestJson(built.path,{env,method:'POST',body:built.payload,auth:true});return{built,result};}
function safeError(error){return{detail:clip(error?.message||error,1000),code:clip(error?.code||'REGISTRAR_ERROR',100),next_action:error?.provider?.next_action||null};}

export async function handleMagnanimousPorkbunDns(request,env,user){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/magnanimous/dns'))return null;
 if(request.method==='GET'&&path==='/api/magnanimous/dns/domain-pricing'){
  try{const result=await requestJson('pricing/get',{env,auth:false});return json({identity:'Magnanimous AI',capability:'domain-pricing',provider_identity_public:false,pricing:result.data?.pricing||{},api_version:result.apiVersion});}catch(error){return json(safeError(error),502);}
 }
 if(!path.startsWith('/api/magnanimous/dns/porkbun'))return null;
 if(!isOwner(user))return json({detail:'Owner access required for registrar account operations.'},403);
 if(!env?.DB)return json({detail:'Registrar control requires D1.'},503);
 await ensureSchema(env);
 const creds=await runtimeCredentials(env);
 if(request.method==='GET'&&path==='/api/magnanimous/dns/porkbun/status')return json({identity:'Magnanimous AI',configured:creds.configured,sandbox:creds.sandbox,read_operations:['domain portfolio','domain metadata','DNS record inventory','nameservers','DNSSEC','glue records','availability and pricing'],write_operations:['DNS create','DNS edit','DNS delete','nameserver update'],write_safety:'dry-run, durable staging, separate confirmation, idempotent execution',domain_purchase_enabled:false,renewal_enabled:false,transfer_enabled:false,provider_identity_public:false});
 if(request.method==='GET'&&path==='/api/magnanimous/dns/porkbun/domains'){
  try{const result=await requestJson('domain/listAll',{env});return json({ok:true,domains:result.data?.domains||[],count:Number(result.data?.count??(result.data?.domains||[]).length),sandbox:result.sandbox});}catch(error){return json(safeError(error),error.httpStatus||502);}
 }
 if(request.method==='GET'&&path==='/api/magnanimous/dns/porkbun/domain'){
  const domain=normalizeDomain(url.searchParams.get('domain'));if(!domain)return json({detail:'A valid domain is required.'},400);
  try{const result=await requestJson(`domain/get/${encodeURIComponent(domain)}`,{env});return json({ok:true,domain:result.data,sandbox:result.sandbox});}catch(error){return json(safeError(error),error.httpStatus||502);}
 }
 if(request.method==='GET'&&path==='/api/magnanimous/dns/porkbun/availability'){
  const domain=normalizeDomain(url.searchParams.get('domain'));if(!domain)return json({detail:'A valid domain is required.'},400);
  try{const result=await requestJson(`domain/checkDomain/${encodeURIComponent(domain)}`,{env,method:'POST',body:{}});return json({ok:true,domain,availability:result.data?.response||null,limits:result.data?.limits||null,ttl_remaining:result.data?.ttlRemaining??null,sandbox:result.sandbox});}catch(error){return json(safeError(error),error.httpStatus||502);}
 }
 if(request.method==='GET'&&path==='/api/magnanimous/dns/porkbun/records'){
  const domain=normalizeDomain(url.searchParams.get('domain'));if(!domain)return json({detail:'A valid domain is required.'},400);
  try{const result=await requestJson(`dns/retrieve/${encodeURIComponent(domain)}`,{env});return json({ok:true,domain,cloudflare:result.data?.cloudflare||null,records:result.data?.records||[],sandbox:result.sandbox});}catch(error){return json(safeError(error),error.httpStatus||502);}
 }
 if(request.method==='GET'&&path==='/api/magnanimous/dns/porkbun/nameservers'){
  const domain=normalizeDomain(url.searchParams.get('domain'));if(!domain)return json({detail:'A valid domain is required.'},400);
  try{const result=await requestJson(`domain/getNs/${encodeURIComponent(domain)}`,{env});return json({ok:true,domain,nameservers:result.data?.ns||[],sandbox:result.sandbox});}catch(error){return json(safeError(error),error.httpStatus||502);}
 }
 if(request.method==='GET'&&path==='/api/magnanimous/dns/porkbun/dnssec'){
  const domain=normalizeDomain(url.searchParams.get('domain'));if(!domain)return json({detail:'A valid domain is required.'},400);
  try{const result=await requestJson(`dns/getDnssecRecords/${encodeURIComponent(domain)}`,{env});return json({ok:true,domain,records:result.data?.records||{},sandbox:result.sandbox});}catch(error){return json(safeError(error),error.httpStatus||502);}
 }
 if(request.method==='GET'&&path==='/api/magnanimous/dns/porkbun/glue'){
  const domain=normalizeDomain(url.searchParams.get('domain'));if(!domain)return json({detail:'A valid domain is required.'},400);
  try{const result=await requestJson(`domain/getGlue/${encodeURIComponent(domain)}`,{env});return json({ok:true,domain,hosts:result.data?.hosts||[],sandbox:result.sandbox});}catch(error){return json(safeError(error),error.httpStatus||502);}
 }
 if(request.method==='POST'&&path==='/api/magnanimous/dns/porkbun/dry-run'){
  const body=await request.json().catch(()=>({}));try{const {built,result}=await previewAction(body,env);return json({ok:true,dry_run:true,would_succeed:result.data?.wouldSucceed!==false,action:built.action,domain:built.domain,destructive:built.destructive,preview:result.data,sandbox:result.sandbox});}catch(error){return json(safeError(error),error.httpStatus||400);}
 }
 if(request.method==='POST'&&path==='/api/magnanimous/dns/porkbun/stage'){
  const body=await request.json().catch(()=>({}));
  try{
   const {built,result}=await previewAction(body,env);if(result.data?.wouldSucceed===false)return json({detail:'Registrar dry-run reported that this action would not succeed.',preview:result.data},409);
   const id=crypto.randomUUID(),ts=now();await env.DB.prepare(`INSERT INTO magnanimous_dns_provider_actions(id,tenant_id,user_id,provider,action,domain,status,payload_json,preview_json,result_json,error_text,created_at,updated_at) VALUES(?,?,?,?,?,?, 'needs_confirmation',?,?,?,?,?,?)`).bind(id,String(user.tenant_id),String(user.id),'porkbun',built.action,built.domain,JSON.stringify({action:built.action,domain:built.domain,path:built.path,payload:buildAction(body,{dryRun:false}).payload,destructive:built.destructive}),JSON.stringify(result.data).slice(0,100000),'{}','',ts,ts).run();
   return json({ok:true,id,status:'needs_confirmation',action:built.action,domain:built.domain,destructive:built.destructive,requires_confirmation:true,confirmation_expires_at:ts+CONFIRM_TTL_SECONDS,preview:result.data},202);
  }catch(error){return json(safeError(error),error.httpStatus||400);}
 }
 if(request.method==='GET'&&path==='/api/magnanimous/dns/porkbun/actions'){
  const {results=[]}=await env.DB.prepare('SELECT id,action,domain,status,preview_json,result_json,error_text,created_at,updated_at FROM magnanimous_dns_provider_actions WHERE tenant_id=? AND provider=? ORDER BY created_at DESC LIMIT 100').bind(String(user.tenant_id),'porkbun').all();
  return json({ok:true,actions:results.map(row=>({...row,preview:JSON.parse(row.preview_json||'{}'),result:JSON.parse(row.result_json||'{}'),preview_json:undefined,result_json:undefined}))});
 }
 const confirm=path.match(/^\/api\/magnanimous\/dns\/porkbun\/actions\/([^/]+)\/confirm$/);
 if(confirm&&request.method==='POST'){
  const id=clip(confirm[1],80),row=await env.DB.prepare('SELECT * FROM magnanimous_dns_provider_actions WHERE id=? AND tenant_id=? AND provider=?').bind(id,String(user.tenant_id),'porkbun').first();if(!row)return json({detail:'DNS action not found.'},404);if(row.status!=='needs_confirmation')return json({detail:`DNS action is already ${row.status}.`},409);
  if(Number(row.created_at||0)<now()-CONFIRM_TTL_SECONDS){await env.DB.prepare("UPDATE magnanimous_dns_provider_actions SET status='expired',updated_at=? WHERE id=? AND status='needs_confirmation'").bind(now(),id).run();return json({detail:'DNS action confirmation expired. Run a fresh dry-run and stage again.'},410);}
  let stored={};try{stored=JSON.parse(row.payload_json||'{}');}catch{return json({detail:'Stored DNS action payload is invalid.'},500);}
  if(!ACTIONS.has(stored.action)||normalizeDomain(stored.domain)!==row.domain||!clip(stored.path,500))return json({detail:'Stored DNS action failed integrity validation.'},409);
  const claimed=await env.DB.prepare("UPDATE magnanimous_dns_provider_actions SET status='executing',updated_at=? WHERE id=? AND tenant_id=? AND status='needs_confirmation'").bind(now(),id,String(user.tenant_id)).run();if(Number(claimed?.meta?.changes||0)!==1)return json({detail:'DNS action was already claimed or changed.'},409);
  try{const result=await requestJson(stored.path,{env,method:'POST',body:stored.payload||{},auth:true,idempotencyKey:`magnanimous-dns-${id}`});await env.DB.prepare("UPDATE magnanimous_dns_provider_actions SET status='completed',result_json=?,error_text='',updated_at=? WHERE id=? AND tenant_id=?").bind(JSON.stringify(result.data).slice(0,100000),now(),id,String(user.tenant_id)).run();return json({ok:true,id,status:'completed',action:row.action,domain:row.domain,result:result.data,sandbox:result.sandbox});}catch(error){await env.DB.prepare("UPDATE magnanimous_dns_provider_actions SET status='failed',error_text=?,updated_at=? WHERE id=? AND tenant_id=?").bind(clip(error?.message||error,1000),now(),id,String(user.tenant_id)).run();return json(safeError(error),error.httpStatus||502);}
 }
 const cancel=path.match(/^\/api\/magnanimous\/dns\/porkbun\/actions\/([^/]+)\/cancel$/);
 if(cancel&&request.method==='POST'){
  const id=clip(cancel[1],80),result=await env.DB.prepare("UPDATE magnanimous_dns_provider_actions SET status='cancelled',updated_at=? WHERE id=? AND tenant_id=? AND provider=? AND status='needs_confirmation'").bind(now(),id,String(user.tenant_id),'porkbun').run();return Number(result?.meta?.changes||0)===1?json({ok:true,id,status:'cancelled'}):json({detail:'Pending DNS action was not found or is no longer cancellable.'},409);
 }
 return json({detail:'Unsupported registrar DNS operation.'},405);
}
