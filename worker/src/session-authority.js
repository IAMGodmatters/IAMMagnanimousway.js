const encoder=new TextEncoder();
const now=()=>Math.floor(Date.now()/1000);
const OPAQUE_PREFIX='ms1_';
const SESSION_TTL_SECONDS=12*60*60;
let schemaReady=false;

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

function bearer(request){
  const raw=String(request?.headers?.get?.('authorization')||'').trim();
  return raw.startsWith('Bearer ')?raw.slice(7).trim():'';
}
function isOpaqueToken(token){return String(token||'').startsWith(OPAQUE_PREFIX)}
function validOpaqueToken(token){return /^ms1_[A-Za-z0-9_-]{40,128}$/.test(String(token||''))}
function b64url(bytes){
  let binary='';
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function randomOpaqueToken(){
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  return `${OPAQUE_PREFIX}${b64url(bytes)}`;
}
async function sha256(value){
  const digest=await crypto.subtle.digest('SHA-256',encoder.encode(String(value||'')));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function hmacHex(secret,value){
  const key=await crypto.subtle.importKey('raw',encoder.encode(String(secret||'')),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature=await crypto.subtle.sign('HMAC',key,encoder.encode(String(value||'')));
  return [...new Uint8Array(signature)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function safeEqual(left,right){
  const [a,b]=await Promise.all([sha256(left),sha256(right)]);
  let diff=0;
  for(let i=0;i<a.length;i+=1)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
async function sessionSecret(env){
  const configured=String(env?.SESSION_SECRET||'').trim();
  if(configured)return configured;
  if(!env?.DB)return'';
  try{
    const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();
    return String(row?.value||'').trim();
  }catch{return''}
}
async function ensureSchema(env){
  if(schemaReady||!env?.DB)return;
  // Migration 0057 owns the opaque session schema. Runtime auth only verifies it.
  await env.DB.prepare('SELECT 1 FROM auth_sessions LIMIT 1').first();
  schemaReady=true;
}
async function opaqueSchemaAvailable(env,context='session'){
  try{
    await ensureSchema(env);
    return true;
  }catch(error){
    console.warn('opaque session authority unavailable; keeping the signed-session recovery rail active',{
      context,
      error:String(error?.message||error||'unknown error').slice(0,240)
    });
    return false;
  }
}
function parseLegacyToken(token){
  const parts=String(token||'').split('|');
  if(parts.length!==5)return null;
  const [user_id,tenant_id,role,exp,sig]=parts,expires_at=Number(exp||0);
  if(!user_id||!tenant_id||!role||!sig||!Number.isFinite(expires_at)||expires_at<=now())return null;
  return{user_id,tenant_id,role,expires_at,sig,payload:`${user_id}|${tenant_id}|${role}|${exp}`};
}
async function verifiedLegacyParts(token,env){
  const parts=parseLegacyToken(token);if(!parts)return null;
  const secret=await sessionSecret(env);if(!secret)return null;
  const expected=await hmacHex(secret,parts.payload);
  return await safeEqual(parts.sig,expected)?parts:null;
}
async function compatibilityToken(row,env){
  const secret=await sessionSecret(env);if(!secret)return'';
  // Internal-only compatibility token. Keep it deliberately short-lived so the
  // old signed-token shape never becomes a second long-lived browser session.
  const compatExpiry=Math.min(Number(row.expires_at||0),now()+60);
  const payload=`${row.user_id}|${row.tenant_id}|${row.role}|${compatExpiry}`;
  return `${payload}|${await hmacHex(secret,payload)}`;
}
async function cleanupSessions(env,t=now()){
  try{
    await env.DB.prepare('DELETE FROM auth_sessions WHERE expires_at<=? OR (revoked_at IS NOT NULL AND revoked_at<=?)').bind(t,t-604800).run();
  }catch(_){}
}

export function requestUsesOpaqueSession(request){return isOpaqueToken(bearer(request))}

export async function resolveSessionRequest(request,env,requestId=''){
  const token=bearer(request);
  if(!isOpaqueToken(token))return{request,opaque:false};
  if(!env?.DB||!validOpaqueToken(token))return{request,opaque:true,response:json({detail:'Not authenticated.',code:'AUTH_REQUIRED'},401)};
  if(!await opaqueSchemaAvailable(env,'resolve')){
    return{request,opaque:true,response:json({detail:'Secure session storage is temporarily unavailable. Sign in again to continue.',code:'SESSION_RENEWAL_REQUIRED'},503)};
  }
  const hash=await sha256(token),t=now();
  const row=await env.DB.prepare(`SELECT s.user_id,s.tenant_id,s.role,s.created_at,s.expires_at,s.revoked_at,u.role AS current_role,u.active
    FROM auth_sessions s JOIN users u ON u.id=s.user_id AND u.tenant_id=s.tenant_id
    WHERE s.token_hash=? LIMIT 1`).bind(hash).first();
  const createdAt=Number(row?.created_at||0),serverExpiry=Number(row?.expires_at||0),cappedExpiry=createdAt>0?Math.min(serverExpiry,createdAt+SESSION_TTL_SECONDS):serverExpiry;
  if(!row||Number(row.active||0)!==1||cappedExpiry<=t||row.revoked_at!=null){
    if(row&&cappedExpiry<=t)try{await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(hash).run()}catch(_){}
    return{request,opaque:true,response:json({detail:'This session is no longer active. Sign in again to continue.',code:'SESSION_EXPIRED'},401)};
  }
  if(serverExpiry!==cappedExpiry)try{await env.DB.prepare('UPDATE auth_sessions SET expires_at=? WHERE token_hash=?').bind(cappedExpiry,hash).run()}catch(_){}
  if(String(row.current_role||'')!==String(row.role||'')){
    try{await env.DB.prepare("UPDATE auth_sessions SET revoked_at=?,revoke_reason='role_changed' WHERE token_hash=? AND revoked_at IS NULL").bind(t,hash).run()}catch(_){}
    return{request,opaque:true,response:json({detail:'Your access changed. Sign in again to continue.',code:'SESSION_RENEWAL_REQUIRED'},401)};
  }
  const normalizedRow={...row,expires_at:cappedExpiry};
  const compat=await compatibilityToken(normalizedRow,env);
  if(!compat)return{request,opaque:true,response:json({detail:'Authentication is temporarily unavailable.',code:'SECURE_SESSION_REQUIRED'},503)};
  const headers=new Headers(request.headers);
  headers.set('authorization',`Bearer ${compat}`);
  if(requestId)headers.set('x-request-id',requestId);
  return{request:new Request(request.clone(),{headers}),opaque:true,session:{token_hash:hash,user_id:row.user_id,tenant_id:row.tenant_id,role:row.role,expires_at:cappedExpiry}};
}

export async function revokeOpaqueSession(request,env,reason='logout'){
  const token=bearer(request);
  if(!isOpaqueToken(token))return{handled:false};
  if(!env?.DB||!validOpaqueToken(token))return{handled:true,response:json({detail:'Not authenticated.',code:'AUTH_REQUIRED'},401)};
  if(!await opaqueSchemaAvailable(env,'revoke')){
    return{handled:true,response:json({detail:'Secure session storage is temporarily unavailable. Sign in again to continue.',code:'SESSION_RENEWAL_REQUIRED'},503)};
  }
  const hash=await sha256(token),t=now();
  const result=await env.DB.prepare('UPDATE auth_sessions SET revoked_at=?,revoke_reason=? WHERE token_hash=? AND revoked_at IS NULL AND expires_at>?')
    .bind(t,String(reason||'logout').slice(0,80),hash,t).run();
  const changed=Number(result?.meta?.changes||0)>0;
  await cleanupSessions(env,t);
  return{handled:true,response:changed?json({ok:true,revoked:true}):json({detail:'This session is already inactive.',code:'SESSION_INACTIVE'},401)};
}

export async function upgradeAuthResponseToOpaque(request,response,env){
  if(!env?.DB||request.method!=='POST'||!response?.ok)return response;
  const path=new URL(request.url).pathname;
  if(!['/api/auth/signup','/api/auth/login','/api/auth/totp/login','/api/admin/login','/api/admin/email-code/verify'].includes(path))return response;
  if(!String(response.headers.get('content-type')||'').toLowerCase().includes('application/json'))return response;
  const data=await response.clone().json().catch(()=>null);
  const legacyToken=String(data?.token||'');
  if(!legacyToken||isOpaqueToken(legacyToken)||!data?.user)return response;
  const parts=await verifiedLegacyParts(legacyToken,env);
  if(!parts||String(data.user.id||'')!==parts.user_id||String(data.user.tenant_id||'')!==parts.tenant_id)return response;

  // The legacy token proves the authentication event and identity. D1 remains
  // authoritative for the role because signup triggers may promote the creator
  // to workspace owner before this outer session layer runs. Starting the opaque
  // session from that effective role prevents a brand-new session from being
  // immediately revoked while preserving later role-change revocation.
  const current=await env.DB.prepare('SELECT role,tenant_id,active FROM users WHERE id=? AND tenant_id=? LIMIT 1')
    .bind(parts.user_id,parts.tenant_id).first();
  if(!current||Number(current.active||0)!==1)return response;
  const effectiveRole=String(current.role||parts.role||'member');
  const effectiveTenant=String(current.tenant_id||parts.tenant_id);
  if(effectiveTenant!==parts.tenant_id)return response;

  if(!await opaqueSchemaAvailable(env,'upgrade'))return response;
  const token=randomOpaqueToken(),hash=await sha256(token),t=now();
  try{
    await env.DB.prepare(`INSERT INTO auth_sessions(token_hash,user_id,tenant_id,role,created_at,expires_at,revoked_at,revoke_reason)
      VALUES(?,?,?,?,?,?,NULL,'')`).bind(hash,parts.user_id,effectiveTenant,effectiveRole,t,parts.expires_at).run();
    await cleanupSessions(env,t);
  }catch(error){
    console.warn('opaque session persistence unavailable; returning the authenticated signed-session fallback',{
      path,
      error:String(error?.message||error||'unknown error').slice(0,240)
    });
    return response;
  }
  const headers=new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-store');headers.set('content-type','application/json; charset=utf-8');
  return new Response(JSON.stringify({...data,user:{...data.user,tenant_id:effectiveTenant,role:effectiveRole,active:Number(current.active)},token,session_expires_at:parts.expires_at}),{status:response.status,statusText:response.statusText,headers});
}
