import {currentUser} from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
export const AGENCY_PLANS={
 agency:{id:'agency',name:'Magnanimous Agency',price_usd:299,cadence:'month',description:'White-label agency operations for client accounts, funnels, booking, reputation, automations, lead recovery and usage rebilling.',features:['Everything in Scale','White-label client workspaces','Up to 25 managed client subaccounts','Funnels + booking + reputation','Automation + Unified Inbox','Lead and abandoned-checkout recovery','Usage rebilling'],entitlements:{metered_ai:true,pstn_minutes:240,avatar_minutes:90,premium_video_credits:90,cost_ceiling_usd:170,white_label:true,client_subaccounts:25,usage_rebilling:true}},
 agency_pro:{id:'agency_pro',name:'Magnanimous Agency Pro',price_usd:499,cadence:'month',description:'Higher-capacity white-label agency operations for larger client portfolios and expanded automation.',features:['Everything in Agency','Up to 100 managed client subaccounts','Higher automation capacity','Higher calling/avatar/video capacity','Expanded white-label operations','Priority agency support path'],entitlements:{metered_ai:true,pstn_minutes:360,avatar_minutes:120,premium_video_credits:120,cost_ceiling_usd:280,white_label:true,client_subaccounts:100,usage_rebilling:true}}
};
const isAgency=p=>Object.prototype.hasOwnProperty.call(AGENCY_PLANS,String(p||'').toLowerCase());
const planPrice=(env,p)=>String(env[p==='agency'?'STRIPE_PRICE_AGENCY':'STRIPE_PRICE_AGENCY_PRO']||'');
const planPaymentLink=(env,p)=>String(env[p==='agency'?'STRIPE_PAYMENT_LINK_AGENCY':'STRIPE_PAYMENT_LINK_AGENCY_PRO']||'').trim();
const enc=new TextEncoder();
async function hmacHex(secret,value){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const out=await crypto.subtle.sign('HMAC',key,enc.encode(value));return[...new Uint8Array(out)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function safeEqual(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
async function makeAgencyReference(env,tenantId,plan){const secret=String(env.SESSION_SECRET||'').trim();if(!secret||!tenantId||!isAgency(plan))return'';const payload=`agency:${tenantId}:${plan}`;return `${payload}:${await hmacHex(secret,payload)}`}
async function parseAgencyReference(env,value){const raw=String(value||''),parts=raw.split(':');if(parts.length!==4||parts[0]!=='agency'||!isAgency(parts[2]))return null;const payload=parts.slice(0,3).join(':'),secret=String(env.SESSION_SECRET||'').trim();if(!secret)return null;const expected=await hmacHex(secret,payload);if(!safeEqual(parts[3],expected))return null;return{tenant_id:parts[1],plan:parts[2]}}
function agencyCheckoutConfigured(env,p){return Boolean((env.STRIPE_SECRET_KEY&&planPrice(env,p))||planPaymentLink(env,p))}
const periodKey=()=>{const d=new Date();return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`};
async function stripe(env,path,options={}){
 if(!env.STRIPE_SECRET_KEY)return{ok:false,data:{error:{message:'Stripe is not configured.'}}};
 const r=await fetch(`https://api.stripe.com${path}`,{...options,headers:{authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,...(options.headers||{})}});const d=await r.json().catch(()=>({}));return{ok:r.ok,status:r.status,data:d};
}
function siteOrigin(request,env){return String(env.PUBLIC_SITE_URL||'').trim().replace(/\/$/,'')||new URL(request.url).origin}
async function savePlan(env,tenantId,{plan,customer_id=null,subscription_id=null,status='active',current_period_end=null}){
 const ts=now(),existing=await env.DB.prepare('SELECT * FROM billing_subscriptions WHERE tenant_id=?').bind(tenantId).first();
 await env.DB.prepare(`INSERT INTO billing_subscriptions(tenant_id,plan,stripe_customer_id,stripe_subscription_id,status,current_period_end,created_at,updated_at)
 VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id) DO UPDATE SET plan=excluded.plan,stripe_customer_id=COALESCE(excluded.stripe_customer_id,billing_subscriptions.stripe_customer_id),stripe_subscription_id=COALESCE(excluded.stripe_subscription_id,billing_subscriptions.stripe_subscription_id),status=excluded.status,current_period_end=excluded.current_period_end,updated_at=excluded.updated_at`)
 .bind(tenantId,plan,customer_id||existing?.stripe_customer_id||null,subscription_id||existing?.stripe_subscription_id||null,status,current_period_end,existing?.created_at||ts,ts).run();
 await env.DB.prepare('UPDATE tenants SET plan=? WHERE id=?').bind(plan,tenantId).run();
}
async function refresh(env,user,row){
 if(!row?.stripe_subscription_id||!env.STRIPE_SECRET_KEY)return row;
 const r=await stripe(env,`/v1/subscriptions/${encodeURIComponent(row.stripe_subscription_id)}`);if(!r.ok||!r.data?.id)return row;
 const active=String(r.data.status||'')==='active';const metadataPlan=String(r.data?.metadata?.plan||row.plan||'');
 if(active&&isAgency(metadataPlan)){await savePlan(env,user.tenant_id,{plan:metadataPlan,customer_id:String(r.data.customer||''),subscription_id:r.data.id,status:r.data.status,current_period_end:Number(r.data.current_period_end||0)||null});return env.DB.prepare('SELECT * FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first()}
 if(!active){await savePlan(env,user.tenant_id,{plan:'free',customer_id:String(r.data.customer||''),subscription_id:r.data.id,status:String(r.data.status||'inactive'),current_period_end:Number(r.data.current_period_end||0)||null});return null}
 return row;
}
export function extendPlansPayload(data,env){
 const base=Array.isArray(data?.plans)?data.plans.filter(p=>!isAgency(p.id)):[];
 return{...data,plans:[...base,...Object.values(AGENCY_PLANS).map(p=>({...p,checkout_configured:agencyCheckoutConfigured(env,p.id),checkout_mode:env.STRIPE_SECRET_KEY&&planPrice(env,p.id)?'checkout_session':planPaymentLink(env,p.id)?'payment_link':'unavailable',target_gross_margin_percent:Number(env.TARGET_GROSS_MARGIN_PERCENT||20)}))],agency_white_label:true,ordinary_user_max_usd:199};
}
async function agencyStatus(env,user){
 let row=await env.DB.prepare('SELECT * FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();if(!isAgency(row?.plan))return null;row=await refresh(env,user,row);if(!row||!isAgency(row.plan)||String(row.status||'')!=='active')return null;
 const plan=AGENCY_PLANS[row.plan],usage=await env.DB.prepare('SELECT direct_variable_cost_usd FROM billing_usage_guard WHERE tenant_id=? AND period_key=?').bind(user.tenant_id,periodKey()).first(),used=Number(usage?.direct_variable_cost_usd||0),ceiling=Number(plan.entitlements.cost_ceiling_usd||0);
 return json({plan:plan.id,plan_name:plan.name,subscription:{plan:plan.id,status:row.status,current_period_end:row.current_period_end},entitlements:plan.entitlements,direct_variable_cost_usd:used,cost_ceiling_usd:ceiling,premium_usage_allowed:used<ceiling,billing_configured:agencyCheckoutConfigured(env,plan.id),portal_configured:Boolean(env.STRIPE_SECRET_KEY&&row.stripe_customer_id),white_label_enabled:true,managed_client_limit:plan.entitlements.client_subaccounts,usage_rebilling:true});
}
async function checkout(request,env,user,body){
 const plan=String(body.plan||'').toLowerCase(),config=AGENCY_PLANS[plan];if(!config)return null;const requiredTerms=plan==='agency_pro'?'agency-pro-2026-09-18.1':'agency-2026-09-18.1';if(body.termsAccepted!==true||String(body.termsVersion||'')!==requiredTerms)return json({detail:'The terms for the selected White Label plan must be accepted before checkout.',code:'TERMS_ACCEPTANCE_REQUIRED',requiredTerms},428);
 const existing=await env.DB.prepare("SELECT plan,status FROM billing_subscriptions WHERE tenant_id=? AND status='active'").bind(user.tenant_id).first();if(existing)return json({detail:'You already have an active subscription. Use Manage subscription to change it.',code:'ACTIVE_SUBSCRIPTION_EXISTS'},409);
 const reference=await makeAgencyReference(env,String(user.tenant_id),plan);if(!reference)return json({detail:'Secure White Label checkout identity is not configured.',code:'CHECKOUT_IDENTITY_NOT_CONFIGURED'},503);
 const price=planPrice(env,plan);
 if(env.STRIPE_SECRET_KEY&&price){
  const form=new URLSearchParams();form.set('mode','subscription');form.set('line_items[0][price]',price);form.set('line_items[0][quantity]','1');form.set('client_reference_id',reference);form.set('customer_email',String(user.email||''));form.set('metadata[tenant_id]',String(user.tenant_id));form.set('metadata[plan]',plan);form.set('metadata[terms_version]',String(body.termsVersion));form.set('metadata[terms_accepted]','true');form.set('subscription_data[metadata][tenant_id]',String(user.tenant_id));form.set('subscription_data[metadata][plan]',plan);form.set('subscription_data[metadata][terms_version]',String(body.termsVersion));form.set('allow_promotion_codes','true');
  const origin=siteOrigin(request,env);form.set('success_url',`${origin}/white-label?checkout=success&plan=${encodeURIComponent(plan)}&session_id={CHECKOUT_SESSION_ID}`);form.set('cancel_url',`${origin}/white-label?checkout=cancelled&plan=${encodeURIComponent(plan)}`);
  const r=await stripe(env,'/v1/checkout/sessions',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:form.toString()});if(!r.ok||!r.data?.url)return json({detail:r.data?.error?.message||'Stripe could not create agency checkout.'},502);return json({url:r.data.url,session_id:r.data.id,plan,mode:'checkout_session'});
 }
 const link=planPaymentLink(env,plan);if(!link)return json({detail:`${config.name} checkout is not configured yet.`,code:'STRIPE_NOT_CONFIGURED'},503);
 let target;try{target=new URL(link)}catch{return json({detail:'White Label payment link configuration is invalid.'},503)}
 target.searchParams.set('client_reference_id',reference);
 return json({url:target.toString(),plan,mode:'payment_link',verification:'signed_webhook'});
}
async function confirm(request,env,user,body){
 const plan=String(body.plan||'').toLowerCase();if(!isAgency(plan))return null;const sessionId=String(body.session_id||'');if(!/^cs_[A-Za-z0-9_]+$/.test(sessionId))return json({detail:'A valid Stripe Checkout session is required.'},400);
 if(!env.STRIPE_SECRET_KEY){const row=await env.DB.prepare('SELECT plan,status,current_period_end FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();if(String(row?.plan||'')===plan&&String(row?.status||'')==='active')return json({confirmed:true,plan,status:'active',current_period_end:Number(row?.current_period_end||0)||null,white_label_enabled:true,verification:'signed_webhook'});return json({confirmed:false,plan:'free',status:'awaiting_signed_webhook'},202)}
 const s=await stripe(env,`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);if(!s.ok||!s.data?.id)return json({detail:s.data?.error?.message||'Stripe checkout could not be verified.'},502);
 const reference=await parseAgencyReference(env,s.data?.client_reference_id),metadataTenant=String(s.data?.metadata?.tenant_id||''),actual=String(s.data?.metadata?.plan||plan).toLowerCase();const tenant=metadataTenant||reference?.tenant_id||'';if(tenant!==String(user.tenant_id)||!isAgency(actual)||(reference?.plan&&reference.plan!==actual))return json({detail:'This checkout does not belong to the signed-in account.'},403);
 const complete=String(s.data.status||'')==='complete'&&String(s.data.payment_status||'')==='paid';if(!complete)return json({confirmed:false,plan:'free',status:String(s.data.payment_status||s.data.status||'open')});
 let sub=null;if(s.data.subscription){const r=await stripe(env,`/v1/subscriptions/${encodeURIComponent(s.data.subscription)}`);if(r.ok)sub=r.data}
 const status=String(sub?.status||'active');if(status!=='active')return json({confirmed:false,plan:'free',status});
 await savePlan(env,user.tenant_id,{plan:actual,customer_id:String(s.data.customer||sub?.customer||''),subscription_id:String(s.data.subscription||sub?.id||''),status:'active',current_period_end:Number(sub?.current_period_end||0)||null});return json({confirmed:true,plan:actual,status:'active',current_period_end:Number(sub?.current_period_end||0)||null,white_label_enabled:true});
}
export async function handleAgencyBillingBefore(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/billing/status'||path==='/api/billing/entitlements'){if(request.method!=='GET')return null;const user=await currentUser(request,env);if(!user)return null;return agencyStatus(env,user)}
 if(path==='/api/billing/checkout'&&request.method==='POST'){const body=await request.clone().json().catch(()=>({}));if(!isAgency(body.plan))return null;const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);return checkout(request,env,user,body)}
 if(path==='/api/billing/confirm'&&request.method==='POST'){const body=await request.clone().json().catch(()=>({}));if(!isAgency(body.plan))return null;const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);return confirm(request,env,user,body)}
 return null;
}
async function agencyCheckoutIdentity(env,object){
 const metadataPlan=String(object?.metadata?.plan||'').toLowerCase();if(!isAgency(metadataPlan))return null;
 const metadataTenant=String(object?.metadata?.tenant_id||'').trim(),reference=await parseAgencyReference(env,object?.client_reference_id);const tenant=metadataTenant||reference?.tenant_id||'';if(!tenant||(reference?.plan&&reference.plan!==metadataPlan))return null;
 const exists=await env.DB.prepare('SELECT id FROM tenants WHERE id=? LIMIT 1').bind(tenant).first();if(!exists?.id)return null;return{tenant,plan:metadataPlan};
}
export async function applyAgencyWebhook(env,event,response){
 if(!response?.ok)return;const type=String(event?.type||''),object=event?.data?.object||{};
 if(type==='checkout.session.completed'||type==='checkout.session.async_payment_succeeded'){
  const identity=await agencyCheckoutIdentity(env,object);if(!identity)return;const paid=String(object?.payment_status||'').toLowerCase()==='paid';if(!paid)return;
  await savePlan(env,identity.tenant,{plan:identity.plan,customer_id:String(object.customer||''),subscription_id:String(object.subscription||''),status:'active'});return;
 }
 if(type==='checkout.session.async_payment_failed'){
  const identity=await agencyCheckoutIdentity(env,object);if(identity)await savePlan(env,identity.tenant,{plan:'free',customer_id:String(object.customer||''),subscription_id:String(object.subscription||''),status:'payment_failed'});return;
 }
 if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(type)){
  let plan=String(object?.metadata?.plan||'').toLowerCase(),tenant=String(object?.metadata?.tenant_id||'').trim(),row=null;if(!tenant||!isAgency(plan)){row=await env.DB.prepare('SELECT tenant_id,plan FROM billing_subscriptions WHERE stripe_subscription_id=? LIMIT 1').bind(String(object.id||'')).first();tenant=tenant||String(row?.tenant_id||'');plan=isAgency(plan)?plan:String(row?.plan||'').toLowerCase()}
  if(!tenant||!isAgency(plan))return;const status=String(object.status||(type.endsWith('.deleted')?'canceled':'inactive')),active=status==='active'&&!type.endsWith('.deleted');await savePlan(env,tenant,{plan:active?plan:'free',customer_id:String(object.customer||''),subscription_id:String(object.id||''),status,current_period_end:Number(object.current_period_end||0)||null});return;
 }
}
