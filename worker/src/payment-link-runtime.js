import { currentUser } from './integrations.js';
import { encodeSignedPlanPaymentReference, normalizePaidPlan } from './payment-reference.js';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
// Free-first billing fallback: these hosted Stripe links are tied to the verified
// recurring Prices. Magnanimous still gates terms and duplicate subscriptions
// before redirecting, and Stripe-signed webhooks remain the activation authority.
const LINK_KEYS={
  plus:'STRIPE_PAYMENT_LINK_PLUS',
  crm:'STRIPE_PAYMENT_LINK_CRM',
  business:'STRIPE_PAYMENT_LINK_BUSINESS',
  pro:'STRIPE_PAYMENT_LINK_BUSINESS',
  scale:'STRIPE_PAYMENT_LINK_SCALE'
};
const TERMS={
  plus:'unlimited-2026-09-18.1',
  crm:'crm-2026-10-10.1',
  business:'business-2026-10-10.2',
  pro:'business-2026-10-10.2',
  scale:'business-annual-2026-10-10.2'
};
const ACTIVEISH=new Set(['active','trialing','past_due']);
function paymentLink(env,plan='plus'){return String(env?.[LINK_KEYS[plan]]||'').trim()}
function availableLinks(env){return Object.fromEntries(Object.keys(LINK_KEYS).map(plan=>[plan,Boolean(paymentLink(env,plan))]))}
function appendQuery(url, key, value) {const parsed = new URL(url);parsed.searchParams.set(key, value);return parsed.toString()}

async function existingSubscription(env,tenantId){
  if(!env?.DB)return null;
  try{return await env.DB.prepare('SELECT plan,status,stripe_subscription_id,current_period_end FROM billing_subscriptions WHERE tenant_id=?').bind(tenantId).first()}catch{return null}
}
async function recordTermsAcceptance(env,user,plan,termsVersion){
  if(!env?.DB)return;
  await env.DB.prepare('INSERT INTO billing_checkout_consents(id,tenant_id,user_id,plan,terms_version,recurring_disclosure_accepted,checkout_mode,accepted_at) VALUES(?,?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(),String(user.tenant_id),String(user.id||''),plan,termsVersion,1,'stripe_payment_link',Math.floor(Date.now()/1000)).run();
}

export async function handlePaymentLinkBilling(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/billing/checkout' || request.method !== 'POST') return null;
  const body=await request.clone().json().catch(()=>({}));
  const requestedPlan=String(body.plan||'business').trim().toLowerCase();
  if(requestedPlan==='agency'||requestedPlan==='agency_pro')return null;
  const plan=normalizePaidPlan(requestedPlan);
  if(!plan)return json({detail:'Choose a valid paid plan: plus, crm, business, pro, or scale.',code:'INVALID_PLAN'},400);
  const link=paymentLink(env,plan);
  if(!link)return null;
  const user = await currentUser(request, env);
  if (!user) return json({ detail: 'Sign in required.' }, 401);
  const tenantId = String(user.tenant_id || '').trim();
  if (!tenantId) return json({ detail: 'Workspace is missing.' }, 409);
  const requiredTerms=TERMS[plan]||TERMS.plus;
  if(body.termsAccepted!==true||body.recurringDisclosureAccepted!==true||String(body.termsVersion||'')!==requiredTerms){
    return json({detail:'The terms and recurring-billing disclosure for the selected plan must be accepted before checkout.',code:'TERMS_ACCEPTANCE_REQUIRED',requiredTerms},428);
  }
  const existing=await existingSubscription(env,tenantId);
  if(existing?.stripe_subscription_id&&ACTIVEISH.has(String(existing.status||''))){
    return json({detail:'This workspace already has an active paid subscription. Use Manage billing to change, recover, or cancel it instead of creating a duplicate.',code:'ACTIVE_SUBSCRIPTION_EXISTS',current_plan:String(existing.plan||'free'),status:String(existing.status||''),current_period_end:existing.current_period_end||null,portal_endpoint:'/api/billing/portal'},409);
  }
  await recordTermsAcceptance(env,user,plan,requiredTerms);
  const referenceSecret=String(env?.SESSION_SECRET||'').trim();
  if(!referenceSecret)return json({detail:'Secure checkout identity is not configured.',code:'CHECKOUT_IDENTITY_NOT_CONFIGURED'},503);
  const paymentReference=await encodeSignedPlanPaymentReference(referenceSecret,tenantId,plan);
  return json({url:appendQuery(link,'client_reference_id',paymentReference),plan,mode:'payment_link',terms_recorded:true});
}

export async function augmentBillingResponse(request, response, env) {
  const links=availableLinks(env);if(!Object.values(links).some(Boolean)||!response)return response;
  const path = new URL(request.url).pathname;
  if (path !== '/api/plans' && path !== '/api/billing/status') return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) return response;
  let data;try { data = await response.clone().json(); } catch { return response; }
  if (path === '/api/plans') {
    if(Array.isArray(data.plans))data.plans=data.plans.map(p=>p?.id&&links[p.id]?{...p,checkout_configured:true,checkout_mode:'payment_link'}:p);
    data.tier_checkout_configured={...(data.tier_checkout_configured||{}),...Object.fromEntries(Object.entries(links).map(([k,v])=>[k,Boolean(v)||Boolean(data?.tier_checkout_configured?.[k])]))};
    data.crm_checkout_configured=Boolean(data.crm_checkout_configured)||Boolean(links.crm);
    data.business_checkout_configured=Boolean(data.business_checkout_configured)||Boolean(links.business);
    data.payment_link_fallbacks=links;
  }
  if (path === '/api/billing/status') {
    data.billing_configured = Object.values(links).some(Boolean)||Boolean(data.billing_configured);
    data.checkout_mode = data.portal_configured?'stripe-hosted-or-payment-link':'payment_link';
    data.portal_configured = Boolean(String(env?.STRIPE_SECRET_KEY || '').trim());
    data.management_request_available = true;
    data.payment_link_fallbacks=links;
  }
  return json(data, response.status);
}
