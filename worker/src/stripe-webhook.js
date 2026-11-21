import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { ensureStripeWebhookEventClaims, claimStripeWebhookEvent, completeStripeWebhookEvent, failStripeWebhookEvent } from './stripe-webhook-idempotency.js';

const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const retryJson=(x)=>new Response(JSON.stringify(x),{status:503,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','retry-after':'30'}});
const enc=new TextEncoder();
const now=()=>Math.floor(Date.now()/1000);
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
function safeEqual(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
function parseSignature(header){const out={t:'',v1:[]};for(const part of String(header||'').split(',')){const [key,...rest]=part.trim().split('='),value=rest.join('=');if(key==='t')out.t=value;if(key==='v1'&&value)out.v1.push(value)}return out}
async function verify(payload,header,secret){
 const parsed=parseSignature(header),stamp=Number(parsed.t);
 if(!parsed.t||!parsed.v1.length||!Number.isFinite(stamp)||Math.abs(now()-stamp)>300)return false;
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const expected=hex(await crypto.subtle.sign('HMAC',key,enc.encode(parsed.t+'.'+payload)));
 return parsed.v1.some(signature=>safeEqual(signature,expected));
}
export async function handleStripeWebhook(request,env,path){
 if(path!=='/api/webhooks/stripe'||request.method!=='POST')return null;
 const runtimeEnv=await getProviderRuntimeEnv(env),secret=String(runtimeEnv.STRIPE_WEBHOOK_SECRET||'').trim();
 if(!secret)return json({detail:'Stripe webhook verification is not configured.'},503);
 const raw=await request.text();if(!(await verify(raw,request.headers.get('stripe-signature'),secret)))return json({detail:'Invalid or expired Stripe signature.'},401);
 let event;try{event=JSON.parse(raw)}catch{return json({detail:'Invalid Stripe webhook payload.'},400)}
 const eventId=String(event?.id||'');if(!eventId)return json({detail:'Stripe event id is required.'},400);
 await ensureStripeWebhookEventClaims(runtimeEnv);
 const claim=await claimStripeWebhookEvent(runtimeEnv,{eventId,eventType:String(event?.type||''),processor:'music'});
 if(claim.duplicate)return json({received:true,duplicate:true});
 if(!claim.claimed)return retryJson({detail:'This Stripe music event is already being processed. The provider should retry shortly.'});
 try{
  const object=event.data?.object||{},metadata=object.metadata||object.subscription_details?.metadata||{};
  if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(String(event.type||''))){
   const userId=String(metadata.user_id||''),tenantId=String(metadata.tenant_id||'');
   if(userId&&tenantId)await runtimeEnv.DB.prepare(`INSERT INTO music_entitlements(tenant_id,user_id,stripe_customer_id,stripe_subscription_id,stripe_event_id,status,current_period_end,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,user_id) DO UPDATE SET stripe_customer_id=excluded.stripe_customer_id,stripe_subscription_id=excluded.stripe_subscription_id,stripe_event_id=excluded.stripe_event_id,status=excluded.status,current_period_end=excluded.current_period_end,updated_at=excluded.updated_at`).bind(tenantId,userId,String(object.customer||''),String(object.id||''),eventId,String(object.status||'inactive'),Number(object.current_period_end||0),now()).run();
  }
  await runtimeEnv.DB.prepare('INSERT OR IGNORE INTO stripe_events(id,event_type,processed_at) VALUES(?,?,?)').bind(eventId,String(event.type||''),now()).run();
  await completeStripeWebhookEvent(runtimeEnv,{eventId,processor:'music',claimToken:claim.claimToken});
  return json({received:true});
 }catch(error){
  await failStripeWebhookEvent(runtimeEnv,{eventId,processor:'music',claimToken:claim.claimToken,errorCode:error?.name||'processing_failed'}).catch(()=>false);
  console.error('Stripe music webhook processing failed',{event_id:eventId,error_name:String(error?.name||'Error')});
  return retryJson({detail:'Stripe music event processing could not be completed. A provider retry is required.'});
 }
}
