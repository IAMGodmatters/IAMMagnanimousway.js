import {createPasswordRecord} from './password-security.js';
import {getProviderRuntimeEnv} from './provider-runtime-env.js';
import {sendGrowthEmail} from './growth-email-transport.js';

const encoder=new TextEncoder();
const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const GENERIC_MESSAGE='If an account exists for that email, a password reset link will be sent shortly.';
const INVALID_TOKEN_MESSAGE='This reset link is invalid or expired. Request a new password reset link.';
let schemaReady=false;

function normEmail(value){return String(value||'').trim().toLowerCase()}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||''))}
function b64url(bytes){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function randomToken(){return b64url(crypto.getRandomValues(new Uint8Array(32)))}
async function sha256(value){const digest=await crypto.subtle.digest('SHA-256',encoder.encode(String(value||'')));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function ttlSeconds(env){const value=Number(env?.PASSWORD_RESET_TTL_SECONDS||1200);return Number.isFinite(value)?Math.max(600,Math.min(3600,Math.floor(value))):1200}
function safeSiteOrigin(env,request){
 const candidates=[env?.PUBLIC_SITE_URL,request?.url,'https://iammagnanimousway.com'];
 for(const candidate of candidates){
  try{const url=new URL(String(candidate||''));if(url.protocol==='https:'||url.hostname==='localhost')return url.origin}catch{}
 }
 return'https://iammagnanimousway.com';
}
function normalizeBase(value){
 const raw=String(value||'https://inkbox.ai/api/v1').trim();
 try{const url=new URL(raw);if(url.protocol!=='https:')return'https://inkbox.ai/api/v1';return`${url.origin}${url.pathname.replace(/\/$/,'')}`}catch{return'https://inkbox.ai/api/v1'}
}
async function ensureSchema(env){
 if(schemaReady||!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS password_reset_tokens(
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  delivery_provider TEXT NOT NULL DEFAULT '',
  delivery_status TEXT NOT NULL DEFAULT 'pending'
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_password_reset_user_expiry ON password_reset_tokens(user_id,expires_at)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_password_reset_expiry ON password_reset_tokens(expires_at)').run();
 schemaReady=true;
}
async function cleanup(env,t=now()){
 try{await env.DB.prepare('DELETE FROM password_reset_tokens WHERE expires_at<? OR (used_at IS NOT NULL AND used_at<?)').bind(t-86400,t-604800).run()}catch{}
}
async function logAuth(env,user,event,success,email=''){
 try{await env.DB.prepare('INSERT INTO auth_events(user_id,tenant_id,email,event,success,created_at) VALUES(?,?,?,?,?,?)').bind(user?.id||null,user?.tenant_id||null,email||user?.email||'',event,success?1:0,now()).run()}catch{}
}
function mailCopy(resetUrl,minutes){
 const subject='Reset your I AM Magnanimous Way password';
 const text=`A password reset was requested for your I AM MAGNANIMOUS WAY™ account.\n\nReset your password: ${resetUrl}\n\nThis secure link expires in ${minutes} minutes and can be used only once. If you did not request this change, you can ignore this email. Do not share this link with anyone.`;
 const html=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717"><h2>I AM MAGNANIMOUS WAY™</h2><p>A password reset was requested for your account.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#9d5700;color:#fff;text-decoration:none;border-radius:7px;font-weight:700">Reset my password</a></p><p>This secure link expires in ${minutes} minutes and can be used only once.</p><p>If you did not request this change, you can ignore this email. Do not share this link with anyone.</p></div>`;
 return{subject,text,html};
}
async function ownerMailConnection(env){
 if(!env?.DB)return null;
 try{
  const tenant=await env.DB.prepare("SELECT id FROM tenants WHERE slug='owner' LIMIT 1").first();
  if(!tenant?.id)return null;
  const connection=await env.DB.prepare("SELECT external_account_id FROM integrations WHERE tenant_id=? AND provider IN ('google','outlook') ORDER BY updated_at DESC LIMIT 1").bind(tenant.id).first();
  return connection?{tenant_id:String(tenant.id)}:null;
 }catch{return null}
}
async function sendWithPlatformMailbox(env,to,copy){
 const connection=await ownerMailConnection(env);if(!connection)return{ok:false,code:'NO_PLATFORM_MAILBOX'};
 try{return await sendGrowthEmail(env,{scopeTenantId:connection.tenant_id,to,subject:copy.subject,text:copy.text,senderName:'I AM Magnanimous Way'})}
 catch(error){return{ok:false,code:'PLATFORM_MAIL_ERROR',error:String(error?.message||error||'Platform mail failed.')}}
}
async function sendWithCommunications(env,to,copy,idempotencyKey){
 let runtime;try{runtime=await getProviderRuntimeEnv(env)}catch{runtime=env}
 const apiKey=String(runtime?.INKBOX_API_KEY||'').trim(),mailbox=String(runtime?.INKBOX_EMAIL_ADDRESS||'iam@inkboxmail.com').trim();
 if(!apiKey||!mailbox)return{ok:false,code:'NO_COMMUNICATION_MAILBOX'};
 const base=normalizeBase(runtime?.INKBOX_BASE_URL),root=`${base}/mail/mailboxes/${encodeURIComponent(mailbox)}/drafts`;
 const headers={'X-API-Key':apiKey,'Accept':'application/json','Content-Type':'application/json','Idempotency-Key':String(idempotencyKey).slice(0,180)};
 try{
  const created=await fetch(root,{method:'POST',headers,body:JSON.stringify({recipients:{to:[to]},subject:copy.subject,body_text:copy.text,body_html:copy.html,track_opens:false})});
  const draft=await created.json().catch(()=>({}));
  if(!created.ok||!draft?.id)return{ok:false,code:'COMMUNICATION_DRAFT_FAILED',error:String(draft?.detail||draft?.error||`Draft creation failed (${created.status}).`)};
  const sent=await fetch(`${root}/${encodeURIComponent(String(draft.id))}/send`,{method:'POST',headers:{'X-API-Key':apiKey,'Accept':'application/json','Content-Type':'application/json','Idempotency-Key':`${String(idempotencyKey).slice(0,150)}-send`},body:JSON.stringify({generation:Number(draft.generation||1)})});
  const receipt=await sent.json().catch(()=>({}));
  if(!sent.ok)return{ok:false,code:'COMMUNICATION_SEND_FAILED',error:String(receipt?.detail||receipt?.error||`Email send failed (${sent.status}).`)};
  return{ok:true,provider:'communications'};
 }catch(error){return{ok:false,code:'COMMUNICATION_TRANSPORT_ERROR',error:String(error?.message||error||'Communication transport failed.')}}
}
async function deliverResetEmail(env,to,copy,idempotencyKey){
 const platform=await sendWithPlatformMailbox(env,to,copy);if(platform?.ok)return{ok:true,provider:'platform-mail'};
 const communications=await sendWithCommunications(env,to,copy,idempotencyKey);if(communications?.ok)return communications;
 return{ok:false,code:communications?.code||platform?.code||'NO_MAIL_TRANSPORT',error:communications?.error||platform?.error||'No password recovery mail transport is configured.'};
}

async function requestReset(request,env){
 if(!env?.DB)return json({detail:'Password recovery is temporarily unavailable.',code:'PASSWORD_RECOVERY_UNAVAILABLE'},503);
 const body=await request.json().catch(()=>({})),email=normEmail(body.email);
 if(!email||!validEmail(email))return json({ok:true,detail:GENERIC_MESSAGE});
 await ensureSchema(env);await cleanup(env);
 const user=await env.DB.prepare('SELECT id,tenant_id,email,role,active FROM users WHERE lower(email)=? AND active=1 ORDER BY created_at ASC LIMIT 1').bind(email).first();
 if(!user){await logAuth(env,null,'password_reset_requested',1,email);return json({ok:true,detail:GENERIC_MESSAGE})}
 const token=randomToken(),tokenHash=await sha256(token),t=now(),ttl=ttlSeconds(env),expires=t+ttl;
 await env.DB.prepare('UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL').bind(t,user.id).run();
 await env.DB.prepare(`INSERT INTO password_reset_tokens(token_hash,user_id,tenant_id,created_at,expires_at,used_at,delivery_provider,delivery_status)
  VALUES(?,?,?,?,?,NULL,'','pending')`).bind(tokenHash,user.id,user.tenant_id,t,expires).run();
 const resetUrl=new URL('/login',safeSiteOrigin(env,request));resetUrl.searchParams.set('reset',token);
 const copy=mailCopy(resetUrl.toString(),Math.ceil(ttl/60));
 const delivery=await deliverResetEmail(env,email,copy,`password-reset-${tokenHash.slice(0,32)}`);
 if(delivery.ok){
  await env.DB.prepare("UPDATE password_reset_tokens SET delivery_provider=?,delivery_status='sent' WHERE token_hash=?").bind(String(delivery.provider||'mail'),tokenHash).run();
  await logAuth(env,user,'password_reset_requested',1,email);
 }else{
  await env.DB.prepare("UPDATE password_reset_tokens SET used_at=?,delivery_provider='',delivery_status='failed' WHERE token_hash=?").bind(now(),tokenHash).run();
  await logAuth(env,user,'password_reset_delivery_failed',0,email);
  console.error('password reset delivery failed',{code:delivery.code,error:delivery.error,user_id:user.id});
 }
 return json({ok:true,detail:GENERIC_MESSAGE});
}

async function completeReset(request,env){
 if(!env?.DB)return json({detail:'Password recovery is temporarily unavailable.',code:'PASSWORD_RECOVERY_UNAVAILABLE'},503);
 const body=await request.json().catch(()=>({})),token=String(body.token||'').trim(),password=String(body.password||'');
 if(!/^[A-Za-z0-9_-]{40,160}$/.test(token))return json({detail:INVALID_TOKEN_MESSAGE,code:'PASSWORD_RESET_INVALID'},400);
 if(password.length<10)return json({detail:'Choose a new password with at least 10 characters.',code:'PASSWORD_TOO_SHORT'},400);
 await ensureSchema(env);await cleanup(env);
 const tokenHash=await sha256(token),t=now();
 const row=await env.DB.prepare(`SELECT r.token_hash,r.user_id,r.tenant_id,r.expires_at,r.used_at,u.email,u.role,u.active
  FROM password_reset_tokens r JOIN users u ON u.id=r.user_id AND u.tenant_id=r.tenant_id
  WHERE r.token_hash=? LIMIT 1`).bind(tokenHash).first();
 if(!row||Number(row.active||0)!==1||row.used_at!=null||Number(row.expires_at||0)<=t)return json({detail:INVALID_TOKEN_MESSAGE,code:'PASSWORD_RESET_INVALID'},400);
 let record;try{record=await createPasswordRecord(password,env)}catch(error){return json({detail:error?.message||'Choose a different password.',code:'PASSWORD_INVALID'},400)}
 const claimed=await env.DB.prepare('UPDATE password_reset_tokens SET used_at=? WHERE token_hash=? AND used_at IS NULL AND expires_at>?').bind(t,tokenHash,t).run();
 if(Number(claimed?.meta?.changes||0)!==1)return json({detail:INVALID_TOKEN_MESSAGE,code:'PASSWORD_RESET_INVALID'},400);
 const changed=await env.DB.prepare('UPDATE users SET password_hash=?,password_salt=? WHERE id=? AND tenant_id=? AND active=1').bind(record.password_hash,record.password_salt,row.user_id,row.tenant_id).run();
 if(Number(changed?.meta?.changes||0)!==1)return json({detail:'Your password could not be changed safely. Request a new reset link.',code:'PASSWORD_RESET_FAILED'},409);
 await env.DB.prepare('UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL').bind(t,row.user_id).run();
 try{await env.DB.prepare("UPDATE auth_sessions SET revoked_at=?,revoke_reason='password_reset' WHERE user_id=? AND revoked_at IS NULL AND expires_at>?").bind(t,row.user_id,t).run()}catch{}
 await logAuth(env,{id:row.user_id,tenant_id:row.tenant_id,email:row.email},'password_reset_completed',1,row.email);
 return json({ok:true,detail:'Your password has been reset. You can sign in now.',login_path:String(row.role||'').toLowerCase()==='owner'?'/owner-login':'/login'});
}

export async function handlePasswordRecovery(request,env){
 const url=new URL(request.url);
 if(request.method==='POST'&&url.pathname==='/api/auth/forgot-password')return requestReset(request,env);
 if(request.method==='POST'&&url.pathname==='/api/auth/reset-password')return completeReset(request,env);
 return null;
}
