import { currentUser } from './integrations.js';
import { getKnowledgeContext } from './knowledge-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clip=(v,n=4000)=>String(v??'').trim().slice(0,n);

async function schema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS wellness_profiles (tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,display_name TEXT NOT NULL DEFAULT '',goals TEXT NOT NULL DEFAULT '',preferences TEXT NOT NULL DEFAULT '',updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,user_id))`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS wellness_goals (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,title TEXT NOT NULL,category TEXT NOT NULL DEFAULT 'general',target TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS wellness_habits (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,title TEXT NOT NULL,frequency TEXT NOT NULL DEFAULT 'daily',active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS wellness_checkins (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,mood INTEGER NOT NULL DEFAULT 0,energy INTEGER NOT NULL DEFAULT 0,sleep_hours REAL NOT NULL DEFAULT 0,water_cups REAL NOT NULL DEFAULT 0,movement_minutes INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL)`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS wellness_plans (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,title TEXT NOT NULL,plan_json TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`).run();
}

function starterPlan(goal='general wellness'){
 return {
  goal,
  principles:['small repeatable actions','sleep consistency','hydration','regular movement','balanced meals','stress recovery','social/spiritual support'],
  daily:[
   {time:'morning',action:'Drink water, get daylight, and choose the day’s top wellness action.'},
   {time:'midday',action:'Eat a balanced meal and take a short movement break.'},
   {time:'evening',action:'Review mood/energy, reduce stimulation, and prepare for consistent sleep.'}
  ],
  weekly:[
   'Review progress without punishment or all-or-nothing scoring.',
   'Adjust one habit at a time based on what actually worked.',
   'Use Magnanimous Research for sourced wellness information when needed.'
  ]
 };
}

export async function handleWellness(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/wellness'))return null;
 if(!env?.DB)return json({detail:'Wellness workspace requires the database.'},503);
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
 await schema(env);const tenant=String(user.tenant_id),uid=String(user.id);
 if(request.method==='GET'&&url.pathname==='/api/wellness/summary'){
  const [profile,goals,habits,checkins,plan]=await Promise.all([
   env.DB.prepare('SELECT display_name,goals,preferences,updated_at FROM wellness_profiles WHERE tenant_id=? AND user_id=?').bind(tenant,uid).first(),
   env.DB.prepare("SELECT * FROM wellness_goals WHERE tenant_id=? AND user_id=? AND status='active' ORDER BY updated_at DESC LIMIT 25").bind(tenant,uid).all(),
   env.DB.prepare('SELECT * FROM wellness_habits WHERE tenant_id=? AND user_id=? AND active=1 ORDER BY updated_at DESC LIMIT 25').bind(tenant,uid).all(),
   env.DB.prepare('SELECT * FROM wellness_checkins WHERE tenant_id=? AND user_id=? ORDER BY created_at DESC LIMIT 14').bind(tenant,uid).all(),
   env.DB.prepare('SELECT * FROM wellness_plans WHERE tenant_id=? AND user_id=? AND active=1 ORDER BY updated_at DESC LIMIT 1').bind(tenant,uid).first()
  ]);
  return json({identity:'Magnanimous Wellness',profile:profile||null,goals:goals.results||[],habits:habits.results||[],checkins:checkins.results||[],plan:plan?{...plan,plan:JSON.parse(plan.plan_json||'{}')}:null,safety:'Educational wellness support only. It does not diagnose or replace licensed medical care.'});
 }
 if(request.method==='POST'&&url.pathname==='/api/wellness/profile'){
  const b=await request.json().catch(()=>({})),ts=now();
  await env.DB.prepare(`INSERT INTO wellness_profiles(tenant_id,user_id,display_name,goals,preferences,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(tenant_id,user_id) DO UPDATE SET display_name=excluded.display_name,goals=excluded.goals,preferences=excluded.preferences,updated_at=excluded.updated_at`).bind(tenant,uid,clip(b.display_name,120),clip(b.goals,2000),clip(b.preferences,2000),ts).run();return json({ok:true});
 }
 if(request.method==='POST'&&url.pathname==='/api/wellness/goals'){
  const b=await request.json().catch(()=>({}));const title=clip(b.title,300);if(!title)return json({detail:'Goal title is required.'},400);const ts=now();const r=await env.DB.prepare('INSERT INTO wellness_goals(tenant_id,user_id,title,category,target,status,created_at,updated_at) VALUES(?,?,?,?,?,\'active\',?,?)').bind(tenant,uid,title,clip(b.category||'general',80),clip(b.target,500),ts,ts).run();return json({ok:true,id:r.meta?.last_row_id||null});
 }
 if(request.method==='POST'&&url.pathname==='/api/wellness/habits'){
  const b=await request.json().catch(()=>({}));const title=clip(b.title,300);if(!title)return json({detail:'Habit title is required.'},400);const ts=now();const r=await env.DB.prepare('INSERT INTO wellness_habits(tenant_id,user_id,title,frequency,active,created_at,updated_at) VALUES(?,?,?,?,1,?,?)').bind(tenant,uid,title,clip(b.frequency||'daily',80),ts,ts).run();return json({ok:true,id:r.meta?.last_row_id||null});
 }
 if(request.method==='POST'&&url.pathname==='/api/wellness/checkins'){
  const b=await request.json().catch(()=>({}));await env.DB.prepare('INSERT INTO wellness_checkins(tenant_id,user_id,mood,energy,sleep_hours,water_cups,movement_minutes,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(tenant,uid,Math.max(0,Math.min(10,Number(b.mood||0))),Math.max(0,Math.min(10,Number(b.energy||0))),Math.max(0,Number(b.sleep_hours||0)),Math.max(0,Number(b.water_cups||0)),Math.max(0,Number(b.movement_minutes||0)),clip(b.notes,2000),now()).run();return json({ok:true});
 }
 if(request.method==='POST'&&url.pathname==='/api/wellness/plan'){
  const b=await request.json().catch(()=>({}));const goal=clip(b.goal||'general wellness',300),plan=starterPlan(goal),ts=now();await env.DB.prepare('UPDATE wellness_plans SET active=0 WHERE tenant_id=? AND user_id=?').bind(tenant,uid).run();const r=await env.DB.prepare('INSERT INTO wellness_plans(tenant_id,user_id,title,plan_json,active,created_at,updated_at) VALUES(?,?,?,?,1,?,?)').bind(tenant,uid,`Wellness plan: ${goal}`,JSON.stringify(plan),ts,ts).run();return json({ok:true,id:r.meta?.last_row_id||null,plan});
 }
 if(request.method==='POST'&&url.pathname==='/api/wellness/research'){
  const b=await request.json().catch(()=>({}));const query=clip(b.query,600);if(!query)return json({detail:'Research question is required.'},400);const data=await getKnowledgeContext(request,env,query,{liveSearch:b.web!==false,news:false,remember:b.remember!==false,localLimit:6,webLimit:6});return json({ok:true,query,sources:data.sources,grounding_context:data.context,live_search_configured:data.search_configured,safety:'Use sourced wellness information for education; urgent or severe symptoms require appropriate professional or emergency care.'});
 }
 return json({detail:'Unsupported wellness operation.'},405);
}
