import { currentUser } from './integrations.js';
import { requirePlatformOwner } from './platform-owner-guard.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clip=(v,n=4000)=>String(v??'').trim().slice(0,n);
const uid=p=>`${p}_${crypto.randomUUID()}`;
const PAIR_TTL=10*60,TASK_TTL=30*60,ACTIVE_WINDOW=120;

export const LOCAL_BRIDGE_ACTIONS=Object.freeze({
 system_info:{risk:'low',auto:true,confirmation:false,family:'system'},
 health:{risk:'low',auto:true,confirmation:false,family:'system'},
 workspace_list:{risk:'low',auto:true,confirmation:false,family:'workspace'},
 read_file:{risk:'low',auto:true,confirmation:false,family:'files'},
 search_text:{risk:'low',auto:true,confirmation:false,family:'files'},
 git_status:{risk:'low',auto:true,confirmation:false,family:'git'},
 git_diff:{risk:'low',auto:true,confirmation:false,family:'git'},
 git_log:{risk:'low',auto:true,confirmation:false,family:'git'},
 project_test:{risk:'medium',auto:true,confirmation:false,family:'project-lifecycle'},
 project_lint:{risk:'medium',auto:true,confirmation:false,family:'project-lifecycle'},
 project_typecheck:{risk:'medium',auto:true,confirmation:false,family:'project-lifecycle'},
 project_build:{risk:'medium',auto:true,confirmation:false,family:'project-lifecycle'},
 web_fetch:{risk:'low',auto:true,confirmation:false,family:'network'},
 browser_search:{risk:'low',auto:true,confirmation:false,family:'native-web'},
 browser_fetch:{risk:'low',auto:true,confirmation:false,family:'native-web'},
 browser_read_flow:{risk:'low',auto:true,confirmation:false,family:'native-web'},
 browser_action_flow:{risk:'high',auto:false,confirmation:true,family:'native-web'},
 browser_profile_list:{risk:'low',auto:true,confirmation:false,family:'native-web'},
 browser_profile_setup:{risk:'medium',auto:false,confirmation:true,family:'native-web'},
 netwalk_probe:{risk:'medium',auto:false,confirmation:false,family:'netwalk',scope_required:true},
 netwalk_scan:{risk:'medium',auto:false,confirmation:false,family:'netwalk',scope_required:true},
 netwalk_diag:{risk:'medium',auto:false,confirmation:false,family:'netwalk',scope_required:true},
 netwalk_map:{risk:'low',auto:false,confirmation:false,family:'netwalk'},
 netwalk_report:{risk:'low',auto:false,confirmation:false,family:'netwalk'},
 apply_patch:{risk:'high',auto:false,confirmation:true,family:'files'},
 git_create_branch:{risk:'medium',auto:false,confirmation:true,family:'git'},
 git_commit:{risk:'high',auto:false,confirmation:true,family:'git'}
});

export const LOCAL_BRIDGE_POLICY=Object.freeze({
 transport:'outbound-polling-over-https',
 inbound_listener_required:false,
 token_storage:'local-agent-only; server stores SHA-256 hash',
 raw_shell_exposed:false,
 raw_keyboard_mouse_exposed:false,
 browser_input_scoped_to_page:true,
 browser_secret_fill_from_remote_task:false,
 browser_private_network_targets:false,
 browser_profiles_local_only:true,
 arbitrary_process_execution:false,
 workspace_roots_required:true,
 exact_capability_allowlist:true,
 secrets_in_chat:false,
 netwalk_read_only:true,
 netwalk_scope_authorization_required:true,
 consequential_changes_confirmation_required:true
});

async function sha(value){
 const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value||'')));
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function bridgeToken(request){
 const h=String(request.headers.get('authorization')||'');
 return h.startsWith('Bridge ')?h.slice(7).trim():'';
}
async function ensureSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_local_bridge_pairings(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,code_hash TEXT NOT NULL UNIQUE,name TEXT NOT NULL DEFAULT '',
  expires_at INTEGER NOT NULL,used_at INTEGER,created_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_local_bridge_devices(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,hostname TEXT NOT NULL DEFAULT '',platform TEXT NOT NULL DEFAULT '',
  capabilities_json TEXT NOT NULL DEFAULT '[]',token_hash TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'active',
  last_seen_at INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_local_bridge_tasks(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,device_id TEXT NOT NULL,action TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',risk_class TEXT NOT NULL DEFAULT 'low',status TEXT NOT NULL DEFAULT 'queued',
  result_json TEXT NOT NULL DEFAULT '{}',error_text TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,claimed_at INTEGER,
  completed_at INTEGER,expires_at INTEGER NOT NULL,confirmed_at INTEGER
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_local_bridge_devices_tenant ON magnanimous_local_bridge_devices(tenant_id,last_seen_at DESC)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_local_bridge_tasks_device ON magnanimous_local_bridge_tasks(device_id,status,created_at)').run();
}
async function owner(request,env){
 const denied=await requirePlatformOwner(request,env);if(denied)return{denied};
 const user=await currentUser(request,env);if(!user)return{denied:json({detail:'Platform owner sign-in required.'},401)};
 return{user};
}
async function deviceFromRequest(request,env){
 const token=bridgeToken(request);if(!token)return null;
 const tokenHash=await sha(token);
 const row=await env.DB.prepare("SELECT * FROM magnanimous_local_bridge_devices WHERE token_hash=? AND status='active'").bind(tokenHash).first();
 if(!row)return null;
 await env.DB.prepare('UPDATE magnanimous_local_bridge_devices SET last_seen_at=?,updated_at=? WHERE id=?').bind(now(),now(),row.id).run();
 return row;
}
function safeCapabilities(value){
 const input=Array.isArray(value)?value:[];
 return [...new Set(input.map(x=>clip(x,80)).filter(x=>LOCAL_BRIDGE_ACTIONS[x]))].slice(0,100);
}
function publicDevice(row,activation=null){
 if(!row)return null;
 let caps=[];try{caps=JSON.parse(row.capabilities_json||'[]')}catch{}
 return{id:row.id,name:row.name,hostname:row.hostname,platform:row.platform,status:row.status,last_seen_at:Number(row.last_seen_at||0),online:Number(row.last_seen_at||0)>=now()-ACTIVE_WINDOW,capabilities:caps,activation:{verified:Boolean(activation?.status==='completed'),status:activation?.status||'not-run',task_id:activation?.id||null,completed_at:Number(activation?.completed_at||0),error:activation?.error_text||''},created_at:Number(row.created_at||0),updated_at:Number(row.updated_at||0)};
}
function validateTask(action,payload){
 const def=LOCAL_BRIDGE_ACTIONS[action];if(!def)throw new Error('Unsupported local bridge action.');
 const body=payload&&typeof payload==='object'&&!Array.isArray(payload)?payload:{};
 if(def.scope_required&&!clip(body.authorization_note,1000))throw new Error('Recorded owner authorization is required for this Netwalk action.');
 if(action==='web_fetch'){
  let u;try{u=new URL(String(body.url||''))}catch{}
  if(!u||!['http:','https:'].includes(u.protocol))throw new Error('web_fetch requires an http(s) URL.');
 }
 if(['read_file','search_text','git_status','git_diff','git_log','project_test','project_lint','project_typecheck','project_build','apply_patch','git_create_branch','git_commit'].includes(action)&&!clip(body.workspace,1000))throw new Error('A paired workspace path/id is required.');
 if(action==='apply_patch'&&!clip(body.patch,200000))throw new Error('apply_patch requires a unified diff patch.');
 return{def,body};
}
export async function hasReadyLocalBridge(env,tenantId){
 if(!env?.DB||!tenantId)return false;
 await ensureSchema(env);
 const row=await env.DB.prepare("SELECT id FROM magnanimous_local_bridge_devices WHERE tenant_id=? AND status='active' AND last_seen_at>=? LIMIT 1").bind(String(tenantId),now()-ACTIVE_WINDOW).first();
 return Boolean(row?.id);
}
export async function hasAnyReadyLocalBridge(env){
 if(!env?.DB)return false;
 await ensureSchema(env);
 const row=await env.DB.prepare("SELECT id FROM magnanimous_local_bridge_devices WHERE status='active' AND last_seen_at>=? LIMIT 1").bind(now()-ACTIVE_WINDOW).first();
 return Boolean(row?.id);
}
export async function findReadyLocalBridgeDevice(env,tenantId,action=''){
 if(!env?.DB||!tenantId)return null;
 await ensureSchema(env);
 const {results=[]}=await env.DB.prepare("SELECT * FROM magnanimous_local_bridge_devices WHERE tenant_id=? AND status='active' AND last_seen_at>=? ORDER BY last_seen_at DESC").bind(String(tenantId),now()-ACTIVE_WINDOW).all();
 for(const row of results){
  let caps=[];try{caps=JSON.parse(row.capabilities_json||'[]')}catch{}
  if(!action||caps.includes(action))return publicDevice(row);
 }
 return null;
}
async function overview(env,user){
 const tenantId=String(user.tenant_id);
 const {results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_local_bridge_devices WHERE tenant_id=? ORDER BY last_seen_at DESC').bind(tenantId).all();
 const {results:activationRows=[]}=await env.DB.prepare("SELECT t.* FROM magnanimous_local_bridge_tasks t JOIN (SELECT device_id,MAX(created_at) created_at FROM magnanimous_local_bridge_tasks WHERE tenant_id=? AND action='health' GROUP BY device_id) latest ON latest.device_id=t.device_id AND latest.created_at=t.created_at WHERE t.tenant_id=? AND t.action='health'").bind(tenantId,tenantId).all();
 const activations=new Map(activationRows.map(x=>[String(x.device_id),x]));
 const devices=results.map(x=>publicDevice(x,activations.get(String(x.id))));
 const pending=Number((await env.DB.prepare("SELECT COUNT(*) n FROM magnanimous_local_bridge_tasks WHERE tenant_id=? AND status IN ('queued','claimed','needs_confirmation')").bind(tenantId).first())?.n||0);
 return{identity:'Magnanimous AI',mode:'outbound-local-bridge',ready:devices.some(x=>x.online&&x.status==='active'&&x.activation.verified),paired:devices.some(x=>x.online&&x.status==='active'),policy:LOCAL_BRIDGE_POLICY,actions:LOCAL_BRIDGE_ACTIONS,devices,pending_tasks:pending};
}

export async function handleMagnanimousLocalBridge(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/local-bridge'))return null;
 if(!env?.DB)return json({detail:'Magnanimous Local Bridge requires D1.'},503);
 await ensureSchema(env);

 if(request.method==='POST'&&path==='/api/magnanimous/local-bridge/agent/pair'){
  const body=await request.json().catch(()=>({})),code=clip(body.code,200);
  if(!code)return json({detail:'Pairing code is required.'},400);
  const codeHash=await sha(code),pair=await env.DB.prepare('SELECT * FROM magnanimous_local_bridge_pairings WHERE code_hash=? AND used_at IS NULL AND expires_at>=?').bind(codeHash,now()).first();
  if(!pair)return json({detail:'Pairing code is invalid, expired, or already used.'},401);
  const token='mblb_'+crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-',''),tokenHash=await sha(token),id=uid('lbd'),ts=now();
  const caps=safeCapabilities(body.capabilities),activationTaskId=caps.includes('health')?uid('lbt'):null;
  const statements=[
   env.DB.prepare('INSERT INTO magnanimous_local_bridge_devices(id,tenant_id,name,hostname,platform,capabilities_json,token_hash,status,last_seen_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,\'active\',?,?,?)').bind(id,pair.tenant_id,clip(body.name,120)||pair.name||'Magnanimous Local Bridge',clip(body.hostname,200),clip(body.platform,120),JSON.stringify(caps),tokenHash,ts,ts,ts),
   env.DB.prepare('UPDATE magnanimous_local_bridge_pairings SET used_at=? WHERE id=? AND used_at IS NULL').bind(ts,pair.id)
  ];
  if(activationTaskId)statements.push(env.DB.prepare('INSERT INTO magnanimous_local_bridge_tasks(id,tenant_id,user_id,device_id,action,payload_json,risk_class,status,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(activationTaskId,pair.tenant_id,pair.user_id,id,'health','{}','low','queued',ts,ts+TASK_TTL));
  await env.DB.batch(statements);
  return json({ok:true,device_id:id,bridge_token:token,activation_task_id:activationTaskId,poll_endpoint:'/api/magnanimous/local-bridge/agent/next',result_endpoint:'/api/magnanimous/local-bridge/agent/result',heartbeat_endpoint:'/api/magnanimous/local-bridge/agent/heartbeat',note:'Store the bridge token only on this local machine. It is shown once and the server keeps only its hash. A safe health task is queued automatically to verify real execution when supported.'},201);
 }

 if(path.startsWith('/api/magnanimous/local-bridge/agent/')){
  const device=await deviceFromRequest(request,env);if(!device)return json({detail:'Valid local bridge token required.'},401);
  if(request.method==='POST'&&path==='/api/magnanimous/local-bridge/agent/heartbeat'){
   const body=await request.json().catch(()=>({})),caps=safeCapabilities(body.capabilities),ts=now();
   await env.DB.prepare('UPDATE magnanimous_local_bridge_devices SET hostname=?,platform=?,capabilities_json=?,last_seen_at=?,updated_at=? WHERE id=?').bind(clip(body.hostname,200)||device.hostname,clip(body.platform,120)||device.platform,JSON.stringify(caps.length?caps:JSON.parse(device.capabilities_json||'[]')),ts,ts,device.id).run();
   return json({ok:true,server_time:ts});
  }
  if(request.method==='GET'&&path==='/api/magnanimous/local-bridge/agent/next'){
   const task=await env.DB.prepare("SELECT * FROM magnanimous_local_bridge_tasks WHERE device_id=? AND status='queued' AND expires_at>=? ORDER BY created_at ASC LIMIT 1").bind(device.id,now()).first();
   if(!task)return json({ok:true,task:null});
   const ts=now(),changed=await env.DB.prepare("UPDATE magnanimous_local_bridge_tasks SET status='claimed',claimed_at=? WHERE id=? AND status='queued'").bind(ts,task.id).run();
   if(!Number(changed?.meta?.changes||0))return json({ok:true,task:null});
   let payload={};try{payload=JSON.parse(task.payload_json||'{}')}catch{}
   return json({ok:true,task:{id:task.id,action:task.action,payload,risk_class:task.risk_class,expires_at:Number(task.expires_at||0)}});
  }
  if(request.method==='POST'&&path==='/api/magnanimous/local-bridge/agent/result'){
   const body=await request.json().catch(()=>({})),taskId=clip(body.task_id,120),ok=body.ok===true,ts=now();
   if(!taskId)return json({detail:'task_id is required.'},400);
   const task=await env.DB.prepare("SELECT id FROM magnanimous_local_bridge_tasks WHERE id=? AND device_id=? AND status IN ('claimed','queued')").bind(taskId,device.id).first();
   if(!task)return json({detail:'Task is not claimable by this bridge.'},409);
   await env.DB.prepare("UPDATE magnanimous_local_bridge_tasks SET status=?,result_json=?,error_text=?,completed_at=? WHERE id=?").bind(ok?'completed':'failed',JSON.stringify(body.result??{}).slice(0,500000),clip(body.error,5000),ts,taskId).run();
   return json({ok:true,task_id:taskId,status:ok?'completed':'failed'});
  }
  return json({detail:'Local bridge agent route not found.'},404);
 }

 const auth=await owner(request,env);if(auth.denied)return auth.denied;const user=auth.user;
 if(request.method==='GET'&&path==='/api/magnanimous/local-bridge')return json(await overview(env,user));
 if(request.method==='POST'&&path==='/api/magnanimous/local-bridge/pairings'){
  const body=await request.json().catch(()=>({})),code='mbp_'+crypto.randomUUID().replaceAll('-','').slice(0,20),id=uid('lbp'),ts=now();
  await env.DB.prepare('INSERT INTO magnanimous_local_bridge_pairings(id,tenant_id,user_id,code_hash,name,expires_at,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,String(user.tenant_id),String(user.id),await sha(code),clip(body.name,120)||'My Magnanimous Bridge',ts+PAIR_TTL,ts).run();
  return json({ok:true,pairing_id:id,pairing_code:code,expires_at:ts+PAIR_TTL,note:'Enter this one-time code only into the Magnanimous Local Bridge running on your computer.'},201);
 }
 if(request.method==='GET'&&path==='/api/magnanimous/local-bridge/devices'){
  const data=await overview(env,user);return json({ready:data.ready,paired:data.paired,devices:data.devices});
 }
 const revokeMatch=path.match(/^\/api\/magnanimous\/local-bridge\/devices\/([^/]+)\/revoke$/);
 if(request.method==='POST'&&revokeMatch){
  const body=await request.json().catch(()=>({}));if(body.confirm!==true)return json({detail:'Device revocation requires confirm=true.'},400);
  const id=clip(revokeMatch[1],120),tenantId=String(user.tenant_id);
  const device=await env.DB.prepare("SELECT id,name FROM magnanimous_local_bridge_devices WHERE id=? AND tenant_id=? AND status='active'").bind(id,tenantId).first();
  if(!device)return json({detail:'Active Local Bridge device not found.'},404);
  await env.DB.batch([
   env.DB.prepare("UPDATE magnanimous_local_bridge_devices SET status='revoked',updated_at=? WHERE id=? AND tenant_id=?").bind(now(),id,tenantId),
   env.DB.prepare("UPDATE magnanimous_local_bridge_tasks SET status='cancelled',error_text='Device revoked by platform owner.',completed_at=? WHERE device_id=? AND tenant_id=? AND status IN ('queued','claimed','needs_confirmation')").bind(now(),id,tenantId)
  ]);
  return json({ok:true,id,status:'revoked',name:device.name,note:'This bridge token can no longer claim tasks. Re-pair the computer to restore access.'});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/local-bridge/tasks'){
  const body=await request.json().catch(()=>({})),deviceId=clip(body.device_id,120),action=clip(body.action,80);
  if(!deviceId||!action)return json({detail:'device_id and action are required.'},400);
  let checked;try{checked=validateTask(action,body.payload)}catch(error){return json({detail:error.message},400)}
  const device=await env.DB.prepare("SELECT * FROM magnanimous_local_bridge_devices WHERE id=? AND tenant_id=? AND status='active'").bind(deviceId,String(user.tenant_id)).first();
  if(!device)return json({detail:'Paired local bridge device not found.'},404);
  const caps=safeCapabilities(JSON.parse(device.capabilities_json||'[]'));if(!caps.includes(action))return json({detail:'That paired bridge does not advertise this action.',code:'CAPABILITY_NOT_READY'},409);
  const id=uid('lbt'),ts=now(),status=checked.def.confirmation?'needs_confirmation':'queued';
  await env.DB.prepare('INSERT INTO magnanimous_local_bridge_tasks(id,tenant_id,user_id,device_id,action,payload_json,risk_class,status,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,String(user.tenant_id),String(user.id),deviceId,action,JSON.stringify(checked.body).slice(0,500000),checked.def.risk,status,ts,ts+TASK_TTL).run();
  return json({ok:true,id,device_id:deviceId,action,risk_class:checked.def.risk,status,requires_confirmation:checked.def.confirmation,confirmation_endpoint:checked.def.confirmation?`/api/magnanimous/local-bridge/tasks/${id}/confirm`:null,note:checked.def.confirmation?'No local mutation has executed. Confirm this exact task separately.':'The safe task is queued for the paired outbound bridge.'},checked.def.confirmation?202:201);
 }
 const confirm=path.match(/^\/api\/magnanimous\/local-bridge\/tasks\/([^/]+)\/confirm$/);
 if(request.method==='POST'&&confirm){
  const id=clip(confirm[1],120),task=await env.DB.prepare("SELECT * FROM magnanimous_local_bridge_tasks WHERE id=? AND tenant_id=? AND status='needs_confirmation' AND expires_at>=?").bind(id,String(user.tenant_id),now()).first();
  if(!task)return json({detail:'Confirmation task not found, already handled, or expired.'},404);
  await env.DB.prepare("UPDATE magnanimous_local_bridge_tasks SET status='queued',confirmed_at=? WHERE id=? AND status='needs_confirmation'").bind(now(),id).run();
  return json({ok:true,id,status:'queued',note:'The exact reviewed task is now available to the paired local bridge.'});
 }
 const taskMatch=path.match(/^\/api\/magnanimous\/local-bridge\/tasks\/([^/]+)$/);
 if(request.method==='GET'&&taskMatch){
  const task=await env.DB.prepare('SELECT * FROM magnanimous_local_bridge_tasks WHERE id=? AND tenant_id=?').bind(clip(taskMatch[1],120),String(user.tenant_id)).first();
  if(!task)return json({detail:'Task not found.'},404);
  let payload={},result={};try{payload=JSON.parse(task.payload_json||'{}')}catch{}try{result=JSON.parse(task.result_json||'{}')}catch{}
  return json({id:task.id,device_id:task.device_id,action:task.action,risk_class:task.risk_class,status:task.status,payload,result,error:task.error_text,created_at:task.created_at,claimed_at:task.claimed_at,completed_at:task.completed_at,expires_at:task.expires_at,confirmed_at:task.confirmed_at});
 }
 return json({detail:'Magnanimous Local Bridge route not found.'},404);
}
