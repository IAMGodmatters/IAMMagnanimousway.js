import { currentUserFromRequest } from './usage-guard.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const PLANS=new Set(['plus','business','pro','scale']);
const ACTIVEISH=new Set(['active','trialing','past_due']);

export async function handleBillingCheckoutHardening(request,env){
 const url=new URL(request.url);
 if(url.pathname!=='/api/billing/checkout'||request.method!=='POST')return null;
 if(!env?.DB)return null;
 const user=await currentUserFromRequest(request,env);
 if(!user)return json({detail:'Sign in required.'},401);
 const body=await request.clone().json().catch(()=>({}));
 const plan=String(body.plan||'').toLowerCase();
 if(!PLANS.has(plan))return json({detail:'Choose a valid paid plan: plus, business, pro, or scale.',code:'INVALID_PLAN'},400);
 let existing=null;
 try{existing=await env.DB.prepare('SELECT plan,status,stripe_customer_id,stripe_subscription_id,current_period_end FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first()}catch(_){ }
 if(existing?.stripe_subscription_id&&ACTIVEISH.has(String(existing.status||''))){
  return json({
   detail:'This workspace already has a Stripe subscription. Use Manage billing to change, recover, or cancel the existing subscription instead of creating a duplicate.',
   code:'ACTIVE_SUBSCRIPTION_EXISTS',
   current_plan:String(existing.plan||'free'),status:String(existing.status||''),
   current_period_end:existing.current_period_end||null,portal_endpoint:'/api/billing/portal'
  },409);
 }
 const priceKey={plus:'STRIPE_PRICE_PLUS',business:'STRIPE_PRICE_BUSINESS',pro:'STRIPE_PRICE_PRO',scale:'STRIPE_PRICE_SCALE'}[plan];
 const stripeConfigured=Boolean(env.STRIPE_SECRET_KEY&&String(env?.[priceKey]||'').trim());
 if(!stripeConfigured&&plan==='business'&&String(env.STRIPE_PAYMENT_LINK_BUSINESS||'').trim()){
  return json({url:String(env.STRIPE_PAYMENT_LINK_BUSINESS).trim(),plan:'business',fallback:'stripe-payment-link'});
 }
 return null;
}
