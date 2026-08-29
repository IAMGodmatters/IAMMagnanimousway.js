import base from './index.js';

const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8'}});
const now=()=>Math.floor(Date.now()/1000);
const textEncoder=()=>new TextEncoder();

async function digestPassword(password, salt) {
  const material=await crypto.subtle.importKey('raw',textEncoder().encode(password),{name:'PBKDF2'},false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:textEncoder().encode(salt),iterations:100000,hash:'SHA-256'},material,256);
  return [...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function hmac(secret,value){
  const key=await crypto.subtle.importKey('raw',textEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const b=await crypto.subtle.sign('HMAC',key,textEncoder().encode(value));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function token(email,workspaceId,role,env){
  const exp=now()+604800; const payload=`${email}|${workspaceId}|${role}|${exp}`;
  return `${payload}|${await hmac(env.SESSION_SECRET,payload)}`;
}
async function auth(request,env){
  const raw=(request.headers.get('authorization')||'').replace(/^Bearer /,'');
  const p=raw.split('|');
  if(p.length!==5||!env.SESSION_SECRET||Number(p[3])<now())return null;
  const [email,wid,role,exp,sig]=p;
  if(sig!==(await hmac(env.SESSION_SECRET,`${email}|${wid}|${role}|${exp}`)))return null;
  const user=await env.DB.prepare('SELECT id,workspace_id,email,role FROM crm_users WHERE workspace_id=? AND email=?').bind(Number(wid),email).first();
  return user?{...user,workspace_id:Number(wid)}:null;
}
async function ensure(env){
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_workspaces (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,owner_email TEXT NOT NULL,plan TEXT NOT NULL DEFAULT 'free',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_users (id INTEGER PRIMARY KEY AUTOINCREMENT,workspace_id INTEGER NOT NULL,email TEXT NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(workspace_id,email),FOREIGN KEY(workspace_id) REFERENCES crm_workspaces(id) ON DELETE CASCADE)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_crm_users_email ON crm_users(email)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_crm_users_workspace ON crm_users(workspace_id)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_crm_contacts_workspace ON crm_contacts(workspace_id)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_crm_activities_workspace ON crm_activities(workspace_id)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_crm_opportunities_workspace ON crm_opportunities(workspace_id)")
  ]);
}
function contact(row){return {...row,tags:row.tags?row.tags.split(',').map(x=>x.trim()).filter(Boolean):[]};}

async function crm(request,env){
  await ensure(env); const url=new URL(request.url),path=url.pathname;
  if(path==='/api/crm/signup'&&request.method==='POST'){
    const b=await request.json(),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');
    if(!email||password.length<8||!String(b.name||'').trim())return json({detail:'Name, email, and a password of at least 8 characters are required.'},400);
    const exists=await env.DB.prepare('SELECT id FROM crm_users WHERE email=?').bind(email).first(); if(exists)return json({detail:'An account with this email already exists.'},409);
    const t=now(),baseSlug=email.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'workspace',slug=`${baseSlug}-${t}`;
    const salt=`${slug}:${env.SESSION_SECRET||'iam'}`,hash=await digestPassword(password,salt);
    const ws=await env.DB.prepare('INSERT INTO crm_workspaces(name,slug,owner_email,plan,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(String(b.name).trim()+"'s CRM",slug,email,'free',t,t).run();
    const wid=Number(ws.meta.last_row_id); await env.DB.prepare('INSERT INTO crm_users(workspace_id,email,password_hash,role,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(wid,email,hash,'owner',t,t).run();
    return json({token:await token(email,wid,'owner',env),workspace:{id:wid,name:String(b.name).trim()+"'s CRM",plan:'free'}} ,201);
  }
  if(path==='/api/crm/login'&&request.method==='POST'){
    const b=await request.json(),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');
    const u=await env.DB.prepare('SELECT id,workspace_id,email,role,password_hash FROM crm_users WHERE email=? LIMIT 1').bind(email).first();
    if(!u)return json({detail:'Invalid email or password.'},401);
    const ws=await env.DB.prepare('SELECT id,name,plan FROM crm_workspaces WHERE id=?').bind(u.workspace_id).first();
    const salt=`${ws?.id ? (await env.DB.prepare('SELECT slug FROM crm_workspaces WHERE id=?').bind(ws.id).first())?.slug : ''}:${env.SESSION_SECRET||'iam'}`;
    if((await digestPassword(password,salt))!==u.password_hash)return json({detail:'Invalid email or password.'},401);
    return json({token:await token(email,u.workspace_id,u.role,env),workspace:ws});
  }
  if(!path.startsWith('/api/crm/'))return null;
  const u=await auth(request,env); if(!u)return json({detail:'CRM login required.'},401); const wid=u.workspace_id;
  if(path==='/api/crm/me')return json({user:{id:u.id,email:u.email,role:u.role},workspace:await env.DB.prepare('SELECT id,name,plan,created_at FROM crm_workspaces WHERE id=?').bind(wid).first()});
  if(path==='/api/crm/summary'){
    const [c,l,cu,o,a]=await Promise.all([
      env.DB.prepare('SELECT COUNT(*) count FROM crm_contacts WHERE workspace_id=?').bind(wid).first(),
      env.DB.prepare("SELECT COUNT(*) count FROM crm_contacts WHERE workspace_id=? AND status IN ('lead','qualified')").bind(wid).first(),
      env.DB.prepare("SELECT COUNT(*) count FROM crm_contacts WHERE workspace_id=? AND status='customer'").bind(wid).first(),
      env.DB.prepare("SELECT COALESCE(SUM(value),0) value FROM crm_opportunities WHERE workspace_id=? AND stage NOT IN ('won','lost')").bind(wid).first(),
      env.DB.prepare('SELECT COUNT(*) count FROM crm_activities WHERE workspace_id=? AND completed=0 AND due_at IS NOT NULL AND due_at<=?').bind(wid,now()).first()
    ]); return json({contacts:c?.count||0,leads:l?.count||0,customers:cu?.count||0,pipeline_value:o?.value||0,overdue_tasks:a?.count||0});
  }
  if(path==='/api/crm/contacts'&&request.method==='GET'){
    const q=(url.searchParams.get('q')||'').trim(),status=url.searchParams.get('status')||'';let sql='SELECT * FROM crm_contacts WHERE workspace_id=?',p=[wid];
    if(q){sql+=' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company LIKE ? OR phone LIKE ?)';const v=`%${q}%`;p.push(v,v,v,v,v)} if(status){sql+=' AND status=?';p.push(status)} sql+=' ORDER BY updated_at DESC,id DESC LIMIT 500';const {results}=await env.DB.prepare(sql).bind(...p).all();return json({contacts:results.map(contact)});
  }
  if(path==='/api/crm/contacts'&&request.method==='POST'){const b=await request.json(),t=now();const r=await env.DB.prepare('INSERT INTO crm_contacts(workspace_id,first_name,last_name,email,phone,company,status,source,tags,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(wid,String(b.first_name||'').trim(),String(b.last_name||'').trim(),String(b.email||'').trim(),String(b.phone||'').trim(),String(b.company||'').trim(),String(b.status||'lead'),String(b.source||'').trim(),Array.isArray(b.tags)?b.tags.join(','):String(b.tags||''),String(b.notes||''),t,t).run();return json({ok:true,id:r.meta.last_row_id},201)}
  const cm=path.match(/^\/api\/crm\/contacts\/(\d+)$/); if(cm){const id=Number(cm[1]);if(request.method==='GET'){const c=await env.DB.prepare('SELECT * FROM crm_contacts WHERE id=? AND workspace_id=?').bind(id,wid).first();if(!c)return json({detail:'Contact not found'},404);const{results:activities}=await env.DB.prepare('SELECT * FROM crm_activities WHERE contact_id=? AND workspace_id=? ORDER BY created_at DESC').bind(id,wid).all();const{results:opportunities}=await env.DB.prepare('SELECT * FROM crm_opportunities WHERE contact_id=? AND workspace_id=? ORDER BY updated_at DESC').bind(id,wid).all();return json({contact:contact(c),activities,opportunities})}if(request.method==='PUT'){const b=await request.json();await env.DB.prepare('UPDATE crm_contacts SET first_name=?,last_name=?,email=?,phone=?,company=?,status=?,source=?,tags=?,notes=?,updated_at=? WHERE id=? AND workspace_id=?').bind(String(b.first_name||'').trim(),String(b.last_name||'').trim(),String(b.email||'').trim(),String(b.phone||'').trim(),String(b.company||'').trim(),String(b.status||'lead'),String(b.source||'').trim(),Array.isArray(b.tags)?b.tags.join(','):String(b.tags||''),String(b.notes||''),now(),id,wid).run();return json({ok:true})}if(request.method==='DELETE'){await env.DB.prepare('DELETE FROM crm_contacts WHERE id=? AND workspace_id=?').bind(id,wid).run();return json({ok:true})}}
  if(path==='/api/crm/opportunities'&&request.method==='GET'){const{results}=await env.DB.prepare('SELECT o.*,c.first_name,c.last_name,c.company FROM crm_opportunities o LEFT JOIN crm_contacts c ON c.id=o.contact_id AND c.workspace_id=o.workspace_id WHERE o.workspace_id=? ORDER BY o.updated_at DESC').bind(wid).all();return json({opportunities:results})}
  if(path==='/api/crm/opportunities'&&request.method==='POST'){const b=await request.json(),t=now();const r=await env.DB.prepare('INSERT INTO crm_opportunities(workspace_id,contact_id,name,stage,value,probability,expected_close_at,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(wid,b.contact_id?Number(b.contact_id):null,String(b.name||'Untitled opportunity'),String(b.stage||'new'),Number(b.value||0),Number(b.probability||0),b.expected_close_at?Number(b.expected_close_at):null,String(b.notes||''),t,t).run();return json({ok:true,id:r.meta.last_row_id},201)}
  if(path==='/api/crm/activities'&&request.method==='POST'){const b=await request.json();const r=await env.DB.prepare('INSERT INTO crm_activities(workspace_id,contact_id,type,title,body,due_at,completed,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(wid,Number(b.contact_id),String(b.type||'note'),String(b.title||''),String(b.body||''),b.due_at?Number(b.due_at):null,b.completed?1:0,now()).run();return json({ok:true,id:r.meta.last_row_id},201)}
  const am=path.match(/^\/api\/crm\/activities\/(\d+)$/);if(am&&request.method==='PUT'){const b=await request.json();await env.DB.prepare('UPDATE crm_activities SET type=?,title=?,body=?,due_at=?,completed=? WHERE id=? AND workspace_id=?').bind(String(b.type||'task'),String(b.title||''),String(b.body||''),b.due_at?Number(b.due_at):null,b.completed?1:0,Number(am[1]),wid).run();return json({ok:true})}
  return json({detail:'CRM route not found.'},404);
}

export default {fetch:async(request,env)=>{const url=new URL(request.url);if(url.pathname.startsWith('/api/crm/')){try{return (await crm(request,env))||json({detail:'CRM route not found'},404)}catch(e){return json({detail:e instanceof Error?e.message:'CRM error'},500)}}return base.fetch(request,env)}};
