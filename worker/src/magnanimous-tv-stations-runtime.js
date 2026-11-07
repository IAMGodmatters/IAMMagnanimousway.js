import {currentUser} from './integrations.js';

const J=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const S=(v,n=500)=>String(v??'').trim().slice(0,n);
const ID=()=>crypto.randomUUID();
const SLUG=/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/;
const HEX=/^#[0-9a-fA-F]{6}$/;

async function schema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_tv_stations(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',visibility TEXT NOT NULL DEFAULT 'public',
  primary_color TEXT NOT NULL DEFAULT '#D9B66D',secondary_color TEXT NOT NULL DEFAULT '#102A4C',
  created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_tv_stations_owner ON magnanimous_tv_stations(tenant_id,user_id,updated_at DESC)').run();
}
function safe(row){return{id:row.id,slug:row.slug,name:row.name,description:row.description,visibility:row.visibility,primary_color:row.primary_color,secondary_color:row.secondary_color,created_at:row.created_at,updated_at:row.updated_at,station_url:'https://iammagnanimousway.com/tv/station?slug='+encodeURIComponent(row.slug),brand:'Magnanimous TV'};}
export async function handleMagnanimousTvStations(request,env){
 const url=new URL(request.url),p=url.pathname;
 if(!p.startsWith('/api/tv/stations'))return null;
 if(!env?.DB)return J({detail:'TV station storage is unavailable.'},503);
 await schema(env);
 const pub=p.match(/^\/api\/tv\/stations\/public\/([a-z0-9-]{3,48})$/);
 if(pub&&request.method==='GET'){
  const row=await env.DB.prepare("SELECT * FROM magnanimous_tv_stations WHERE slug=? AND visibility IN ('public','unlisted')").bind(pub[1]).first();
  return row?J(safe(row)):J({detail:'Station not found.'},404);
 }
 const user=await currentUser(request,env).catch(()=>null);
 if(!user)return J({detail:'Sign in to manage your TV stations.'},401);
 const tenant=String(user.tenant_id||''),uid=String(user.id||'');
 if(!tenant||!uid)return J({detail:'Your account does not have a valid workspace identity.'},403);
 if(p==='/api/tv/stations'&&request.method==='GET'){
  const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_tv_stations WHERE tenant_id=? AND user_id=? ORDER BY updated_at DESC LIMIT 20').bind(tenant,uid).all();
  return J({stations:results.map(safe),limit:5});
 }
 if(p==='/api/tv/stations'&&request.method==='POST'){
  const b=await request.json().catch(()=>({}));
  const name=S(b.name,80),slug=S(b.slug,48).toLowerCase().replace(/\s+/g,'-'),description=S(b.description,280);
  const visibility=['public','unlisted'].includes(b.visibility)?b.visibility:'public';
  const primary=HEX.test(String(b.primary_color||''))?String(b.primary_color):'#D9B66D';
  const secondary=HEX.test(String(b.secondary_color||''))?String(b.secondary_color):'#102A4C';
  if(name.length<3)return J({detail:'Station name must contain at least 3 characters.'},400);
  if(!SLUG.test(slug))return J({detail:'Station address must be 3–48 characters and use lowercase letters, numbers and hyphens.'},400);
  const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM magnanimous_tv_stations WHERE tenant_id=? AND user_id=?').bind(tenant,uid).first();
  if(Number(count?.n||0)>=5)return J({detail:'This account has reached the current free station-profile limit of 5.'},429);
  const id=ID(),now=Math.floor(Date.now()/1000);
  try{
   await env.DB.prepare('INSERT INTO magnanimous_tv_stations(id,tenant_id,user_id,slug,name,description,visibility,primary_color,secondary_color,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,uid,slug,name,description,visibility,primary,secondary,now,now).run();
  }catch(error){return J({detail:'That station address is already in use. Choose another address.'},409)}
  const row=await env.DB.prepare('SELECT * FROM magnanimous_tv_stations WHERE id=? AND tenant_id=? AND user_id=?').bind(id,tenant,uid).first();
  return J({station:safe(row),broadcast_status:'not_connected',message:'Station profile created. Live broadcast is not connected yet.'},201);
 }
 const item=p.match(/^\/api\/tv\/stations\/([0-9a-f-]{36})$/);
 if(item&&request.method==='PATCH'){
  const b=await request.json().catch(()=>({}));
  const name=S(b.name,80),description=S(b.description,280);
  const visibility=['public','unlisted'].includes(b.visibility)?b.visibility:'public';
  const primary=HEX.test(String(b.primary_color||''))?String(b.primary_color):'#D9B66D';
  const secondary=HEX.test(String(b.secondary_color||''))?String(b.secondary_color):'#102A4C';
  if(name.length<3)return J({detail:'Station name must contain at least 3 characters.'},400);
  const result=await env.DB.prepare('UPDATE magnanimous_tv_stations SET name=?,description=?,visibility=?,primary_color=?,secondary_color=?,updated_at=? WHERE id=? AND tenant_id=? AND user_id=?').bind(name,description,visibility,primary,secondary,Math.floor(Date.now()/1000),item[1],tenant,uid).run();
  if(!Number(result?.meta?.changes||0))return J({detail:'Station not found or not owned by this account.'},404);
  const row=await env.DB.prepare('SELECT * FROM magnanimous_tv_stations WHERE id=? AND tenant_id=? AND user_id=?').bind(item[1],tenant,uid).first();
  return J({station:safe(row)});
 }
 return J({detail:'TV station route not found.'},404);
}
