const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const PLAN_ORDER = ['free', 'plus', 'business', 'pro', 'scale'];
const PLAN_CONFIG = {
  free: {
    id: 'free', name: 'Free', price_usd: 0, cadence: 'forever', primary: true,
    description: 'Core Magnanimous AI and creator/business tools with free-first providers.',
    features: ['Magnanimous AI', 'Free-first AI routing', 'Creator workspaces', 'CRM and lead tools', 'Free translation'],
    entitlements: { metered_ai: false, pstn_minutes: 0, avatar_minutes: 0, premium_video_credits: 0, cost_ceiling_usd: 0 }
  },
  plus: {
    id: 'plus', name: 'Magnanimous Plus', price_usd: 19, cadence: 'month',
    description: 'Affordable expanded access while high-variable-cost services stay controlled.',
    features: ['Everything in Free', 'Higher workflow capacity', 'Expanded business tools', 'Priority free-first routing'],
    entitlements: { metered_ai: false, pstn_minutes: 0, avatar_minutes: 0, premium_video_credits: 0, cost_ceiling_usd: 8 }
  },
  business: {
    id: 'business', name: 'Full Business', price_usd: 49, cadence: 'month',
    description: 'Full business workspace with controlled access to premium integrations.',
    features: ['Everything in Plus', 'Full business workspace', 'Advanced assistant workflows', 'Calling and avatar integration access', 'Professional Business Plan included where entitlement rules apply'],
    entitlements: { metered_ai: true, pstn_minutes: 30, avatar_minutes: 10, premium_video_credits: 10, cost_ceiling_usd: 24 }
  },
  pro: {
    id: 'pro', name: 'Magnanimous Pro', price_usd: 99, cadence: 'month',
    description: 'Higher-capacity professional tier with larger controlled premium allowances.',
    features: ['Everything in Full Business', 'Premium AI access', 'Larger calling allowance', 'Larger avatar/video allowance', 'Priority business workflows'],
    entitlements: { metered_ai: true, pstn_minutes: 90, avatar_minutes: 30, premium_video_credits: 30, cost_ceiling_usd: 54 }
  },
  scale: {
    id: 'scale', name: 'Magnanimous Scale', price_usd: 199, cadence: 'month',
    description: 'High-capacity organizational tier with controlled premium usage and scale features.',
    features: ['Everything in Pro', 'Highest included capacity', 'Expanded team/business workflows', 'Largest controlled premium allowances', 'Scale-ready support path'],
    entitlements: { metered_ai: true, pstn_minutes: 180, avatar_minutes: 60, premium_video_credits: 60, cost_ceiling_usd: 112 }
  }
};

const PRICE_ENV = {
  plus: 'STRIPE_PRICE_PLUS',
  business: 'STRIPE_PRICE_BUSINESS',
  pro: 'STRIPE_PRICE_PRO',
  scale: 'STRIPE_PRICE_SCALE'
};

function normalizedPlan(value) {
  const id = String(value || '').toLowerCase();
  return PLAN_CONFIG[id] ? id : 'free';
}
function isActive(status) { return ['active', 'trialing'].includes(String(status || '')); }
function planPrice(env, plan) {
  const key = PRICE_ENV[plan];
  return key ? String(env?.[key] || '') : '';
}
function targetMargin(env) {
  const value = Number(env?.TARGET_GROSS_MARGIN_PERCENT || 20);
  return Number.isFinite(value) && value > 0 && value < 100 ? value : 20;
}
function publicPlan(env, id) {
  const plan = PLAN_CONFIG[id];
  return {
    ...plan,
    checkout_configured: id === 'free' ? true : Boolean(env.STRIPE_SECRET_KEY && planPrice(env, id)),
    target_gross_margin_percent: targetMargin(env)
  };
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
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
  return env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId, tenantId).first();
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
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS billing_usage_guard (
    tenant_id TEXT NOT NULL, period_key TEXT NOT NULL, direct_variable_cost_usd REAL NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL, PRIMARY KEY(tenant_id,period_key)
  )`).run();
}
function siteOrigin(request, env) {
  return String(env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '') || new URL(request.url).origin;
}
async function stripeRequest(env, path, options = {}) {
  if (!env.STRIPE_SECRET_KEY) return { ok: false, data: { error: { message: 'Stripe is not configured.' } } };
  const response = await fetch(`https://api.stripe.com${path}`, {
    ...options,
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}
async function saveSubscription(env, tenantId, values) {
  if (!tenantId) return;
  const timestamp = now();
  const existing = await env.DB.prepare('SELECT * FROM billing_subscriptions WHERE tenant_id=?').bind(tenantId).first();
  const plan = normalizedPlan(values.plan || existing?.plan || 'free');
  await env.DB.prepare(`INSERT INTO billing_subscriptions(
    tenant_id,plan,stripe_customer_id,stripe_subscription_id,status,current_period_end,created_at,updated_at
  ) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id) DO UPDATE SET
    plan=excluded.plan,stripe_customer_id=excluded.stripe_customer_id,stripe_subscription_id=excluded.stripe_subscription_id,
    status=excluded.status,current_period_end=excluded.current_period_end,updated_at=excluded.updated_at`)
    .bind(tenantId, plan, values.customer_id ?? existing?.stripe_customer_id ?? null,
      values.subscription_id ?? existing?.stripe_subscription_id ?? null,
      String(values.status ?? existing?.status ?? 'inactive'),
      values.current_period_end ?? existing?.current_period_end ?? null,
      existing?.created_at || timestamp, timestamp).run();
  await env.DB.prepare('UPDATE tenants SET plan=? WHERE id=?').bind(plan, tenantId).run();
}
async function createCheckout(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const plan = normalizedPlan(body.plan || 'business');
  if (plan === 'free') return json({ detail: 'The Free plan does not require checkout.' }, 400);
  const price = planPrice(env, plan);
  if (!env.STRIPE_SECRET_KEY || !price) return json({ detail: `${PLAN_CONFIG[plan].name} checkout is not configured yet.`, code: 'STRIPE_NOT_CONFIGURED' }, 503);
  const origin = siteOrigin(request, env);
  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  form.set('line_items[0][price]', price);
  form.set('line_items[0][quantity]', '1');
  form.set('client_reference_id', String(user.tenant_id));
  form.set('customer_email', String(user.email || ''));
  form.set('metadata[tenant_id]', String(user.tenant_id));
  form.set('metadata[plan]', plan);
  form.set('subscription_data[metadata][tenant_id]', String(user.tenant_id));
  form.set('subscription_data[metadata][plan]', plan);
  form.set('allow_promotion_codes', 'true');
  form.set('success_url', `${origin}/pricing?checkout=success&plan=${encodeURIComponent(plan)}&session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url', `${origin}/pricing?checkout=cancelled&plan=${encodeURIComponent(plan)}`);
  const { ok, data } = await stripeRequest(env, '/v1/checkout/sessions', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form.toString()
  });
  if (!ok || !data?.url) return json({ detail: data?.error?.message || 'Stripe could not create checkout.' }, 502);
  return json({ url: data.url, session_id: data.id, plan });
}
function parseStripeSignature(header) {
  const out = { t: '', v1: [] };
  for (const part of String(header || '').split(',')) {
    const [key, ...rest] = part.trim().split('='); const value = rest.join('=');
    if (key === 't') out.t = value; if (key === 'v1' && value) out.v1.push(value);
  }
  return out;
}
async function verifyStripeWebhook(rawBody, header, secret) {
  const parsed = parseStripeSignature(header);
  if (!parsed.t || !parsed.v1.length) return false;
  const timestamp = Number(parsed.t);
  if (!Number.isFinite(timestamp) || Math.abs(now() - timestamp) > 300) return false;
  const expected = await hmacHex(secret, `${parsed.t}.${rawBody}`);
  return parsed.v1.some(sig => safeEqual(sig, expected));
}
async function resolveTenant(env, object) {
  const direct = String(object?.metadata?.tenant_id || '').trim();
  if (direct) return direct;
  const subId = typeof object?.id === 'string' && object.id.startsWith('sub_') ? object.id : String(object?.subscription || '');
  if (!subId) return '';
  const row = await env.DB.prepare('SELECT tenant_id FROM billing_subscriptions WHERE stripe_subscription_id=?').bind(subId).first();
  return String(row?.tenant_id || '');
}
async function processEvent(env, event) {
  const type = String(event?.type || ''); const object = event?.data?.object || {};
  if (type === 'checkout.session.completed') {
    const tenantId = String(object?.metadata?.tenant_id || object?.client_reference_id || '').trim();
    const plan = normalizedPlan(object?.metadata?.plan || 'business');
    if (tenantId) await saveSubscription(env, tenantId, {
      plan, customer_id: String(object.customer || '') || null, subscription_id: String(object.subscription || '') || null, status: 'active'
    });
    return;
  }
  if (['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(type)) {
    const tenantId = await resolveTenant(env, object); if (!tenantId) return;
    const row = await env.DB.prepare('SELECT plan FROM billing_subscriptions WHERE tenant_id=?').bind(tenantId).first();
    const desired = normalizedPlan(object?.metadata?.plan || row?.plan || 'business');
    const status = String(object.status || (type.endsWith('.deleted') ? 'canceled' : 'inactive'));
    const active = isActive(status) && !type.endsWith('.deleted');
    await saveSubscription(env, tenantId, {
      plan: active ? desired : 'free', customer_id: String(object.customer || '') || null,
      subscription_id: String(object.id || '') || null, status,
      current_period_end: Number(object.current_period_end || 0) || null
    });
  }
}
async function webhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ detail: 'Stripe webhook verification is not configured.' }, 503);
  const raw = await request.text(); const sig = request.headers.get('stripe-signature') || '';
  if (!await verifyStripeWebhook(raw, sig, String(env.STRIPE_WEBHOOK_SECRET))) return json({ detail: 'Invalid Stripe webhook signature.' }, 401);
  let event; try { event = JSON.parse(raw); } catch { return json({ detail: 'Invalid Stripe webhook payload.' }, 400); }
  const eventId = String(event?.id || ''); if (!eventId) return json({ detail: 'Stripe event id is required.' }, 400);
  const seen = await env.DB.prepare('SELECT event_id FROM billing_webhook_events WHERE event_id=?').bind(eventId).first();
  if (seen) return json({ received: true, duplicate: true });
  await processEvent(env, event);
  await env.DB.prepare('INSERT INTO billing_webhook_events(event_id,event_type,processed_at) VALUES(?,?,?)').bind(eventId, String(event?.type || ''), now()).run();
  return json({ received: true });
}
async function fetchSubscription(env, id) {
  if (!id) return null; const { ok, data } = await stripeRequest(env, `/v1/subscriptions/${encodeURIComponent(id)}`); return ok ? data : null;
}
async function refreshSubscription(env, user) {
  const row = await env.DB.prepare('SELECT * FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();
  if (!row?.stripe_subscription_id || !env.STRIPE_SECRET_KEY) return row || null;
  const sub = await fetchSubscription(env, row.stripe_subscription_id); if (!sub?.id) return row;
  const status = String(sub.status || 'inactive'); const active = isActive(status);
  const plan = normalizedPlan(sub?.metadata?.plan || row.plan || 'business');
  await saveSubscription(env, user.tenant_id, {
    plan: active ? plan : 'free', customer_id: String(sub.customer || '') || row.stripe_customer_id || null,
    subscription_id: String(sub.id), status, current_period_end: Number(sub.current_period_end || 0) || null
  });
  return env.DB.prepare('SELECT * FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();
}
async function confirmCheckout(request, env, user) {
  const body = await request.json().catch(() => ({})); const sessionId = String(body.session_id || '').trim();
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return json({ detail: 'A valid Stripe Checkout session is required.' }, 400);
  const { ok, data: session } = await stripeRequest(env, `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (!ok || !session?.id) return json({ detail: session?.error?.message || 'Stripe checkout session could not be verified.' }, 502);
  const tenantId = String(session?.metadata?.tenant_id || session?.client_reference_id || '').trim();
  if (tenantId !== String(user.tenant_id)) return json({ detail: 'This checkout session does not belong to your workspace.' }, 403);
  if (session.mode !== 'subscription' || session.status !== 'complete') return json({ detail: 'Stripe has not confirmed this subscription yet.' }, 409);
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : String(session.subscription?.id || '');
  const sub = await fetchSubscription(env, subscriptionId); if (!sub?.id) return json({ detail: 'Stripe subscription could not be verified.' }, 502);
  const status = String(sub.status || 'inactive'); const active = isActive(status);
  const plan = normalizedPlan(session?.metadata?.plan || sub?.metadata?.plan || body.plan || 'business');
  await saveSubscription(env, user.tenant_id, {
    plan: active ? plan : 'free', customer_id: String(sub.customer || session.customer || '') || null,
    subscription_id: subscriptionId, status, current_period_end: Number(sub.current_period_end || 0) || null
  });
  return json({ confirmed: active, plan: active ? plan : 'free', status, current_period_end: Number(sub.current_period_end || 0) || null });
}
function periodKey() { const d = new Date(); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`; }
async function status(env, user) {
  const row = await refreshSubscription(env, user);
  const planId = normalizedPlan(row?.plan || 'free'); const plan = PLAN_CONFIG[planId];
  const usage = await env.DB.prepare('SELECT direct_variable_cost_usd FROM billing_usage_guard WHERE tenant_id=? AND period_key=?').bind(user.tenant_id, periodKey()).first();
  const cost = Number(usage?.direct_variable_cost_usd || 0); const ceiling = Number(plan.entitlements.cost_ceiling_usd || 0);
  return json({
    plan: planId, plan_name: plan.name, subscription: row || null,
    entitlements: plan.entitlements,
    target_gross_margin_percent: targetMargin(env),
    direct_variable_cost_usd: cost,
    cost_ceiling_usd: ceiling,
    premium_usage_allowed: planId !== 'free' && cost < ceiling,
    billing_configured: Boolean(env.STRIPE_SECRET_KEY),
    portal_configured: Boolean(env.STRIPE_SECRET_KEY)
  });
}

export async function handleTierBilling(request, env) {
  const url = new URL(request.url); const path = url.pathname;
  const relevant = path === '/api/plans' || ['/api/billing/checkout','/api/billing/confirm','/api/billing/status','/api/billing/entitlements','/api/billing/webhook'].includes(path);
  if (!relevant) return null;
  await ensureSchema(env);
  if (path === '/api/plans' && request.method === 'GET') return json({
    free_first: true,
    plans: PLAN_ORDER.map(id => publicPlan(env, id)),
    business_checkout_configured: Boolean(env.STRIPE_SECRET_KEY && planPrice(env, 'business')),
    tier_checkout_configured: Object.fromEntries(PLAN_ORDER.filter(id=>id!=='free').map(id=>[id,Boolean(env.STRIPE_SECRET_KEY && planPrice(env,id))])),
    target_gross_margin_percent: targetMargin(env)
  });
  if (path === '/api/billing/webhook' && request.method === 'POST') return webhook(request, env);
  const user = await currentUser(request, env);
  if (!user) return json({ detail: 'Sign in required.' }, 401);
  if ((path === '/api/billing/status' || path === '/api/billing/entitlements') && request.method === 'GET') return status(env, user);
  if (path === '/api/billing/checkout' && request.method === 'POST') return createCheckout(request, env, user);
  if (path === '/api/billing/confirm' && request.method === 'POST') return confirmCheckout(request, env, user);
  return null;
}
