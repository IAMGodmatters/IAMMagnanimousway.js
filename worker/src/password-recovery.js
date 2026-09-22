import {createPasswordRecord} from './password-security.js';
import {currentUser} from './integrations.js';

const encoder=new TextEncoder();
const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const GENERIC_MESSAGE='If an account exists for that email, a password reset link will be sent shortly.';
const INVALID_TOKEN_MESSAGE='This reset link is invalid or expired. Request a new password reset link.';
const RECOVERY_CODE_COUNT=8;
const RECOVERY_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let schemaReady=false;

function normEmail(value){return String(value||'').trim().toLowerCase()}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||''))}
function b64url(bytes){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function randomToken(){return b64url(crypto.getRandomValues(new Uint8Array(32)))}
function randomRecoveryCode(){
 const bytes=crypto.getRandomValues(new Uint8Array(24));let body='';
 for(let i=0;i<bytes.length;i+=1)body+=RECOVERY_ALPHABET[bytes[i]&31];
 return 'MAG-'+body.match(/.{1,4}/g).join('-');
}
function normalizeRecoveryCode(value){return String(value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'')}
async function sha256(value){const digest=await crypto.subtle.digest('SHA-256',encoder.encode(String(value||'')));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function ttlSeconds(env){const value=Number(env?.PASSWORD_RESET_TTL_SECONDS||1200);return Number.isFinite(value)?Math.max(600,Math.min(3600,Math.floor(value))):1200}
const CANONICAL_SITE_ORIGIN='https://iammagnanimousway.com';
function isAllowedRecoveryOrigin(url){
 const host=String(url?.hostname||'').trim().toLowerCase().replace(/\.$/,'');
 if(url?.protocol==='https:'&&(host==='iammagnanimousway.com'||host==='www.iammagnanimousway.com'))return true;
 return (url?.protocol==='http:'||url?.protocol==='https:')&&(host==='localhost'||host==='127.0.0.1'||host==='[::1]');
}
function safeSiteOrigin(env,request){
 const candidates=[env?.PUBLIC_SITE_URL,request?.url];
 for(const candidate of candidates){
  try{const url=new URL(String(candidate||''));if(isAllowedRecoveryOrigin(url))return url.origin}catch{}
 }
 return CANONICAL_SITE_ORIGIN;
}
async function ensureSchema(env){
 if(schemaReady||!env?.DB)return;
 // Migration 0069 owns this schema. Runtime recovery only verifies it so a
 // password-reset request never spends D1 writes on DDL/index checks.
 await env.DB.prepare('SELECT 1 FROM password_reset_tokens LIMIT 1').first();
 await env.DB.prepare('SELECT 1 FROM account_recovery_codes LIMIT 1').first();
 await env.DB.prepare('SELECT 1 FROM user_recovery_contacts LIMIT 1').first();
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
 const text=`A password reset was requested for your I AM MAGNANIMOUS WAY™ account.\n\nReset your password: ${resetUrl}\n\nThis secure link expires in ${minutes} minutes and can be used only once. For your security, password changes happen only on iammagnanimousway.com. If you did not request this change, you can ignore this email. Do not share this link with anyone.`;
 const html=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717"><h2>I AM MAGNANIMOUS WAY™</h2><p>A password reset was requested for your account.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#9d5700;color:#fff;text-decoration:none;border-radius:7px;font-weight:700">Reset my password</a></p><p>This secure link expires in ${minutes} minutes and can be used only once.</p><p><strong>For your security, password changes happen only on iammagnanimousway.com.</strong></p><p>If you did not request this change, you can ignore this email. Do not share this link with anyone.</p></div>`;
 return{subject,text,html};
}
async function sendWithMagnanimousMail(env,to,copy,idempotencyKey){
 const mailer=env?.MAGNANIMOUS_MAIL;
 if(!mailer||typeof mailer.send!=='function')return{ok:false,code:'NO_NATIVE_MAGNANIMOUS_MAIL'};
 try{
  return await mailer.send({
   kind:'password-reset',
   to,
   subject:copy.subject,
   text:copy.text,
   html:copy.html,
   idempotencyKey,
   sensitive:true
  });
 }catch(error){
  return{ok:false,code:'MAGNANIMOUS_MAIL_ERROR',error:String(error?.message||error||'Magnanimous mail failed.')};
 }
}
async function deliverResetEmail(env,to,copy,idempotencyKey){
 const native=await sendWithMagnanimousMail(env,to,copy,idempotencyKey);
 if(native?.ok)return{ok:true,provider:String(native.provider||'magnanimous-native-mail')};
 const nativeCode=String(native?.code||'NO_NATIVE_MAGNANIMOUS_MAIL');
 return{
  ok:false,
  code:['NO_NATIVE_MAGNANIMOUS_MAIL','MAGNANIMOUS_MAIL_NOT_CONFIGURED'].includes(nativeCode)?'NO_MAIL_TRANSPORT':'PASSWORD_RESET_DELIVERY_FAILED',
  error:`native=${nativeCode}: ${String(native?.error||'unavailable')}`
 };
}

async function activeSessionUser(request,env){try{return await currentUser(request,env)}catch{return null}}
function sameUser(left,right){return Boolean(left&&right&&String(left.id||'')===String(right.id||'')&&String(left.tenant_id||'')===String(right.tenant_id||''))}
async function issueNativeReset(env,user,source){
 const token=randomToken(),tokenHash=await sha256(token),t=now(),ttl=ttlSeconds(env),expires=t+ttl;
 await env.DB.prepare(`INSERT INTO password_reset_tokens(token_hash,user_id,tenant_id,created_at,expires_at,used_at,delivery_provider,delivery_status)
  VALUES(?,?,?,?,?,NULL,'magnanimous-native','ready')`).bind(tokenHash,user.id,user.tenant_id,t,expires).run();
 await env.DB.prepare('UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND token_hash<>? AND used_at IS NULL').bind(t,user.id,tokenHash).run();
 await logAuth(env,user,`password_reset_native_${String(source||'recovery').slice(0,40)}`,1,user.email);
 return{ok:true,reset_token:token,expires_in_seconds:ttl,recovery_method:String(source||'magnanimous-native'),detail:'Identity verified by Magnanimous. Create your new password now.'};
}

async function requestReset(request,env){
 if(!env?.DB)return json({detail:'Password recovery is temporarily unavailable.',code:'PASSWORD_RECOVERY_UNAVAILABLE'},503);
 const body=await request.json().catch(()=>({})),email=normEmail(body.email),recoveryCode=normalizeRecoveryCode(body.recovery_code);
 if(!email||!validEmail(email))return json({ok:true,detail:GENERIC_MESSAGE});
 await ensureSchema(env);await cleanup(env);
 let user=await env.DB.prepare('SELECT id,tenant_id,email,role,active FROM users WHERE lower(email)=? AND active=1 ORDER BY created_at ASC LIMIT 1').bind(email).first();
 let deliveryEmail=email,recoveryEmailMatch=false;
 if(!user){
  try{
   user=await env.DB.prepare(`SELECT u.id,u.tenant_id,u.email,u.role,u.active
     FROM user_recovery_contacts r JOIN users u ON u.id=r.user_id AND u.tenant_id=r.tenant_id
     WHERE lower(r.recovery_email)=? AND r.recovery_email_verified_at>0 AND u.active=1
     ORDER BY r.updated_at DESC LIMIT 1`).bind(email).first();
   recoveryEmailMatch=Boolean(user);
  }catch{}
 }
 if(!user){await logAuth(env,null,'password_reset_requested',1,email);return json({ok:true,detail:GENERIC_MESSAGE,recovery_methods:['magnanimous-native-mail','trusted-session','recovery-code','verified-recovery-email']})}

 const sessionUser=await activeSessionUser(request,env);
 if(sameUser(sessionUser,user)){
  const issued=await issueNativeReset(env,user,'trusted-session');
  return json({...issued,login_path:String(user.role||'').toLowerCase()==='owner'?'/owner-login':'/login'});
 }
 if(recoveryCode){
  if(!/^MAG[A-Z0-9]{24}$/.test(recoveryCode))return json({detail:'That Magnanimous recovery code is invalid or already used.',code:'RECOVERY_CODE_INVALID'},400);
  const codeHash=await sha256(recoveryCode);
  const codeRow=await env.DB.prepare('SELECT id FROM account_recovery_codes WHERE user_id=? AND tenant_id=? AND code_hash=? AND used_at IS NULL LIMIT 1').bind(user.id,user.tenant_id,codeHash).first();
  if(!codeRow){await logAuth(env,user,'password_recovery_code_failed',0,email);return json({detail:'That Magnanimous recovery code is invalid or already used.',code:'RECOVERY_CODE_INVALID'},400)}
  const claimed=await env.DB.prepare('UPDATE account_recovery_codes SET used_at=? WHERE id=? AND used_at IS NULL').bind(now(),codeRow.id).run();
  if(Number(claimed?.meta?.changes||0)!==1)return json({detail:'That Magnanimous recovery code is invalid or already used.',code:'RECOVERY_CODE_INVALID'},400);
  const issued=await issueNativeReset(env,user,'recovery-code');
  return json({...issued,login_path:String(user.role||'').toLowerCase()==='owner'?'/owner-login':'/login'});
 }
 const token=randomToken(),tokenHash=await sha256(token),t=now(),ttl=ttlSeconds(env),expires=t+ttl;
 // Do not invalidate an older delivered reset link until the replacement email
 // is actually accepted by a mail transport. A failed resend must not strand
 // the user with no working recovery link.
 await env.DB.prepare(`INSERT INTO password_reset_tokens(token_hash,user_id,tenant_id,created_at,expires_at,used_at,delivery_provider,delivery_status)
  VALUES(?,?,?,?,?,NULL,'','pending')`).bind(tokenHash,user.id,user.tenant_id,t,expires).run();
 const resetUrl=new URL('/forgot-password',safeSiteOrigin(env,request));resetUrl.searchParams.set('reset',token);resetUrl.searchParams.set('portal',String(user.role||'').toLowerCase()==='owner'?'owner':'customer');
 const copy=mailCopy(resetUrl.toString(),Math.ceil(ttl/60));
 const delivery=await deliverResetEmail(env,deliveryEmail,copy,`password-reset-${tokenHash.slice(0,32)}`);
 if(delivery.ok){
  await env.DB.prepare("UPDATE password_reset_tokens SET delivery_provider=?,delivery_status='sent' WHERE token_hash=?").bind(String(delivery.provider||'mail'),tokenHash).run();
  await env.DB.prepare('UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND token_hash<>? AND used_at IS NULL').bind(now(),user.id,tokenHash).run();
  await logAuth(env,user,recoveryEmailMatch?'password_reset_requested_recovery_email':'password_reset_requested',1,deliveryEmail);
  console.info('password reset delivery sent',{provider:String(delivery.provider||'mail'),user_id:user.id,recovery_email:recoveryEmailMatch});
 }else{
  await env.DB.prepare("UPDATE password_reset_tokens SET used_at=?,delivery_provider='',delivery_status='failed' WHERE token_hash=?").bind(now(),tokenHash).run();
  await logAuth(env,user,'password_reset_delivery_failed',0,deliveryEmail);
  console.error('password reset delivery failed',{code:delivery.code,error:delivery.error,user_id:user.id});
 }
 return json({ok:true,detail:GENERIC_MESSAGE,recovery_methods:['magnanimous-native-mail','trusted-session','recovery-code','verified-recovery-email']});
}

async function recoveryCodeStatus(request,env){
 if(!env?.DB)return json({detail:'Account recovery is temporarily unavailable.'},503);
 await ensureSchema(env);const user=await activeSessionUser(request,env);
 if(!user)return json({detail:'Sign in to manage Magnanimous recovery codes.',code:'AUTH_REQUIRED'},401);
 const row=await env.DB.prepare('SELECT COUNT(*) AS active_count,MAX(created_at) AS last_created_at FROM account_recovery_codes WHERE user_id=? AND tenant_id=? AND used_at IS NULL').bind(user.id,user.tenant_id).first();
 return json({ok:true,active_count:Number(row?.active_count||0),last_created_at:Number(row?.last_created_at||0)});
}
async function rotateRecoveryCodes(request,env){
 if(!env?.DB)return json({detail:'Account recovery is temporarily unavailable.'},503);
 await ensureSchema(env);const user=await activeSessionUser(request,env);
 if(!user)return json({detail:'Sign in to create Magnanimous recovery codes.',code:'AUTH_REQUIRED'},401);
 const t=now(),codes=Array.from({length:RECOVERY_CODE_COUNT},()=>randomRecoveryCode());
 const hashes=await Promise.all(codes.map(code=>sha256(normalizeRecoveryCode(code))));
 await env.DB.prepare('UPDATE account_recovery_codes SET used_at=? WHERE user_id=? AND tenant_id=? AND used_at IS NULL').bind(t,user.id,user.tenant_id).run();
 for(let i=0;i<hashes.length;i+=1)await env.DB.prepare('INSERT INTO account_recovery_codes(user_id,tenant_id,code_hash,created_at,used_at) VALUES(?,?,?,?,NULL)').bind(user.id,user.tenant_id,hashes[i],t).run();
 await logAuth(env,user,'password_recovery_codes_rotated',1,user.email);
 return json({ok:true,codes,count:codes.length,detail:'New Magnanimous recovery codes created. Each code works once. Save them somewhere private; only their hashes are stored.'});
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
 if(request.method==='GET'&&url.pathname==='/api/auth/recovery-codes')return recoveryCodeStatus(request,env);
 if(request.method==='POST'&&url.pathname==='/api/auth/recovery-codes')return rotateRecoveryCodes(request,env);
 return null;
}
