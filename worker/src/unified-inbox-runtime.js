import { currentUser } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const text=(v,n=12000)=>String(v||'').trim().slice(0,n);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number(v||0)));

async function ensure(env){
 const statements=[
  `CREATE TABLE IF NOT EXISTS unified_inbox_threads (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT,channel TEXT NOT NULL DEFAULT 'task',source TEXT NOT NULL DEFAULT 'manual',external_ref TEXT NOT NULL DEFAULT '',customer_name TEXT NOT NULL DEFAULT '',customer_ref TEXT NOT NULL DEFAULT '',subject TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open',priority INTEGER NOT NULL DEFAULT 50,assigned_ai_agent_id TEXT,assigned_user_id TEXT,last_message_at INTEGER NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_unified_inbox_tenant_updated ON unified_inbox_threads(tenant_id,updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_unified_inbox_client ON unified_inbox_threads(tenant_id,client_id,updated_at DESC)`,
  `CREATE TABLE IF NOT EXISTS unified_inbox_messages (id INTEGER PRIMARY KEY AUTOINCREMENT,thread_id TEXT NOT NULL,tenant_id TEXT NOT NULL,direction TEXT NOT NULL DEFAULT 'inbound',author_type TEXT NOT NULL DEFAULT 'customer',author_name TEXT NOT NULL DEFAULT '',content TEXT NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_unified_inbox_messages_thread ON unified_inbox_messages(tenant_id,thread_id,id)`,
  `CREATE TABLE IF NOT EXISTS unified_inbox_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,thread_id TEXT,event_type TEXT NOT NULL,actor_id TEXT NOT NULL DEFAULT '',detail TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL)`
 ];
 for(const q of statements)await env.DB.prepare(q).run();
}
async function audit(env,tenant,thread,event,user,detail=''){await env.DB.prepare('INSERT INTO unified_inbox_audit(tenant_id,thread_id,event_type,actor_id,detail,created_at) VALUES(?,?,?,?,?,?)').bind(tenant,thread||null,event,String(user?.id||''),text(detail,2000),now()).run()}
function rowThread(x){return {...x,priority:Number(x.priority||0),last_message_at:Number(x.last_message_at||0),created_at:Number(x.created_at||0),updated_at:Number(x.updated_at||0)} }
async function clientExists(env,tenant,clientId){if(!clientId)return true;try{return Boolean(await env.DB.prepare('SELECT id FROM bpo_clients WHERE id=? AND tenant_id=?').bind(clientId,tenant).first())}catch{return false}}

async function listThreads(env,tenant,url){
 let sql=`SELECT t.*,(SELECT content FROM unified_inbox_messages m WHERE m.thread_id=t.id AND m.tenant_id=t.tenant_id ORDER BY m.id DESC LIMIT 1) last_message FROM unified_inbox_threads t WHERE t.tenant_id=?`;
 const args=[tenant];
 const status=text(url.searchParams.get('status'),30),channel=text(url.searchParams.get('channel'),40),client=text(url.searchParams.get('client_id'),80);
 if(status){sql+=' AND t.status=?';args.push(status)}if(channel){sql+=' AND t.channel=?';args.push(channel)}if(client){sql+=' AND t.client_id=?';args.push(client)}
 sql+=' ORDER BY CASE t.status WHEN \'open\' THEN 0 WHEN \'waiting\' THEN 1 ELSE 2 END,t.priority DESC,t.updated_at DESC LIMIT 300';
 const {results=[]}=await env.DB.prepare(sql).bind(...args).all();return results.map(rowThread);
}
async function overview(env,tenant){
 const count=async(where,args=[])=>Number((await env.DB.prepare(`SELECT COUNT(*) n FROM unified_inbox_threads WHERE tenant_id=? ${where}`).bind(tenant,...args).first())?.n||0);
 const [open,waiting,unassigned,urgent]=await Promise.all([count("AND status='open'"),count("AND status='waiting'"),count("AND assigned_user_id IS NULL AND assigned_ai_agent_id IS NULL AND status IN ('open','waiting')"),count("AND priority>=80 AND status IN ('open','waiting')")]);
 let bpoOpen=0;try{bpoOpen=Number((await env.DB.prepare("SELECT COUNT(*) n FROM bpo_work_items WHERE tenant_id=? AND status IN ('open','assigned','in-progress','waiting')").bind(tenant).first())?.n||0)}catch{}
 return{ok:true,open,waiting,unassigned,urgent,bpo_open_items:bpoOpen,channels:['email','sms','voice','voicemail','social','chat','web','task'],capture_endpoint:'/api/inbox/capture',handoff:'Magnanimous AI + named specialists + human users'};
}

export async function handleUnifiedInbox(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/inbox'))return null;if(!env?.DB)return json({detail:'Unified Inbox database is unavailable.'},503);
 try{
  await ensure(env);const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use Unified Inbox.'},401);const tenant=String(user.tenant_id);
  if(request.method==='GET'&&url.pathname==='/api/inbox/overview')return json(await overview(env,tenant));
  if(request.method==='GET'&&url.pathname==='/api/inbox/threads')return json({threads:await listThreads(env,tenant,url)});
  if(request.method==='POST'&&(url.pathname==='/api/inbox/threads'||url.pathname==='/api/inbox/capture')){
   const b=await request.json().catch(()=>({})),clientId=text(b.client_id,80)||null;if(clientId&&!await clientExists(env,tenant,clientId))return json({detail:'Choose a valid client account.'},400);
   const id=crypto.randomUUID(),ts=now(),subject=text(b.subject,300)||'Conversation',content=text(b.content||b.message,30000);if(!content)return json({detail:'Message content is required.'},400);
   await env.DB.prepare('INSERT INTO unified_inbox_threads(id,tenant_id,client_id,channel,source,external_ref,customer_name,customer_ref,subject,status,priority,assigned_ai_agent_id,assigned_user_id,last_message_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,clientId,text(b.channel||'task',40),text(b.source||'manual',80),text(b.external_ref,200),text(b.customer_name,200),text(b.customer_ref,200),subject,text(b.status||'open',30),clamp(b.priority||50,1,100),b.assigned_ai_agent_id?text(b.assigned_ai_agent_id,100):null,b.assigned_user_id?text(b.assigned_user_id,100):null,ts,ts,ts).run();
   await env.DB.prepare('INSERT INTO unified_inbox_messages(thread_id,tenant_id,direction,author_type,author_name,content,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,tenant,text(b.direction||'inbound',20),text(b.author_type||'customer',40),text(b.author_name||b.customer_name,160),content,JSON.stringify(b.metadata||{}),ts).run();
   await audit(env,tenant,id,'thread.created',user,`${text(b.channel||'task',40)} • ${subject}`);return json({ok:true,id},201)
  }
  let m=url.pathname.match(/^\/api\/inbox\/threads\/([^/]+)$/);
  if(m&&request.method==='PATCH'){
   const id=m[1],thread=await env.DB.prepare('SELECT * FROM unified_inbox_threads WHERE id=? AND tenant_id=?').bind(id,tenant).first();if(!thread)return json({detail:'Inbox thread not found.'},404);const b=await request.json().catch(()=>({}));
   const status=b.status===undefined?thread.status:text(b.status,30),priority=b.priority===undefined?thread.priority:clamp(b.priority,1,100),ai=b.assigned_ai_agent_id===undefined?thread.assigned_ai_agent_id:(b.assigned_ai_agent_id?text(b.assigned_ai_agent_id,100):null),human=b.assigned_user_id===undefined?thread.assigned_user_id:(b.assigned_user_id?text(b.assigned_user_id,100):null);
   await env.DB.prepare('UPDATE unified_inbox_threads SET status=?,priority=?,assigned_ai_agent_id=?,assigned_user_id=?,updated_at=? WHERE id=? AND tenant_id=?').bind(status,priority,ai,human,now(),id,tenant).run();await audit(env,tenant,id,'thread.updated',user,`${thread.status} -> ${status}`);return json({ok:true,status,priority})
  }
  m=url.pathname.match(/^\/api\/inbox\/threads\/([^/]+)\/messages$/);
  if(m&&request.method==='GET'){
   const thread=await env.DB.prepare('SELECT * FROM unified_inbox_threads WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!thread)return json({detail:'Inbox thread not found.'},404);const{results=[]}=await env.DB.prepare('SELECT * FROM unified_inbox_messages WHERE tenant_id=? AND thread_id=? ORDER BY id').bind(tenant,m[1]).all();return json({thread:rowThread(thread),messages:results.map(x=>({...x,metadata:JSON.parse(x.metadata_json||'{}')}))})
  }
  if(m&&request.method==='POST'){
   const thread=await env.DB.prepare('SELECT * FROM unified_inbox_threads WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!thread)return json({detail:'Inbox thread not found.'},404);const b=await request.json().catch(()=>({})),content=text(b.content||b.message,30000);if(!content)return json({detail:'Reply content is required.'},400);const ts=now();
   const result=await env.DB.prepare('INSERT INTO unified_inbox_messages(thread_id,tenant_id,direction,author_type,author_name,content,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(m[1],tenant,text(b.direction||'outbound',20),text(b.author_type||'user',40),text(b.author_name||user.name||user.email,160),content,JSON.stringify(b.metadata||{}),ts).run();await env.DB.prepare('UPDATE unified_inbox_threads SET last_message_at=?,updated_at=?,status=? WHERE id=? AND tenant_id=?').bind(ts,ts,text(b.thread_status||'waiting',30),m[1],tenant).run();await audit(env,tenant,m[1],'message.sent',user,text(content,240));return json({ok:true,id:result.meta?.last_row_id||null},201)
  }
  if(request.method==='GET'&&url.pathname==='/api/inbox/audit'){const{results=[]}=await env.DB.prepare('SELECT * FROM unified_inbox_audit WHERE tenant_id=? ORDER BY id DESC LIMIT 400').bind(tenant).all();return json({events:results})}
  return json({detail:'Unified Inbox endpoint not found.'},404);
 }catch(error){console.error('unified inbox error',error);return json({detail:error?.message||'Unified Inbox could not complete this request.'},500)}
}
