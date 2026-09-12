import {currentUser,decrypt} from './integrations.js';
import {sendGrowthEmail} from './growth-email-transport.js';

const GLOBAL_SCOPE='__platform__';
const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clean=(v,n=500)=>String(v||'').trim().slice(0,n);
const emailOf=v=>clean(v,320).toLowerCase();
const safeJson=v=>{try{return JSON.stringify(v||{})}catch{return'{}'}};
const parse=v=>{try{return JSON.parse(String(v||'{}'))}catch{return{}}};
const rank={visitor:0,lead:1,qualified:2,checkout_started:3,abandoned_checkout:4,customer:5,retained:6};

async function ensureDefaults(env,scope=GLOBAL_SCOPE){
 await env.DB.prepare(`INSERT OR IGNORE INTO growth_funnels(id,scope_tenant_id,name,slug,status,stages_json,source_scope,created_at,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?)`).bind(`${scope}:revenue-recovery`,scope,'Magnanimous Revenue Recovery','revenue-recovery','active',JSON.stringify(['visitor','lead','qualified','checkout_started','abandoned_checkout','customer','retained']),'all-platform',now(),now()).run();
 await env.DB.prepare(`INSERT OR IGNORE INTO growth_settings(scope_tenant_id,automation_enabled,sender_name,reply_to_email,postal_address,first_followup_minutes,second_followup_minutes,updated_at)
 VALUES(?,1,'I AM MAGNANIMOUS WAY™','','',60,1440,?)`).bind(scope,now()).run();
}
async function settings(env,scope){await ensureDefaults(env,scope);return env.DB.prepare('SELECT * FROM growth_settings WHERE scope_tenant_id=?').bind(scope).first()}
async function consentForUser(env,userId){
 try{const row=await env.DB.prepare('SELECT marketing_consent,marketing_updated_at FROM consent_records WHERE user_id=?').bind(String(userId||'')).first();return{allowed:Number(row?.marketing_consent||0)===1,updated:Number(row?.marketing_updated_at||0)}}catch{return{allowed:false,updated:0}}
}
async function event(env,scope,leadId,type,source,detail='',metadata={}){
 await env.DB.prepare('INSERT INTO growth_events(scope_tenant_id,lead_id,event_type,source,detail,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)').bind(scope,leadId,type,source,clean(detail,1000),safeJson(metadata),now()).run();
}
async function upsertLead(env,input){
 const scope=clean(input.scopeTenantId||GLOBAL_SCOPE,160),email=emailOf(input.email);if(!email||!email.includes('@'))return null;
 await ensureDefaults(env,scope);
 const existing=await env.DB.prepare('SELECT * FROM growth_leads WHERE scope_tenant_id=? AND email=?').bind(scope,email).first();
 const requested=clean(input.stage||'lead',40),stage=(existing&&rank[existing.stage]>rank[requested])?existing.stage:requested;
 const explicit=typeof input.marketingConsent==='boolean',unsub=Number(existing?.unsubscribed_at||0)>0;
 const consent=unsub?0:explicit?(input.marketingConsent?1:0):Number(existing?.marketing_consent||0);
 const id=String(existing?.id||crypto.randomUUID()),token=String(existing?.unsubscribe_token||crypto.randomUUID().replaceAll('-',''));
 const metadata={...parse(existing?.metadata_json),...(input.metadata||{})};
 const ts=now();
 await env.DB.prepare(`INSERT INTO growth_leads(id,scope_tenant_id,customer_tenant_id,user_id,email,name,source,source_ref,stage,intent,marketing_consent,consent_source,consent_updated_at,checkout_provider,checkout_reference,checkout_url,checkout_started_at,converted_at,last_activity_at,metadata_json,unsubscribe_token,unsubscribed_at,created_at,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
 ON CONFLICT(scope_tenant_id,email) DO UPDATE SET
 customer_tenant_id=CASE WHEN excluded.customer_tenant_id<>'' THEN excluded.customer_tenant_id ELSE growth_leads.customer_tenant_id END,
 user_id=CASE WHEN excluded.user_id<>'' THEN excluded.user_id ELSE growth_leads.user_id END,
 name=CASE WHEN excluded.name<>'' THEN excluded.name ELSE growth_leads.name END,
 source=excluded.source,source_ref=CASE WHEN excluded.source_ref<>'' THEN excluded.source_ref ELSE growth_leads.source_ref END,
 stage=excluded.stage,intent=CASE WHEN excluded.intent<>'' THEN excluded.intent ELSE growth_leads.intent END,
 marketing_consent=excluded.marketing_consent,consent_source=CASE WHEN excluded.consent_source<>'' THEN excluded.consent_source ELSE growth_leads.consent_source END,
 consent_updated_at=COALESCE(excluded.consent_updated_at,growth_leads.consent_updated_at),
 checkout_provider=CASE WHEN excluded.checkout_provider<>'' THEN excluded.checkout_provider ELSE growth_leads.checkout_provider END,
 checkout_reference=CASE WHEN excluded.checkout_reference<>'' THEN excluded.checkout_reference ELSE growth_leads.checkout_reference END,
 checkout_url=CASE WHEN excluded.checkout_url<>'' THEN excluded.checkout_url ELSE growth_leads.checkout_url END,
 checkout_started_at=COALESCE(excluded.checkout_started_at,growth_leads.checkout_started_at),
 converted_at=COALESCE(excluded.converted_at,growth_leads.converted_at),
 last_activity_at=excluded.last_activity_at,metadata_json=excluded.metadata_json,updated_at=excluded.updated_at`)
 .bind(id,scope,clean(input.customerTenantId,160),clean(input.userId,160),email,clean(input.name,200),clean(input.source||'platform',80),clean(input.sourceRef,500),stage,clean(input.intent,250),consent,clean(input.consentSource,100),input.consentUpdatedAt||null,clean(input.checkoutProvider,60),clean(input.checkoutReference,300),clean(input.checkoutUrl,1400),input.checkoutStartedAt||null,input.convertedAt||null,ts,safeJson(metadata),token,existing?.unsubscribed_at||null,existing?.created_at||ts,ts).run();
 const lead=await env.DB.prepare('SELECT * FROM growth_leads WHERE scope_tenant_id=? AND email=?').bind(scope,email).first();
 await event(env,scope,lead.id,input.eventType||'lead.updated',input.source||'platform',input.intent||'',metadata);
 return lead;
}
async function queueRecovery(env,lead){
 if(!lead||Number(lead.marketing_consent)!==1||lead.unsubscribed_at||!lead.checkout_url||lead.stage==='customer')return;
 const cfg=await settings(env,lead.scope_tenant_id);if(Number(cfg?.automation_enabled||0)!==1)return;
 const start=Number(lead.checkout_started_at||now()),delays=[Math.max(5,Number(cfg.first_followup_minutes||60))*60,Math.max(60,Number(cfg.second_followup_minutes||1440))*60];
 const copy=[
  ['Your checkout is still available','You started checkout but did not finish. Your saved checkout link is below if you still want to continue.'],
  ['Still want to finish your checkout?','Your checkout is still available. If you changed your mind, you can ignore this message or unsubscribe below.']
 ];
 for(let i=0;i<2;i++)await env.DB.prepare(`INSERT OR IGNORE INTO growth_outreach_queue(id,scope_tenant_id,lead_id,sequence_key,step,scheduled_at,status,subject,body_text,action_url,transport,created_at,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?,?,?, ?,?)`).bind(crypto.randomUUID(),lead.scope_tenant_id,lead.id,'abandoned-checkout',i+1,start+delays[i],'queued',copy[i][0],copy[i][1],lead.checkout_url,'auto',now(),now()).run();
}
async function cancelRecovery(env,leadId,reason='converted'){
 await env.DB.prepare("UPDATE growth_outreach_queue SET status='cancelled',cancelled_at=?,last_error=?,updated_at=? WHERE lead_id=? AND status IN ('queued','waiting-sender','waiting-compliance','retry')").bind(now(),reason,now(),leadId).run();
}
async function markConverted(env,{scope=GLOBAL_SCOPE,reference='',email='',source='platform'}){
 let lead=null;if(reference)lead=await env.DB.prepare('SELECT * FROM growth_leads WHERE scope_tenant_id=? AND checkout_reference=? ORDER BY updated_at DESC LIMIT 1').bind(scope,reference).first();
 if(!lead&&email)lead=await env.DB.prepare('SELECT * FROM growth_leads WHERE scope_tenant_id=? AND email=?').bind(scope,emailOf(email)).first();if(!lead)return null;
 await env.DB.prepare("UPDATE growth_leads SET stage='customer',converted_at=?,last_activity_at=?,updated_at=? WHERE id=?").bind(now(),now(),now(),lead.id).run();await cancelRecovery(env,lead.id,'payment completed');await event(env,scope,lead.id,'checkout.completed',source,'Payment completed',{reference});return lead;
}
export async function recordSignupLead(env,user,body={}){
 if(!user?.email)return null;return upsertLead(env,{scopeTenantId:GLOBAL_SCOPE,customerTenantId:user.tenant_id,userId:user.id,email:user.email,name:user.name,source:'signup',stage:'lead',intent:'created Magnanimous account',marketingConsent:body.marketingConsent===true,consentSource:'signup',consentUpdatedAt:now(),eventType:'account.created'});
}
export async function recordPlatformCheckout(env,user,body={},checkout={}){
 if(!user?.email||!checkout?.url)return null;const c=await consentForUser(env,user.id);
 const lead=await upsertLead(env,{scopeTenantId:GLOBAL_SCOPE,customerTenantId:user.tenant_id,userId:user.id,email:user.email,name:user.name,source:'magnanimous-pricing',stage:'checkout_started',intent:`plan:${clean(body.plan,40)}`,marketingConsent:c.allowed,consentSource:'account-consent',consentUpdatedAt:c.updated||now(),checkoutProvider:'stripe',checkoutReference:checkout.session_id,checkoutUrl:checkout.url,checkoutStartedAt:now(),eventType:'checkout.started',metadata:{plan:clean(body.plan,40)}});
 await queueRecovery(env,lead);return lead;
}
export async function recordStripeGrowthEvent(env,eventData){
 const eventType=String(eventData?.type||''),object=eventData?.data?.object||{};if(eventType==='checkout.session.completed')return markConverted(env,{scope:GLOBAL_SCOPE,reference:String(object.id||''),email:String(object.customer_details?.email||object.customer_email||''),source:'stripe'});
 return null;
}
async function shopifyGraph(shop,token,query,variables={}){
 const r=await fetch(`https://${shop}/admin/api/2026-07/graphql.json`,{method:'POST',headers:{'content-type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables})});const d=await r.json().catch(()=>({}));if(!r.ok||d.errors?.length)throw new Error(d.errors?.map(x=>x.message).join('; ')||`Shopify sync failed (${r.status})`);return d.data||{};
}
function shopAddress(shop){return Array.isArray(shop?.shopAddress?.formatted)?shop.shopAddress.formatted.filter(Boolean).join(', '):''}
async function syncShopifyConnection(env,row){
 const meta=parse(row.metadata_json),shop=clean(meta.shop_domain||row.external_account_id,300).toLowerCase();if(!shop)return{ok:false,error:'Shopify shop domain missing'};
 const token=await decrypt(String(row.access_token||''),env);if(!token)return{ok:false,error:'Shopify connection needs reauthorization'};
 const query=`query GrowthAbandoned { shop { name contactEmail shopAddress { formatted(withCompany:true) } } abandonedCheckouts(first:100, reverse:true) { nodes { id name createdAt updatedAt completedAt abandonedCheckoutUrl customer { displayName defaultEmailAddress { emailAddress marketingState marketingUpdatedAt marketingUnsubscribeUrl } } } } }`;
 try{
  const data=await shopifyGraph(shop,token,query),scope=String(row.tenant_id),merchant=data.shop||{};await ensureDefaults(env,scope);
  const addr=shopAddress(merchant);if(addr)await env.DB.prepare("UPDATE growth_settings SET postal_address=CASE WHEN postal_address='' THEN ? ELSE postal_address END,reply_to_email=CASE WHEN reply_to_email='' THEN ? ELSE reply_to_email END,sender_name=CASE WHEN sender_name='I AM MAGNANIMOUS WAY™' THEN ? ELSE sender_name END,updated_at=? WHERE scope_tenant_id=?").bind(addr,clean(merchant.contactEmail,320),clean(merchant.name||'Store',120),now(),scope).run();
  let count=0;for(const item of data?.abandonedCheckouts?.nodes||[]){const em=item?.customer?.defaultEmailAddress,email=em?.emailAddress;if(!email)continue;const subscribed=String(em?.marketingState||'').toUpperCase()==='SUBSCRIBED';
   const complete=!!item.completedAt;const lead=await upsertLead(env,{scopeTenantId:scope,email,name:item?.customer?.displayName||'',source:'shopify',sourceRef:item.id,stage:complete?'customer':'abandoned_checkout',intent:`shopify checkout ${item.name||''}`,marketingConsent:subscribed,consentSource:'shopify-marketing-state',consentUpdatedAt:item.updatedAt?Math.floor(new Date(item.updatedAt).getTime()/1000):now(),checkoutProvider:'shopify',checkoutReference:item.id,checkoutUrl:String(item.abandonedCheckoutUrl||''),checkoutStartedAt:item.createdAt?Math.floor(new Date(item.createdAt).getTime()/1000):now(),convertedAt:complete?Math.floor(new Date(item.completedAt).getTime()/1000):null,eventType:complete?'checkout.completed':'checkout.abandoned',metadata:{shop_domain:shop,checkout_name:item.name||'',shopify_unsubscribe_url:String(em?.marketingUnsubscribeUrl||'')}});
   if(complete)await cancelRecovery(env,lead.id,'Shopify checkout recovered');else await queueRecovery(env,lead);count++;
  }
  await env.DB.prepare(`INSERT INTO growth_sync_state(scope_tenant_id,provider,cursor,last_sync_at,last_error,updated_at) VALUES(?,'shopify','',?,'',?) ON CONFLICT(scope_tenant_id,provider) DO UPDATE SET last_sync_at=excluded.last_sync_at,last_error='',updated_at=excluded.updated_at`).bind(scope,now(),now()).run();
  return{ok:true,count,shop};
 }catch(error){await env.DB.prepare(`INSERT INTO growth_sync_state(scope_tenant_id,provider,cursor,last_sync_at,last_error,updated_at) VALUES(?,'shopify','',NULL,?,?) ON CONFLICT(scope_tenant_id,provider) DO UPDATE SET last_error=excluded.last_error,updated_at=excluded.updated_at`).bind(String(row.tenant_id),clean(error?.message,1000),now()).run().catch(()=>{});return{ok:false,error:clean(error?.message,1000),shop}}
}
export async function syncShopifyGrowth(env){
 let rows=[];try{rows=(await env.DB.prepare("SELECT tenant_id,external_account_id,access_token,metadata_json FROM integrations WHERE provider='shopify'").all()).results||[]}catch{return{connections:0,synced:0,errors:[]}}
 let synced=0;const errors=[];for(const row of rows){const r=await syncShopifyConnection(env,row);if(r.ok)synced+=r.count||0;else errors.push(r.error)}return{connections:rows.length,synced,errors};
}
export async function processGrowthOutreach(env,origin='https://iammagnanimousway.com'){
 const due=(await env.DB.prepare(`SELECT q.*,l.email,l.name,l.marketing_consent,l.unsubscribed_at,l.stage,l.metadata_json FROM growth_outreach_queue q JOIN growth_leads l ON l.id=q.lead_id WHERE q.status IN ('queued','retry','waiting-sender','waiting-compliance') AND q.scheduled_at<=? ORDER BY q.scheduled_at LIMIT 30`).bind(now()).all()).results||[];let sent=0,waiting=0,cancelled=0;
 for(const item of due){if(Number(item.marketing_consent)!==1||item.unsubscribed_at||['customer','retained'].includes(item.stage)){await cancelRecovery(env,item.lead_id,'consent removed or customer converted');cancelled++;continue}
  const cfg=await settings(env,item.scope_tenant_id);if(Number(cfg.automation_enabled)!==1){await env.DB.prepare("UPDATE growth_outreach_queue SET status='cancelled',cancelled_at=?,last_error='automation disabled',updated_at=? WHERE id=?").bind(now(),now(),item.id).run();cancelled++;continue}
  if(!clean(cfg.postal_address,500)){await env.DB.prepare("UPDATE growth_outreach_queue SET status='waiting-compliance',last_error='Add a valid business postal address in Growth Funnel settings before commercial recovery mail sends.',updated_at=? WHERE id=?").bind(now(),item.id).run();waiting++;continue}
  const lead=await env.DB.prepare('SELECT unsubscribe_token,metadata_json FROM growth_leads WHERE id=?').bind(item.lead_id).first(),meta=parse(lead?.metadata_json);
  const unsub=`${String(origin||'https://iammagnanimousway.com').replace(/\/$/,'')}/api/growth/unsubscribe?token=${encodeURIComponent(lead.unsubscribe_token)}`;
  const body=`${item.body_text}\n\nContinue checkout: ${item.action_url}\n\nIf you do not want these follow-ups, unsubscribe: ${unsub}${meta.shopify_unsubscribe_url?`\nShopify preferences: ${meta.shopify_unsubscribe_url}`:''}\n\n${cfg.sender_name}\n${cfg.postal_address}`;
  const result=await sendGrowthEmail(env,{scopeTenantId:item.scope_tenant_id,to:item.email,subject:item.subject,text:body,replyTo:cfg.reply_to_email,senderName:cfg.sender_name});
  if(result.ok){await env.DB.prepare("UPDATE growth_outreach_queue SET status='sent',sent_at=?,provider_receipt=?,last_error='',updated_at=? WHERE id=?").bind(now(),clean(result.receipt,300),now(),item.id).run();await event(env,item.scope_tenant_id,item.lead_id,'outreach.sent','growth-automation',item.subject,{step:item.step});sent++}
  else{const state=result.code==='NO_SENDER'||result.code==='SENDER_AUTH'?'waiting-sender':'retry';await env.DB.prepare('UPDATE growth_outreach_queue SET status=?,last_error=?,updated_at=? WHERE id=?').bind(state,clean(result.error,1000),now(),item.id).run();waiting++}
 }
 return{due:due.length,sent,waiting,cancelled};
}
export async function scheduledGrowth(env,origin){const shopify=await syncShopifyGrowth(env);const outreach=await processGrowthOutreach(env,origin);return{shopify,outreach}}

async function adminUser(request,env){const user=await currentUser(request,env);if(!user||!['owner','admin','super_admin','superadmin'].includes(String(user.role||'').toLowerCase()))return null;return user}
export async function handleGrowthRecovery(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/growth'))return null;
 if(path==='/api/growth/unsubscribe'&&request.method==='GET'){const token=clean(url.searchParams.get('token'),200),lead=await env.DB.prepare('SELECT * FROM growth_leads WHERE unsubscribe_token=?').bind(token).first();if(!lead)return new Response('This unsubscribe link is no longer valid.',{status:404,headers:{'content-type':'text/plain; charset=utf-8'}});await env.DB.prepare('UPDATE growth_leads SET marketing_consent=0,unsubscribed_at=?,updated_at=? WHERE id=?').bind(now(),now(),lead.id).run();await cancelRecovery(env,lead.id,'unsubscribed');await event(env,lead.scope_tenant_id,lead.id,'marketing.unsubscribed','recipient','');return new Response('<!doctype html><meta charset="utf-8"><title>Unsubscribed</title><main style="font-family:system-ui;max-width:680px;margin:60px auto;padding:24px"><h1>You are unsubscribed.</h1><p>Magnanimous will not send automated marketing or checkout recovery email to this address unless you explicitly subscribe again.</p><a href="/">Return to I AM MAGNANIMOUS WAY™</a></main>',{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}})}
 const user=await adminUser(request,env);if(!user)return json({detail:'Owner or admin access is required.'},401);
 if(path==='/api/growth/overview'&&request.method==='GET'){await ensureDefaults(env,GLOBAL_SCOPE);const counts=(await env.DB.prepare('SELECT stage,COUNT(*) count FROM growth_leads GROUP BY stage').all()).results||[],queue=(await env.DB.prepare('SELECT status,COUNT(*) count FROM growth_outreach_queue GROUP BY status').all()).results||[],sync=(await env.DB.prepare('SELECT * FROM growth_sync_state ORDER BY updated_at DESC').all()).results||[],cfg=await settings(env,GLOBAL_SCOPE);return json({funnel:'Magnanimous Revenue Recovery',stages:['visitor','lead','qualified','checkout_started','abandoned_checkout','customer','retained'],lead_counts:counts,outreach:queue,sync,settings:cfg,autonomy:{lead_memory:'first-party D1',funnel:'first-party',queue:'first-party',delivery:'replaceable email adapter',shopify:'scheduled connected-store sync'}})}
 if(path==='/api/growth/leads'&&request.method==='GET'){const stage=clean(url.searchParams.get('stage'),40);const result=stage?await env.DB.prepare('SELECT * FROM growth_leads WHERE stage=? ORDER BY last_activity_at DESC LIMIT 250').bind(stage).all():await env.DB.prepare('SELECT * FROM growth_leads ORDER BY last_activity_at DESC LIMIT 250').all();return json({leads:result.results||[]})}
 if(path==='/api/growth/settings'&&request.method==='GET')return json({settings:await settings(env,GLOBAL_SCOPE)});
 if(path==='/api/growth/settings'&&request.method==='PATCH'){const body=await request.json().catch(()=>({})),cfg=await settings(env,GLOBAL_SCOPE);await env.DB.prepare('UPDATE growth_settings SET automation_enabled=?,sender_name=?,reply_to_email=?,postal_address=?,first_followup_minutes=?,second_followup_minutes=?,updated_at=? WHERE scope_tenant_id=?').bind(body.automation_enabled===false?0:1,clean(body.sender_name||cfg.sender_name,160),emailOf(body.reply_to_email||cfg.reply_to_email),clean(body.postal_address||cfg.postal_address,500),Math.max(5,Number(body.first_followup_minutes||cfg.first_followup_minutes||60)),Math.max(60,Number(body.second_followup_minutes||cfg.second_followup_minutes||1440)),now(),GLOBAL_SCOPE).run();return json({settings:await settings(env,GLOBAL_SCOPE)})}
 if(path==='/api/growth/run'&&request.method==='POST')return json(await scheduledGrowth(env,new URL(request.url).origin));
 return json({detail:'Growth route not found.'},404);
}
