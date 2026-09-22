import {currentUser} from './integrations.js';

const encoder=new TextEncoder();
const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());
const normEmail=value=>String(value||'').trim().toLowerCase();

function b64url(bytes){
 let binary='';
 for(const byte of bytes)binary+=String.fromCharCode(byte);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function randomToken(){return 'rc1_'+b64url(crypto.getRandomValues(new Uint8Array(32)))}
function randomEightDigitCode(){
 const max=0x100000000-(0x100000000%100000000);
 const data=new Uint32Array(1);
 do{crypto.getRandomValues(data)}while(data[0]>=max);
 return String(data[0]%100000000).padStart(8,'0');
}
async function sha256(value){
 const digest=await crypto.subtle.digest('SHA-256',encoder.encode(String(value||'')));
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function safeEqual(left,right){
 const a=String(left||''),b=String(right||'');
 if(a.length!==b.length)return false;
 let diff=0;for(let i=0;i<a.length;i+=1)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}
function maskEmail(value){
 const [name,domain]=normEmail(value).split('@');
 if(!name||!domain)return'';
 return (name.slice(0,2)||'*')+'***@'+domain;
}
function maskPhone(value){
 const clean=String(value||'');
 if(!clean)return'';
 return clean.length<=5?'•••••':clean.slice(0,3)+'••••'+clean.slice(-3);
}
function normalizePhone(value){
 const raw=String(value||'').trim();
 if(!raw)return'';
 const clean=raw.replace(/[\s().-]/g,'');
 return /^\+[1-9]\d{7,14}$/.test(clean)?clean:'';
}
function deliveryFlag(env,name){
 const value=String(env?.[name]||'').trim().toLowerCase();
 return ['1','true','yes','on'].includes(value);
}
async function logAuth(env,user,event,success,email=''){
 try{await env.DB.prepare('INSERT INTO auth_events(user_id,tenant_id,email,event,success,created_at) VALUES(?,?,?,?,?,?)')
   .bind(user?.id||null,user?.tenant_id||null,email||user?.email||'',event,success?1:0,now()).run()}catch{}
}
async function authenticatedUser(request,env){
 try{return await currentUser(request,env)}catch{return null}
}
async function sendVerificationEmail(env,user,target,code,idempotencyKey){
 const mailer=env?.MAGNANIMOUS_MAIL;
 if(!mailer||typeof mailer.send!=='function')return{ok:false,code:'MAGNANIMOUS_MAIL_NOT_CONFIGURED'};
 const subject='Verify your Magnanimous recovery email';
 const text=`Your I AM MAGNANIMOUS WAY™ recovery-email verification code is: ${code}\n\nThis code expires in 10 minutes and works once. If you did not request this change, do not share the code and leave your account recovery settings unchanged.`;
 const html=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717"><h2>I AM MAGNANIMOUS WAY™</h2><p>Your recovery-email verification code is:</p><p style="font-size:28px;font-weight:800;letter-spacing:.16em">${code}</p><p>This code expires in 10 minutes and works once.</p><p>If you did not request this change, do not share the code.</p></div>`;
 try{return await mailer.send({kind:'recovery-email-verification',to:target,subject,text,html,idempotencyKey,sensitive:true})}
 catch(error){return{ok:false,code:'MAGNANIMOUS_MAIL_ERROR',error:String(error?.message||error||'mail failed')}}
}
async function status(request,env){
 if(!env?.DB)return json({detail:'Recovery contacts are temporarily unavailable.'},503);
 const user=await authenticatedUser(request,env);
 if(!user)return json({detail:'Sign in to manage recovery contacts.',code:'AUTH_REQUIRED'},401);
 const row=await env.DB.prepare('SELECT recovery_email,recovery_email_verified_at,phone_e164,phone_verified_at,updated_at FROM user_recovery_contacts WHERE user_id=? AND tenant_id=? LIMIT 1')
   .bind(user.id,user.tenant_id).first().catch(()=>null);
 return json({
  ok:true,
  recovery_email:row?.recovery_email?maskEmail(row.recovery_email):'',
  recovery_email_configured:Boolean(row?.recovery_email),
  recovery_email_verified:Boolean(Number(row?.recovery_email_verified_at||0)>0),
  phone:row?.phone_e164?maskPhone(row.phone_e164):'',
  phone_configured:Boolean(row?.phone_e164),
  phone_verified:Boolean(Number(row?.phone_verified_at||0)>0),
  email_verification_available:deliveryFlag(env,'MAGNANIMOUS_MAIL_DELIVERY_AVAILABLE'),
  sms_recovery_available:deliveryFlag(env,'MAGNANIMOUS_SMS_DELIVERY_AVAILABLE'),
  updated_at:Number(row?.updated_at||0)
 });
}
async function requestRecoveryEmail(request,env){
 if(!env?.DB)return json({detail:'Recovery contacts are temporarily unavailable.'},503);
 const user=await authenticatedUser(request,env);
 if(!user)return json({detail:'Sign in to set a recovery email.',code:'AUTH_REQUIRED'},401);
 const body=await request.json().catch(()=>({})),target=normEmail(body.email);
 if(!validEmail(target))return json({detail:'Enter a valid recovery email address.',code:'RECOVERY_EMAIL_INVALID'},400);
 if(!deliveryFlag(env,'MAGNANIMOUS_MAIL_DELIVERY_AVAILABLE')){
  return json({detail:'Recovery-email delivery is temporarily unavailable on the current host. Use Google Authenticator or a Magnanimous recovery code for recovery right now.',code:'RECOVERY_EMAIL_TRANSPORT_UNAVAILABLE',fallbacks:['authenticator','recovery-code']},503);
 }
 if(target===normEmail(user.email))return json({detail:'Use a different email from your primary sign-in email.',code:'RECOVERY_EMAIL_MUST_DIFFER'},400);
 const token=randomToken(),code=randomEightDigitCode(),tokenHash=await sha256(token),codeHash=await sha256(code),t=now(),expires=t+600;
 try{await env.DB.prepare("UPDATE recovery_contact_challenges SET consumed_at=? WHERE user_id=? AND kind='email' AND consumed_at IS NULL").bind(t,user.id).run()}catch{}
 await env.DB.prepare('INSERT INTO recovery_contact_challenges(token_hash,user_id,tenant_id,kind,target,code_hash,created_at,expires_at,attempts,consumed_at) VALUES(?,?,?,?,?,?,?,?,0,NULL)')
  .bind(tokenHash,user.id,user.tenant_id,'email',target,codeHash,t,expires).run();
 const delivery=await sendVerificationEmail(env,user,target,code,`recovery-email-${tokenHash.slice(0,32)}`);
 if(!delivery?.ok){
  await env.DB.prepare('UPDATE recovery_contact_challenges SET consumed_at=? WHERE token_hash=?').bind(t,tokenHash).run().catch(()=>{});
  await logAuth(env,user,'recovery_email_delivery_failed',0,target);
  return json({detail:'Magnanimous could not deliver the recovery-email verification code. Your existing recovery settings were not changed.',code:'RECOVERY_EMAIL_DELIVERY_FAILED'},503);
 }
 await logAuth(env,user,'recovery_email_verification_sent',1,target);
 return json({ok:true,challenge_token:token,expires_in_seconds:600,email_hint:maskEmail(target),detail:'Enter the 8-digit code sent to your recovery email.'});
}
async function confirmRecoveryEmail(request,env){
 if(!env?.DB)return json({detail:'Recovery contacts are temporarily unavailable.'},503);
 const user=await authenticatedUser(request,env);
 if(!user)return json({detail:'Sign in to verify a recovery email.',code:'AUTH_REQUIRED'},401);
 const body=await request.json().catch(()=>({})),token=String(body.challenge_token||''),code=String(body.code||'').replace(/\D/g,'');
 if(!/^rc1_[A-Za-z0-9_-]{40,128}$/.test(token)||!/^\d{8}$/.test(code))return json({detail:'That verification challenge is invalid or expired.',code:'RECOVERY_EMAIL_CHALLENGE_INVALID'},400);
 const hash=await sha256(token),t=now();
 const row=await env.DB.prepare("SELECT token_hash,target,code_hash,expires_at,attempts,consumed_at FROM recovery_contact_challenges WHERE token_hash=? AND user_id=? AND tenant_id=? AND kind='email' LIMIT 1")
  .bind(hash,user.id,user.tenant_id).first();
 if(!row||row.consumed_at!=null||Number(row.expires_at||0)<=t||Number(row.attempts||0)>=5)return json({detail:'That verification challenge is invalid or expired.',code:'RECOVERY_EMAIL_CHALLENGE_INVALID'},400);
 const submittedHash=await sha256(code);
 if(!safeEqual(submittedHash,row.code_hash)){
  const attempts=Number(row.attempts||0)+1;
  await env.DB.prepare('UPDATE recovery_contact_challenges SET attempts=?,consumed_at=CASE WHEN ?>=5 THEN ? ELSE consumed_at END WHERE token_hash=? AND consumed_at IS NULL').bind(attempts,attempts,t,hash).run();
  await logAuth(env,user,'recovery_email_verification_failed',0,row.target);
  return json({detail:attempts>=5?'Too many invalid codes. Start recovery-email setup again.':'That 8-digit verification code is incorrect.',code:'RECOVERY_EMAIL_CODE_INVALID'},400);
 }
 const claimed=await env.DB.prepare('UPDATE recovery_contact_challenges SET consumed_at=? WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?').bind(t,hash,t).run();
 if(Number(claimed?.meta?.changes||0)!==1)return json({detail:'That verification challenge is no longer active.',code:'RECOVERY_EMAIL_CHALLENGE_INVALID'},400);
 await env.DB.prepare(`INSERT INTO user_recovery_contacts(user_id,tenant_id,recovery_email,recovery_email_verified_at,phone_e164,phone_verified_at,updated_at)
  VALUES(?,?,?,?, '',0,?)
  ON CONFLICT(user_id) DO UPDATE SET tenant_id=excluded.tenant_id,recovery_email=excluded.recovery_email,recovery_email_verified_at=excluded.recovery_email_verified_at,updated_at=excluded.updated_at`)
  .bind(user.id,user.tenant_id,row.target,t,t).run();
 await logAuth(env,user,'recovery_email_verified',1,row.target);
 return json({ok:true,recovery_email:maskEmail(row.target),verified:true,detail:'Your recovery email is verified and can now be used for password recovery.'});
}
async function savePhone(request,env){
 if(!env?.DB)return json({detail:'Recovery contacts are temporarily unavailable.'},503);
 const user=await authenticatedUser(request,env);
 if(!user)return json({detail:'Sign in to manage your recovery phone.',code:'AUTH_REQUIRED'},401);
 const body=await request.json().catch(()=>({})),raw=String(body.phone||'').trim();
 if(!raw){
  await env.DB.prepare(`INSERT INTO user_recovery_contacts(user_id,tenant_id,recovery_email,recovery_email_verified_at,phone_e164,phone_verified_at,updated_at)
   VALUES(?,?, '',0,'',0,?)
   ON CONFLICT(user_id) DO UPDATE SET phone_e164='',phone_verified_at=0,updated_at=excluded.updated_at`).bind(user.id,user.tenant_id,now()).run();
  await logAuth(env,user,'recovery_phone_cleared',1,user.email);
  return json({ok:true,phone:'',verified:false,detail:'Optional recovery phone removed.'});
 }
 const phone=normalizePhone(raw);
 if(!phone)return json({detail:'Enter the phone in international format, for example +639171234567.',code:'RECOVERY_PHONE_INVALID'},400);
 const t=now();
 await env.DB.prepare(`INSERT INTO user_recovery_contacts(user_id,tenant_id,recovery_email,recovery_email_verified_at,phone_e164,phone_verified_at,updated_at)
  VALUES(?,?, '',0,?,0,?)
  ON CONFLICT(user_id) DO UPDATE SET tenant_id=excluded.tenant_id,phone_e164=excluded.phone_e164,phone_verified_at=0,updated_at=excluded.updated_at`)
  .bind(user.id,user.tenant_id,phone,t).run();
 await logAuth(env,user,'recovery_phone_saved_unverified',1,user.email);
 return json({ok:true,phone:maskPhone(phone),verified:false,sms_recovery_available:deliveryFlag(env,'MAGNANIMOUS_SMS_DELIVERY_AVAILABLE'),detail:deliveryFlag(env,'MAGNANIMOUS_SMS_DELIVERY_AVAILABLE')?'Optional recovery phone saved. SMS verification can be completed when requested.':'Optional recovery phone saved. No SMS was sent because Magnanimous does not currently have an active native SMS delivery path.'});
}
async function clearRecoveryEmail(request,env){
 if(!env?.DB)return json({detail:'Recovery contacts are temporarily unavailable.'},503);
 const user=await authenticatedUser(request,env);
 if(!user)return json({detail:'Sign in to manage your recovery email.',code:'AUTH_REQUIRED'},401);
 const t=now();
 await env.DB.prepare(`INSERT INTO user_recovery_contacts(user_id,tenant_id,recovery_email,recovery_email_verified_at,phone_e164,phone_verified_at,updated_at)
  VALUES(?,?, '',0,'',0,?)
  ON CONFLICT(user_id) DO UPDATE SET recovery_email='',recovery_email_verified_at=0,updated_at=excluded.updated_at`).bind(user.id,user.tenant_id,t).run();
 await logAuth(env,user,'recovery_email_cleared',1,user.email);
 return json({ok:true,detail:'Recovery email removed.'});
}

export async function handleRecoveryContacts(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/auth/recovery-contact'&&request.method==='GET')return status(request,env);
 if(path==='/api/auth/recovery-contact/email/request'&&request.method==='POST')return requestRecoveryEmail(request,env);
 if(path==='/api/auth/recovery-contact/email/confirm'&&request.method==='POST')return confirmRecoveryEmail(request,env);
 if(path==='/api/auth/recovery-contact/email'&&request.method==='DELETE')return clearRecoveryEmail(request,env);
 if(path==='/api/auth/recovery-contact/phone'&&request.method==='PUT')return savePhone(request,env);
 return null;
}
