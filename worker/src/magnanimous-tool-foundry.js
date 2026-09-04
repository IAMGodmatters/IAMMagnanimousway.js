import { currentUser } from './integrations.js';
import { getIntegrationCatalog, rankIntegrationTargets } from './magnanimous-integration-catalog.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clip=(v,n=5000)=>String(v??'').trim().slice(0,n);

async function schema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_tool_gaps (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,capability TEXT NOT NULL,example_task TEXT NOT NULL DEFAULT '',count INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'observed',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,user_id,capability))`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_native_tool_specs (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,name TEXT NOT NULL,purpose TEXT NOT NULL,family TEXT NOT NULL DEFAULT 'general',inputs_json TEXT NOT NULL DEFAULT '{}',outputs_json TEXT NOT NULL DEFAULT '{}',steps_json TEXT NOT NULL DEFAULT '[]',risk TEXT NOT NULL DEFAULT 'low',status TEXT NOT NULL DEFAULT 'draft',uses INTEGER NOT NULL DEFAULT 0,successes INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,user_id,name))`).run();
}

function normalizeName(v){return clip(v,100).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'magnanimous-tool'}
function proposedSteps(purpose){return [
 {type:'understand',instruction:`Understand the requested outcome: ${purpose}`},
 {type:'gather',instruction:'Gather only the inputs and authorized data required for the task.'},
 {type:'execute',instruction:'Use a native capability first; use an external connector only when materially necessary.'},
 {type:'verify',instruction:'Validate the result, safety boundaries, permissions, and expected output shape.'},
 {type:'learn',instruction:'Record success/failure, provider cost/latency when applicable, and reusable lessons.'}
]}
function integrationRisk(item){
 const high=new Set(['payments']);
 const medium=new Set(['sales','crm','deployment','commerce','operations','data','security']);
 if(high.has(item.category))return'high';
 if(medium.has(item.category))return'medium';
 return'low';
}
async function upsertSpec(env,{tenant,uid,name,purpose,family,inputs={},outputs={},steps,risk='low',status}){
 const ts=now(),safeName=normalizeName(name),safeFamily=normalizeName(family||'general'),toolSteps=Array.isArray(steps)&&steps.length?steps.slice(0,30):proposedSteps(purpose),toolStatus=status||(risk==='high'?'review-required':'draft');
 await env.DB.prepare(`INSERT INTO magnanimous_native_tool_specs(tenant_id,user_id,name,purpose,family,inputs_json,outputs_json,steps_json,risk,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,user_id,name) DO UPDATE SET purpose=excluded.purpose,family=excluded.family,inputs_json=excluded.inputs_json,outputs_json=excluded.outputs_json,steps_json=excluded.steps_json,risk=excluded.risk,status=CASE WHEN magnanimous_native_tool_specs.status='ready' THEN 'ready' ELSE excluded.status END,updated_at=excluded.updated_at`).bind(tenant,uid,safeName,clip(purpose,2000),safeFamily,JSON.stringify(inputs).slice(0,30000),JSON.stringify(outputs).slice(0,30000),JSON.stringify(toolSteps).slice(0,50000),risk,toolStatus,ts,ts).run();
 return env.DB.prepare('SELECT id,name,purpose,family,risk,status FROM magnanimous_native_tool_specs WHERE tenant_id=? AND user_id=? AND name=?').bind(tenant,uid,safeName).first();
}

export async function handleMagnanimousToolFoundry(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/magnanimous/tool-foundry'))return null;
 if(!env?.DB)return json({detail:'Tool Foundry requires D1.'},503);
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
 await schema(env);const tenant=String(user.tenant_id),uid=String(user.id);
 if(request.method==='GET'&&url.pathname==='/api/magnanimous/tool-foundry'){
  const [gaps,specs]=await Promise.all([
   env.DB.prepare('SELECT capability,example_task,count,status,updated_at FROM magnanimous_tool_gaps WHERE tenant_id=? AND user_id=? ORDER BY count DESC,updated_at DESC LIMIT 100').bind(tenant,uid).all(),
   env.DB.prepare('SELECT id,name,purpose,family,inputs_json,outputs_json,steps_json,risk,status,uses,successes,created_at,updated_at FROM magnanimous_native_tool_specs WHERE tenant_id=? AND user_id=? ORDER BY updated_at DESC LIMIT 300').bind(tenant,uid).all()
  ]);
  return json({identity:'Magnanimous AI',mode:'native-tool-learning',gaps:gaps.results||[],tools:(specs.results||[]).map(x=>({...x,inputs:JSON.parse(x.inputs_json||'{}'),outputs:JSON.parse(x.outputs_json||'{}'),steps:JSON.parse(x.steps_json||'[]')})),integration_targets:getIntegrationCatalog().length,note:'Magnanimous learns reusable native tool recipes and provider-adapter specifications. External services still require their own authorization. High-impact tools remain review-gated.'});
 }
 if(request.method==='GET'&&url.pathname==='/api/magnanimous/tool-foundry/integrations'){
  const goal=clip(url.searchParams.get('goal'),1000);
  return json({identity:'Magnanimous AI',mode:'integration-benchmark-catalog',catalog:getIntegrationCatalog(),recommended:goal?rankIntegrationTargets(goal):[],note:'Catalog entries are capability benchmarks and adapter targets, not inherited ChatGPT connections.'});
 }
 if(request.method==='POST'&&url.pathname==='/api/magnanimous/tool-foundry/seed-integrations'){
  const b=await request.json().catch(()=>({}));const onlyPriority=Boolean(b.high_priority_only);const targets=getIntegrationCatalog().filter(x=>!onlyPriority||['critical','high'].includes(x.priority));const seeded=[];
  for(const item of targets){
   const risk=integrationRisk(item),purpose=`Magnanimous adapter for ${item.name}: ${item.capabilities.join(', ')}. Keep Magnanimous as the brain; use this provider only when connected, authorized, and materially useful.`;
   const spec=await upsertSpec(env,{tenant,uid,name:`adapter-${item.id}`,purpose,family:`integration-${item.category}`,risk,status:risk==='high'?'review-required':'proposed',inputs:{goal:'string',authorized_context:'object',provider_connection:'required'},outputs:{result:'provider-specific normalized result',outcome_metrics:'quality/cost/latency'},steps:[
    {type:'route',instruction:`Determine whether ${item.name} materially improves the requested task over Magnanimous native/free capability.`},
    {type:'authorize',instruction:'Verify the provider connection, tenant scope, permissions, and required user approval before any consequential action.'},
    {type:'execute',instruction:`Call the ${item.name} adapter through a normalized Magnanimous tool contract; do not expose provider credentials to clients.`},
    {type:'normalize',instruction:'Convert the provider response into a stable Magnanimous result shape with source/provider attribution.'},
    {type:'learn',instruction:'Record success, quality, latency, cost and reusable lessons so Magnanimous improves future routing.'}
   ]});seeded.push(spec);
  }
  return json({ok:true,seeded:seeded.length,high_priority_only:onlyPriority,review_required:seeded.filter(x=>x?.risk==='high').length,tools:seeded});
 }
 if(request.method==='POST'&&url.pathname==='/api/magnanimous/tool-foundry/observe'){
  const b=await request.json().catch(()=>({}));const capability=normalizeName(b.capability||b.need),example=clip(b.example_task||b.task,1500);if(!capability)return json({detail:'Capability is required.'},400);const ts=now();await env.DB.prepare(`INSERT INTO magnanimous_tool_gaps(tenant_id,user_id,capability,example_task,count,status,created_at,updated_at) VALUES(?,?,?,?,1,'observed',?,?) ON CONFLICT(tenant_id,user_id,capability) DO UPDATE SET example_task=CASE WHEN excluded.example_task<>'' THEN excluded.example_task ELSE magnanimous_tool_gaps.example_task END,count=magnanimous_tool_gaps.count+1,updated_at=excluded.updated_at`).bind(tenant,uid,capability,example,ts,ts).run();const gap=await env.DB.prepare('SELECT * FROM magnanimous_tool_gaps WHERE tenant_id=? AND user_id=? AND capability=?').bind(tenant,uid,capability).first();let proposal=null;if(Number(gap?.count||0)>=3){const name=capability,purpose=example||`Reusable native capability for ${capability}`;proposal=await upsertSpec(env,{tenant,uid,name,purpose,family:'learned',risk:'low',status:'proposed'});await env.DB.prepare("UPDATE magnanimous_tool_gaps SET status='proposed',updated_at=? WHERE tenant_id=? AND user_id=? AND capability=?").bind(ts,tenant,uid,capability).run();}
  return json({ok:true,gap_count:Number(gap?.count||1),proposal});
 }
 if(request.method==='POST'&&url.pathname==='/api/magnanimous/tool-foundry/spec'){
  const b=await request.json().catch(()=>({})),name=normalizeName(b.name),purpose=clip(b.purpose,2000);if(!purpose)return json({detail:'Tool purpose is required.'},400);const risk=['low','medium','high'].includes(String(b.risk))?String(b.risk):'low';const row=await upsertSpec(env,{tenant,uid,name,purpose,family:b.family||'general',inputs:typeof b.inputs==='object'&&b.inputs?b.inputs:{},outputs:typeof b.outputs==='object'&&b.outputs?b.outputs:{},steps:Array.isArray(b.steps)?b.steps:undefined,risk,status:risk==='high'?'review-required':'draft'});return json({ok:true,tool:row});
 }
 if(request.method==='POST'&&url.pathname==='/api/magnanimous/tool-foundry/outcome'){
  const b=await request.json().catch(()=>({}));const name=normalizeName(b.name);await env.DB.prepare('UPDATE magnanimous_native_tool_specs SET uses=uses+1,successes=successes+?,updated_at=? WHERE tenant_id=? AND user_id=? AND name=?').bind(b.success?1:0,now(),tenant,uid,name).run();return json({ok:true});
 }
 if(request.method==='POST'&&url.pathname==='/api/magnanimous/tool-foundry/promote'){
  const b=await request.json().catch(()=>({}));const name=normalizeName(b.name),row=await env.DB.prepare('SELECT * FROM magnanimous_native_tool_specs WHERE tenant_id=? AND user_id=? AND name=?').bind(tenant,uid,name).first();if(!row)return json({detail:'Tool spec not found.'},404);if(row.risk==='high')return json({detail:'High-risk tools require explicit review and cannot self-promote.'},409);await env.DB.prepare("UPDATE magnanimous_native_tool_specs SET status='ready',updated_at=? WHERE tenant_id=? AND user_id=? AND name=?").bind(now(),tenant,uid,name).run();return json({ok:true,name,status:'ready'});
 }
 return json({detail:'Unsupported Tool Foundry operation.'},405);
}
