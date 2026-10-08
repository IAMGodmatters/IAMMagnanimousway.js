import {decrypt} from './integrations.js';
import {getProviderRuntimeEnv} from './provider-runtime-env.js';

const now=()=>Math.floor(Date.now()/1000);
const encoder=new TextEncoder();
function b64url(value){let binary='';for(const b of encoder.encode(String(value||'')))binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function normalizeBase(value){
 const raw=String(value||'https://inkbox.ai/api/v1').trim();
 try{const url=new URL(raw);if(url.protocol!=='https:')return'https://inkbox.ai/api/v1';return`${url.origin}${url.pathname.replace(/\/$/,'')}`}catch{return'https://inkbox.ai/api/v1'}
}
async function communicationsRuntime(env){try{return await getProviderRuntimeEnv(env)}catch{return env}}
async function ownerTenant(env){
 const configured=String(env.GROWTH_SENDER_TENANT_ID||'').trim();if(configured)return configured;
 try{
  const canonical=await env.DB.prepare("SELECT u.tenant_id FROM tenants t JOIN users u ON u.id=t.owner_user_id WHERE t.slug='owner' AND u.active=1 LIMIT 1").first();
  if(canonical?.tenant_id)return String(canonical.tenant_id);
  const row=await env.DB.prepare("SELECT tenant_id FROM users WHERE active=1 AND lower(role) IN ('owner','admin','super_admin','superadmin') ORDER BY CASE WHEN lower(role)='owner' THEN 0 ELSE 1 END,id LIMIT 1").first();
  return String(row?.tenant_id||'');
 }catch{return ''}
}
export async function connectionFor(env,scopeTenantId){
 const tenants=[];if(scopeTenantId&&scopeTenantId!=='__platform__')tenants.push(scopeTenantId);const owner=await ownerTenant(env);if(owner&&!tenants.includes(owner))tenants.push(owner);
 for(const tenant of tenants){
  try{const row=await env.DB.prepare("SELECT * FROM integrations WHERE tenant_id=? AND provider IN ('google','outlook') ORDER BY CASE provider WHEN 'google' THEN 0 ELSE 1 END,updated_at DESC LIMIT 1").bind(tenant).first();if(row)return row}catch{}
 }
 return null;
}
async function refreshGoogle(env,row,refreshToken){
 if(!refreshToken||!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return '';
 const body=new URLSearchParams({client_id:String(env.GOOGLE_CLIENT_ID),client_secret:String(env.GOOGLE_CLIENT_SECRET),refresh_token:refreshToken,grant_type:'refresh_token'});
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});const d=await r.json().catch(()=>({}));return r.ok?String(d.access_token||''):'';
}
async function refreshOutlook(env,row,refreshToken){
 if(!refreshToken||!env.MICROSOFT_CLIENT_ID||!env.MICROSOFT_CLIENT_SECRET)return '';
 const body=new URLSearchParams({client_id:String(env.MICROSOFT_CLIENT_ID),client_secret:String(env.MICROSOFT_CLIENT_SECRET),refresh_token:refreshToken,grant_type:'refresh_token',scope:'openid email offline_access Mail.Read Mail.Send'});
 const r=await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});const d=await r.json().catch(()=>({}));return r.ok?String(d.access_token||''):'';
}
async function connectedSenderReady(env,conn){
 if(!conn)return false;
 const provider=String(conn.provider||'');if(provider!=='google'&&provider!=='outlook')return false;
 const access=await decrypt(String(conn.access_token||''),env).catch(()=> '');if(!access)return false;
 const expires=Number(conn.token_expires_at||0);if(!expires||expires>now()+90)return true;
 const refresh=await decrypt(String(conn.refresh_token||''),env).catch(()=> '');if(!refresh)return false;
 if(provider==='google')return Boolean(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET);
 if(provider==='outlook')return Boolean(env.MICROSOFT_CLIENT_ID&&env.MICROSOFT_CLIENT_SECRET);
 return false;
}
async function communicationsSenderReady(env){
 const runtime=await communicationsRuntime(env);
 return Boolean(String(runtime?.INKBOX_API_KEY||'').trim()&&String(runtime?.INKBOX_EMAIL_ADDRESS||'iam@inkboxmail.com').trim());
}
export async function hasGrowthEmailSender(env,scopeTenantId='__platform__'){
 const conn=await connectionFor(env,scopeTenantId);
 if(await connectedSenderReady(env,conn))return true;
 return communicationsSenderReady(env);
}
async function accessToken(env,row){
 let token=await decrypt(String(row?.access_token||''),env);if(!token)return '';
 const expires=Number(row?.token_expires_at||0);if(!expires||expires>now()+90)return token;
 const refresh=await decrypt(String(row?.refresh_token||''),env);if(row.provider==='google')return await refreshGoogle(env,row,refresh)||token;if(row.provider==='outlook')return await refreshOutlook(env,row,refresh)||token;return token;
}
async function gmailSend(token,{to,subject,text,replyTo,senderName}){
 const lines=[`To: ${to}`,`Subject: ${subject}`,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8'];if(replyTo)lines.splice(1,0,`Reply-To: ${replyTo}`);if(senderName)lines.push(`X-Sender-Name: ${senderName}`);lines.push('',text);
 const r=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({raw:b64url(lines.join('\r\n'))})});const d=await r.json().catch(()=>({}));return r.ok?{ok:true,receipt:String(d.id||'gmail-sent')}:{ok:false,error:String(d?.error?.message||`Gmail send failed (${r.status})`)};
}
async function outlookSend(token,{to,subject,text,replyTo}){
 const message={subject,body:{contentType:'Text',content:text},toRecipients:[{emailAddress:{address:to}}]};if(replyTo)message.replyTo=[{emailAddress:{address:replyTo}}];
 const r=await fetch('https://graph.microsoft.com/v1.0/me/sendMail',{method:'POST',headers:{Authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({message,saveToSentItems:true})});if(r.ok)return{ok:true,receipt:'outlook-sent'};const d=await r.json().catch(()=>({}));return{ok:false,error:String(d?.error?.message||`Outlook send failed (${r.status})`)};
}
async function communicationsSend(env,{to,subject,text,replyTo='',idempotencyKey=''}){
 const runtime=await communicationsRuntime(env),apiKey=String(runtime?.INKBOX_API_KEY||'').trim(),mailbox=String(runtime?.INKBOX_EMAIL_ADDRESS||'iam@inkboxmail.com').trim();
 if(!apiKey||!mailbox)return{ok:false,code:'NO_COMMUNICATION_MAILBOX',error:'No verified Magnanimous communications mailbox is configured.'};
 const base=normalizeBase(runtime?.INKBOX_BASE_URL),root=`${base}/mail/mailboxes/${encodeURIComponent(mailbox)}/drafts`;
 const stable=String(idempotencyKey||`mail-${await crypto.subtle.digest('SHA-256',encoder.encode(`${to}|${subject}|${text}`)).then(x=>[...new Uint8Array(x)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,48))}`).slice(0,180);
 const headers={'X-API-Key':apiKey,'Accept':'application/json','Content-Type':'application/json','Idempotency-Key':stable};
 try{
  const created=await fetch(root,{method:'POST',headers,body:JSON.stringify({recipients:{to:[to]},subject,body_text:text,reply_to:replyTo||null,track_opens:false})});
  const draft=await created.json().catch(()=>({}));
  if(!created.ok||!draft?.id)return{ok:false,code:'COMMUNICATION_DRAFT_FAILED',error:String(draft?.detail||draft?.error||`Draft creation failed (${created.status}).`)};
  const sent=await fetch(`${root}/${encodeURIComponent(String(draft.id))}/send`,{method:'POST',headers:{'X-API-Key':apiKey,'Accept':'application/json','Content-Type':'application/json','Idempotency-Key':`${stable.slice(0,150)}-send`},body:JSON.stringify({generation:Number(draft.generation||1)})});
  const receipt=await sent.json().catch(()=>({}));
  if(!sent.ok)return{ok:false,code:'COMMUNICATION_SEND_FAILED',error:String(receipt?.detail||receipt?.error||`Email send failed (${sent.status}).`)};
  return{ok:true,provider:'magnanimous-communications',receipt:String(receipt?.id||receipt?.message_id||'communications-sent')};
 }catch(error){return{ok:false,code:'COMMUNICATION_TRANSPORT_ERROR',error:String(error?.message||error||'Communication transport failed.')}}
}

export async function sendGrowthEmail(env,{scopeTenantId,to,subject,text,replyTo='',senderName='',idempotencyKey=''}){
 const conn=await connectionFor(env,scopeTenantId);
 if(conn){
  const token=await accessToken(env,conn).catch(()=> '');
  if(token){
   const result=conn.provider==='google'?await gmailSend(token,{to,subject,text,replyTo,senderName}):conn.provider==='outlook'?await outlookSend(token,{to,subject,text,replyTo}):null;
   if(result?.ok)return result;
  }
 }
 const communications=await communicationsSend(env,{to,subject,text,replyTo,idempotencyKey});
 if(communications?.ok)return communications;
 if(conn)return{ok:false,code:communications?.code||'SENDER_AUTH',error:communications?.error||'The connected email sender needs to be reauthorized.'};
 return{ok:false,code:communications?.code||'NO_SENDER',error:communications?.error||'Connect a Gmail, Outlook, or verified Magnanimous communications sender before automated email can send.'};
}
