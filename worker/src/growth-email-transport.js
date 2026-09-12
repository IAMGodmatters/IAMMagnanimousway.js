import {decrypt} from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const encoder=new TextEncoder();
function b64url(value){let binary='';for(const b of encoder.encode(String(value||'')))binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function ownerTenant(env){
 const configured=String(env.GROWTH_SENDER_TENANT_ID||'').trim();if(configured)return configured;
 try{const row=await env.DB.prepare("SELECT tenant_id FROM users WHERE active=1 AND lower(role) IN ('owner','admin','super_admin','superadmin') ORDER BY CASE WHEN lower(role)='owner' THEN 0 ELSE 1 END,id LIMIT 1").first();return String(row?.tenant_id||'')}catch{return ''}
}
async function connectionFor(env,scopeTenantId){
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

export async function sendGrowthEmail(env,{scopeTenantId,to,subject,text,replyTo='',senderName=''}){
 const conn=await connectionFor(env,scopeTenantId);if(!conn)return{ok:false,code:'NO_SENDER',error:'Connect a Gmail or Outlook sender in Connections before automated email can send.'};
 const token=await accessToken(env,conn);if(!token)return{ok:false,code:'SENDER_AUTH',error:'The connected email sender needs to be reauthorized.'};
 if(conn.provider==='google')return gmailSend(token,{to,subject,text,replyTo,senderName});
 if(conn.provider==='outlook')return outlookSend(token,{to,subject,text,replyTo});
 return{ok:false,code:'NO_TRANSPORT',error:'No supported email transport is connected.'};
}
