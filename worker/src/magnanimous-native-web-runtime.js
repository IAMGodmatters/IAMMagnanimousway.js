import {currentUser} from './integrations.js';
import {requirePlatformOwner} from './platform-owner-guard.js';
import {findReadyLocalBridgeDevice,queueLocalBridgeTask,localBridgeTask,handleMagnanimousLocalBridge} from './magnanimous-local-bridge-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clip=(value,n=4000)=>String(value??'').trim().slice(0,n);
const uid=prefix=>`${prefix}_${crypto.randomUUID()}`;

export const NATIVE_WEB_CAPABILITIES=Object.freeze({
 search:{action:'browser_search',mode:'read-only',confirmation:false,description:'Fresh browser-based web search from a local Chromium session.'},
 fetch:{action:'browser_fetch',mode:'read-only',confirmation:false,description:'JavaScript-rendered page extraction with links, optional HTML and selector fields.'},
 read_flow:{action:'browser_read_flow',mode:'read-only',confirmation:false,description:'Multi-step navigation, waiting, scrolling, snapshots and extraction without page writes.'},
 action_flow:{action:'browser_action_flow',mode:'interactive',confirmation:true,description:'Confirmed page-scoped click/fill/select/press workflows with screenshot capture.'},
 profiles:{action:'browser_profile_list',mode:'local-session',confirmation:false,description:'Persistent local Chromium session profiles. Credentials stay on the paired computer.'},
 profile_setup:{action:'browser_profile_setup',mode:'local-session',confirmation:true,description:'Opens a visible local browser for manual sign-in without sending passwords through the platform.'},
 monitoring:{action:'scheduled-native-web',mode:'read-only',confirmation:false,description:'15-minute-or-slower scheduled search/fetch monitoring through the paired native browser.'}
});

const KIND_TO_ACTION=Object.freeze({
 search:'browser_search',
 fetch:'browser_fetch',
 read:'browser_read_flow',
 read_flow:'browser_read_flow',
 action:'browser_action_flow',
 action_flow:'browser_action_flow',
 profiles:'browser_profile_list',
 profile_setup:'browser_profile_setup'
});

async function sha(value){
 const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value??'')));
 return [...new Uint8Array(data)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

async function ensureSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_web_monitors(
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL,
  request_json TEXT NOT NULL DEFAULT '{}',
  interval_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'active',
  last_task_id TEXT,
  last_run_at INTEGER NOT NULL DEFAULT 0,
  next_run_at INTEGER NOT NULL DEFAULT 0,
  last_result_hash TEXT NOT NULL DEFAULT '',
  last_changed_at INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_native_web_monitors_due ON magnanimous_web_monitors(status,next_run_at)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_native_web_monitors_tenant ON magnanimous_web_monitors(tenant_id,created_at DESC)').run();
}

async function owner(request,env){
 const denied=await requirePlatformOwner(request,env);if(denied)return{denied};
 const user=await currentUser(request,env);if(!user)return{denied:json({detail:'Platform owner sign-in required.'},401)};
 return{user};
}

function publicMonitor(row){
 return{
  id:row.id,name:row.name,kind:row.kind,interval_minutes:Number(row.interval_minutes||0),status:row.status,
  last_task_id:row.last_task_id||null,last_run_at:Number(row.last_run_at||0),next_run_at:Number(row.next_run_at||0),
  changed:Boolean(row.last_changed_at&&row.last_run_at&&Number(row.last_changed_at)>=Number(row.last_run_at)),
  last_changed_at:Number(row.last_changed_at||0),last_error:row.last_error||'',created_at:Number(row.created_at||0),updated_at:Number(row.updated_at||0)
 };
}

async function readiness(env,tenantId){
 const entries={};
 for(const [id,def] of Object.entries(NATIVE_WEB_CAPABILITIES)){
  if(id==='monitoring'){entries[id]={...def,ready:Boolean(await findReadyLocalBridgeDevice(env,tenantId,'browser_fetch'))};continue}
  entries[id]={...def,ready:Boolean(await findReadyLocalBridgeDevice(env,tenantId,def.action))};
 }
 return entries;
}

function payloadFor(kind,body){
 if(kind==='search')return{query:clip(body.query,2000),limit:body.limit,profile:body.profile,locale:body.locale};
 if(kind==='fetch')return{url:clip(body.url,4000),selector:clip(body.selector,1000),max_chars:body.max_chars,link_limit:body.link_limit,include_html:body.include_html===true,fields:body.fields||{},profile:body.profile,locale:body.locale,settle_ms:body.settle_ms};
 if(kind==='read'||kind==='read_flow'||kind==='action'||kind==='action_flow')return{steps:Array.isArray(body.steps)?body.steps:[],profile:body.profile,locale:body.locale,timeout_ms:body.timeout_ms};
 if(kind==='profile_setup')return{url:clip(body.url,4000),profile:body.profile,seconds:body.seconds,locale:body.locale};
 if(kind==='profiles')return{};
 return{};
}

async function queueRun(env,user,kind,body,allowConfirmation=true){
 const action=KIND_TO_ACTION[kind];
 if(!action)return{ok:false,code:'UNSUPPORTED_NATIVE_WEB_KIND',detail:'Unsupported native web run kind.'};
 const queued=await queueLocalBridgeTask(env,user,{action,payload:payloadFor(kind,body),allowConfirmation});
 if(!queued.ok)return queued;
 return{...queued,kind,native:true,operator:'Magnanimous AI',tinyfish_required:false};
}

async function confirmOrCancel(request,env,user,taskId,operation){
 const nestedUrl=new URL('/api/magnanimous/local-bridge/tasks/'+encodeURIComponent(taskId)+'/'+operation,request.url);
 const headers=new Headers(request.headers);headers.set('content-type','application/json');headers.delete('content-length');
 const nested=new Request(nestedUrl,{method:'POST',headers,body:operation==='confirm'?JSON.stringify({confirm:true}):JSON.stringify({})});
 return handleMagnanimousLocalBridge(nested,env);
}

export async function handleMagnanimousNativeWeb(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/native-web'))return null;
 if(!env?.DB)return json({detail:'Magnanimous Native Web requires D1.'},503);
 await ensureSchema(env);
 const auth=await owner(request,env);if(auth.denied)return auth.denied;const user=auth.user,tenantId=String(user.tenant_id);

 if(request.method==='GET'&&path==='/api/magnanimous/native-web/capabilities'){
  const capabilities=await readiness(env,tenantId);
  return json({
   identity:'Magnanimous AI',
   architecture:'native-first-local-browser',
   browser_engine:'Chromium via Playwright on paired Magnanimous Local Bridge',
   tinyfish_required:false,
   external_web_agent_required:false,
   secrets:'local browser profiles only; password fields are not accepted from remote browser tasks',
   private_network_targets:false,
   capabilities
  });
 }

 if(request.method==='POST'&&path==='/api/magnanimous/native-web/runs'){
  const body=await request.json().catch(()=>({})),kind=clip(body.kind,40).toLowerCase();
  try{
   const queued=await queueRun(env,user,kind,body,true);
   if(!queued.ok)return json({detail:queued.detail,code:queued.code,native:true,tinyfish_required:false},queued.code==='CONFIRMATION_REQUIRED'?409:503);
   return json(queued,queued.requires_confirmation?202:201);
  }catch(error){return json({detail:error.message||'Native web run could not be queued.',code:'NATIVE_WEB_INVALID'},400)}
 }

 let match=path.match(/^\/api\/magnanimous\/native-web\/runs\/([^/]+)$/);
 if(request.method==='GET'&&match){
  const task=await localBridgeTask(env,tenantId,decodeURIComponent(match[1]));
  if(!task)return json({detail:'Native web run not found.'},404);
  return json({...task,native:true,tinyfish_required:false});
 }

 match=path.match(/^\/api\/magnanimous\/native-web\/runs\/([^/]+)\/(confirm|cancel)$/);
 if(request.method==='POST'&&match)return confirmOrCancel(request,env,user,decodeURIComponent(match[1]),match[2]);

 if(request.method==='GET'&&path==='/api/magnanimous/native-web/monitors'){
  const {results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_web_monitors WHERE tenant_id=? ORDER BY created_at DESC LIMIT 200').bind(tenantId).all();
  return json({monitors:results.map(publicMonitor),native:true,tinyfish_required:false});
 }

 if(request.method==='POST'&&path==='/api/magnanimous/native-web/monitors'){
  const body=await request.json().catch(()=>({})),kind=clip(body.kind,40).toLowerCase();
  if(!['search','fetch'].includes(kind))return json({detail:'Native monitors support read-only search or fetch jobs.'},400);
  const requestPayload=payloadFor(kind,body);
  if(kind==='search'&&!requestPayload.query)return json({detail:'Search monitor requires query.'},400);
  if(kind==='fetch'&&!requestPayload.url)return json({detail:'Fetch monitor requires url.'},400);
  const interval=Math.max(15,Math.min(10080,Number(body.interval_minutes||60))),id=uid('nwm'),ts=now();
  await env.DB.prepare('INSERT INTO magnanimous_web_monitors(id,tenant_id,user_id,name,kind,request_json,interval_minutes,status,last_run_at,next_run_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,\'active\',0,?,?,?)').bind(id,tenantId,String(user.id),clip(body.name,160)||('Native '+kind+' monitor'),kind,JSON.stringify(requestPayload).slice(0,100000),Math.floor(interval),ts,ts,ts).run();
  const row=await env.DB.prepare('SELECT * FROM magnanimous_web_monitors WHERE id=?').bind(id).first();
  return json({monitor:publicMonitor(row),native:true,tinyfish_required:false},201);
 }

 match=path.match(/^\/api\/magnanimous\/native-web\/monitors\/([^/]+)$/);
 if(match&&request.method==='DELETE'){
  const id=decodeURIComponent(match[1]),changed=await env.DB.prepare('DELETE FROM magnanimous_web_monitors WHERE id=? AND tenant_id=?').bind(id,tenantId).run();
  return json({deleted:Number(changed?.meta?.changes||0)>0,id});
 }
 if(match&&request.method==='PATCH'){
  const id=decodeURIComponent(match[1]),body=await request.json().catch(()=>({})),status=['active','paused'].includes(String(body.status))?String(body.status):null;
  const interval=body.interval_minutes==null?null:Math.max(15,Math.min(10080,Math.floor(Number(body.interval_minutes)||60)));
  const row=await env.DB.prepare('SELECT * FROM magnanimous_web_monitors WHERE id=? AND tenant_id=?').bind(id,tenantId).first();
  if(!row)return json({detail:'Monitor not found.'},404);
  await env.DB.prepare('UPDATE magnanimous_web_monitors SET status=?,interval_minutes=?,next_run_at=?,updated_at=? WHERE id=? AND tenant_id=?').bind(status||row.status,interval||row.interval_minutes,status==='active'?now():row.next_run_at,now(),id,tenantId).run();
  const updated=await env.DB.prepare('SELECT * FROM magnanimous_web_monitors WHERE id=?').bind(id).first();
  return json({monitor:publicMonitor(updated)});
 }

 return json({detail:'Magnanimous Native Web route not found.'},404);
}

async function settleMonitor(env,row){
 if(!row.last_task_id)return false;
 const task=await localBridgeTask(env,row.tenant_id,row.last_task_id);
 if(!task||!['completed','failed','cancelled'].includes(String(task.status)))return false;
 const ts=now(),next=ts+Math.max(15,Number(row.interval_minutes||60))*60;
 if(task.status==='completed'){
  const digest=await sha(JSON.stringify(task.result||{}));
  const changed=Boolean(row.last_result_hash&&row.last_result_hash!==digest);
  await env.DB.prepare('UPDATE magnanimous_web_monitors SET last_task_id=NULL,last_result_hash=?,last_changed_at=?,last_error=\'\',next_run_at=?,updated_at=? WHERE id=?').bind(digest,changed?ts:Number(row.last_changed_at||0),next,ts,row.id).run();
 }else{
  await env.DB.prepare('UPDATE magnanimous_web_monitors SET last_task_id=NULL,last_error=?,next_run_at=?,updated_at=? WHERE id=?').bind(clip(task.error||task.status,2000),next,ts,row.id).run();
 }
 return true;
}

async function queueMonitor(env,row){
 let body={};try{body=JSON.parse(row.request_json||'{}')}catch{}
 const user={tenant_id:row.tenant_id,id:row.user_id};
 const queued=await queueRun(env,user,row.kind,body,false);
 if(!queued.ok){
  await env.DB.prepare('UPDATE magnanimous_web_monitors SET last_error=?,next_run_at=?,updated_at=? WHERE id=?').bind(clip(queued.detail||queued.code,2000),now()+Math.max(15,Number(row.interval_minutes||60))*60,now(),row.id).run();
  return false;
 }
 const ts=now();
 await env.DB.prepare('UPDATE magnanimous_web_monitors SET last_task_id=?,last_run_at=?,next_run_at=?,last_error=\'\',updated_at=? WHERE id=?').bind(queued.id,ts,ts+Math.max(15,Number(row.interval_minutes||60))*60,ts,row.id).run();
 return true;
}

export async function scheduledNativeWeb(env){
 if(!env?.DB)return{ok:false,processed:0,queued:0};
 await ensureSchema(env);
 const {results:pending=[]}=await env.DB.prepare("SELECT * FROM magnanimous_web_monitors WHERE status='active' AND last_task_id IS NOT NULL LIMIT 100").all();
 let processed=0,queued=0;
 for(const row of pending){try{if(await settleMonitor(env,row))processed++}catch(error){console.error('native web monitor settlement failed',row.id,error)}}
 const {results:due=[]}=await env.DB.prepare("SELECT * FROM magnanimous_web_monitors WHERE status='active' AND last_task_id IS NULL AND next_run_at<=? ORDER BY next_run_at ASC LIMIT 40").bind(now()).all();
 for(const row of due){try{if(await queueMonitor(env,row))queued++}catch(error){console.error('native web monitor queue failed',row.id,error)}}
 return{ok:true,processed,queued};
}
