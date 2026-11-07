const encoder=new TextEncoder();
const SLUG=/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/;
const denied=()=>new Response(null,{status:401,headers:{'cache-control':'no-store'}});
async function mediaSecret(env){
 const configured=String(env.SESSION_SECRET||'').trim();
 if(configured)return configured;
 const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first().catch(()=>null);
 return String(row?.value||'').trim();
}
function decode64url(value){
 const normalized=String(value||'').replace(/-/g,'+').replace(/_/g,'/');
 const padded=normalized+'='.repeat((4-normalized.length%4)%4);
 const binary=atob(padded);
 return Uint8Array.from(binary,ch=>ch.charCodeAt(0));
}
async function verifyMediaToken(token,secret){
 const parts=String(token||'').split('.');
 if(parts.length!==2||!secret||secret.length<32)return null;
 try{
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret+'|magnanimous-tv-media-v1'),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('HMAC',key,decode64url(parts[1]),encoder.encode(parts[0]));
  if(!valid)return null;
  const payload=JSON.parse(new TextDecoder().decode(decode64url(parts[0])));
  if(!payload||payload.v!==1||!Number.isFinite(payload.exp)||payload.exp<=Math.floor(Date.now()/1000))return null;
  return payload;
 }catch{return null}
}
export async function handleMagnanimousTvMediaAuth(request,env){
 const url=new URL(request.url);
 if(url.pathname!=='/api/tv/media/auth')return null;
 if(request.method!=='POST')return new Response(null,{status:405,headers:{allow:'POST','cache-control':'no-store'}});
 if(!env?.DB)return denied();
 const body=await request.json().catch(()=>null);
 if(!body)return denied();
 const action=String(body.action||''),path=String(body.path||'').trim().toLowerCase(),protocol=String(body.protocol||'').toLowerCase();
 if(!SLUG.test(path))return denied();
 if(action==='publish'){
  if(protocol!=='webrtc')return denied();
  const secret=await mediaSecret(env),payload=await verifyMediaToken(body.token,secret);
  if(!payload||payload.action!=='publish'||payload.path!==path||!payload.station||!payload.tenant||!payload.sub)return denied();
  const station=await env.DB.prepare('SELECT id FROM magnanimous_tv_stations WHERE id=? AND tenant_id=? AND user_id=? AND slug=?').bind(String(payload.station),String(payload.tenant),String(payload.sub),path).first();
  return station?new Response(null,{status:200,headers:{'cache-control':'no-store'}}):denied();
 }
 if(action==='read'||action==='playback'){
  if(!['webrtc','hls'].includes(protocol))return denied();
  const station=await env.DB.prepare("SELECT id FROM magnanimous_tv_stations WHERE slug=? AND visibility IN ('public','unlisted')").bind(path).first();
  return station?new Response(null,{status:200,headers:{'cache-control':'no-store'}}):denied();
 }
 return denied();
}
