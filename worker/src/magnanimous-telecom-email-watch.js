import {decrypt} from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const encoder=new TextEncoder();
const decoder=new TextDecoder();
const WATCH_QUERY='in:inbox newer_than:7d {from:gigs.com from:telna.com from:1global.com from:fonusmobile.com from:fonus.me from:ntc.gov.ph}';
const PROVIDERS=[
 ['gigs','gigs.com'],
 ['telna','telna.com'],
 ['1global','1global.com'],
 ['fonus','fonusmobile.com'],
 ['fonus','fonus.me'],
 ['ntc-ph','ntc.gov.ph']
];

function b64urlText(value){
 let binary='';for(const b of encoder.encode(String(value||'')))binary+=String.fromCharCode(b);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function fromB64url(value=''){
 const normalized=String(value||'').replace(/-/g,'+').replace(/_/g,'/');
 const padded=normalized+'='.repeat((4-normalized.length%4)%4);
 try{return decoder.decode(Uint8Array.from(atob(padded),c=>c.charCodeAt(0)))}catch{return ''}
}
function headerMap(message){
 const out={};for(const row of message?.payload?.headers||[])out[String(row?.name||'').toLowerCase()]=String(row?.value||'');return out;
}
function cleanHeader(value){return String(value||'').replace(/[\r\n]+/g,' ').trim()}
function extractAddress(value){
 const text=String(value||'').trim(),angle=text.match(/<([^<>\s]+@[^<>\s]+)>/),plain=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
 return String(angle?.[1]||plain?.[0]||'').toLowerCase();
}
function providerKey(from){
 const address=extractAddress(from),domain=address.split('@')[1]||'';
 return PROVIDERS.find(([,suffix])=>domain===suffix||domain.endsWith('.'+suffix))?.[0]||'';
}
function flattenParts(part,out=[]){
 if(!part)return out;
 out.push(part);
 for(const child of part.parts||[])flattenParts(child,out);
 return out;
}
function plainBody(message){
 const parts=flattenParts(message?.payload||{});
 const plain=parts.find(p=>String(p.mimeType||'').toLowerCase()==='text/plain'&&p?.body?.data);
 if(plain)return fromB64url(plain.body.data).slice(0,24000);
 const html=parts.find(p=>String(p.mimeType||'').toLowerCase()==='text/html'&&p?.body?.data);
 if(html)return fromB64url(html.body.data).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,24000);
 return fromB64url(message?.payload?.body?.data||'').slice(0,24000);
}
function attachmentNames(message){
 return flattenParts(message?.payload||{}).map(p=>String(p.filename||'').trim()).filter(Boolean).slice(0,20);
}
function automaticAcknowledgement(from,subject,body){
 const hay=(String(subject||'')+'\n'+String(body||'')).toLowerCase(),address=extractAddress(from);
 if(/(^|[.@_-])(no-?reply|donotreply|do-not-reply)([.@_-]|$)/.test(address))return true;
 return [
  'case updated','new case raised','we have received your inquiry','we received your inquiry',
  'will get back to you within','we will get back to you within','ticket has been created',
  'this is an automated','automated message','do not reply to this'
 ].some(x=>hay.includes(x));
}
function consequentialRequest(body){
 const hay=String(body||'').toLowerCase();
 return /\b(sign|signature|execute the agreement|accept the agreement|deposit|payment|invoice|wire transfer|credit card|bank transfer|passport|government id|government-issued id|kyc document|sec registration|dti registration|performance bond|pay-up capital|paid-up capital)\b/.test(hay);
}
function replyText(key,{consequential=false}={}){
 const common='Magnanimous Telecom will keep production fail-closed until the applicable commercial, country, carrier-profile, real-connectivity, cost-control and regulatory evidence is verified. This message does not accept a contract, authorize a payment/deposit, or represent regulated service as live.';
 if(key==='ntc-ph')return `Good day,\n\nThank you for the response. Please provide or confirm any remaining written guidance for the correct NTC classification, current Form NTC 1-20 path, documentary/ownership/capital/fee/bond requirements, required authorized-network agreement, and whether a Magnanimous-branded SIM/eSIM service on a host carrier requires additional VNO/MVNO/mobile authority. Please route the matter to the Negros Oriental/Dumaguete licensing unit if appropriate.\n\n${common}\n\nRespectfully,\nMagnanimous Telecom\nI AM MAGNANIMOUS WAY™`;
 const specific={
  gigs:'Please provide any remaining test-project/API access, agreement-grade resale authority, Philippines eligibility/coverage, wholesale pricing/fair-use terms, and the path to one real Philippines trial eSIM/profile after commercial approval.',
  telna:'Please provide any remaining Philippines network/IMSI eligibility, white-label/reseller agreement, sandbox/API or trial access, wholesale pricing/fair-use terms, Philippine KYC/SIM-registration obligations, and genuinely independent primary/backup network options.',
  '1global':'Please keep case 02547094 with the Connect / Embedded Telco commercial/onboarding team and provide any remaining agreement, Philippines eligibility, platform/sandbox credentials, wholesale pricing/fair-use terms, real trial eSIM path, and independent backup/failure-domain details.',
  fonus:'Please provide any remaining reseller agreement/resale authority, Philippines eligibility, wholesale rate deck/fair-use terms, eSIM/pSIM provisioning/API process, compliance obligations, real trial connectivity path, and independently routed backup options.'
 }[key]||'Please provide the remaining commercial, technical, pricing, country and compliance evidence needed to complete qualification.';
 const caution=consequential?' We received the consequential item you referenced; it will be reviewed separately and is not accepted or executed by this automated reply.':'';
 return `Hello,\n\nThank you for the update. ${specific}${caution}\n\n${common}\n\nBusiness contact: Godmattersinc@iammagnanimousway.com\n\nThank you,\nMagnanimous Telecom\nI AM MAGNANIMOUS WAY™`;
}
async function jsonFetch(url,options={}){
 const response=await fetch(url,options),text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={raw:text}}
 if(!response.ok||data?.error)throw new Error(data?.error?.message||data?.error_description||data?.message||`Gmail request failed (${response.status}).`);
 return data;
}
async function owner(env){
 try{return await env.DB.prepare("SELECT id,tenant_id,email FROM users WHERE active=1 AND lower(role) IN ('owner','admin','super_admin','superadmin') ORDER BY CASE WHEN lower(role)='owner' THEN 0 ELSE 1 END,id LIMIT 1").first()}catch{return null}
}
async function permission(env,tenant){
 try{const row=await env.DB.prepare("SELECT can_read,can_write FROM assistant_permissions WHERE tenant_id=? AND provider='google'").bind(tenant).first();return row?{read:!!row.can_read,write:!!row.can_write}:{read:true,write:true}}catch{return{read:true,write:true}}
}
async function googleConnection(env,tenant){
 const row=await env.DB.prepare("SELECT * FROM integrations WHERE tenant_id=? AND provider='google' ORDER BY updated_at DESC LIMIT 1").bind(tenant).first();
 if(!row)return null;
 return{...row,access_token:await decrypt(String(row.access_token||''),env),refresh_token:await decrypt(String(row.refresh_token||''),env)};
}
async function accessToken(env,conn){
 if(conn.access_token&&(!Number(conn.token_expires_at)||Number(conn.token_expires_at)>now()+90))return conn.access_token;
 if(!conn.refresh_token||!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return '';
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({
  client_id:String(env.GOOGLE_CLIENT_ID),client_secret:String(env.GOOGLE_CLIENT_SECRET),refresh_token:String(conn.refresh_token),grant_type:'refresh_token'
 })});
 const data=await response.json().catch(()=>({}));return response.ok?String(data.access_token||''):'';
}
async function ensureSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS telecom_email_watch_events (
  message_id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,provider_key TEXT NOT NULL DEFAULT '',thread_id TEXT NOT NULL DEFAULT '',
  sender TEXT NOT NULL DEFAULT '',subject TEXT NOT NULL DEFAULT '',classification TEXT NOT NULL DEFAULT 'observed',
  action TEXT NOT NULL DEFAULT 'recorded',reply_message_id TEXT NOT NULL DEFAULT '',snippet TEXT NOT NULL DEFAULT '',
  attachment_names_json TEXT NOT NULL DEFAULT '[]',created_at INTEGER NOT NULL,processed_at INTEGER NOT NULL)`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS telecom_email_watch_state (
  tenant_id TEXT PRIMARY KEY,enabled INTEGER NOT NULL DEFAULT 1,last_run_at INTEGER,last_message_at INTEGER,
  last_action TEXT NOT NULL DEFAULT '',last_error TEXT NOT NULL DEFAULT '',updated_at INTEGER NOT NULL)`).run();
}
async function seen(env,id){return Boolean(await env.DB.prepare('SELECT message_id FROM telecom_email_watch_events WHERE message_id=?').bind(id).first())}
async function recentThreadReply(env,tenant,thread){
 if(!thread)return false;
 const cutoff=now()-(6*60*60);
 const row=await env.DB.prepare("SELECT message_id FROM telecom_email_watch_events WHERE tenant_id=? AND thread_id=? AND action IN ('replied','acknowledged_without_acceptance') AND processed_at>=? ORDER BY processed_at DESC LIMIT 1").bind(tenant,thread,cutoff).first();
 return Boolean(row?.message_id);
}
async function record(env,tenant,event){
 await env.DB.prepare(`INSERT OR IGNORE INTO telecom_email_watch_events(
  message_id,tenant_id,provider_key,thread_id,sender,subject,classification,action,reply_message_id,snippet,attachment_names_json,created_at,processed_at
 ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
  event.id,tenant,event.provider,event.thread,event.from,event.subject,event.classification,event.action,event.replyId||'',event.snippet,
  JSON.stringify(event.attachments||[]),event.createdAt||now(),now()
 ).run();
}
async function updatePartnerEvidence(env,tenant,key,messageId,classification,snippet){
 if(!['gigs','telna','1global','fonus'].includes(key))return;
 const ref='gmail:'+messageId,note=`Latest inbound ${classification}: ${String(snippet||'').slice(0,500)}`;
 try{
  await env.DB.prepare(`UPDATE telecom_mobile_partner_acquisition SET
   evidence_reference=CASE WHEN instr(evidence_reference,?)>0 THEN evidence_reference ELSE substr(evidence_reference||CASE WHEN evidence_reference='' THEN '' ELSE ';' END||?,1,4000) END,
   notes=substr(CASE WHEN notes='' THEN ? ELSE notes||' | '||? END,1,4000),updated_at=?
   WHERE tenant_id=? AND provider_key=?`).bind(ref,ref,note,note,now(),tenant,key).run();
 }catch{}
}
async function sendReply(token,message,key,consequential){
 const h=headerMap(message),to=extractAddress(h.from);if(!to)return{sent:false,id:''};
 const subject=/^re:/i.test(h.subject||'')?h.subject:`Re: ${h.subject||'Magnanimous Telecom inquiry'}`;
 const lines=[`To: ${to}`,`Subject: ${subject}`,...(h['message-id']?[`In-Reply-To: ${h['message-id']}`,`References: ${h['message-id']}`]:[]),'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: 8bit','',replyText(key,{consequential})];
 const data=await jsonFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{
  method:'POST',headers:{Authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({raw:b64urlText(lines.join('\r\n')),threadId:message.threadId})
 });
 return{sent:true,id:String(data.id||'')};
}
async function state(env,tenant,patch={}){
 const ts=now();await env.DB.prepare(`INSERT INTO telecom_email_watch_state(tenant_id,enabled,last_run_at,last_message_at,last_action,last_error,updated_at)
 VALUES(?,1,?,?,?,?,?) ON CONFLICT(tenant_id) DO UPDATE SET
 enabled=excluded.enabled,last_run_at=excluded.last_run_at,last_message_at=excluded.last_message_at,last_action=excluded.last_action,last_error=excluded.last_error,updated_at=excluded.updated_at`)
 .bind(tenant,ts,patch.last_message_at||null,String(patch.last_action||''),String(patch.last_error||'').slice(0,1000),ts).run();
}
export async function scheduledTelecomEmailWatch(env){
 if(String(env.TELECOM_EMAIL_WATCH_ENABLED||'true').toLowerCase()==='false'||!env?.DB)return{enabled:false};
 await ensureSchema(env);
 const user=await owner(env);if(!user)return{enabled:true,status:'no-owner'};
 const existing=await env.DB.prepare('SELECT enabled FROM telecom_email_watch_state WHERE tenant_id=?').bind(user.tenant_id).first();
 if(existing&&Number(existing.enabled)===0)return{enabled:false,status:'disabled'};
 const perms=await permission(env,user.tenant_id);if(!perms.read){await state(env,user.tenant_id,{last_error:'Gmail read permission is disabled.'});return{enabled:true,status:'read-disabled'}};
 const conn=await googleConnection(env,user.tenant_id);if(!conn){await state(env,user.tenant_id,{last_error:'Connect Gmail in Magnanimous Connections to activate telecom email monitoring.'});return{enabled:true,status:'gmail-not-connected'}};
 const token=await accessToken(env,conn);if(!token){await state(env,user.tenant_id,{last_error:'Connected Gmail needs reauthorization.'});return{enabled:true,status:'gmail-reauthorize'}};
 try{
  const list=await jsonFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q='+encodeURIComponent(WATCH_QUERY),{headers:{Authorization:`Bearer ${token}`}});
  let processed=0,replied=0,lastMessage=0;
  for(const row of list.messages||[]){
   if(await seen(env,row.id))continue;
   const message=await jsonFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(row.id)}?format=full`,{headers:{Authorization:`Bearer ${token}`}});
   const h=headerMap(message),from=h.from||'',key=providerKey(from);if(!key)continue;
   const body=plainBody(message),attachments=attachmentNames(message),auto=automaticAcknowledgement(from,h.subject,body),consequential=consequentialRequest(body);
   const cooldown=!auto&&await recentThreadReply(env,user.tenant_id,message.threadId||'');
   const classification=auto?'auto_ack':consequential?'owner_action_required':'substantive';
   let action=auto?'recorded_no_reply':cooldown?'recorded_thread_cooldown':'recorded_write_disabled',replyId='';
   if(!auto&&!cooldown&&perms.write){
    const sent=await sendReply(token,message,key,consequential);if(sent.sent){action=consequential?'acknowledged_without_acceptance':'replied';replyId=sent.id;replied++}
   }
   const internalDate=Math.floor(Number(message.internalDate||Date.now())/1000);lastMessage=Math.max(lastMessage,internalDate);
   const snippet=String(message.snippet||body||'').replace(/\s+/g,' ').slice(0,900);
   await record(env,user.tenant_id,{id:message.id,provider:key,thread:message.threadId||'',from,subject:cleanHeader(h.subject),classification,action,replyId,snippet,attachments,createdAt:internalDate});
   await updatePartnerEvidence(env,user.tenant_id,key,message.id,classification,snippet);
   processed++;
  }
  await state(env,user.tenant_id,{last_message_at:lastMessage||null,last_action:`processed:${processed};replied:${replied}`,last_error:''});
  return{enabled:true,status:'ok',processed,replied};
 }catch(error){
  const message=String(error?.message||error||'Telecom email watch failed.');await state(env,user.tenant_id,{last_error:message});throw error;
 }
}

export async function telecomEmailWatchStatus(env,tenantId){
 await ensureSchema(env);
 const stateRow=await env.DB.prepare('SELECT * FROM telecom_email_watch_state WHERE tenant_id=?').bind(tenantId).first();
 const {results=[]}=await env.DB.prepare('SELECT message_id,provider_key,thread_id,sender,subject,classification,action,reply_message_id,snippet,attachment_names_json,created_at,processed_at FROM telecom_email_watch_events WHERE tenant_id=? ORDER BY processed_at DESC LIMIT 30').bind(tenantId).all();
 return{state:stateRow||{tenant_id:tenantId,enabled:1},events:results.map(x=>({...x,attachment_names:(()=>{try{return JSON.parse(x.attachment_names_json||'[]')}catch{return[]}})()}))};
}
