const now=()=>Math.floor(Date.now()/1000);
const clip=(v,n=12000)=>String(v??'').slice(0,n);
const scope=(u)=>[String(u?.tenant_id||''),String(u?.id||'')];
const parse=(v)=>{try{return JSON.parse(String(v||'{}'))}catch{return{}}};

export async function ensureWorkSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_work_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  goal TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned',
  stage TEXT NOT NULL DEFAULT 'understand',
  specialist_id TEXT NOT NULL DEFAULT '',
  progress INTEGER NOT NULL DEFAULT 0,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_magnanimous_work_user ON magnanimous_work_items(tenant_id,user_id,updated_at DESC)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_work_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_id INTEGER NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT NOT NULL DEFAULT '',
  checkpoint_id INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_magnanimous_work_steps ON magnanimous_work_steps(tenant_id,user_id,work_id,id)').run();
}

function row(value,steps=[]){return{...value,progress:Number(value.progress||0),metadata:parse(value.metadata),steps}}

export async function listWork(env,user,limit=80){
 await ensureWorkSchema(env);const[t,u]=scope(user),cap=Math.max(1,Math.min(200,Number(limit)||80));
 const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_work_items WHERE tenant_id=? AND user_id=? ORDER BY updated_at DESC LIMIT ?').bind(t,u,cap).all();
 if(!results.length)return[];const ids=results.map(x=>Number(x.id)),marks=ids.map(()=>'?').join(',');
 const{results:steps=[]}=await env.DB.prepare(`SELECT * FROM magnanimous_work_steps WHERE tenant_id=? AND user_id=? AND work_id IN (${marks}) ORDER BY id ASC`).bind(t,u,...ids).all();
 return results.map(x=>row(x,steps.filter(s=>Number(s.work_id)===Number(x.id))));
}

export async function getWork(env,user,id){
 await ensureWorkSchema(env);const[t,u]=scope(user);const item=await env.DB.prepare('SELECT * FROM magnanimous_work_items WHERE id=? AND tenant_id=? AND user_id=?').bind(Number(id),t,u).first();
 if(!item)return null;const{results:steps=[]}=await env.DB.prepare('SELECT * FROM magnanimous_work_steps WHERE work_id=? AND tenant_id=? AND user_id=? ORDER BY id ASC').bind(Number(id),t,u).all();return row(item,steps);
}

export async function createWork(env,user,body={}){
 await ensureWorkSchema(env);const[t,u]=scope(user),ts=now(),title=clip(body.title||body.goal||'New Magnanimous work item',220).trim(),goal=clip(body.goal||'',12000).trim();
 const r=await env.DB.prepare('INSERT INTO magnanimous_work_items(tenant_id,user_id,title,goal,status,stage,specialist_id,progress,metadata,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(t,u,title,goal,'planned','understand',clip(body.specialist_id||'',120),0,JSON.stringify(body.metadata||{}).slice(0,5000),ts,ts).run();
 const id=Number(r?.meta?.last_row_id||0);if(!id)return null;
 await env.DB.prepare('INSERT INTO magnanimous_work_steps(work_id,tenant_id,user_id,title,description,status,result,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,t,u,'Understand the outcome',goal,'pending','',ts,ts).run();return getWork(env,user,id);
}

export async function updateWork(env,user,id,body={}){
 const current=await getWork(env,user,id);if(!current)return null;const[t,u]=scope(user),ts=now();
 const statuses=['planned','working','waiting','failed','completed','cancelled'],stages=['understand','plan','approve','execute','verify','continue','finished'];
 const status=statuses.includes(String(body.status))?String(body.status):current.status,stage=stages.includes(String(body.stage))?String(body.stage):current.stage;
 const progress=body.progress===undefined?current.progress:Math.max(0,Math.min(100,Number(body.progress)||0));
 await env.DB.prepare('UPDATE magnanimous_work_items SET title=?,goal=?,status=?,stage=?,specialist_id=?,progress=?,metadata=?,updated_at=? WHERE id=? AND tenant_id=? AND user_id=?').bind(body.title===undefined?current.title:clip(body.title,220),body.goal===undefined?current.goal:clip(body.goal,12000),status,stage,body.specialist_id===undefined?current.specialist_id:clip(body.specialist_id,120),progress,JSON.stringify(body.metadata===undefined?current.metadata:{...current.metadata,...body.metadata}).slice(0,5000),ts,Number(id),t,u).run();return getWork(env,user,id);
}

export async function addWorkStep(env,user,id,body={}){
 const work=await getWork(env,user,id);if(!work)return null;const[t,u]=scope(user),ts=now();
 const r=await env.DB.prepare('INSERT INTO magnanimous_work_steps(work_id,tenant_id,user_id,title,description,status,result,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(Number(id),t,u,clip(body.title||'Next step',220),clip(body.description||'',8000),'pending','',ts,ts).run();return Number(r?.meta?.last_row_id||0);
}

export async function updateWorkStep(env,user,workId,stepId,body={}){
 const work=await getWork(env,user,workId);if(!work)return null;const step=work.steps.find(x=>Number(x.id)===Number(stepId));if(!step)return null;const[t,u]=scope(user),ts=now(),allowed=['pending','working','waiting','failed','completed'];
 const status=allowed.includes(String(body.status))?String(body.status):step.status;
 await env.DB.prepare('UPDATE magnanimous_work_steps SET title=?,description=?,status=?,result=?,checkpoint_id=?,updated_at=? WHERE id=? AND work_id=? AND tenant_id=? AND user_id=?').bind(body.title===undefined?step.title:clip(body.title,220),body.description===undefined?step.description:clip(body.description,8000),status,body.result===undefined?step.result:clip(body.result,12000),body.checkpoint_id===undefined?step.checkpoint_id:body.checkpoint_id,ts,Number(stepId),Number(workId),t,u).run();
 const refreshed=await getWork(env,user,workId),total=Math.max(1,refreshed.steps.length),done=refreshed.steps.filter(x=>x.status==='completed').length,progress=Math.round(done/total*100);await updateWork(env,user,workId,{progress,status:progress===100?'completed':refreshed.status==='planned'?'working':refreshed.status,stage:progress===100?'finished':refreshed.stage});return getWork(env,user,workId);
}
