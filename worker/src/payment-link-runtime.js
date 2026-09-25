import { currentUser } from './integrations.js';
import { encodePlanPaymentReference, encodeTopupPaymentReference, normalizePaidPlan } from './payment-reference.js';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
const LINK_KEYS={plus:'STRIPE_PAYMENT_LINK_PLUS',business:'STRIPE_PAYMENT_LINK_BUSINESS',pro:'STRIPE_PAYMENT_LINK_PRO',scale:'STRIPE_PAYMENT_LINK_SCALE'};
function paymentLink(env,plan='business'){return String(env?.[LINK_KEYS[plan]]||'').trim()}
function availableLinks(env){return Object.fromEntries(Object.keys(LINK_KEYS).map(plan=>[plan,Boolean(paymentLink(env,plan))]))}
function appendQuery(url, key, value) {const parsed = new URL(url);parsed.searchParams.set(key, value);return parsed.toString()}

export async function handlePaymentLinkBilling(request, env) {
  const url = new URL(request.url);
  if (!['/api/billing/checkout','/api/billing/topup'].includes(url.pathname) || request.method !== 'POST') return null;
  const user = await currentUser(request, env);
  if (!user) return json({ detail: 'Sign in required.' }, 401);
  const tenantId = String(user.tenant_id || '').trim();
  if (!tenantId) return json({ detail: 'Workspace is missing.' }, 409);
  if(url.pathname==='/api/billing/topup'){
   const link=String(env?.STRIPE_PAYMENT_LINK_USAGE_TOPUP||'').trim();
   if(!link)return json({detail:'Premium usage top-up checkout is not configured.'},503);
   return json({url:appendQuery(link,'client_reference_id',encodeTopupPaymentReference(tenantId)),purpose:'premium_usage_topup',markup_percent:20,activation:'confirmed Stripe payment only'});
  }
  const body=await request.clone().json().catch(()=>({}));
  const requestedPlan=String(body.plan||'business').trim().toLowerCase();
  if(requestedPlan==='agency'||requestedPlan==='agency_pro')return null;
  const plan=normalizePaidPlan(requestedPlan);
  if(!plan)return json({detail:'Choose a valid paid plan: plus, business, pro, or scale.',code:'INVALID_PLAN'},400);
  const link=paymentLink(env,plan);
  if(!link)return null;
  const paymentReference=encodePlanPaymentReference(tenantId,plan);
  return json({url:appendQuery(link,'client_reference_id',paymentReference),plan,mode:'payment_link'});
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
    data.business_checkout_configured=Boolean(links.business)||Boolean(data.business_checkout_configured);
    data.payment_link_fallbacks=links;
    data.agency_payment_link_fallbacks={
      agency:Boolean(links.agency)||Boolean(data?.agency_payment_link_fallbacks?.agency),
      agency_pro:Boolean(links.agency_pro)||Boolean(data?.agency_payment_link_fallbacks?.agency_pro)
    };
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