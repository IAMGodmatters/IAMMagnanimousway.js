const encoder=new TextEncoder();
const now=()=>Math.floor(Date.now()/1000);
let schemaReady=false;

function bearerToken(request){
  const raw=String(request?.headers?.get?.('authorization')||'').trim();
  return raw.startsWith('Bearer ')?raw.slice(7).trim():'';
}
function tokenParts(token){
  const parts=String(token||'').split('|');
  if(parts.length!==5)return null;
  const expiresAt=Number(parts[3]||0);
  if(!Number.isFinite(expiresAt)||expiresAt<=0)return null;
  return{user_id:String(parts[0]||''),tenant_id:String(parts[1]||''),role:String(parts[2]||''),expires_at:expiresAt};
}
async function sha256(value){
  const digest=await crypto.subtle.digest('SHA-256',encoder.encode(String(value||'')));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function ensureSessionRevocationSchema(env){
  if(schemaReady||!env?.DB)return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS auth_revoked_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    tenant_id TEXT NOT NULL DEFAULT '',
    expires_at INTEGER NOT NULL,
    revoked_at INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT 'logout'
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_auth_revoked_sessions_expiry ON auth_revoked_sessions(expires_at)').run();
  schemaReady=true;
}
export async function revokeRequestSession(request,env,reason='logout'){
  if(!env?.DB)return{revoked:false,reason:'database_unavailable'};
  const token=bearerToken(request),parts=tokenParts(token);
  if(!token||!parts)return{revoked:false,reason:'missing_or_unrecognized_token'};
  await ensureSessionRevocationSchema(env);
  const t=now(),hash=await sha256(token);
  await env.DB.prepare(`INSERT INTO auth_revoked_sessions(token_hash,user_id,tenant_id,expires_at,revoked_at,reason)
    VALUES(?,?,?,?,?,?) ON CONFLICT(token_hash) DO UPDATE SET expires_at=excluded.expires_at,revoked_at=excluded.revoked_at,reason=excluded.reason`)
    .bind(hash,parts.user_id,parts.tenant_id,parts.expires_at,t,String(reason||'logout').slice(0,80)).run();
  try{await env.DB.prepare('DELETE FROM auth_revoked_sessions WHERE expires_at<=?').bind(t).run()}catch(_){}
  return{revoked:true,expires_at:parts.expires_at};
}
export async function isRequestSessionRevoked(request,env){
  if(!env?.DB)return false;
  const token=bearerToken(request);
  if(!token)return false;
  await ensureSessionRevocationSchema(env);
  const hash=await sha256(token),row=await env.DB.prepare('SELECT expires_at FROM auth_revoked_sessions WHERE token_hash=? LIMIT 1').bind(hash).first();
  if(!row)return false;
  const expiresAt=Number(row.expires_at||0);
  if(expiresAt<=now()){
    try{await env.DB.prepare('DELETE FROM auth_revoked_sessions WHERE token_hash=?').bind(hash).run()}catch(_){}
    return false;
  }
  return true;
}
export function requestBearerToken(request){return bearerToken(request)}
