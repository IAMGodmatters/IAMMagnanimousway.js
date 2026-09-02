import { currentUser } from './integrations.js';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });

function paymentLink(env) {
  return String(env?.STRIPE_PAYMENT_LINK_BUSINESS || '').trim();
}

function appendQuery(url, key, value) {
  const parsed = new URL(url);
  parsed.searchParams.set(key, value);
  return parsed.toString();
}

export async function handlePaymentLinkBilling(request, env) {
  const link = paymentLink(env);
  if (!link) return null;
  const url = new URL(request.url);
  if (url.pathname !== '/api/billing/checkout' || request.method !== 'POST') return null;

  const user = await currentUser(request, env);
  if (!user) return json({ detail: 'Sign in required.' }, 401);
  const tenantId = String(user.tenant_id || '').trim();
  if (!tenantId) return json({ detail: 'Workspace is missing.' }, 409);

  return json({
    url: appendQuery(link, 'client_reference_id', tenantId),
    plan: 'business',
    mode: 'payment_link'
  });
}

export async function augmentBillingResponse(request, response, env) {
  if (!paymentLink(env) || !response) return response;
  const path = new URL(request.url).pathname;
  if (path !== '/api/plans' && path !== '/api/billing/status') return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) return response;
  let data;
  try { data = await response.clone().json(); } catch { return response; }
  if (path === '/api/plans') data.business_checkout_configured = true;
  if (path === '/api/billing/status') {
    data.billing_configured = true;
    data.checkout_mode = 'payment_link';
  }
  return json(data, response.status);
}
