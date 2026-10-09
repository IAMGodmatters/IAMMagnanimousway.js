import { currentUser } from './integrations.js';
import { requirePlatformOwner } from './platform-owner-guard.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const encoder=new TextEncoder();
const DRIVE_SCOPES=['openid','email','https://www.googleapis.com/auth/drive.readonly'];
const APPROVED_ROOTS=new Set([
 '1pBOgqj8AAoTeQl6nJovAPABqEYf_dIqJ', // Educational Video
 '1C7dvHBi-WxWTnL-e_JyBPeUFE9zj-zTV', // Cartoon Collection
 '1l-lBHCtbtUeYnYhJ9dXUYJJw_RWyqfzI', // Kids Learning Materials
 '1cL5_6F7GEymvrsEuo7Qwf3pMHBcZAiJW', // Kwentong Pambata
 '1GJWO_4m5E50SpY1AFrQvHT1OKzSEdgaR'  // Disney Movies English & Tag Dub
]);

function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function fromB64(value){const s=atob(value);return Uint8Array.from(s,c=>c.charCodeAt(0))}
async function sessionSecret(env){
 const direct=String(env?.SESSION_SECRET||'').trim();if(direct)return direct;
 const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();
 return String(row?.value||'');
}
async function credentialKey(env){
 const source=String(env?.INTEGRATION_CREDENTIALS_KEY||await sessionSecret(env)||'').trim();
 if(!source)throw new Error('Kids media credential encryption is unavailable.');
 const digest=await crypto.subtle.digest('SHA-256',encoder.encode(`magnanimous-kids-drive-v1:${source}`));
 return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function encrypt(value,env){
 if(!value)return '';
 const iv=crypto.getRandomValues(new Uint8Array(12)),key=await credentialKey(env);
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(String(value)));
 return `enc1.${b64(iv)}.${b64(new Uint8Array(cipher))}`;
}
async function decrypt(value,env){
 if(!value)return '';
 const raw=String(value);if(!raw.startsWith('enc1.'))return raw;
 const [,ivPart,cipherPart]=raw.split('.');const key=await credentialKey(env);
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(ivPart)},key,fromB64(cipherPart));
 return new TextDecoder().decode(plain);
}
async function ensureTables(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS kids_drive_states(
  state TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,owner_user_id TEXT NOT NULL,owner_email TEXT NOT NULL,
  created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS kids_drive_auth(
  tenant_id TEXT PRIMARY KEY,google_subject TEXT NOT NULL DEFAULT '',google_email TEXT NOT NULL DEFAULT '',
  access_token TEXT NOT NULL DEFAULT '',refresh_token TEXT NOT NULL DEFAULT '',token_expires_at INTEGER,
  created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
 )`).run();
}
function redirectUri(request){return `${new URL(request.url).origin}/api/kids-drive/callback`}
async function ownerTenant(env){return env.DB.prepare("SELECT id,owner_user_id FROM tenants WHERE slug='owner' LIMIT 1").first()}
async function ownerDriveRow(env){
 const tenant=await ownerTenant(env);if(!tenant?.id)return null;
 return env.DB.prepare('SELECT * FROM kids_drive_auth WHERE tenant_id=? LIMIT 1').bind(tenant.id).first();
}
async function tokenExchange(env,request,code){
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({
  code,client_id:String(env.GOOGLE_CLIENT_ID||''),client_secret:String(env.GOOGLE_CLIENT_SECRET||''),redirect_uri:redirectUri(request),grant_type:'authorization_code'
 })});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||data.error)throw new Error(data.error_description||data.error||'Google Drive authorization failed.');
 return data;
}
async function freshDriveAuth(env,row){
 if(!row)return null;
 let access=await decrypt(row.access_token,env),refresh=await decrypt(row.refresh_token,env);
 const expiry=Number(row.token_expires_at||0);
 if(access&&(!expiry||expiry>now()+90))return{...row,access_token:access,refresh_token:refresh};
 if(!refresh)throw new Error('Google Drive authorization expired. Reconnect the owner Drive account.');
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({
  client_id:String(env.GOOGLE_CLIENT_ID||''),client_secret:String(env.GOOGLE_CLIENT_SECRET||''),refresh_token:refresh,grant_type:'refresh_token'
 })});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.access_token)throw new Error(data.error_description||data.error||'Google Drive token refresh failed.');
 access=String(data.access_token);const expiresAt=now()+Number(data.expires_in||3600);
 await env.DB.prepare('UPDATE kids_drive_auth SET access_token=?,token_expires_at=?,updated_at=? WHERE tenant_id=?').bind(await encrypt(access,env),expiresAt,now(),row.tenant_id).run();
 return{...row,access_token:access,refresh_token:refresh,token_expires_at:expiresAt};
}
async function driveMeta(access,id){
 const url=new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`);
 url.searchParams.set('fields','id,name,mimeType,parents,shortcutDetails');url.searchParams.set('supportsAllDrives','true');
 const response=await fetch(url,{headers:{Authorization:`Bearer ${access}`}});
 if(!response.ok)return null;return response.json();
}
async function isApprovedFile(access,fileId){
 const visited=new Set(),queue=[fileId];let calls=0;
 while(queue.length&&calls<64){
  const id=queue.shift();if(!id||visited.has(id))continue;visited.add(id);
  if(APPROVED_ROOTS.has(id))return true;
  const meta=await driveMeta(access,id);calls++;if(!meta)continue;
  if(meta.shortcutDetails?.targetId&&!visited.has(meta.shortcutDetails.targetId))queue.push(meta.shortcutDetails.targetId);
  for(const parent of meta.parents||[]){if(APPROVED_ROOTS.has(parent))return true;if(!visited.has(parent))queue.push(parent)}
 }
 return false;
}
function mediaCors(headers){
 headers.set('access-control-allow-origin','*');
 headers.set('access-control-expose-headers','Content-Type, Content-Length, Content-Range, Accept-Ranges');
 headers.set('cache-control','private, max-age=0, no-store');
 headers.set('accept-ranges','bytes');
 return headers;
}
async function streamDriveFile(request,env,fileId){
 if(!/^[A-Za-z0-9_-]{10,100}$/.test(fileId))return json({detail:'Invalid media id.'},400);
 const row=await ownerDriveRow(env);if(!row)return json({detail:'Owner Google Drive is not connected yet.',code:'KIDS_DRIVE_NOT_CONNECTED'},503);
 const auth=await freshDriveAuth(env,row);
 if(!(await isApprovedFile(auth.access_token,fileId)))return json({detail:'This file is outside the approved Kids media roots.'},403);
 const url=new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);url.searchParams.set('alt','media');url.searchParams.set('supportsAllDrives','true');
 const upstreamHeaders={Authorization:`Bearer ${auth.access_token}`};const range=request.headers.get('range');if(range)upstreamHeaders.Range=range;
 const upstream=await fetch(url,{method:request.method==='HEAD'?'HEAD':'GET',headers:upstreamHeaders});
 if(!upstream.ok&&upstream.status!==206){const text=await upstream.text().catch(()=> '');return json({detail:text||`Drive media request failed (${upstream.status}).`},upstream.status)}
 const headers=mediaCors(new Headers());for(const key of ['content-type','content-length','content-range','etag','last-modified']){const value=upstream.headers.get(key);if(value)headers.set(key,value)}
 return new Response(request.method==='HEAD'?null:upstream.body,{status:upstream.status,headers});
}

export async function handleKidsDriveMedia(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/kids-'))return null;
 if(!env?.DB)return json({detail:'Database binding is not configured.'},503);
 await ensureTables(env);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,HEAD,POST,OPTIONS','access-control-allow-headers':'Authorization, Content-Type, Range'}});
 if(path==='/api/kids-media/status'&&request.method==='GET'){
  const row=await ownerDriveRow(env);return json({ready:Boolean(row),source:'owner-authorized-google-drive',audience_login_required:false});
 }
 if(path==='/api/kids-drive/owner-status'&&request.method==='GET'){
  const denied=await requirePlatformOwner(request,env);if(denied)return denied;const row=await ownerDriveRow(env);
  return json({ready:Boolean(row),google_email:row?.google_email||'',connected_at:Number(row?.created_at||0),updated_at:Number(row?.updated_at||0)});
 }
 if(path==='/api/kids-drive/connect'&&request.method==='POST'){
  const denied=await requirePlatformOwner(request,env);if(denied)return denied;const user=await currentUser(request,env);if(!user)return json({detail:'Platform owner sign-in required.'},401);
  if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return json({detail:'Google OAuth is not configured on the platform.'},503);
  const state=crypto.randomUUID(),expires=now()+600;
  await env.DB.prepare('INSERT INTO kids_drive_states(state,tenant_id,owner_user_id,owner_email,created_at,expires_at) VALUES(?,?,?,?,?,?)').bind(state,user.tenant_id,user.id,String(user.email||'').toLowerCase(),now(),expires).run();
  const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');target.searchParams.set('client_id',String(env.GOOGLE_CLIENT_ID));target.searchParams.set('redirect_uri',redirectUri(request));target.searchParams.set('response_type','code');target.searchParams.set('access_type','offline');target.searchParams.set('prompt','consent');target.searchParams.set('scope',DRIVE_SCOPES.join(' '));target.searchParams.set('state',state);if(user.email)target.searchParams.set('login_hint',String(user.email));
  return json({authorization_url:target.toString(),expires_at:expires});
 }
 if(path==='/api/kids-drive/callback'&&request.method==='GET'){
  const state=String(url.searchParams.get('state')||''),code=String(url.searchParams.get('code')||'');if(!state||!code)return json({detail:'Google callback is missing state or code.'},400);
  const pending=await env.DB.prepare('SELECT * FROM kids_drive_states WHERE state=? LIMIT 1').bind(state).first();if(!pending||Number(pending.expires_at)<now())return json({detail:'Google authorization state expired or is invalid.'},400);
  const token=await tokenExchange(env,request,code);const access=String(token.access_token||''),refresh=String(token.refresh_token||'');if(!access)return json({detail:'Google did not return an access token.'},502);
  const profileResponse=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${access}`}});const profile=await profileResponse.json().catch(()=>({}));const googleEmail=String(profile.email||'').trim().toLowerCase();
  if(!googleEmail||googleEmail!==String(pending.owner_email||'').trim().toLowerCase())return json({detail:'Use the same approved Google email as the Magnanimous platform owner account.'},403);
  const ts=now(),expiresAt=ts+Number(token.expires_in||3600);
  const existing=await env.DB.prepare('SELECT refresh_token FROM kids_drive_auth WHERE tenant_id=?').bind(pending.tenant_id).first();const savedRefresh=refresh?await encrypt(refresh,env):String(existing?.refresh_token||'');
  await env.DB.prepare(`INSERT INTO kids_drive_auth(tenant_id,google_subject,google_email,access_token,refresh_token,token_expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)
   ON CONFLICT(tenant_id) DO UPDATE SET google_subject=excluded.google_subject,google_email=excluded.google_email,access_token=excluded.access_token,refresh_token=excluded.refresh_token,token_expires_at=excluded.token_expires_at,updated_at=excluded.updated_at`)
   .bind(pending.tenant_id,String(profile.sub||''),googleEmail,await encrypt(access,env),savedRefresh,expiresAt,ts,ts).run();
  await env.DB.prepare('DELETE FROM kids_drive_states WHERE state=?').bind(state).run();
  return Response.redirect(`${url.origin}/kids/setup?connected=1`,302);
 }
 const match=path.match(/^\/api\/kids-media\/stream\/([A-Za-z0-9_-]+)$/);if(match&&(request.method==='GET'||request.method==='HEAD'))return streamDriveFile(request,env,match[1]);
 return json({detail:'Kids media route not found.'},404);
}
