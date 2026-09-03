import { currentUser } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n||0)));
const text=(v,n=6000)=>String(v||'').trim().slice(0,n);
const arr=v=>Array.isArray(v)?v:[];

async function ensure(env){
 const statements=[
  `CREATE TABLE IF NOT EXISTS bpo_clients (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,industry TEXT NOT NULL DEFAULT '',service_lines TEXT NOT NULL DEFAULT '[]',status TEXT NOT NULL DEFAULT 'active',data_classification TEXT NOT NULL DEFAULT 'standard',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS bpo_programs (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,name TEXT NOT NULL,channel TEXT NOT NULL DEFAULT 'omnichannel',queue_id TEXT,timezone TEXT NOT NULL DEFAULT 'UTC',operating_hours_json TEXT NOT NULL DEFAULT '{}',sla_response_seconds INTEGER NOT NULL DEFAULT 30,sla_resolution_seconds INTEGER NOT NULL DEFAULT 86400,target_service_level REAL NOT NULL DEFAULT 80,target_quality REAL NOT NULL DEFAULT 90,target_csat REAL NOT NULL DEFAULT 4.5,required_skills TEXT NOT NULL DEFAULT '[]',knowledge_scope TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS bpo_work_items (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,program_id TEXT NOT NULL,external_ref TEXT NOT NULL DEFAULT '',channel TEXT NOT NULL DEFAULT 'task',priority INTEGER NOT NULL DEFAULT 50,subject TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',customer_name TEXT NOT NULL DEFAULT '',customer_ref TEXT NOT NULL DEFAULT '',assigned_agent_id TEXT,assigned_ai_agent_id TEXT,status TEXT NOT NULL DEFAULT 'open',due_at INTEGER,first_response_at INTEGER,resolved_at INTEGER,disposition TEXT NOT NULL DEFAULT '',metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS bpo_audit_events (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,client_id TEXT,program_id TEXT,work_item_id TEXT,actor_type TEXT NOT NULL DEFAULT 'user',actor_id TEXT NOT NULL DEFAULT '',event_type TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL)`
 ];
 for(const q of statements)await env.DB.prepare(q).run();
}
async function audit(env,tenant,event,opts={}){await env.DB.prepare('INSERT INTO bpo_audit_events(tenant_id,client_id,program_id,work_item_id,actor_type,actor_id,event_type,detail,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(tenant,opts.client_id||null,opts.program_id||null,opts.work_item_id||null,opts.actor_type||'user',opts.actor_id||'',event,text(opts.detail,2000),now()).run()}

async function overview(env,tenant){
 const [clients,programs,open,overdue,resolved]=await Promise.all([
  env.DB.prepare("SELECT COUNT(*) n FROM bpo_clients WHERE tenant_id=? AND status='active'").bind(tenant).first(),
  env.DB.prepare("SELECT COUNT(*) n FROM bpo_programs WHERE tenant_id=? AND status='active'").bind(tenant).first(),
  env.DB.prepare("SELECT COUNT(*) n FROM bpo_work_items WHERE tenant_id=? AND status IN ('open','assigned','in-progress','waiting')").bind(tenant).first(),
  env.DB.prepare("SELECT COUNT(*) n FROM bpo_work_items WHERE tenant_id=? AND due_at IS NOT NULL AND due_at<? AND status NOT IN ('resolved','closed','canceled')").bind(tenant,now()).first(),
  env.DB.prepare("SELECT COUNT(*) n FROM bpo_work_items WHERE tenant_id=? AND resolved_at>=?").bind(tenant,now()-86400*30).first()
 ]);
 const {results=[]}=await env.DB.prepare(`SELECT p.id,p.name,p.client_id,p.sla_response_seconds,p.sla_resolution_seconds,p.target_service_level,p.target_quality,p.target_csat,
  c.name client_name,
  SUM(CASE WHEN w.status IN ('open','assigned','in-progress','waiting') THEN 1 ELSE 0 END) open_items,
  SUM(CASE WHEN w.due_at IS NOT NULL AND w.due_at<? AND w.status NOT IN ('resolved','closed','canceled') THEN 1 ELSE 0 END) overdue_items,
  AVG(CASE WHEN w.first_response_at IS NOT NULL THEN w.first_response_at-w.created_at END) avg_first_response_seconds,
  AVG(CASE WHEN w.resolved_at IS NOT NULL THEN w.resolved_at-w.created_at END) avg_resolution_seconds
  FROM bpo_programs p JOIN bpo_clients c ON c.id=p.client_id
  LEFT JOIN bpo_work_items w ON w.program_id=p.id AND w.tenant_id=p.tenant_id
  WHERE p.tenant_id=? GROUP BY p.id ORDER BY c.name,p.name`).bind(now(),tenant).all();
 return{ok:true,clients:Number(clients?.n||0),programs:Number(programs?.n||0),open_items:Number(open?.n||0),overdue_items:Number(overdue?.n||0),resolved_30d:Number(resolved?.n||0),program_health:results.map(r=>({...r,open_items:Number(r.open_items||0),overdue_items:Number(r.overdue_items||0),avg_first_response_seconds:r.avg_first_response_seconds==null?null:Number(Number(r.avg_first_response_seconds).toFixed(1)),avg_resolution_seconds:r.avg_resolution_seconds==null?null:Number(Number(r.avg_resolution_seconds).toFixed(1))}))};
}

export async function handleBpoOperations(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/bpo'))return null;if(!env?.DB)return json({detail:'BPO operations database is unavailable.'},503);
 try{
  await ensure(env);const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use BPO operations.'},401);const tenant=String(user.tenant_id),owner=user.role==='owner';
  if(request.method==='GET'&&url.pathname==='/api/bpo/overview')return json(await overview(env,tenant));
  if(request.method==='GET'&&url.pathname==='/api/bpo/clients'){const{results=[]}=await env.DB.prepare('SELECT * FROM bpo_clients WHERE tenant_id=? ORDER BY status DESC,name').bind(tenant).all();return json({clients:results.map(x=>({...x,service_lines:JSON.parse(x.service_lines||'[]')}))})}
  if(request.method==='POST'&&url.pathname==='/api/bpo/clients'){
   if(!owner)return json({detail:'Workspace owner access required.'},403);const b=await request.json().catch(()=>({})),name=text(b.name,160);if(!name)return json({detail:'Client name is required.'},400);const id=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO bpo_clients(id,tenant_id,name,industry,service_lines,status,data_classification,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,name,text(b.industry,120),JSON.stringify(arr(b.service_lines).map(x=>text(x,80)).filter(Boolean)),text(b.status||'active',30),text(b.data_classification||'standard',40),text(b.notes),ts,ts).run();await audit(env,tenant,'client.created',{client_id:id,actor_id:user.id,detail:name});return json({id},201)
  }
  if(request.method==='GET'&&url.pathname==='/api/bpo/programs'){const{results=[]}=await env.DB.prepare('SELECT p.*,c.name client_name FROM bpo_programs p JOIN bpo_clients c ON c.id=p.client_id WHERE p.tenant_id=? ORDER BY c.name,p.name').bind(tenant).all();return json({programs:results.map(x=>({...x,required_skills:JSON.parse(x.required_skills||'[]'),operating_hours:JSON.parse(x.operating_hours_json||'{}')}))})}
  if(request.method==='POST'&&url.pathname==='/api/bpo/programs'){
   if(!owner)return json({detail:'Workspace owner access required.'},403);const b=await request.json().catch(()=>({})),client=await env.DB.prepare('SELECT id FROM bpo_clients WHERE id=? AND tenant_id=?').bind(String(b.client_id||''),tenant).first();if(!client)return json({detail:'Choose a valid client.'},400);const name=text(b.name,160);if(!name)return json({detail:'Program name is required.'},400);const id=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO bpo_programs(id,tenant_id,client_id,name,channel,queue_id,timezone,operating_hours_json,sla_response_seconds,sla_resolution_seconds,target_service_level,target_quality,target_csat,required_skills,knowledge_scope,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,client.id,name,text(b.channel||'omnichannel',40),b.queue_id?String(b.queue_id):null,text(b.timezone||'UTC',80),JSON.stringify(b.operating_hours||{}),clamp(b.sla_response_seconds||30,1,86400),clamp(b.sla_resolution_seconds||86400,60,2592000),clamp(b.target_service_level||80,1,100),clamp(b.target_quality||90,1,100),clamp(b.target_csat||4.5,1,5),JSON.stringify(arr(b.required_skills).map(x=>text(x,80)).filter(Boolean)),text(b.knowledge_scope,500),text(b.status||'active',30),ts,ts).run();await audit(env,tenant,'program.created',{client_id:client.id,program_id:id,actor_id:user.id,detail:name});return json({id},201)
  }
  if(request.method==='GET'&&url.pathname==='/api/bpo/work-items'){
   const program=url.searchParams.get('program_id')||'',status=url.searchParams.get('status')||'';let sql='SELECT w.*,p.name program_name,c.name client_name FROM bpo_work_items w JOIN bpo_programs p ON p.id=w.program_id JOIN bpo_clients c ON c.id=w.client_id WHERE w.tenant_id=?';const args=[tenant];if(program){sql+=' AND w.program_id=?';args.push(program)}if(status){sql+=' AND w.status=?';args.push(status)}sql+=' ORDER BY CASE WHEN w.due_at IS NOT NULL AND w.due_at<? THEN 0 ELSE 1 END,w.priority DESC,w.created_at ASC LIMIT 500';args.push(String(now()));const{results=[]}=await env.DB.prepare(sql).bind(...args).all();return json({items:results.map(x=>({...x,metadata:JSON.parse(x.metadata_json||'{}')}))})
  }
  if(request.method==='POST'&&url.pathname==='/api/bpo/work-items'){
   const b=await request.json().catch(()=>({})),program=await env.DB.prepare('SELECT * FROM bpo_programs WHERE id=? AND tenant_id=? AND status=?').bind(String(b.program_id||''),tenant,'active').first();if(!program)return json({detail:'Choose an active program.'},400);const subject=text(b.subject,300);if(!subject)return json({detail:'Work item subject is required.'},400);const id=crypto.randomUUID(),ts=now(),due=b.due_at?Number(b.due_at):ts+Number(program.sla_resolution_seconds||86400);await env.DB.prepare('INSERT INTO bpo_work_items(id,tenant_id,client_id,program_id,external_ref,channel,priority,subject,body,customer_name,customer_ref,assigned_agent_id,assigned_ai_agent_id,status,due_at,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,program.client_id,program.id,text(b.external_ref,160),text(b.channel||program.channel||'task',40),clamp(b.priority||50,1,100),subject,text(b.body),text(b.customer_name,200),text(b.customer_ref,200),b.assigned_agent_id?String(b.assigned_agent_id):null,b.assigned_ai_agent_id?String(b.assigned_ai_agent_id):null,'open',due,JSON.stringify(b.metadata||{}),ts,ts).run();await audit(env,tenant,'work-item.created',{client_id:program.client_id,program_id:program.id,work_item_id:id,actor_id:user.id,detail:subject});return json({id,due_at:due},201)
  }
  const m=url.pathname.match(/^\/api\/bpo\/work-items\/([^/]+)$/);if(m&&request.method==='PUT'){
   const item=await env.DB.prepare('SELECT * FROM bpo_work_items WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!item)return json({detail:'Work item not found.'},404);const b=await request.json().catch(()=>({})),status=text(b.status||item.status,30),ts=now(),first=item.first_response_at||(['assigned','in-progress','waiting','resolved','closed'].includes(status)?ts:null),resolved=['resolved','closed'].includes(status)?(item.resolved_at||ts):item.resolved_at;await env.DB.prepare('UPDATE bpo_work_items SET assigned_agent_id=?,assigned_ai_agent_id=?,status=?,first_response_at=?,resolved_at=?,disposition=?,updated_at=? WHERE id=? AND tenant_id=?').bind(b.assigned_agent_id===undefined?item.assigned_agent_id:b.assigned_agent_id,b.assigned_ai_agent_id===undefined?item.assigned_ai_agent_id:b.assigned_ai_agent_id,status,first,resolved,text(b.disposition||item.disposition,120),ts,item.id,tenant).run();await audit(env,tenant,'work-item.updated',{client_id:item.client_id,program_id:item.program_id,work_item_id:item.id,actor_id:user.id,detail:`${item.status} -> ${status}`});return json({ok:true,status,first_response_at:first,resolved_at:resolved})
  }
  if(request.method==='GET'&&url.pathname==='/api/bpo/audit'){const{results=[]}=await env.DB.prepare('SELECT * FROM bpo_audit_events WHERE tenant_id=? ORDER BY created_at DESC LIMIT 500').bind(tenant).all();return json({events:results})}
  return json({detail:'BPO operations endpoint not found.'},404);
 }catch(error){console.error('bpo operations error',error);return json({detail:error?.message||'BPO operations error.'},500)}
}
