import {currentUser} from './integrations.js';
import {requirePlatformOwner} from './platform-owner-guard.js';
import {queueLocalBridgeTask,localBridgeTask} from './magnanimous-local-bridge-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clip=(v,n=4000)=>String(v??'').trim().slice(0,n);
const uid=p=>`${p}_${crypto.randomUUID()}`;
const MIN_INTERVAL_MINUTES=15;
const MAX_STEPS=40;
const MAX_WORKSPACE_TEXT=256000;

export const MAGNANIMOUS_ROUTINE_STUDIO_POLICY=Object.freeze({
 identity:'Magnanimous AI',
 ownership:'Magnanimous owns skills, routines, run history, workspace state, orchestration, memory and policy.',
 cloud_execution:'Standalone Magnanimous runtime can execute AI, sandbox, server-browser render and workspace steps while the owner computer is offline.',
 local_execution:'Interactive authenticated browser actions may use the owner-paired Magnanimous Local Bridge and remain exact-approval gated.',
 provider_dependency:false,
 paid_provider_required:false,
 proprietary_code_copied:false,
 schedule_floor_minutes:MIN_INTERVAL_MINUTES,
 approval_rule:'A scheduled routine never silently approves an interactive browser write. Exact approval is required before consequential action execution.',
 truth_boundary:'A persistent Magnanimous cloud workspace is software running on attached compute. Physical CPU, storage and Internet capacity still come from owner hardware or a replaceable host.'
});

const STEP_TYPES=new Set([
 'ai.prompt','agent.handoff','cloud.browser.render','cloud.sandbox.exec',
 'workspace.write','workspace.read','native-web.search','native-web.fetch',
 'native-web.research','native-web.read_flow','native-web.action_flow'
]);

function parse(value,fallback={}){try{return typeof value==='string'?JSON.parse(value||''):value??fallback}catch{return fallback}}
function safeName(value,n=160){return clip(value,n).replace(/[\u0000-\u001f]/g,' ')}
function publicSkill(row){return{
 id:row.id,name:row.name,description:row.description,source_type:row.source_type,status:row.status,version:Number(row.version||1),
 steps:parse(row.steps_json,[]),risk_class:row.risk_class,created_at:Number(row.created_at||0),updated_at:Number(row.updated_at||0)
}}
function publicRoutine(row){return{
 id:row.id,name:row.name,skill_id:row.skill_id,status:row.status,interval_minutes:Number(row.interval_minutes||0),
 next_run_at:Number(row.next_run_at||0),last_run_at:Number(row.last_run_at||0),run_count:Number(row.run_count||0),
 max_attempts:Number(row.max_attempts||1),created_at:Number(row.created_at||0),updated_at:Number(row.updated_at||0)
}}
function publicRun(row){return{
 id:row.id,routine_id:row.routine_id||null,skill_id:row.skill_id,status:row.status,trigger_type:row.trigger_type,
 attempt:Number(row.attempt||0),max_attempts:Number(row.max_attempts||1),error:row.error_text||'',
 state:parse(row.state_json,{}),result:parse(row.result_json,{}),created_at:Number(row.created_at||0),
 started_at:Number(row.started_at||0),completed_at:Number(row.completed_at||0),updated_at:Number(row.updated_at||0)
}}

function stepRisk(step){
 const type=String(step?.type||'');
 if(type==='native-web.action_flow')return'high';
 if(type==='cloud.sandbox.exec')return'medium';
 if(type==='workspace.write')return'low';
 return'low';
}
function skillRisk(steps){return steps.some(s=>stepRisk(s)==='high')?'high':steps.some(s=>stepRisk(s)==='medium')?'medium':'low'}

function normalizeStep(raw,index=0){
 const type=clip(raw?.type,80);
 if(!STEP_TYPES.has(type))throw new Error(`Unsupported skill step type at position ${index+1}: ${type||'missing type'}`);
 const step={type,label:safeName(raw?.label||type,180)};
 if(type==='ai.prompt'||type==='agent.handoff'){
  step.prompt=clip(raw?.prompt,12000);
  if(!step.prompt)throw new Error(`Step ${index+1} requires prompt.`);
  if(type==='agent.handoff')step.specialist_id=clip(raw?.specialist_id,100);
  step.max_tokens=Math.max(64,Math.min(Number(raw?.max_tokens||1200),4000));
 }
 if(type==='cloud.browser.render'){
  let u;try{u=new URL(String(raw?.url||''))}catch{}
  if(!u||!['http:','https:'].includes(u.protocol))throw new Error(`Step ${index+1} requires a public http(s) URL.`);
  step.url=u.toString();step.mode=['dom','screenshot','pdf'].includes(raw?.mode)?raw.mode:'dom';
 }
 if(type==='cloud.sandbox.exec'){
  const argv=Array.isArray(raw?.argv)?raw.argv.map(x=>clip(x,2000)).filter(Boolean):[];
  if(!argv.length||argv.length>64)throw new Error(`Step ${index+1} requires 1-64 argv entries.`);
  step.argv=argv;step.cwd=clip(raw?.cwd,800)||'.';step.timeout_ms=Math.max(100,Math.min(Number(raw?.timeout_ms||10000),60000));
  step.allow_shell=raw?.allow_shell===true;
 }
 if(type==='workspace.write'){
  step.path=clip(raw?.path,600);step.content=String(raw?.content??'').slice(0,MAX_WORKSPACE_TEXT);step.mime=clip(raw?.mime,120)||'text/plain';
  if(!step.path)throw new Error(`Step ${index+1} requires path.`);
 }
 if(type==='workspace.read'){
  step.path=clip(raw?.path,600);if(!step.path)throw new Error(`Step ${index+1} requires path.`);
 }
 if(type.startsWith('native-web.')){
  const kind=type.slice('native-web.'.length);
  step.payload=raw?.payload&&typeof raw.payload==='object'&&!Array.isArray(raw.payload)?raw.payload:{};
  if(kind==='search'||kind==='research'){step.payload.query=clip(step.payload.query||raw?.query,2000);if(!step.payload.query)throw new Error(`Step ${index+1} requires query.`)}
  if(kind==='fetch'){step.payload.url=clip(step.payload.url||raw?.url,4000);if(!step.payload.url)throw new Error(`Step ${index+1} requires url.`)}
  if(kind==='read_flow'||kind==='action_flow'){step.payload.steps=Array.isArray(step.payload.steps)?step.payload.steps:(Array.isArray(raw?.steps)?raw.steps:[]);if(!step.payload.steps.length)throw new Error(`Step ${index+1} requires browser steps.`)}
 }
 return step;
}
function normalizeSteps(value){
 const source=Array.isArray(value)?value:[];
 if(!source.length)throw new Error('A skill requires at least one step.');
 if(source.length>MAX_STEPS)throw new Error(`A skill may contain at most ${MAX_STEPS} steps.`);
 return source.map(normalizeStep);
}

async function ensureSchema(env){
 if(!env?.DB)return;
 const q=[
 `CREATE TABLE IF NOT EXISTS magnanimous_skills(
   id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',
   source_type TEXT NOT NULL DEFAULT 'manual',steps_json TEXT NOT NULL DEFAULT '[]',risk_class TEXT NOT NULL DEFAULT 'low',
   status TEXT NOT NULL DEFAULT 'active',version INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 'CREATE INDEX IF NOT EXISTS idx_magnanimous_skills_tenant ON magnanimous_skills(tenant_id,status,updated_at DESC)',
 `CREATE TABLE IF NOT EXISTS magnanimous_routines(
   id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,skill_id TEXT NOT NULL,name TEXT NOT NULL,
   status TEXT NOT NULL DEFAULT 'active',interval_minutes INTEGER NOT NULL DEFAULT 60,next_run_at INTEGER NOT NULL DEFAULT 0,
   last_run_at INTEGER NOT NULL DEFAULT 0,run_count INTEGER NOT NULL DEFAULT 0,max_attempts INTEGER NOT NULL DEFAULT 3,
   created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 'CREATE INDEX IF NOT EXISTS idx_magnanimous_routines_due ON magnanimous_routines(status,next_run_at)',
 'CREATE INDEX IF NOT EXISTS idx_magnanimous_routines_tenant ON magnanimous_routines(tenant_id,updated_at DESC)',
 `CREATE TABLE IF NOT EXISTS magnanimous_routine_runs(
   id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,routine_id TEXT,skill_id TEXT NOT NULL,
   trigger_type TEXT NOT NULL DEFAULT 'manual',status TEXT NOT NULL DEFAULT 'queued',attempt INTEGER NOT NULL DEFAULT 0,
   max_attempts INTEGER NOT NULL DEFAULT 3,state_json TEXT NOT NULL DEFAULT '{}',result_json TEXT NOT NULL DEFAULT '{}',
   error_text TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,started_at INTEGER NOT NULL DEFAULT 0,
   completed_at INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL)`,
 'CREATE INDEX IF NOT EXISTS idx_magnanimous_runs_reconcile ON magnanimous_routine_runs(status,updated_at)',
 'CREATE INDEX IF NOT EXISTS idx_magnanimous_runs_tenant ON magnanimous_routine_runs(tenant_id,created_at DESC)',
 `CREATE TABLE IF NOT EXISTS magnanimous_cloud_workspaces(
   id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,root_key TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',
   created_at INTEGER NOT NULL,last_active_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,
   UNIQUE(tenant_id,user_id))`,
 'CREATE INDEX IF NOT EXISTS idx_magnanimous_cloud_workspaces_tenant ON magnanimous_cloud_workspaces(tenant_id,status,updated_at DESC)',
 `CREATE TABLE IF NOT EXISTS magnanimous_cloud_workspace_files(
   id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,path TEXT NOT NULL,mime TEXT NOT NULL DEFAULT 'text/plain',
   content_text TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,
   UNIQUE(tenant_id,path))`,
 'CREATE INDEX IF NOT EXISTS idx_magnanimous_workspace_files ON magnanimous_cloud_workspace_files(tenant_id,updated_at DESC)'
 ];
 for(const sql of q)await env.DB.prepare(sql).run();
}

async function owner(request,env){
 const denied=await requirePlatformOwner(request,env);if(denied)return{denied};
 const user=await currentUser(request,env);if(!user)return{denied:json({detail:'Platform owner sign-in required.'},401)};
 return{user};
}

async function ensureCloudWorkspace(env,user){
 const tenant=String(user.tenant_id),userId=String(user.id),ts=now();
 let row=await env.DB.prepare('SELECT * FROM magnanimous_cloud_workspaces WHERE tenant_id=? AND user_id=?').bind(tenant,userId).first();
 if(!row){
  const id=uid('mcw'),rootKey=('tenant-'+tenant+'-user-'+userId).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,180);
  await env.DB.prepare('INSERT INTO magnanimous_cloud_workspaces(id,tenant_id,user_id,root_key,status,created_at,last_active_at,updated_at) VALUES(?,?,?,?,\'active\',?,?,?)')
   .bind(id,tenant,userId,rootKey,ts,ts,ts).run();
  row=await env.DB.prepare('SELECT * FROM magnanimous_cloud_workspaces WHERE id=?').bind(id).first();
 }else{
  await env.DB.prepare('UPDATE magnanimous_cloud_workspaces SET last_active_at=?,updated_at=? WHERE id=?').bind(ts,ts,row.id).run();
 }
 return row;
}

async function upsertWorkspaceFile(env,user,path,mime,content){
 const safePath=clip(path,600);if(!safePath)throw new Error('Workspace path is required.');
 if(safePath.includes('..')||safePath.startsWith('/'))throw new Error('Workspace paths must be relative and may not contain ..');
 const safeContent=String(content??'').slice(0,MAX_WORKSPACE_TEXT),ts=now(),id=uid('mwf');
 await env.DB.prepare(`INSERT INTO magnanimous_cloud_workspace_files(id,tenant_id,user_id,path,mime,content_text,created_at,updated_at)
  VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,path) DO UPDATE SET user_id=excluded.user_id,mime=excluded.mime,content_text=excluded.content_text,updated_at=excluded.updated_at`)
  .bind(id,String(user.tenant_id),String(user.id),safePath,clip(mime,120)||'text/plain',safeContent,ts,ts).run();
 return env.DB.prepare('SELECT id,path,mime,LENGTH(content_text) bytes,created_at,updated_at FROM magnanimous_cloud_workspace_files WHERE tenant_id=? AND path=?').bind(String(user.tenant_id),safePath).first();
}

async function aiStep(env,step,context){
 if(!env?.AI)throw new Error('Magnanimous AI execution binding is not configured.');
 const specialist=step.type==='agent.handoff'&&step.specialist_id?`Specialist branch: ${step.specialist_id}. `:'';
 const prior=context.results.length?JSON.stringify(context.results.slice(-8)).slice(0,12000):'(none)';
 const prompt=`${specialist}You are an execution department beneath Magnanimous AI. Complete only this bounded skill step. Do not claim external actions unless tool evidence is present.\n\nSTEP:\n${step.prompt}\n\nPRIOR VERIFIED STEP RESULTS:\n${prior}`;
 const model=String(env.CLOUDFLARE_AI_MODEL||env.MAGNANIMOUS_AI_MODEL||'@cf/meta/llama-3.3-70b-instruct-fp8-fast');
 const out=await env.AI.run(model,{messages:[{role:'user',content:prompt}],max_tokens:step.max_tokens||1200,temperature:.2});
 return{type:step.type,specialist_id:step.specialist_id||null,text:clip(typeof out==='string'?out:(out?.response||out?.result?.response||out?.result||''),30000)};
}

async function queueNativeWeb(env,user,step){
 const map={search:'browser_search',fetch:'browser_fetch',research:'browser_research',read_flow:'browser_read_flow',action_flow:'browser_action_flow'};
 const kind=step.type.slice('native-web.'.length),action=map[kind];if(!action)throw new Error('Unsupported native web skill action.');
 const queued=await queueLocalBridgeTask(env,user,{action,payload:step.payload||{},allowConfirmation:true});
 if(!queued.ok)throw new Error(queued.detail||queued.code||'Native web task could not be queued.');
 if(queued.requires_confirmation)return{waiting_approval:true,task_id:queued.id,action};
 return{waiting_external:true,task_id:queued.id,action};
}

async function executeStep(env,user,step,context){
 if(step.type==='ai.prompt'||step.type==='agent.handoff')return aiStep(env,step,context);
 if(step.type==='cloud.browser.render'){
  const browser=env?.MAGNANIMOUS_BROWSER||env?.BROWSER;if(!browser?.render)throw new Error('Magnanimous cloud browser service is not configured.');
  return{type:step.type,...await browser.render(step.url,{mode:step.mode||'dom'})};
 }
 if(step.type==='cloud.sandbox.exec'){
  const sandbox=env?.MAGNANIMOUS_SANDBOX||env?.SANDBOX;if(!sandbox?.exec)throw new Error('Magnanimous cloud sandbox service is not configured.');
  const workspace=await ensureCloudWorkspace(env,user),relative=clip(step.cwd,600).replace(/^\/+/, '');
  if(relative.includes('..'))throw new Error('Sandbox cwd may not contain ..');
  const scopedCwd='routine-workspaces/'+workspace.root_key+(relative&&relative!=='.'?'/'+relative:'');
  const result=await sandbox.exec(step.argv,{cwd:scopedCwd,timeout_ms:step.timeout_ms,allow_shell:step.allow_shell===true});
  if(!result?.ok)throw new Error(clip(result?.stderr||'Magnanimous sandbox command failed.',4000));
  return{type:step.type,workspace_id:workspace.id,exit_code:result.exit_code,stdout:clip(result.stdout,30000),stderr:clip(result.stderr,10000),truncated:Boolean(result.truncated)};
 }
 if(step.type==='workspace.write')return{type:step.type,file:await upsertWorkspaceFile(env,user,step.path,step.mime,step.content)};
 if(step.type==='workspace.read'){
  const row=await env.DB.prepare('SELECT id,path,mime,content_text,created_at,updated_at FROM magnanimous_cloud_workspace_files WHERE tenant_id=? AND path=?').bind(String(user.tenant_id),step.path).first();
  if(!row)throw new Error(`Workspace file not found: ${step.path}`);
  return{type:step.type,file:{id:row.id,path:row.path,mime:row.mime,content:row.content_text,created_at:Number(row.created_at||0),updated_at:Number(row.updated_at||0)}};
 }
 if(step.type.startsWith('native-web.'))return queueNativeWeb(env,user,step);
 throw new Error(`Unsupported skill step: ${step.type}`);
}

async function saveRunState(env,runId,status,state,result={},error=''){
 const ts=now(),done=['completed','failed','needs_confirmation'].includes(status);
 await env.DB.prepare('UPDATE magnanimous_routine_runs SET status=?,state_json=?,result_json=?,error_text=?,completed_at=?,updated_at=? WHERE id=?')
  .bind(status,JSON.stringify(state).slice(0,400000),JSON.stringify(result).slice(0,400000),clip(error,8000),done?ts:0,ts,runId).run();
}

async function resumeRun(env,run){
 const user=await env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(run.user_id,run.tenant_id).first();
 if(!user)throw new Error('Routine owner is no longer active.');
 const skill=await env.DB.prepare("SELECT * FROM magnanimous_skills WHERE id=? AND tenant_id=? AND status='active'").bind(run.skill_id,run.tenant_id).first();
 if(!skill)throw new Error('Routine skill is unavailable.');
 const steps=parse(skill.steps_json,[]),state=parse(run.state_json,{step_index:0,results:[]}),results=Array.isArray(state.results)?state.results:[];

 if(state.pending_task_id){
  const task=await localBridgeTask(env,run.tenant_id,state.pending_task_id);
  if(!task)throw new Error('Pending native web task no longer exists.');
  if(task.status==='needs_confirmation'){await saveRunState(env,run.id,'needs_confirmation',state,{results},'Exact approval is required for the pending browser action.');return'needs_confirmation'}
  if(['queued','claimed'].includes(task.status)){await saveRunState(env,run.id,'waiting_external',state,{results});return'waiting_external'}
  if(task.status!=='completed')throw new Error(task.error||`Native web task ended as ${task.status}.`);
  results.push({step_index:Number(state.step_index||0),type:'native-web.result',task_id:task.id,result:task.result});
  state.step_index=Number(state.step_index||0)+1;delete state.pending_task_id;
 }

 while(Number(state.step_index||0)<steps.length){
  const index=Number(state.step_index||0),step=steps[index];
  const value=await executeStep(env,user,step,{results});
  if(value?.waiting_approval){
   state.pending_task_id=value.task_id;state.results=results;
   await saveRunState(env,run.id,'needs_confirmation',state,{results},'Exact approval is required for this browser action.');
   return'needs_confirmation';
  }
  if(value?.waiting_external){
   state.pending_task_id=value.task_id;state.results=results;
   await saveRunState(env,run.id,'waiting_external',state,{results});
   return'waiting_external';
  }
  results.push({step_index:index,label:step.label,type:step.type,value});
  state.step_index=index+1;state.results=results;
  await saveRunState(env,run.id,'running',state,{results});
 }
 await saveRunState(env,run.id,'completed',state,{results});
 if(run.routine_id)await env.DB.prepare('UPDATE magnanimous_routines SET run_count=run_count+1,last_run_at=?,updated_at=? WHERE id=?').bind(now(),now(),run.routine_id).run();
 return'completed';
}

async function createRun(env,user,{routine=null,skill,trigger_type='manual'}){
 const id=uid('mrr'),ts=now(),maxAttempts=Math.max(1,Math.min(Number(routine?.max_attempts||3),8));
 await env.DB.prepare(`INSERT INTO magnanimous_routine_runs(id,tenant_id,user_id,routine_id,skill_id,trigger_type,status,attempt,max_attempts,state_json,result_json,created_at,started_at,updated_at)
  VALUES(?,?,?,?,?,?,'running',1,?,'{"step_index":0,"results":[]}','{}',?,?,?)`)
  .bind(id,String(user.tenant_id),String(user.id),routine?.id||null,skill.id,trigger_type,maxAttempts,ts,ts,ts).run();
 const run=await env.DB.prepare('SELECT * FROM magnanimous_routine_runs WHERE id=?').bind(id).first();
 try{await resumeRun(env,run)}
 catch(error){
  const latest=await env.DB.prepare('SELECT * FROM magnanimous_routine_runs WHERE id=?').bind(id).first(),attempt=Number(latest?.attempt||1);
  if(attempt<maxAttempts){
   await env.DB.prepare("UPDATE magnanimous_routine_runs SET status='retry_wait',error_text=?,updated_at=? WHERE id=?").bind(clip(error?.message||error,8000),now(),id).run();
  }else await saveRunState(env,id,'failed',parse(latest?.state_json,{}),parse(latest?.result_json,{}),error?.message||String(error));
 }
 return env.DB.prepare('SELECT * FROM magnanimous_routine_runs WHERE id=?').bind(id).first();
}

async function retryRun(env,row){
 const attempt=Number(row.attempt||0)+1;
 await env.DB.prepare("UPDATE magnanimous_routine_runs SET status='running',attempt=?,error_text='',updated_at=? WHERE id=?").bind(attempt,now(),row.id).run();
 const latest=await env.DB.prepare('SELECT * FROM magnanimous_routine_runs WHERE id=?').bind(row.id).first();
 try{return await resumeRun(env,latest)}catch(error){
  if(attempt<Number(row.max_attempts||1)){await env.DB.prepare("UPDATE magnanimous_routine_runs SET status='retry_wait',error_text=?,updated_at=? WHERE id=?").bind(clip(error?.message||error,8000),now(),row.id).run();return'retry_wait'}
  await saveRunState(env,row.id,'failed',parse(latest.state_json,{}),parse(latest.result_json,{}),error?.message||String(error));return'failed';
 }
}

function teachFromDemonstration(body){
 const demo=Array.isArray(body.demonstration)?body.demonstration:[];
 if(!demo.length)throw new Error('demonstration must include at least one recorded step.');
 const compiled=[];
 let browserSteps=[],browserWrite=false;
 const flush=()=>{
  if(!browserSteps.length)return;
  compiled.push(normalizeStep({type:browserWrite?'native-web.action_flow':'native-web.read_flow',label:'Taught browser flow',payload:{steps:browserSteps}},compiled.length));
  browserSteps=[];browserWrite=false;
 };
 for(const item of demo){
  const kind=clip(item?.kind||item?.type,80).toLowerCase();
  if(kind==='browser'){
   const op=clip(item?.op,80).toLowerCase();if(!op)continue;
   const step={...item,op};delete step.kind;delete step.type;
   if(['click','fill','press','select'].includes(op))browserWrite=true;
   browserSteps.push(step);continue;
  }
  flush();
  if(kind==='prompt'||kind==='ai')compiled.push(normalizeStep({type:'ai.prompt',label:item.label,prompt:item.prompt||item.text},compiled.length));
  else if(kind==='handoff')compiled.push(normalizeStep({type:'agent.handoff',label:item.label,prompt:item.prompt||item.text,specialist_id:item.specialist_id},compiled.length));
  else if(kind==='sandbox')compiled.push(normalizeStep({type:'cloud.sandbox.exec',...item},compiled.length));
  else if(kind==='workspace.write'||kind==='workspace.read')compiled.push(normalizeStep({...item,type:kind},compiled.length));
  else if(kind==='render')compiled.push(normalizeStep({type:'cloud.browser.render',...item},compiled.length));
 }
 flush();
 if(!compiled.length)throw new Error('No supported steps could be learned from the demonstration.');
 return compiled;
}

export async function handleMagnanimousRoutineStudio(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/routine-studio'))return null;
 if(!env?.DB)return json({detail:'Magnanimous Routine Studio requires the platform database.'},503);
 await ensureSchema(env);
 const auth=await owner(request,env);if(auth.denied)return auth.denied;const user=auth.user,tenant=String(user.tenant_id);

 if(request.method==='GET'&&path==='/api/magnanimous/routine-studio/overview'){
  const workspace=await ensureCloudWorkspace(env,user);
  const [skills,routines,runs,files]=await Promise.all([
   env.DB.prepare("SELECT COUNT(*) n FROM magnanimous_skills WHERE tenant_id=? AND status!='archived'").bind(tenant).first(),
   env.DB.prepare("SELECT COUNT(*) n FROM magnanimous_routines WHERE tenant_id=? AND status='active'").bind(tenant).first(),
   env.DB.prepare("SELECT status,COUNT(*) n FROM magnanimous_routine_runs WHERE tenant_id=? GROUP BY status").bind(tenant).all(),
   env.DB.prepare('SELECT COUNT(*) n FROM magnanimous_cloud_workspace_files WHERE tenant_id=?').bind(tenant).first()
  ]);
  const runCounts=Object.fromEntries((runs.results||[]).map(x=>[x.status,Number(x.n||0)]));
  const browser=env?.MAGNANIMOUS_BROWSER||env?.BROWSER,sandbox=env?.MAGNANIMOUS_SANDBOX||env?.SANDBOX;
  return json({policy:MAGNANIMOUS_ROUTINE_STUDIO_POLICY,skills:Number(skills?.n||0),active_routines:Number(routines?.n||0),workspace_files:Number(files?.n||0),runs:runCounts,cloud_workspace:{id:workspace.id,status:workspace.status,root_key:workspace.root_key,runtime:String(env.MAGNANIMOUS_RUNTIME||'edge-adapter'),browser_configured:Boolean(browser?.configured??browser?.render),sandbox_configured:Boolean(sandbox?.configured??sandbox?.exec),tenant_scoped:true,owner_machine_required_for_cloud_steps:false}});
 }

 if(path==='/api/magnanimous/routine-studio/skills'){
  if(request.method==='GET'){const{results=[]}=await env.DB.prepare("SELECT * FROM magnanimous_skills WHERE tenant_id=? AND status!='archived' ORDER BY updated_at DESC").bind(tenant).all();return json({skills:results.map(publicSkill)})}
  if(request.method==='POST'){
   const body=await request.json().catch(()=>({})),steps=normalizeSteps(body.steps),ts=now(),id=uid('msk');
   await env.DB.prepare('INSERT INTO magnanimous_skills(id,tenant_id,user_id,name,description,source_type,steps_json,risk_class,status,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id,tenant,String(user.id),safeName(body.name)||'Untitled Skill',clip(body.description,4000),'manual',JSON.stringify(steps),skillRisk(steps),'active',1,ts,ts).run();
   return json({skill:publicSkill(await env.DB.prepare('SELECT * FROM magnanimous_skills WHERE id=?').bind(id).first())},201);
  }
  return json({detail:'Method not allowed.'},405);
 }

 if(request.method==='POST'&&path==='/api/magnanimous/routine-studio/skills/teach'){
  const body=await request.json().catch(()=>({})),steps=teachFromDemonstration(body),ts=now(),id=uid('msk');
  await env.DB.prepare('INSERT INTO magnanimous_skills(id,tenant_id,user_id,name,description,source_type,steps_json,risk_class,status,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
   .bind(id,tenant,String(user.id),safeName(body.name)||'Taught Skill',clip(body.description,4000),'demonstration',JSON.stringify(steps),skillRisk(steps),'active',1,ts,ts).run();
  return json({learned:true,skill:publicSkill(await env.DB.prepare('SELECT * FROM magnanimous_skills WHERE id=?').bind(id).first())},201);
 }

 let m=path.match(/^\/api\/magnanimous\/routine-studio\/skills\/([^/]+)$/);
 if(m){
  const skill=await env.DB.prepare('SELECT * FROM magnanimous_skills WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!skill)return json({detail:'Skill not found.'},404);
  if(request.method==='GET')return json({skill:publicSkill(skill)});
  if(request.method==='PATCH'){
   const body=await request.json().catch(()=>({})),steps=body.steps===undefined?parse(skill.steps_json,[]):normalizeSteps(body.steps),status=['active','paused','archived'].includes(body.status)?body.status:skill.status;
   await env.DB.prepare('UPDATE magnanimous_skills SET name=?,description=?,steps_json=?,risk_class=?,status=?,version=version+1,updated_at=? WHERE id=? AND tenant_id=?')
    .bind(safeName(body.name===undefined?skill.name:body.name)||skill.name,body.description===undefined?skill.description:clip(body.description,4000),JSON.stringify(steps),skillRisk(steps),status,now(),skill.id,tenant).run();
   return json({skill:publicSkill(await env.DB.prepare('SELECT * FROM magnanimous_skills WHERE id=?').bind(skill.id).first())});
  }
  return json({detail:'Method not allowed.'},405);
 }

 if(path==='/api/magnanimous/routine-studio/routines'){
  if(request.method==='GET'){const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_routines WHERE tenant_id=? ORDER BY updated_at DESC').bind(tenant).all();return json({routines:results.map(publicRoutine)})}
  if(request.method==='POST'){
   const body=await request.json().catch(()=>({})),skill=await env.DB.prepare("SELECT * FROM magnanimous_skills WHERE id=? AND tenant_id=? AND status='active'").bind(clip(body.skill_id,120),tenant).first();
   if(!skill)return json({detail:'Choose an active skill.'},400);
   const interval=Math.max(MIN_INTERVAL_MINUTES,Math.min(Number(body.interval_minutes||60),10080)),ts=now(),id=uid('mrt');
   await env.DB.prepare('INSERT INTO magnanimous_routines(id,tenant_id,user_id,skill_id,name,status,interval_minutes,next_run_at,max_attempts,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id,tenant,String(user.id),skill.id,safeName(body.name)||skill.name,'active',interval,ts+interval*60,Math.max(1,Math.min(Number(body.max_attempts||3),8)),ts,ts).run();
   return json({routine:publicRoutine(await env.DB.prepare('SELECT * FROM magnanimous_routines WHERE id=?').bind(id).first())},201);
  }
  return json({detail:'Method not allowed.'},405);
 }

 m=path.match(/^\/api\/magnanimous\/routine-studio\/routines\/([^/]+)$/);
 if(m&&request.method==='PATCH'){
  const row=await env.DB.prepare('SELECT * FROM magnanimous_routines WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!row)return json({detail:'Routine not found.'},404);
  const body=await request.json().catch(()=>({})),status=['active','paused','archived'].includes(body.status)?body.status:row.status,interval=Math.max(MIN_INTERVAL_MINUTES,Math.min(Number(body.interval_minutes||row.interval_minutes),10080));
  await env.DB.prepare('UPDATE magnanimous_routines SET name=?,status=?,interval_minutes=?,next_run_at=?,max_attempts=?,updated_at=? WHERE id=? AND tenant_id=?')
   .bind(safeName(body.name===undefined?row.name:body.name)||row.name,status,interval,status==='active'?now()+interval*60:Number(row.next_run_at||0),Math.max(1,Math.min(Number(body.max_attempts||row.max_attempts),8)),now(),row.id,tenant).run();
  return json({routine:publicRoutine(await env.DB.prepare('SELECT * FROM magnanimous_routines WHERE id=?').bind(row.id).first())});
 }

 m=path.match(/^\/api\/magnanimous\/routine-studio\/routines\/([^/]+)\/run$/);
 if(m&&request.method==='POST'){
  const routine=await env.DB.prepare('SELECT * FROM magnanimous_routines WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!routine)return json({detail:'Routine not found.'},404);
  const skill=await env.DB.prepare("SELECT * FROM magnanimous_skills WHERE id=? AND tenant_id=? AND status='active'").bind(routine.skill_id,tenant).first();if(!skill)return json({detail:'Routine skill is unavailable.'},409);
  await request.json().catch(()=>({}));
  const run=await createRun(env,user,{routine,skill,trigger_type:'manual'});
  return json({run:publicRun(run),approval_note:run.status==='needs_confirmation'?'Re-run approval endpoint for this exact run after reviewing the skill steps.':null},202);
 }

 m=path.match(/^\/api\/magnanimous\/routine-studio\/routines\/([^/]+)\/runs$/);
 if(m&&request.method==='GET'){
  const routine=await env.DB.prepare('SELECT id FROM magnanimous_routines WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!routine)return json({detail:'Routine not found.'},404);
  const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_routine_runs WHERE routine_id=? AND tenant_id=? ORDER BY created_at DESC LIMIT 100').bind(m[1],tenant).all();return json({runs:results.map(publicRun)});
 }

 m=path.match(/^\/api\/magnanimous\/routine-studio\/runs\/([^/]+)\/approve$/);
 if(m&&request.method==='POST'){
  const run=await env.DB.prepare("SELECT * FROM magnanimous_routine_runs WHERE id=? AND tenant_id=? AND status='needs_confirmation'").bind(m[1],tenant).first();if(!run)return json({detail:'Pending run not found.'},404);
  const body=await request.json().catch(()=>({}));if(body.confirm!==true)return json({detail:'Exact run approval requires confirm=true.'},400);
  const state=parse(run.state_json,{});if(state.pending_task_id)await env.DB.prepare("UPDATE magnanimous_local_bridge_tasks SET status='queued',confirmed_at=? WHERE id=? AND tenant_id=? AND status='needs_confirmation'").bind(now(),state.pending_task_id,tenant).run();
  await env.DB.prepare("UPDATE magnanimous_routine_runs SET status='waiting_external',error_text='',updated_at=? WHERE id=?").bind(now(),run.id).run();
  const latest=await env.DB.prepare('SELECT * FROM magnanimous_routine_runs WHERE id=?').bind(run.id).first();
  try{await resumeRun(env,latest)}catch(error){await saveRunState(env,run.id,'failed',parse(latest.state_json,{}),parse(latest.result_json,{}),error?.message||String(error))}
  return json({run:publicRun(await env.DB.prepare('SELECT * FROM magnanimous_routine_runs WHERE id=?').bind(run.id).first())});
 }

 if(path==='/api/magnanimous/routine-studio/workspace/files'){
  if(request.method==='GET'){const{results=[]}=await env.DB.prepare('SELECT id,path,mime,LENGTH(content_text) bytes,created_at,updated_at FROM magnanimous_cloud_workspace_files WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 200').bind(tenant).all();return json({files:results})}
  if(request.method==='POST'){const body=await request.json().catch(()=>({}));return json({file:await upsertWorkspaceFile(env,user,body.path,body.mime,body.content)},201)}
  return json({detail:'Method not allowed.'},405);
 }

 m=path.match(/^\/api\/magnanimous\/routine-studio\/workspace\/files\/([^/]+)$/);
 if(m&&request.method==='GET'){
  const row=await env.DB.prepare('SELECT id,path,mime,content_text,created_at,updated_at FROM magnanimous_cloud_workspace_files WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!row)return json({detail:'Workspace file not found.'},404);
  return json({file:{id:row.id,path:row.path,mime:row.mime,content:row.content_text,created_at:Number(row.created_at||0),updated_at:Number(row.updated_at||0)}});
 }

 return json({detail:'Magnanimous Routine Studio route not found.'},404);
}

export async function scheduledMagnanimousRoutines(env){
 if(!env?.DB)return{ok:false,reason:'database-unavailable'};
 await ensureSchema(env);const stamp=now(),events=[];

 const{results:waiting=[]}=await env.DB.prepare("SELECT * FROM magnanimous_routine_runs WHERE status IN ('waiting_external','retry_wait') ORDER BY updated_at ASC LIMIT 40").all();
 for(const row of waiting){
  try{
   if(row.status==='retry_wait'){
    if(stamp-Number(row.updated_at||0)<Math.min(900,30*Math.max(1,Number(row.attempt||1))))continue;
    events.push({run_id:row.id,status:await retryRun(env,row)});continue;
   }
   events.push({run_id:row.id,status:await resumeRun(env,row)});
  }catch(error){
   const attempt=Number(row.attempt||1),max=Number(row.max_attempts||1);
   if(attempt<max)await env.DB.prepare("UPDATE magnanimous_routine_runs SET status='retry_wait',error_text=?,updated_at=? WHERE id=?").bind(clip(error?.message||error,8000),stamp,row.id).run();
   else await saveRunState(env,row.id,'failed',parse(row.state_json,{}),parse(row.result_json,{}),error?.message||String(error));
  }
 }

 const{results:due=[]}=await env.DB.prepare("SELECT * FROM magnanimous_routines WHERE status='active' AND next_run_at<=? ORDER BY next_run_at ASC LIMIT 20").bind(stamp).all();
 for(const routine of due){
  const next=stamp+Math.max(MIN_INTERVAL_MINUTES,Number(routine.interval_minutes||60))*60;
  await env.DB.prepare('UPDATE magnanimous_routines SET next_run_at=?,updated_at=? WHERE id=?').bind(next,stamp,routine.id).run();
  const skill=await env.DB.prepare("SELECT * FROM magnanimous_skills WHERE id=? AND tenant_id=? AND status='active'").bind(routine.skill_id,routine.tenant_id).first();
  const user=await env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(routine.user_id,routine.tenant_id).first();
  if(!skill||!user){events.push({routine_id:routine.id,status:'skipped-unavailable'});continue}
  const run=await createRun(env,user,{routine,skill,trigger_type:'scheduled'});
  events.push({routine_id:routine.id,run_id:run.id,status:run.status});
 }
 return{ok:true,processed:events.length,events};
}
