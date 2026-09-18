import {getProviderRuntimeEnv} from './provider-runtime-env.js';
import {sendGrowthEmail} from './growth-email-transport.js';

const clean=(v,n=12000)=>String(v??'').trim().slice(0,n);
const email=v=>clean(v,254).toLowerCase();
const phone=v=>clean(v,40).replace(/[\s().-]/g,'');
const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
const validPhone=v=>/^\+[1-9]\d{7,14}$/.test(phone(v));
function twilioReady(env){return Boolean(env.TWILIO_ACCOUNT_SID&&env.TWILIO_AUTH_TOKEN&&env.TWILIO_PHONE_NUMBER)}
function plivoReady(env){return Boolean(env.PLIVO_AUTH_ID&&env.PLIVO_AUTH_TOKEN&&env.PLIVO_PHONE_NUMBER)}
function basic(user,pass){return 'Basic '+btoa(String(user)+':'+String(pass))}
async function optedOut(env,tenant,address){
 try{return Boolean(await env.DB.prepare('SELECT phone FROM voice_do_not_call WHERE tenant_id=? AND phone=? LIMIT 1').bind(tenant,address).first())}catch{return false}
}
async function twilioSms(env,to,body){
 const form=new URLSearchParams({To:to,From:String(env.TWILIO_PHONE_NUMBER),Body:body});
 const url='https://api.twilio.com/2010-04-01/Accounts/'+encodeURIComponent(String(env.TWILIO_ACCOUNT_SID))+'/Messages.json';
 const r=await fetch(url,{method:'POST',headers:{authorization:basic(env.TWILIO_ACCOUNT_SID,env.TWILIO_AUTH_TOKEN),'content-type':'application/x-www-form-urlencoded'},body});const d=await r.json().catch(()=>({}));return r.ok?{ok:true,receipt:String(d.sid||'sms-sent')}:{ok:false,status:r.status,error:String(d.message||('SMS send failed ('+r.status+')'))};
}
async function plivoSms(env,to,body){
 const url='https://api.plivo.com/v1/Account/'+encodeURIComponent(String(env.PLIVO_AUTH_ID))+'/Message/';
 const r=await fetch(url,{method:'POST',headers:{authorization:basic(env.PLIVO_AUTH_ID,env.PLIVO_AUTH_TOKEN),'content-type':'application/json'},body:JSON.stringify({src:String(env.PLIVO_PHONE_NUMBER),dst:to,text:body})});const d=await r.json().catch(()=>({}));return r.ok?{ok:true,receipt:String(d.message_uuid?.[0]||d.api_id||'sms-sent')}:{ok:false,status:r.status,error:String(d.error||d.message||('SMS send failed ('+r.status+')'))};
}
export async function messagingReadiness(env,tenant=''){env=await getProviderRuntimeEnv(env);let emailConnected=false;
 if(tenant){try{emailConnected=Boolean(await env.DB.prepare("SELECT id FROM integrations WHERE tenant_id=? AND provider IN ('google','outlook') LIMIT 1").bind(String(tenant)).first())}catch{}}
 const smsReady=twilioReady(env)||plivoReady(env);
 return{email:emailConnected,email_connected:emailConnected,sms:smsReady,sms_provider_configured:smsReady,email_note:emailConnected?'Tenant Gmail/Outlook sender connected.':'Connect Gmail or Outlook in this workspace before email can send.',sms_note:smsReady?'Carrier SMS transport configured; explicit contact consent is still required.':'SMS requires configured carrier credentials and explicit contact consent.'};
}
export async function deliverUnifiedInboxMessage(env,{tenant,thread,content,subject='',consentConfirmed=false}){
 env=await getProviderRuntimeEnv(env);const channel=String(thread?.channel||'').toLowerCase(),target=clean(thread?.customer_ref,254);
 if(channel==='email'){
  if(!validEmail(email(target)))return{ok:false,code:'MISSING_EMAIL_TARGET',status:400,error:'This email thread needs a valid customer email address in Customer contact.'};
  const sent=await sendGrowthEmail(env,{scopeTenantId:tenant,to:email(target),subject:clean(subject||thread.subject||'Message',240),text:clean(content,30000),senderName:'Magnanimous White Label',tenantOnly:true});
  return sent.ok?{ok:true,channel:'email',receipt:sent.receipt||'email-sent'}:{ok:false,code:sent.code||'EMAIL_SEND_FAILED',status:503,error:sent.error||'Connected email delivery failed.'};
 }
 if(channel==='sms'){
  const to=phone(target);if(!validPhone(to))return{ok:false,code:'MISSING_SMS_TARGET',status:400,error:'This SMS thread needs a valid E.164 customer phone number such as +15551234567.'};
  if(consentConfirmed!==true)return{ok:false,code:'SMS_CONSENT_REQUIRED',status:400,error:'Confirm that this contact gave permission to receive this SMS before sending.'};
  if(await optedOut(env,tenant,to))return{ok:false,code:'SMS_OPT_OUT',status:409,error:'This number is on the workspace do-not-contact list.'};
  const body=clean(content,1500);if(twilioReady(env))return{...(await twilioSms(env,to,body)),channel:'sms'};if(plivoReady(env))return{...(await plivoSms(env,to,body)),channel:'sms'};return{ok:false,code:'SMS_PROVIDER_NOT_CONFIGURED',status:503,error:'Carrier SMS is not configured for this platform yet.'};
 }
 return{ok:true,channel,receipt:'inbox-only',stored_only:true};
}
