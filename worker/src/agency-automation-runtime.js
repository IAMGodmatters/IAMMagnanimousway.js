import { currentUser } from './integrations.js';
import { createWork } from './work-engine-runtime.js';
import { handleUnifiedInbox } from './unified-inbox-runtime.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const text=(v,n=12000)=>String(v??'').trim().slice(0,n);

async function ensure(env){
 const statements=[
  `CREATE TABLE IF NOT EXISTS agency_automations (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT,name TEXT NOT NULL,trigger_type TEXT NOT NULL,action_type TEXT NOT NULL,action_config_json TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'active',run_count INTEGER NOT NULL DEFAULT 0,last_run_at INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_agency_automations_trigger ON agency_automations(tenant_id,client_id,trigger_type,status)`,
  `CREATE TABLE IF NOT EXISTS agency_automation_runs (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,automation_id TEXT NOT NULL,trigger_type TEXT NOT NULL,action_type TEXT NOT NULL,status TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '',result_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_agency_automation_runs ON agency_automation_runs(tenant_id,automation_id,id DESC)`
 ];
 for(const q of statements)await env.DB.prepare(q).run();
}
async function clientExists(env,tenant,id){if(!id)return true;try{return Boolean(await env.DB.prepare('SELECT id FROM bpo_clients WHERE id=? AND tenant_id=?').bind(id,tenant).first())}catch{return false}}
function config(v){try{return typeof v==='string'?JSON.parse(v||'{}'):(v||{})}catch{return{}}}
function row(x){return{...x,action_config:config(x.action_config_json),run_count:Number(x.run_count||0),last_run_at:x.last_run_at?Number(x.last_run_at):null}}
function getPath(value,path){return String(path||'').split('.').filter(Boolean).reduce((v,k)=>v&&typeof v==='object'?v[k]:undefined,value)}
function render(template,payload,event){return text(String(template||'').replace(/\{\{\s*([\w.-]+)\s*\}\}/g,(_,key)=>{const value=key==='event'?event:getPath(payload,key);return value==null?'':String(value)}),12000)}
async function logRun(env,tenant,rule,status,detail,result={}){await env.DB.prepare('INSERT INTO agency_automation_runs(tenant_id,automation_id,trigger_type,action_type,status,detail,result_json,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(tenant,rule.id,rule.trigger_type,rule.action_type,status,text(detail,3000),JSON.stringify(result||{}).slice(0,12000),now()).run()}

async function executeRule(request,env,user,rule,payload={}){
 const cfg=config(rule.action_config_json),event=rule.trigger_type;
 try{
  let result={};
  if(rule.action_type==='create-work'){
   const title=render(cfg.title||rule.name,payload,event)||rule.name;
   const goal=render(cfg.goal||cfg.message||`Follow up on ${event}: {{subject}}`,payload,event)||`Automation ${rule.name} triggered by ${event}.`;
   const item=await createWork(env,user,{title,goal,specialist_id:text(cfg.specialist_id,120),metadata:{automation_id:rule.id,trigger_type:event,client_id:rule.client_id||'',source:'agency-automation'}});
   if(!item)throw new Error('Work Engine did not create the automated work item.');
   result={work_id:item.id,title:item.title};
  }else if(rule.action_type==='create-inbox'){
   const headers=new Headers();const auth=request.headers.get('authorization');if(auth)headers.set('authorization',auth);headers.set('content-type','application/json');
   const body={client_id:rule.client_id||payload.client_id||'',channel:cfg.channel||'task',source:'agency-automation',customer_name:render(cfg.customer_name||'{{customer_name}}',payload,event),subject:render(cfg.subject||rule.name,payload,event),content:render(cfg.content||cfg.message||`Automation ${rule.name} triggered by ${event}.`,payload,event),priority:Number(cfg.priority||50),direction:'inbound',author_type:'automation',author_name:'Magnanimous Automation',metadata:{automation_id:rule.id,trigger_type:event}};
   const response=await handleUnifiedInbox(new Request(new URL('/api/inbox/capture',request.url),{method:'POST',headers,body:JSON.stringify(body)}),env);
   const data=await response?.clone().json().catch(()=>({}));if(!response?.ok)throw new Error(data?.detail||'Unified Inbox did not accept the automated item.');result={inbox_thread_id:data.id};
  }else{
   throw new Error(`Unsupported automation action: ${rule.action_type}`);
  }
  const ts=now();await env.DB.prepare('UPDATE agency_automations SET run_count=run_count+1,last_run_at=?,updated_at=? WHERE id=? AND tenant_id=?').bind(ts,ts,rule.id,user.tenant_id).run();await logRun(env,user.tenant_id,rule,'completed','Automation action completed.',result);return{ok:true,automation_id:rule.id,...result};
 }catch(error){const detail=error?.message||String(error);await logRun(env,user.tenant_id,rule,'failed',detail,{});return{ok:false,automation_id:rule.id,detail};}
}

export async function dispatchAgencyAutomationEvent(request,env,{trigger_type,client_id='',payload={}}={}){
 if(!env?.DB||!trigger_type)return[];await ensure(env);const user=await currentUser(request,env).catch(()=>null);if(!user)return[];const tenant=String(user.tenant_id),client=text(client_id||payload?.client_id,80);
 let sql="SELECT * FROM agency_automations WHERE tenant_id=? AND trigger_type=? AND status='active' AND (client_id IS NULL OR client_id='')";const args=[tenant,text(trigger_type,80)];if(client){sql="SELECT * FROM agency_automations WHERE tenant_id=? AND trigger_type=? AND status='active' AND (client_id IS NULL OR client_id='' OR client_id=?)";args.push(client)}
 const{results=[]}=await env.DB.prepare(sql).bind(...args).all();const output=[];for(const rule of results)output.push(await executeRule(request,env,user,rule,{...payload,client_id:client}));return output;
}

export async function handleAgencyAutomations(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/agency/automations'))return null;if(!env?.DB)return json({detail:'Agency automation database is unavailable.'},503);
 try{
  await ensure(env);const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use Agency Automations.'},401);const tenant=String(user.tenant_id),owner=['owner','admin'].includes(String(user.role||'').toLowerCase());
  if(url.pathname==='/api/agency/automations'){
   if(request.method==='GET'){const client=text(url.searchParams.get('client_id'),80);let sql='SELECT * FROM agency_automations WHERE tenant_id=?';const args=[tenant];if(client){sql+=' AND (client_id=? OR client_id IS NULL)';args.push(client)}sql+=' ORDER BY status DESC,updated_at DESC';const{results=[]}=await env.DB.prepare(sql).bind(...args).all();return json({automations:results.map(row),triggers:['booking.created','funnel.created','review.created','usage.created','inbox.received','manual'],actions:['create-work','create-inbox']})}
   if(request.method==='POST'){if(!owner)return json({detail:'Workspace owner access required to create automations.'},403);const b=await request.json().catch(()=>({})),client=text(b.client_id,80)||null;if(client&&!await clientExists(env,tenant,client))return json({detail:'Choose a valid client account.'},400);const name=text(b.name,180),trigger=text(b.trigger_type,80),action=text(b.action_type,80);if(!name||!trigger||!action)return json({detail:'Name, trigger and action are required.'},400);const id=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO agency_automations(id,tenant_id,client_id,name,trigger_type,action_type,action_config_json,status,run_count,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,client,name,trigger,action,JSON.stringify(b.action_config||{}).slice(0,12000),text(b.status||'active',30),0,ts,ts).run();return json({ok:true,id},201)}
   return json({detail:'Method not allowed.'},405);
  }
  if(url.pathname==='/api/agency/automations/trigger'&&request.method==='POST'){
   const b=await request.json().catch(()=>({}));const trigger=text(b.trigger_type,80);if(!trigger)return json({detail:'trigger_type is required.'},400);return json({ok:true,results:await dispatchAgencyAutomationEvent(request,env,{trigger_type:trigger,client_id:text(b.client_id,80),payload:b.payload||{}})})
  }
  let m=url.pathname.match(/^\/api\/agency\/automations\/([^/]+)$/);
  if(m&&request.method==='PATCH'){if(!owner)return json({detail:'Workspace owner access required.'},403);const rule=await env.DB.prepare('SELECT * FROM agency_automations WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!rule)return json({detail:'Automation not found.'},404);const b=await request.json().catch(()=>({}));await env.DB.prepare('UPDATE agency_automations SET name=?,trigger_type=?,action_type=?,action_config_json=?,status=?,updated_at=? WHERE id=? AND tenant_id=?').bind(text(b.name===undefined?rule.name:b.name,180),text(b.trigger_type===undefined?rule.trigger_type:b.trigger_type,80),text(b.action_type===undefined?rule.action_type:b.action_type,80),JSON.stringify(b.action_config===undefined?config(rule.action_config_json):b.action_config).slice(0,12000),text(b.status===undefined?rule.status:b.status,30),now(),m[1],tenant).run();return json({ok:true})}
  m=url.pathname.match(/^\/api\/agency\/automations\/([^/]+)\/run$/);
  if(m&&request.method==='POST'){const rule=await env.DB.prepare('SELECT * FROM agency_automations WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!rule)return json({detail:'Automation not found.'},404);const b=await request.json().catch(()=>({}));return json(await executeRule(request,env,user,rule,b.payload||{}))}
  m=url.pathname.match(/^\/api\/agency\/automations\/([^/]+)\/runs$/);
  if(m&&request.method==='GET'){const rule=await env.DB.prepare('SELECT id FROM agency_automations WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!rule)return json({detail:'Automation not found.'},404);const{results=[]}=await env.DB.prepare('SELECT * FROM agency_automation_runs WHERE tenant_id=? AND automation_id=? ORDER BY id DESC LIMIT 100').bind(tenant,m[1]).all();return json({runs:results.map(x=>({...x,result:config(x.result_json)}))})}
  return json({detail:'Agency automation endpoint not found.'},404);
 }catch(error){console.error('agency automation error',error);return json({detail:error?.message||'Agency automation could not complete this request.'},500)}
}
