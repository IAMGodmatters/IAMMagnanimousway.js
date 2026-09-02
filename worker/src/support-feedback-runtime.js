import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const text=(v,n=5000)=>String(v||'').trim().slice(0,n);
const categories=['bug','problem','suggestion','feedback','feature-request','billing','account','other'];
const priorities=['low','normal','high','urgent'];
const statuses=['open','reviewing','planned','in-progress','resolved','closed'];
async function ensure(env){await env.DB.prepare(`CREATE TABLE IF NOT EXISTS support_feedback (
 id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,user_email TEXT NOT NULL DEFAULT '',
 category TEXT NOT NULL DEFAULT 'feedback',subject TEXT NOT NULL,message TEXT NOT NULL,page_url TEXT NOT NULL DEFAULT '',
 priority TEXT NOT NULL DEFAULT 'normal',status TEXT NOT NULL DEFAULT 'open',owner_response TEXT NOT NULL DEFAULT '',
 created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`).run()}

export async function handleSupportFeedback(request,env,{platformOwner=false}={}){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/support'))return null;if(!env?.DB)return json({error:'Support database is not configured.'},503);
 try{
  await ensure(env);const user=await currentUser(request,env);if(!user)return json({error:'Sign in to contact support or leave feedback.'},401);const tenant=String(user.tenant_id),uid=String(user.id);
  if(request.method==='GET'&&url.pathname==='/api/support/meta')return json({categories,priorities,statuses,contact_method:'in-app support queue'});
  if(request.method==='POST'&&url.pathname==='/api/support/tickets'){
   const b=await request.json().catch(()=>({})),subject=text(b.subject,220),message=text(b.message,12000),category=categories.includes(String(b.category))?String(b.category):'feedback',priority=priorities.includes(String(b.priority))?String(b.priority):'normal';if(!subject||!message)return json({error:'Subject and message are required.'},400);const id=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO support_feedback(id,tenant_id,user_id,user_email,category,subject,message,page_url,priority,status,owner_response,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,uid,text(user.email,320),category,subject,message,text(b.page_url,1500),priority,'open','',ts,ts).run();return json({ok:true,id,status:'open',message:'Your feedback has been added to the owner support queue.'},201)
  }
  if(request.method==='GET'&&url.pathname==='/api/support/tickets'){const {results=[]}=await env.DB.prepare('SELECT id,category,subject,message,page_url,priority,status,owner_response,created_at,updated_at FROM support_feedback WHERE tenant_id=? AND user_id=? ORDER BY created_at DESC LIMIT 100').bind(tenant,uid).all();return json({tickets:results})}
  if(url.pathname.startsWith('/api/support/owner/')){
   if(!platformOwner)return json({error:'Platform owner access is required.'},403);
   if(request.method==='GET'&&url.pathname==='/api/support/owner/tickets'){const status=String(url.searchParams.get('status')||''),priority=String(url.searchParams.get('priority')||'');let sql='SELECT * FROM support_feedback WHERE 1=1',args=[];if(statuses.includes(status)){sql+=' AND status=?';args.push(status)}if(priorities.includes(priority)){sql+=' AND priority=?';args.push(priority)}sql+=' ORDER BY CASE priority WHEN \'urgent\' THEN 0 WHEN \'high\' THEN 1 WHEN \'normal\' THEN 2 ELSE 3 END, created_at DESC LIMIT 300';const {results=[]}=await env.DB.prepare(sql).bind(...args).all();const counts=await env.DB.prepare("SELECT COUNT(*) total,SUM(CASE WHEN status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) open_count,SUM(CASE WHEN priority='urgent' AND status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) urgent_count FROM support_feedback").first();return json({tickets:results,summary:{total:Number(counts?.total||0),open:Number(counts?.open_count||0),urgent:Number(counts?.urgent_count||0)}})}
   const m=url.pathname.match(/^\/api\/support\/owner\/tickets\/([^/]+)$/);if(m&&request.method==='PUT'){const b=await request.json().catch(()=>({})),old=await env.DB.prepare('SELECT * FROM support_feedback WHERE id=?').bind(m[1]).first();if(!old)return json({error:'Ticket not found.'},404);const status=statuses.includes(String(b.status))?String(b.status):old.status,response=b.owner_response===undefined?old.owner_response:text(b.owner_response,12000),priority=priorities.includes(String(b.priority))?String(b.priority):old.priority;await env.DB.prepare('UPDATE support_feedback SET status=?,owner_response=?,priority=?,updated_at=? WHERE id=?').bind(status,response,priority,now(),m[1]).run();return json({ok:true,ticket:await env.DB.prepare('SELECT * FROM support_feedback WHERE id=?').bind(m[1]).first()})}
  }
  return json({error:'Support endpoint not found.'},404)
 }catch(e){console.error('support feedback error',e);return json({error:e?.message||'Support service error.'},500)}
}
