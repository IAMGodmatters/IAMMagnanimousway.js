import { currentUserFromRequest } from './usage-guard.js';
import { encodeSignedPlanPaymentReference } from './payment-reference.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const PLANS=new Set(['plus','crm','studio','business','pro','scale']);
const ACTIVEISH=new Set(['active','trialing','past_due']);
const TERMS={plus:'unlimited-2026-09-18.1',crm:'crm-2026-10-10.1',studio:'studio-2026-10-10.1',business:'business-2026-10-10.3',pro:'business-2026-10-10.3',scale:'business-annual-2026-10-10.3'};
function appendQuery(url,key,value){const parsed=new URL(url);parsed.searchParams.set(key,value);return parsed.toString()}

export async function handleBillingCheckoutHardening(request,env){
 const url=new URL(request.url);
 if(url.pathname!=='/api/billing/checkout'||request.method!=='POST')return null;
 if(!env?.DB)return null;
 const user=await currentUserFromRequest(request,env);
 if(!user)return json({detail:'Sign in required.'},401);
 const body=await request.clone().json().catch(()=>({}));
 const plan=String(body.plan||'business').toLowerCase();
 if(!PLANS.has(plan))return json({detail:'Choose a valid paid plan: plus, crm, studio, business, pro, or scale.',code:'INVALID_PLAN'},400);
 const requiredTerms=TERMS[plan];
 if(body.termsAccepted!==true||body.recurringDisclosureAccepted!==true||String(body.termsVersion||'')!==requiredTerms)return json({detail:'Premium Services Agreement acceptance is required before checkout.',code:'TERMS_ACCEPTANCE_REQUIRED',requiredTerms},428);
 let existing=null;
 try{existing=await env.DB.prepare('SELECT plan,status,stripe_customer_id,stripe_subscription_id,current_period_end FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first()}catch(_){ }
 if(existing?.stripe_subscription_id&&ACTIVEISH.has(String(existing.status||''))){
  return json({detail:'This workspace already has an active paid subscription. Use Manage billing to change, recover, or cancel the existing subscription instead of creating a duplicate.',code:'ACTIVE_SUBSCRIPTION_EXISTS',current_plan:String(existing.plan||'free'),status:String(existing.status||''),current_period_end:existing.current_period_end||null,portal_endpoint:'/api/billing/portal'},409);
 }
 // New CRM/Business/Annual offers must use verified hosted Checkout. Do not let
 // their old Payment Links intercept checkout because those links can carry stale prices.
 if(plan==='plus'&&!String(env.STRIPE_SECRET_KEY||'').trim()){
  const link=String(env.STRIPE_PAYMENT_LINK_PLUS||'').trim();
  if(link){const secret=String(env.SESSION_SECRET||'').trim();if(!secret)return json({detail:'Secure checkout identity is not configured.',code:'CHECKOUT_IDENTITY_NOT_CONFIGURED'},503);const paymentReference=await encodeSignedPlanPaymentReference(secret,String(user.tenant_id),plan);return json({url:appendQuery(link,'client_reference_id',paymentReference),plan,mode:'payment_link',fallback:'hosted-payment-link'});}
 }
 return null;
}
