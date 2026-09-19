import {currentUser,decrypt} from './integrations.js';
import {handleAssistantIntegrations} from './assistant-integrations-runtime.js';
import {getIntegrationRuntimeEnv} from './platform-credentials.js';
import {hasWhiteLabelAccess} from './white-label-native-products.js';

const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const trim=(value,max=1000)=>String(value??'').trim().slice(0,max);
const numberId=value=>/^[0-9]{5,30}$/.test(String(value??''));
const zero=(body,status=200)=>new Response(body,{status,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
const mentions=(message,term)=>term.length>=4&&new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z0-9]|$)`,'i').test(message);

async function schema(env){
 await env.DB.batch([
  env.DB.prepare('CREATE TABLE IF NOT EXISTS white_label_whatsapp_routes (phone_number_id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,integration_external_account_id TEXT NOT NULL,created_by TEXT NOT NULL,created_at INTEGER NOT NULL)'),
  env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_white_label_whatsapp_routes_client ON white_label_whatsapp_routes(tenant_id,client_id)'),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS white_label_whatsapp_inbox (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,phone_number_id TEXT NOT NULL,sender TEXT NOT NULL,customer_text TEXT NOT NULL,suggested_text TEXT NOT NULL,received_at INTEGER NOT NULL,reply_status TEXT NOT NULL DEFAULT 'review',reply_text TEXT NOT NULL DEFAULT '',provider_reply_id TEXT NOT NULL DEFAULT '',assistant_action_id TEXT NOT NULL DEFAULT '',sent_at INTEGER NOT NULL DEFAULT 0)"),
  env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_white_label_whatsapp_inbox_client ON white_label_whatsapp_inbox(tenant_id,client_id,received_at DESC)')
 ]);
}

async function hmac(secret,body){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body)))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function equal(a,b){if(a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0}

export async function suggestWhatsAppProductReply(db,tenant,client,message){
 const text=trim(message,2000).toLowerCase();
 if(!text)return 'Thank you for contacting us. A team member will review your message.';
 const {results=[]}=await db.prepare('SELECT name,sku,stock FROM white_label_pos_products WHERE tenant_id=? AND client_id=? AND active=1 ORDER BY name LIMIT 200').bind(tenant,client).all().catch(()=>({results:[]}));
 const match=results.find(item=>{
  const name=trim(item.name,160).toLowerCase(),sku=trim(item.sku,80).toLowerCase();
  return mentions(text,name)||mentions(text,sku);
 });
 if(match)return `Thanks for asking about ${trim(match.name,160)}. I can help with that product. Would you like details about it or would you prefer a team member to follow up?`;
 return 'Thanks for contacting us. Which product are you interested in? A team member can confirm details and availability.';
}

async function receive(request,env,url){
 if(request.method==='GET'){
  const verify=String(env.WHATSAPP_VERIFY_TOKEN||'');
  if(!verify)return zero('Webhook not configured',503);
  if(url.searchParams.get('hub.mode')!=='subscribe'||!equal(url.searchParams.get('hub.verify_token')||'',verify))return zero('Invalid verification',403);
  const challenge=url.searchParams.get('hub.challenge')||'';
  return /^\d{1,128}$/.test(challenge)?zero(challenge):zero('Invalid challenge',400);
 }
 if(request.method!=='POST')return zero('Method not allowed',405);
 const secret=String(env.META_APP_SECRET||'');if(!secret)return zero('Webhook not configured',503);
 const raw=await request.text(),signature=request.headers.get('x-hub-signature-256')||'';
 if(!equal(signature,`sha256=${await hmac(secret,raw)}`))return zero('Invalid signature',403);
 let payload;try{payload=JSON.parse(raw)}catch{return zero('Invalid JSON',400)}
 if(!env.DB)return zero('Inbox unavailable',503);
 await schema(env);
 for(const entry of Array.isArray(payload.entry)?payload.entry.slice(0,30):[]){
  for(const change of Array.isArray(entry.changes)?entry.changes.slice(0,30):[]){
   const value=change.value||{},phone=String(value.metadata?.phone_number_id||'');
   if(!numberId(phone))continue;
   const route=await env.DB.prepare('SELECT tenant_id,client_id FROM white_label_whatsapp_routes WHERE phone_number_id=?').bind(phone).first();
   if(!route)continue;
   for(const message of Array.isArray(value.messages)?value.messages.slice(0,100):[]){
    const id=trim(message.id,120),sender=trim(message.from,30),customer=trim(message.text?.body,2000);
    if(message.type!=='text'||!id||!/^\d{7,20}$/.test(sender)||!customer)continue;
    const draft=await suggestWhatsAppProductReply(env.DB,route.tenant_id,route.client_id,customer);
    await env.DB.prepare('INSERT OR IGNORE INTO white_label_whatsapp_inbox(id,tenant_id,client_id,phone_number_id,sender,customer_text,suggested_text,received_at) VALUES(?,?,?,?,?,?,?,?)')
     .bind(id,route.tenant_id,route.client_id,phone,sender,customer,draft,Number(message.timestamp)||now()).run();
   }
  }
 }
 return zero('EVENT_RECEIVED');
}

async function privateInbox(request,env,url){
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in first.'},401);
 if(!await hasWhiteLabelAccess(env,user))return json({detail:'An active Agency White Label plan is required.'},403);
 await schema(env);
 const tenant=String(user.tenant_id),base='/api/white-label/native/whatsapp';
 if(url.pathname===`${base}/routes`&&request.method==='GET'){
  const {results=[]}=await env.DB.prepare('SELECT phone_number_id,client_id,integration_external_account_id,created_at FROM white_label_whatsapp_routes WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100').bind(tenant).all();
  return json({routes:results});
 }
 if(url.pathname===`${base}/routes`&&request.method==='POST'){
  const input=await request.json().catch(()=>({})),phone=trim(input.phone_number_id,30),client=trim(input.client_id,80),external=trim(input.integration_external_account_id,120);
  if(!numberId(phone)||!client||!external)return json({detail:'Choose a client, a connected WhatsApp account and its business phone number ID.'},400);
  const clientRow=await env.DB.prepare('SELECT id FROM bpo_clients WHERE tenant_id=? AND id=?').bind(tenant,client).first();
  const connection=await env.DB.prepare("SELECT access_token FROM integrations WHERE tenant_id=? AND provider='whatsapp' AND external_account_id=?").bind(tenant,external).first();
  if(!clientRow||!connection)return json({detail:'The client or connected account is not in your workspace.'},404);
  const token=await decrypt(connection.access_token,env);
  const version=trim(env.META_GRAPH_VERSION||'v23.0',15);
  const verify=await fetch(`https://graph.facebook.com/${version}/${phone}?fields=id,display_phone_number`,{headers:{Authorization:`Bearer ${token}`}});
  if(!verify.ok)return json({detail:'The connected WhatsApp account cannot verify that business phone number ID.'},400);
  const data=await verify.json().catch(()=>({}));if(String(data.id)!==phone)return json({detail:'Phone number ownership verification failed.'},400);
  try{await env.DB.prepare('INSERT INTO white_label_whatsapp_routes(phone_number_id,tenant_id,client_id,integration_external_account_id,created_by,created_at) VALUES(?,?,?,?,?,?)').bind(phone,tenant,client,external,String(user.id),now()).run()}
  catch{return json({detail:'That phone number is already routed. Review the existing owner and client before changing it.'},409)}
  return json({ok:true,phone_number_id:phone,client_id:client},201);
 }
 if(url.pathname===`${base}/inbox`&&request.method==='GET'){
  const client=trim(url.searchParams.get('client_id'),80);
  const owned=await env.DB.prepare('SELECT id FROM bpo_clients WHERE tenant_id=? AND id=?').bind(tenant,client).first();
  if(!owned)return json({detail:'Choose a client belonging to this workspace.'},400);
  const {results=[]}=await env.DB.prepare('SELECT id,phone_number_id,sender,customer_text,suggested_text,received_at,reply_status,reply_text,sent_at FROM white_label_whatsapp_inbox WHERE tenant_id=? AND client_id=? ORDER BY received_at DESC LIMIT 100').bind(tenant,client).all();
  return json({messages:results});
 }
 const match=url.pathname.match(/^\/api\/white-label\/native\/whatsapp\/reply\/([^/]+)$/);
 if(match&&request.method==='POST'){
  const id=trim(match[1],120),row=await env.DB.prepare("SELECT * FROM white_label_whatsapp_inbox WHERE id=? AND tenant_id=? AND reply_status='review'").bind(id,tenant).first();
  if(!row)return json({detail:'Message not found or already handled.'},404);
  if(now()-Number(row.received_at)>23*3600)return json({detail:'The free-form reply window is closing or expired; use an approved template or contact Meta support.'},409);
  const input=await request.json().catch(()=>({})),reply=trim(input.text,2000);
  if(!reply)return json({detail:'Review and enter a reply before sending.'},400);
  const route=await env.DB.prepare('SELECT integration_external_account_id FROM white_label_whatsapp_routes WHERE phone_number_id=? AND tenant_id=? AND client_id=?').bind(row.phone_number_id,tenant,row.client_id).first();
  if(!route)return json({detail:'This client phone connection is no longer routed.'},409);
  const connection=await env.DB.prepare("SELECT id FROM integrations WHERE tenant_id=? AND provider='whatsapp' AND external_account_id=?").bind(tenant,route.integration_external_account_id).first();
  if(!connection)return json({detail:'The connected WhatsApp account is missing.'},409);
  const claim=await env.DB.prepare("UPDATE white_label_whatsapp_inbox SET reply_status='sending' WHERE id=? AND tenant_id=? AND reply_status='review'").bind(id,tenant).run();
  if(!claim.meta?.changes)return json({detail:'This message is already being handled.'},409);
  try{
   const target=new URL('/api/assistant-integrations/actions',request.url);
   const actionRequest=new Request(target,{method:'POST',headers:{Authorization:request.headers.get('authorization')||'','Content-Type':'application/json'},body:JSON.stringify({provider:'whatsapp',external_account_id:route.integration_external_account_id,action:'send_message',confirm:true,payload:{phone_number_id:row.phone_number_id,to:row.sender,text:reply}})});
   const response=await handleAssistantIntegrations(actionRequest,env),data=await response?.json().catch(()=>({}));
   if(!response?.ok||data?.status!=='completed'||!data?.result?.messages?.[0]?.id)throw new Error('WhatsApp did not confirm the send.');
   await env.DB.prepare("UPDATE white_label_whatsapp_inbox SET reply_status='sent',reply_text=?,provider_reply_id=?,assistant_action_id=?,sent_at=? WHERE id=? AND tenant_id=? AND reply_status='sending'").bind(reply,trim(data.result.messages[0].id,120),trim(data.id,120),now(),id,tenant).run();
   return json({ok:true,id,reply_status:'sent',action_id:data.id});
  }catch(error){
   // Ambiguous provider failures must not auto-retry, because the provider may have delivered the reply.
   await env.DB.prepare("UPDATE white_label_whatsapp_inbox SET reply_status='needs-review' WHERE id=? AND tenant_id=? AND reply_status='sending'").bind(id,tenant).run();
   return json({detail:'Delivery was not confirmed. Check the connected WhatsApp account before resending.'},502);
  }
 }
 return json({detail:'Inbox route not found.'},404);
}

export async function handleWhiteLabelWhatsApp(request,env){
 const url=new URL(request.url);
 const runtimeEnv=await getIntegrationRuntimeEnv(env);
 if(url.pathname==='/api/white-label/native/whatsapp/webhook')return receive(request,runtimeEnv,url);
 if(!url.pathname.startsWith('/api/white-label/native/whatsapp/'))return null;
 if(!runtimeEnv.DB)return json({detail:'Inbox database is unavailable.'},503);
 try{return await privateInbox(request,runtimeEnv,url)}catch{return json({detail:'WhatsApp inbox request could not be completed.'},500)}
}
