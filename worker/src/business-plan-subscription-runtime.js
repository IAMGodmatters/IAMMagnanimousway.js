import { handleBusinessPlan as handleLegacyBusinessPlan } from './business-plan-runtime.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const PLAN_MONTHLY_PRICE_ID='price_1UBPMoDuxV2kib03YdE09xf0';
const PLAN_MONTHLY_PRICE_USD=79;
const ACTIVE_STATUSES=new Set(['active','trialing','past_due']);

async function hmacHex(secret,value){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function safeEqual(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
async function sessionSecret(env){
  const configured=String(env.SESSION_SECRET||'').trim();if(configured)return configured;
  try{const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();return String(row?.value||'')}catch{return''}
}
async function currentUser(request,env){
  const raw=request.headers.get('authorization')||'';if(!raw.startsWith('Bearer '))return null;
  const parts=raw.slice(7).split('|');if(parts.length!==5||Number(parts[3])<now())return null;
  const [userId,tenantId,role,exp,sig]=parts,secret=await sessionSecret(env);
  if(!secret||!safeEqual(sig,await hmacHex(secret,`${userId}|${tenantId}|${role}|${exp}`)))return null;
  return env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId,tenantId).first();
}
async function ensureSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS business_plan_subscriptions(
    project_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    stripe_subscription_id TEXT NOT NULL,
    stripe_session_id TEXT,
    status TEXT NOT NULL DEFAULT 'incomplete',
    current_period_end INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_business_plan_sub_tenant ON business_plan_subscriptions(tenant_id,updated_at)').run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS business_plan_subscription_events(
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    processed_at INTEGER NOT NULL
  )`).run();
}
async function projectForUser(env,id,user){return env.DB.prepare('SELECT * FROM business_plan_projects WHERE id=? AND tenant_id=? AND user_id=?').bind(id,user.tenant_id,user.id).first()}
async function includedAccess(env,user,project){
  if(Number(project?.paid||0)===1){
    const monthly=await env.DB.prepare('SELECT status FROM business_plan_subscriptions WHERE project_id=?').bind(project.id).first().catch(()=>null);
    if(!monthly)return{ok:true,reason:'legacy_one_time_purchase'};
    if(ACTIVE_STATUSES.has(String(monthly.status||'')))return{ok:true,reason:'business_plan_monthly'};
  }
  const tenant=await env.DB.prepare('SELECT id,slug,plan FROM tenants WHERE id=?').bind(user.tenant_id).first();
  if(tenant?.slug==='owner')return{ok:true,reason:'platform_owner'};
  if(String(tenant?.plan||'free')==='business')return{ok:true,reason:'full_business'};
  try{const sub=await env.DB.prepare('SELECT plan,status FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();if(sub?.plan==='business'&&['active','trialing','past_due'].includes(String(sub?.status||'')))return{ok:true,reason:'full_business'}}catch{}
  return{ok:false,reason:'subscription_required'};
}
function siteOrigin(request,env){return String(env.PUBLIC_SITE_URL||'').trim().replace(/\/$/,'')||new URL(request.url).origin}
async function stripeRequest(env,path,options={}){
  if(!env.STRIPE_SECRET_KEY)return{ok:false,status:503,data:{error:{message:'Stripe is not configured.'}}};
  const r=await fetch(`https://api.stripe.com${path}`,{...options,headers:{authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,...(options.headers||{})}});
  return{ok:r.ok,status:r.status,data:await r.json().catch(()=>({}))};
}
function parseStripeSignature(header){const out={t:'',v1:[]};for(const part of String(header||'').split(',')){const [k,...rest]=part.trim().split('='),v=rest.join('=');if(k==='t')out.t=v;if(k==='v1'&&v)out.v1.push(v)}return out}
async function verifyWebhook(raw,header,secret){const p=parseStripeSignature(header);if(!p.t||!p.v1.length)return false;const ts=Number(p.t);if(!Number.isFinite(ts)||Math.abs(now()-ts)>300)return false;const expected=await hmacHex(secret,`${p.t}.${raw}`);return p.v1.some(x=>safeEqual(x,expected))}
async function setSubscriptionAccess(env,{projectId,tenantId,userId,subscriptionId,sessionId,status,currentPeriodEnd}){
  if(!projectId||!tenantId||!userId||!subscriptionId)return;
  const ts=now();
  await env.DB.prepare(`INSERT INTO business_plan_subscriptions(project_id,tenant_id,user_id,stripe_subscription_id,stripe_session_id,status,current_period_end,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?)
    ON CONFLICT(project_id) DO UPDATE SET stripe_subscription_id=excluded.stripe_subscription_id,stripe_session_id=COALESCE(excluded.stripe_session_id,business_plan_subscriptions.stripe_session_id),status=excluded.status,current_period_end=excluded.current_period_end,updated_at=excluded.updated_at`)
    .bind(projectId,tenantId,userId,subscriptionId,sessionId||null,String(status||'incomplete'),Number(currentPeriodEnd||0)||null,ts,ts).run();
  const active=ACTIVE_STATUSES.has(String(status||''))?1:0;
  await env.DB.prepare('UPDATE business_plan_projects SET paid=?,stripe_session_id=COALESCE(?,stripe_session_id),updated_at=? WHERE id=? AND tenant_id=? AND user_id=?')
    .bind(active,sessionId||null,ts,projectId,tenantId,userId).run();
}
async function subscriptionFromStripe(env,id){
  if(!id)return null;
  const {ok,data}=await stripeRequest(env,`/v1/subscriptions/${encodeURIComponent(id)}`);
  return ok&&data?.id?data:null;
}
async function rewriteLegacyResponse(response,path){
  if(!response)return response;
  const type=String(response.headers.get('content-type')||'');
  if(!type.includes('application/json'))return response;
  const text=await response.text();let data;try{data=JSON.parse(text)}catch{return new Response(text,{status:response.status,headers:response.headers})}
  if('one_time_price_usd' in data){delete data.one_time_price_usd;data.monthly_price_usd=PLAN_MONTHLY_PRICE_USD;data.billing_interval='month'}
  if(typeof data.detail==='string')data.detail=data.detail.replace(/Full Business or the one-time plan unlock\.?/i,'Full Business or the $79/month professional business-plan subscription.');
  if(data.premium_reason==='one_time_purchase')data.premium_reason='legacy_one_time_purchase';
  return json(data,response.status);
}

async function handleWebhook(request,env){
  if(!env.STRIPE_WEBHOOK_SECRET)return null;
  const clone=request.clone(),raw=await clone.text(),sig=clone.headers.get('stripe-signature')||'';
  if(!await verifyWebhook(raw,sig,String(env.STRIPE_WEBHOOK_SECRET)))return null;
  let event;try{event=JSON.parse(raw)}catch{return null}
  const object=event?.data?.object||{},meta=object?.metadata||{};
  if(String(meta.product_type||'')!=='professional_business_plan')return null;
  const eventId=String(event?.id||'');if(!eventId)return json({detail:'Stripe event id is required.'},400);
  const seen=await env.DB.prepare('SELECT event_id FROM business_plan_subscription_events WHERE event_id=?').bind(eventId).first();if(seen)return json({received:true,duplicate:true});
  if(event.type==='checkout.session.completed'){
    const subscriptionId=typeof object.subscription==='string'?object.subscription:String(object.subscription?.id||'');
    const sub=await subscriptionFromStripe(env,subscriptionId);
    if(sub)await setSubscriptionAccess(env,{projectId:String(meta.project_id||''),tenantId:String(meta.tenant_id||''),userId:String(meta.user_id||''),subscriptionId:sub.id,sessionId:String(object.id||''),status:sub.status,currentPeriodEnd:sub.current_period_end});
  }else if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'||event.type==='customer.subscription.created'){
    await setSubscriptionAccess(env,{projectId:String(meta.project_id||''),tenantId:String(meta.tenant_id||''),userId:String(meta.user_id||''),subscriptionId:String(object.id||''),sessionId:null,status:String(object.status||event.type==='customer.subscription.deleted'?'canceled':'incomplete'),currentPeriodEnd:object.current_period_end});
  }
  await env.DB.prepare('INSERT INTO business_plan_subscription_events(event_id,event_type,processed_at) VALUES(?,?,?)').bind(eventId,String(event.type||''),now()).run();
  return json({received:true,business_plan_subscription:true});
}

export async function handleBusinessPlan(request,env){
  const url=new URL(request.url),path=url.pathname;
  const relevant=path.startsWith('/api/business-plan')||path==='/api/billing/webhook';
  if(!relevant)return null;
  await ensureSchema(env);

  if(path==='/api/billing/webhook'&&request.method==='POST'){
    const handled=await handleWebhook(request,env);
    if(handled)return handled;
    return handleLegacyBusinessPlan(request,env);
  }
  if(path==='/api/business-plan/config'&&request.method==='GET')return json({enabled:true,free_preview:true,monthly_price_usd:PLAN_MONTHLY_PRICE_USD,billing_interval:'month',recurring:true,included_with_full_business:true,pipeline:['Intake','Clarify','Research','Validate','Financial Review','Draft','Hostile Review','Consistency Check','Audience Adaptation','Final Polish']});

  if(path==='/api/business-plan/checkout'&&request.method==='POST'){
    const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
    const body=await request.json().catch(()=>({})),id=String(body.project_id||''),p=await projectForUser(env,id,user);if(!p)return json({detail:'Plan project not found.'},404);
    const ent=await includedAccess(env,user,p);if(ent.ok)return json({included:true,premium:true,reason:ent.reason});
    if(!env.STRIPE_SECRET_KEY)return json({detail:'Stripe checkout is not configured.'},503);
    const form=new URLSearchParams(),origin=siteOrigin(request,env),price=String(env.STRIPE_PRICE_BUSINESS_PLAN_MONTHLY||PLAN_MONTHLY_PRICE_ID);
    form.set('mode','subscription');
    form.set('line_items[0][price]',price);form.set('line_items[0][quantity]','1');
    form.set('client_reference_id',String(user.tenant_id));form.set('customer_email',String(user.email||''));
    for(const [k,v] of Object.entries({product_type:'professional_business_plan',tenant_id:String(user.tenant_id),user_id:String(user.id),project_id:id,billing_model:'monthly_recurring'})){
      form.set(`metadata[${k}]`,v);form.set(`subscription_data[metadata][${k}]`,v);
    }
    form.set('success_url',`${origin}/business-plan?checkout=success&session_id={CHECKOUT_SESSION_ID}&project_id=${encodeURIComponent(id)}`);
    form.set('cancel_url',`${origin}/business-plan?checkout=cancelled&project_id=${encodeURIComponent(id)}`);
    const {ok,data}=await stripeRequest(env,'/v1/checkout/sessions',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:form.toString()});
    if(!ok||!data?.url)return json({detail:data?.error?.message||'Stripe could not create subscription checkout.'},502);
    return json({url:data.url,session_id:data.id,project_id:id,monthly_price_usd:PLAN_MONTHLY_PRICE_USD,billing_interval:'month',recurring:true});
  }

  if(path==='/api/business-plan/confirm'&&request.method==='POST'){
    const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
    const body=await request.json().catch(()=>({})),id=String(body.project_id||''),sessionId=String(body.session_id||''),p=await projectForUser(env,id,user);if(!p)return json({detail:'Plan project not found.'},404);
    if(!/^cs_[A-Za-z0-9_]+$/.test(sessionId))return json({detail:'A valid Stripe Checkout session is required.'},400);
    const {ok,data:s}=await stripeRequest(env,`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);if(!ok||!s?.id)return json({detail:s?.error?.message||'Stripe checkout could not be verified.'},502);
    const meta=s.metadata||{};if(String(meta.product_type||'')!=='professional_business_plan'||String(meta.project_id||'')!==id||String(meta.tenant_id||'')!==String(user.tenant_id))return json({detail:'This checkout does not belong to this business-plan project.'},403);
    if(s.mode!=='subscription'||s.status!=='complete')return json({detail:'Stripe has not confirmed this monthly subscription yet.'},409);
    const subscriptionId=typeof s.subscription==='string'?s.subscription:String(s.subscription?.id||'');
    const sub=await subscriptionFromStripe(env,subscriptionId);if(!sub||!ACTIVE_STATUSES.has(String(sub.status||'')))return json({detail:'The business-plan subscription is not active yet.'},409);
    await setSubscriptionAccess(env,{projectId:id,tenantId:String(user.tenant_id),userId:String(user.id),subscriptionId:sub.id,sessionId,status:sub.status,currentPeriodEnd:sub.current_period_end});
    return json({confirmed:true,project_id:id,premium:true,premium_reason:'business_plan_monthly',subscription_id:sub.id,subscription_status:sub.status,monthly_price_usd:PLAN_MONTHLY_PRICE_USD,billing_interval:'month'});
  }

  const response=await handleLegacyBusinessPlan(request,env);
  return rewriteLegacyResponse(response,path);
}
