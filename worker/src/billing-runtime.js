const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price_usd: 0,
    cadence: 'forever',
    primary: true,
    description: 'The main way to use I AM Magnanimous Way: core AI, Magnanimous AI, creator tools, CRM, and browser-based tools without a subscription.',
    features: ['Magnanimous AI and configured free-first AI providers', 'Core AI and creator workspaces', 'CRM and lead tools', 'Free browser-based tools']
  },
  {
    id: 'business',
    name: 'Full Business',
    price_usd: 49,
    cadence: 'month',
    primary: false,
    description: 'One optional upgrade for the complete business feature set, including advanced assistant, calling, and avatar integrations when their providers are configured.',
    features: ['Everything in Free', 'Full business workspace access', 'Advanced virtual-assistant workflows', 'Phone and call-center feature access', 'Avatar/video integrations when configured'],
    note: 'Third-party carrier, avatar, video, or AI usage can still be subject to the provider’s own quotas and usage charges.'
  }
];

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sessionSecret(env) {
  const configured = String(env.SESSION_SECRET || '').trim();
  if (configured) return configured;
  try {
    const row = await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();
    return String(row?.value || '');
  } catch (_) { return ''; }
}

async function currentUser(request, env) {
  const raw = request.headers.get('authorization') || '';
  if (!raw.startsWith('Bearer ')) return null;
  const parts = raw.slice(7).split('|');
  if (parts.length !== 5 || Number(parts[3]) < now()) return null;
  const [userId, tenantId, role, exp, sig] = parts;
  const secret = await sessionSecret(env);
  if (!secret || !safeEqual(sig, await hmacHex(secret, `${userId}|${tenantId}|${role}|${exp}`))) return null;
  return env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1')
    .bind(userId, tenantId).first();
}

async function ensureSchema(env) {
  try { await env.DB.prepare("ALTER TABLE tenants ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'").run(); } catch (_) {}
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS billing_subscriptions (
    tenant_id TEXT PRIMARY KEY, plan TEXT NOT NULL DEFAULT 'free', stripe_customer_id TEXT,
    stripe_subscription_id TEXT, status TEXT NOT NULL DEFAULT 'inactive', current_period_end INTEGER,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS billing_webhook_events (
    event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL, processed_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS public_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '', rating INTEGER NOT NULL, body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, moderated_at INTEGER,
    moderated_by TEXT
  )`).run();
}

function siteOrigin(request, env) {
  const configured = String(env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
  return configured || new URL(request.url).origin;
}

async function stripeRequest(env, path, options = {}) {
  if (!env.STRIPE_SECRET_KEY) return { ok: false, status: 503, data: { error: { message: 'Stripe is not configured.' } } };
  const response = await fetch(`https://api.stripe.com${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

function isBusinessSubscriptionActive(status) {
  return ['active', 'trialing', 'past_due'].includes(String(status || ''));
}

async function createCheckout(request, env, user) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_BUSINESS) {
    return json({ detail: 'Business checkout is not configured yet.', code: 'STRIPE_NOT_CONFIGURED' }, 503);
  }
  const origin = siteOrigin(request, env);
  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  form.set('line_items[0][price]', String(env.STRIPE_PRICE_BUSINESS));
  form.set('line_items[0][quantity]', '1');
  form.set('client_reference_id', String(user.tenant_id));
  form.set('customer_email', String(user.email || ''));
  form.set('metadata[tenant_id]', String(user.tenant_id));
  form.set('metadata[plan]', 'business');
  form.set('subscription_data[metadata][tenant_id]', String(user.tenant_id));
  form.set('subscription_data[metadata][plan]', 'business');
  form.set('allow_promotion_codes', 'true');
  form.set('success_url', `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url', `${origin}/pricing?checkout=cancelled`);

  const { ok, data } = await stripeRequest(env, '/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  });
  if (!ok || !data?.url) return json({ detail: data?.error?.message || 'Stripe could not create checkout.' }, 502);
  return json({ url: data.url, session_id: data.id, plan: 'business' });
}

function parseStripeSignature(header) {
  const out = { t: '', v1: [] };
  for (const part of String(header || '').split(',')) {
    const [key, ...rest] = part.trim().split('=');
    const value = rest.join('=');
    if (key === 't') out.t = value;
    if (key === 'v1' && value) out.v1.push(value);
  }
  return out;
}

async function verifyStripeWebhook(rawBody, signatureHeader, secret) {
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed.t || !parsed.v1.length) return false;
  const timestamp = Number(parsed.t);
  if (!Number.isFinite(timestamp) || Math.abs(now() - timestamp) > 300) return false;
  const expected = await hmacHex(secret, `${parsed.t}.${rawBody}`);
  return parsed.v1.some(sig => safeEqual(sig, expected));
}

async function saveSubscription(env, tenantId, values) {
  if (!tenantId) return;
  const timestamp = now();
  const existing = await env.DB.prepare('SELECT * FROM billing_subscriptions WHERE tenant_id=?').bind(tenantId).first();
  const customerId = values.customer_id ?? existing?.stripe_customer_id ?? null;
  const subscriptionId = values.subscription_id ?? existing?.stripe_subscription_id ?? null;
  const status = String(values.status ?? existing?.status ?? 'inactive');
  const periodEnd = values.current_period_end ?? existing?.current_period_end ?? null;
  const plan = String(values.plan || 'free');
  await env.DB.prepare(`
    INSERT INTO billing_subscriptions(tenant_id,plan,stripe_customer_id,stripe_subscription_id,status,current_period_end,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?)
    ON CONFLICT(tenant_id) DO UPDATE SET
      plan=excluded.plan, stripe_customer_id=excluded.stripe_customer_id,
      stripe_subscription_id=excluded.stripe_subscription_id, status=excluded.status,
      current_period_end=excluded.current_period_end, updated_at=excluded.updated_at
  `).bind(tenantId, plan, customerId, subscriptionId, status, periodEnd, existing?.created_at || timestamp, timestamp).run();
  await env.DB.prepare('UPDATE tenants SET plan=? WHERE id=?').bind(plan, tenantId).run();
}

async function resolveTenantForSubscription(env, object) {
  const direct = String(object?.metadata?.tenant_id || '').trim();
  if (direct) return direct;
  const subscriptionId = typeof object?.id === 'string' && object.id.startsWith('sub_') ? object.id : String(object?.subscription || '');
  if (!subscriptionId) return '';
  const row = await env.DB.prepare('SELECT tenant_id FROM billing_subscriptions WHERE stripe_subscription_id=?').bind(subscriptionId).first();
  return String(row?.tenant_id || '');
}

async function processStripeEvent(env, event) {
  const type = String(event?.type || '');
  const object = event?.data?.object || {};
  if (type === 'checkout.session.completed') {
    const tenantId = String(object?.metadata?.tenant_id || object?.client_reference_id || '').trim();
    if (tenantId) {
      await saveSubscription(env, tenantId, {
        plan: 'business',
        customer_id: String(object.customer || '') || null,
        subscription_id: String(object.subscription || '') || null,
        status: 'active'
      });
    }
    return;
  }
  if (type === 'customer.subscription.created' || type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    const tenantId = await resolveTenantForSubscription(env, object);
    if (!tenantId) return;
    const status = String(object.status || (type.endsWith('.deleted') ? 'canceled' : 'inactive'));
    const active = isBusinessSubscriptionActive(status) && type !== 'customer.subscription.deleted';
    await saveSubscription(env, tenantId, {
      plan: active ? 'business' : 'free',
      customer_id: String(object.customer || '') || null,
      subscription_id: String(object.id || '') || null,
      status,
      current_period_end: Number(object.current_period_end || 0) || null
    });
  }
}

async function stripeWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ detail: 'Stripe webhook verification is not configured.' }, 503);
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  if (!await verifyStripeWebhook(rawBody, signature, String(env.STRIPE_WEBHOOK_SECRET))) {
    return json({ detail: 'Invalid Stripe webhook signature.' }, 401);
  }
  let event;
  try { event = JSON.parse(rawBody); } catch { return json({ detail: 'Invalid Stripe webhook payload.' }, 400); }
  const eventId = String(event?.id || '');
  if (!eventId) return json({ detail: 'Stripe event id is required.' }, 400);
  const seen = await env.DB.prepare('SELECT event_id FROM billing_webhook_events WHERE event_id=?').bind(eventId).first();
  if (seen) return json({ received: true, duplicate: true });
  await processStripeEvent(env, event);
  await env.DB.prepare('INSERT INTO billing_webhook_events(event_id,event_type,processed_at) VALUES(?,?,?)')
    .bind(eventId, String(event?.type || ''), now()).run();
  return json({ received: true });
}

async function fetchStripeSubscription(env, subscriptionId) {
  if (!subscriptionId || !env.STRIPE_SECRET_KEY) return null;
  const { ok, data } = await stripeRequest(env, `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`);
  return ok ? data : null;
}

async function refreshSubscription(env, user) {
  const row = await env.DB.prepare('SELECT * FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();
  if (!row?.stripe_subscription_id || !env.STRIPE_SECRET_KEY) return row || null;
  const subscription = await fetchStripeSubscription(env, row.stripe_subscription_id);
  if (!subscription?.id) return row;
  const status = String(subscription.status || 'inactive');
  const active = isBusinessSubscriptionActive(status);
  await saveSubscription(env, user.tenant_id, {
    plan: active ? 'business' : 'free',
    customer_id: String(subscription.customer || '') || row.stripe_customer_id || null,
    subscription_id: String(subscription.id),
    status,
    current_period_end: Number(subscription.current_period_end || 0) || null
  });
  return env.DB.prepare('SELECT * FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();
}

async function confirmCheckout(request, env, user) {
  if (!env.STRIPE_SECRET_KEY) return json({ detail: 'Stripe is not configured.', code: 'STRIPE_NOT_CONFIGURED' }, 503);
  const body = await request.json().catch(() => ({}));
  const sessionId = String(body.session_id || '').trim();
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return json({ detail: 'A valid Stripe Checkout session is required.' }, 400);

  const { ok, data: session } = await stripeRequest(env, `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (!ok || !session?.id) return json({ detail: session?.error?.message || 'Stripe checkout session could not be verified.' }, 502);
  const tenantId = String(session?.metadata?.tenant_id || session?.client_reference_id || '').trim();
  if (!tenantId || tenantId !== String(user.tenant_id)) return json({ detail: 'This checkout session does not belong to your workspace.' }, 403);
  if (session.mode !== 'subscription' || session.status !== 'complete' || !['paid', 'no_payment_required'].includes(String(session.payment_status || ''))) {
    return json({ detail: 'Stripe has not confirmed this subscription payment yet.', code: 'PAYMENT_NOT_CONFIRMED' }, 409);
  }

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : String(session.subscription?.id || '');
  if (!subscriptionId) return json({ detail: 'Stripe did not return a subscription for this checkout.' }, 409);
  const subscription = await fetchStripeSubscription(env, subscriptionId);
  if (!subscription?.id) return json({ detail: 'Stripe subscription could not be verified.' }, 502);
  const status = String(subscription.status || 'inactive');
  const active = isBusinessSubscriptionActive(status);
  await saveSubscription(env, user.tenant_id, {
    plan: active ? 'business' : 'free',
    customer_id: String(subscription.customer || session.customer || '') || null,
    subscription_id: subscriptionId,
    status,
    current_period_end: Number(subscription.current_period_end || 0) || null
  });
  return json({ confirmed: active, plan: active ? 'business' : 'free', status, current_period_end: Number(subscription.current_period_end || 0) || null });
}

async function createPortal(request, env, user) {
  if (!env.STRIPE_SECRET_KEY) return json({ detail: 'Stripe is not configured.' }, 503);
  const row = await refreshSubscription(env, user);
  const customerId = String(row?.stripe_customer_id || '');
  if (!customerId) return json({ detail: 'No Stripe customer is linked to this workspace.' }, 409);
  const form = new URLSearchParams();
  form.set('customer', customerId);
  form.set('return_url', `${siteOrigin(request, env)}/pricing`);
  const { ok, data } = await stripeRequest(env, '/v1/billing_portal/sessions', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  });
  if (!ok || !data?.url) return json({ detail: data?.error?.message || 'Stripe could not open the subscription portal.' }, 502);
  return json({ url: data.url });
}

async function billingStatus(env, user) {
  await refreshSubscription(env, user);
  const tenant = await env.DB.prepare("SELECT id,name,COALESCE(plan,'free') plan FROM tenants WHERE id=?").bind(user.tenant_id).first();
  const subscription = await env.DB.prepare('SELECT plan,status,current_period_end FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();
  return json({
    plan: String(tenant?.plan || 'free'),
    workspace: tenant?.name || '',
    subscription: subscription || null,
    billing_configured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_BUSINESS)
  });
}

async function listReviews(env) {
  const { results } = await env.DB.prepare(`
    SELECT id,display_name,rating,body,created_at
    FROM public_reviews WHERE status='approved' ORDER BY created_at DESC LIMIT 50
  `).all();
  return json({ reviews: results || [] });
}

async function createReview(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const rating = Number(body.rating || 0);
  const text = String(body.body || '').trim();
  const displayName = String(body.display_name || user.name || 'Member').trim().slice(0, 80);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ detail: 'Rating must be from 1 to 5.' }, 400);
  if (text.length < 3 || text.length > 2000) return json({ detail: 'Review must be between 3 and 2,000 characters.' }, 400);
  const result = await env.DB.prepare(`
    INSERT INTO public_reviews(tenant_id,user_id,display_name,rating,body,status,created_at)
    VALUES(?,?,?,?,?,'pending',?)
  `).bind(user.tenant_id, user.id, displayName, rating, text, now()).run();
  return json({ id: result.meta.last_row_id, status: 'pending', detail: 'Thanks. Your review is awaiting moderation.' }, 201);
}

async function adminReviews(request, env, user, path) {
  if (!user || user.role !== 'owner') return json({ detail: 'Owner access required.' }, 401);
  if (path === '/api/admin/reviews' && request.method === 'GET') {
    const { results } = await env.DB.prepare(`
      SELECT id,tenant_id,user_id,display_name,rating,body,status,created_at,moderated_at,moderated_by
      FROM public_reviews ORDER BY created_at DESC LIMIT 250
    `).all();
    return json({ reviews: results || [] });
  }
  const match = path.match(/^\/api\/admin\/reviews\/(\d+)\/moderate$/);
  if (match && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const status = String(body.status || '').toLowerCase();
    if (!['approved', 'rejected', 'pending'].includes(status)) return json({ detail: 'Invalid moderation status.' }, 400);
    await env.DB.prepare('UPDATE public_reviews SET status=?,moderated_at=?,moderated_by=? WHERE id=?')
      .bind(status, now(), user.id, Number(match[1])).run();
    return json({ ok: true, status });
  }
  return null;
}

export async function handleBilling(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const relevant = path === '/api/plans' || path.startsWith('/api/billing') || path === '/api/monetization/config' || path === '/api/reviews' || path.startsWith('/api/admin/reviews');
  if (!relevant) return null;
  await ensureSchema(env);

  if (path === '/api/plans' && request.method === 'GET') {
    return json({ free_first: true, plans: PLANS, business_checkout_configured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_BUSINESS) });
  }
  if (path === '/api/monetization/config' && request.method === 'GET') {
    return json({
      adsense_client: String(env.ADSENSE_CLIENT_ID || ''),
      ads_enabled: Boolean(env.ADSENSE_CLIENT_ID),
      business_checkout_configured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_BUSINESS)
    });
  }
  if (path === '/api/billing/webhook' && request.method === 'POST') return stripeWebhook(request, env);
  if (path === '/api/reviews' && request.method === 'GET') return listReviews(env);

  const user = await currentUser(request, env);
  if (path === '/api/admin/reviews' || path.startsWith('/api/admin/reviews/')) return adminReviews(request, env, user, path);
  if (!user) return json({ detail: 'Sign in required.' }, 401);

  if (path === '/api/billing/status' && request.method === 'GET') return billingStatus(env, user);
  if (path === '/api/billing/checkout' && request.method === 'POST') return createCheckout(request, env, user);
  if (path === '/api/billing/confirm' && request.method === 'POST') return confirmCheckout(request, env, user);
  if (path === '/api/billing/portal' && request.method === 'POST') return createPortal(request, env, user);
  if (path === '/api/reviews' && request.method === 'POST') return createReview(request, env, user);
  return null;
}