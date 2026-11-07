import {currentUser} from './integrations.js';

const J=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const S=(v,n=500)=>String(v??'').trim().slice(0,n);
const ID=()=>crypto.randomUUID();
const SLUG=/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/;
const HEX=/^#[0-9a-fA-F]{6}$/;
const encoder=new TextEncoder();
async function mediaSecret(env){
 const configured=String(env.SESSION_SECRET||'').trim();
 if(configured)return configured;
 const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first().catch(()=>null);
 return String(row?.value||'').trim();
}
function b64url(bytes){
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function signMediaToken(payload,secret){
 const body=b64url(encoder.encode(JSON.stringify(payload)));
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret+'|magnanimous-tv-media-v1'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(body)));
 return body+'.'+b64url(signature);
}

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
  const id=ID(),now=Math.floor(Date.now()/1000);
  try{
   const inserted=await env.DB.prepare('INSERT INTO magnanimous_tv_stations(id,tenant_id,user_id,slug,name,description,visibility,primary_color,secondary_color,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM magnanimous_tv_stations WHERE tenant_id=? AND user_id=?) < 5').bind(id,tenant,uid,slug,name,description,visibility,primary,secondary,now,now,tenant,uid).run();
   if(!Number(inserted?.meta?.changes||0))return J({detail:'This account has reached the current free station-profile limit of 5.'},429);
  }catch(error){
   const existing=await env.DB.prepare('SELECT id FROM magnanimous_tv_stations WHERE slug=?').bind(slug).first().catch(()=>null);
   if(existing)return J({detail:'That station address is already in use. Choose another address.'},409);
   return J({detail:'Station could not be created. Try again.'},500);
  }
  const row=await env.DB.prepare('SELECT * FROM magnanimous_tv_stations WHERE id=? AND tenant_id=? AND user_id=?').bind(id,tenant,uid).first();
  return J({station:safe(row),broadcast_status:'not_connected',message:'Station profile created. Live broadcast is not connected yet.'},201);
 }
 const publish=p.match(/^\\/api\\/tv\\/stations\\/([0-9a-f-]{36})\\/publish-token$/);
 if(publish&&request.method==='POST'){
  const row=await env.DB.prepare('SELECT * FROM magnanimous_tv_stations WHERE id=? AND tenant_id=? AND user_id=?').bind(publish[1],tenant,uid).first();
  if(!row)return J({detail:'Station not found or not owned by this account.'},404);
  const host=String(env.TV_MEDIA_PUBLIC_HOST||'').trim().toLowerCase().replace(/^https?:\\/\\//,'').replace(/\\/.*$/,'');
  if(!/^[a-z0-9.-]{3,253}$/.test(host))return J({detail:'The Magnanimous media host is not configured yet.'},503);
  const secret=await mediaSecret(env);
  if(secret.length<32)return J({detail:'The media signing key is not configured.'},503);
  const now=Math.floor(Date.now()/1000),expires=now+43200;
  const token=await signMediaToken({v:1,sub:uid,tenant,station:row.id,path:row.slug,action:'publish',iat:now,exp:expires},secret);
  return J({station:safe(row),protocol:'WHIP/WebRTC',publish_url:'https://'+host+'/'+row.slug+'/whip',viewer_hls_url:'https://'+host+'/'+row.slug+'/index.m3u8',token,expires_at:new Date(expires*1000).toISOString(),message:'Short-lived publish token. Keep it private and paste it only into an authorized WHIP publisher.'});
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
