import { currentUser } from './integrations.js';

const encoder = new TextEncoder();
const now = () => Math.floor(Date.now() / 1000);
const PREMIUM_AMOUNT_CENTS = 4900;
const PREMIUM_CURRENCY = 'usd';
const PREMIUM_STATUSES = new Set(['active', 'trialing']);
const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { 'cache-control': 'no-store' }
});

async function ensureTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS subscriptions (
    tenant_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'inactive',
    stripe_customer_id TEXT NOT NULL DEFAULT '',
    stripe_subscription_id TEXT NOT NULL DEFAULT '',
    stripe_price_id TEXT NOT NULL DEFAULT '',
    current_period_end INTEGER,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS billing_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL DEFAULT '',
    stripe_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT '',
    stripe_customer_id TEXT NOT NULL DEFAULT '',
    stripe_subscription_id TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  )`).run();
}

function stripeConfigured(env) {
  return Boolean(String(env?.STRIPE_SECRET_KEY || '').trim());
}

function webhookConfigured(env) {
  return Boolean(String(env?.STRIPE_WEBHOOK_SECRET || '').trim());
}

function planPayload(user, row, env) {
  if (user?.role === 'owner') {
    return {
      plan: 'owner',
      premium: true,
      status: 'active',
      price_cents: PREMIUM_AMOUNT_CENTS,
      currency: PREMIUM_CURRENCY,
      interval: 'month',
      stripe_configured: stripeConfigured(env),
      webhook_configured: webhookConfigured(env),
      cancel_at_period_end: false,
      current_period_end: null
    };
  }
  const status = String(row?.status || 'inactive');
  return {
    plan: PREMIUM_STATUSES.has(status) ? 'premium' : 'free',
    premium: PREMIUM_STATUSES.has(status),
    status,
    price_cents: PREMIUM_AMOUNT_CENTS,
    currency: PREMIUM_CURRENCY,
    interval: 'month',
    stripe_configured: stripeConfigured(env),
    webhook_configured: webhookConfigured(env),
    cancel_at_period_end: Boolean(row?.cancel_at_period_end),
    current_period_end: row?.current_period_end || null,
    stripe_customer: Boolean(row?.stripe_customer_id)
  };
}

async function stripePost(env, path, params) {
  const secret = String(env?.STRIPE_SECRET_KEY || '').trim();
  if (!secret) {
    const error = new Error('Stripe is not connected to the platform yet.');
    error.status = 503;
    throw error;
  }
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(params)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || `Stripe request failed (${response.status}).`);
    error.status = response.status >= 500 ? 502 : 400;
    throw error;
  }
  return data;
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function safeEqual(left, right) {
  const a = String(left || '').toLowerCase();
  const b = String(right || '').toLowerCase();
  if (a.length !== b.length || !a.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

async function verifyStripeSignature(rawBody, header, secret) {
  const pieces = String(header || '').split(',').map(part => part.trim());
  const timestamp = pieces.find(part => part.startsWith('t='))?.slice(2) || '';
  const signatures = pieces.filter(part => part.startsWith('v1=')).map(part => part.slice(3));
  if (!timestamp || signatures.length === 0 || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(now() - Number(timestamp)) > 300) return false;
  const expected = await hmacHex(secret, `${timestamp}.${rawBody}`);
  return signatures.some(signature => safeEqual(signature, expected));
}

async function subscriptionRow(env, tenantId) {
  return env.DB.prepare('SELECT * FROM subscriptions WHERE tenant_id=?').bind(String(tenantId)).first();
}

async function upsertSubscription(env, values) {
  const ts = now();
  const existing = await subscriptionRow(env, values.tenant_id);
  await env.DB.prepare(`INSERT INTO subscriptions(
    tenant_id,user_id,plan,status,stripe_customer_id,stripe_subscription_id,stripe_price_id,current_period_end,cancel_at_period_end,created_at,updated_at
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id) DO UPDATE SET
    user_id=excluded.user_id,
    plan=excluded.plan,
    status=excluded.status,
    stripe_customer_id=CASE WHEN excluded.stripe_customer_id<>'' THEN excluded.stripe_customer_id ELSE subscriptions.stripe_customer_id END,
    stripe_subscription_id=CASE WHEN excluded.stripe_subscription_id<>'' THEN excluded.stripe_subscription_id ELSE subscriptions.stripe_subscription_id END,
    stripe_price_id=CASE WHEN excluded.stripe_price_id<>'' THEN excluded.stripe_price_id ELSE subscriptions.stripe_price_id END,
    current_period_end=excluded.current_period_end,
    cancel_at_period_end=excluded.cancel_at_period_end,
    updated_at=excluded.updated_at`)
    .bind(
      String(values.tenant_id || ''),
      String(values.user_id || existing?.user_id || ''),
      String(values.plan || 'premium'),
      String(values.status || existing?.status || 'inactive'),
      String(values.stripe_customer_id || ''),
      String(values.stripe_subscription_id || ''),
      String(values.stripe_price_id || ''),
      values.current_period_end ? Number(values.current_period_end) : null,
      values.cancel_at_period_end ? 1 : 0,
      existing?.created_at || ts,
      ts
    ).run();
}

async function tenantForStripeObject(env, object) {
  const metadataTenant = String(object?.metadata?.tenant_id || object?.client_reference_id || '').trim();
  if (metadataTenant) return metadataTenant;
  const subscriptionId = String(
    object?.subscription ||
    object?.parent?.subscription_details?.subscription ||
    (String(object?.id || '').startsWith('sub_') ? object.id : '')
  ).trim();
  if (subscriptionId) {
    const row = await env.DB.prepare('SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id=?').bind(subscriptionId).first();
    if (row?.tenant_id) return String(row.tenant_id);
  }
  const customerId = String(object?.customer || '').trim();
  if (customerId) {
    const row = await env.DB.prepare('SELECT tenant_id FROM subscriptions WHERE stripe_customer_id=? ORDER BY updated_at DESC LIMIT 1').bind(customerId).first();
    if (row?.tenant_id) return String(row.tenant_id);
  }
  return '';
}

function stripeSubscriptionId(object) {
  if (String(object?.id || '').startsWith('sub_')) return String(object.id);
  return String(object?.subscription || object?.parent?.subscription_details?.subscription || '').trim();
}

async function recordEvent(env, event, tenantId, object) {
  const eventType = String(event?.type || 'unknown');
  const amount = eventType === 'invoice.paid' ? Number(object?.amount_paid || 0) : 0;
  const result = await env.DB.prepare(`INSERT OR IGNORE INTO billing_events(
    tenant_id,stripe_event_id,event_type,amount_cents,currency,status,stripe_customer_id,stripe_subscription_id,created_at
  ) VALUES(?,?,?,?,?,?,?,?,?)`)
    .bind(
      String(tenantId || ''),
      String(event?.id || crypto.randomUUID()),
      eventType,
      Number.isFinite(amount) ? amount : 0,
      String(object?.currency || PREMIUM_CURRENCY),
      String(object?.status || object?.payment_status || ''),
      String(object?.customer || ''),
      stripeSubscriptionId(object),
      Number(event?.created || now())
    ).run();
  return Number(result?.meta?.changes || 0) > 0;
}

async function processWebhook(env, event) {
  const object = event?.data?.object || {};
  const tenantId = await tenantForStripeObject(env, object);
  const isNew = await recordEvent(env, event, tenantId, object);
  if (!isNew) return;

  if (event.type === 'checkout.session.completed') {
    const checkoutTenant = String(object?.client_reference_id || object?.metadata?.tenant_id || tenantId || '').trim();
    if (!checkoutTenant) return;
    await upsertSubscription(env, {
      tenant_id: checkoutTenant,
      user_id: String(object?.metadata?.user_id || ''),
      plan: 'premium',
      status: 'active',
      stripe_customer_id: String(object?.customer || ''),
      stripe_subscription_id: String(object?.subscription || ''),
      stripe_price_id: String(env?.STRIPE_PRICE_ID || ''),
      current_period_end: null,
      cancel_at_period_end: false
    });
    return;
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subTenant = String(object?.metadata?.tenant_id || tenantId || '').trim();
    if (!subTenant) return;
    const priceId = String(object?.items?.data?.[0]?.price?.id || env?.STRIPE_PRICE_ID || '');
    await upsertSubscription(env, {
      tenant_id: subTenant,
      user_id: String(object?.metadata?.user_id || ''),
      plan: 'premium',
      status: event.type === 'customer.subscription.deleted' ? 'canceled' : String(object?.status || 'inactive'),
      stripe_customer_id: String(object?.customer || ''),
      stripe_subscription_id: String(object?.id || ''),
      stripe_price_id: priceId,
      current_period_end: Number(object?.current_period_end || 0) || null,
      cancel_at_period_end: Boolean(object?.cancel_at_period_end)
    });
  }
}

async function handleWebhook(request, env) {
  const secret = String(env?.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!secret) return json({ error: 'Stripe webhook verification is not configured.' }, 503);
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  if (!(await verifyStripeSignature(rawBody, signature, secret))) {
    return json({ error: 'Invalid Stripe webhook signature.' }, 400);
  }
  let event;
  try { event = JSON.parse(rawBody); } catch { return json({ error: 'Invalid Stripe event payload.' }, 400); }
  await processWebhook(env, event);
  return json({ received: true });
}

async function createCheckout(request, env, user) {
  const row = await subscriptionRow(env, user.tenant_id);
  if (PREMIUM_STATUSES.has(String(row?.status || ''))) {
    return json({ error: 'This workspace already has Premium. Use Manage billing instead.' }, 409);
  }

  const origin = new URL(request.url).origin;
  const params = {
    mode: 'subscription',
    success_url: `${origin}/billing?checkout=success`,
    cancel_url: `${origin}/billing?checkout=cancelled`,
    client_reference_id: String(user.tenant_id),
    'metadata[tenant_id]': String(user.tenant_id),
    'metadata[user_id]': String(user.id),
    'subscription_data[metadata][tenant_id]': String(user.tenant_id),
    'subscription_data[metadata][user_id]': String(user.id),
    'line_items[0][quantity]': '1',
    allow_promotion_codes: 'true'
  };

  if (row?.stripe_customer_id) params.customer = String(row.stripe_customer_id);
  else if (user.email) params.customer_email = String(user.email);

  const configuredPrice = String(env?.STRIPE_PRICE_ID || '').trim();
  if (configuredPrice) {
    params['line_items[0][price]'] = configuredPrice;
  } else {
    params['line_items[0][price_data][currency]'] = PREMIUM_CURRENCY;
    params['line_items[0][price_data][unit_amount]'] = String(PREMIUM_AMOUNT_CENTS);
    params['line_items[0][price_data][recurring][interval]'] = 'month';
    params['line_items[0][price_data][product_data][name]'] = 'I AM Magnanimous Way Premium';
    params['line_items[0][price_data][product_data][description]'] = 'Premium AI, automation, voice, creator, and business capabilities.';
  }

  const session = await stripePost(env, 'checkout/sessions', params);
  return json({ url: session.url, session_id: session.id });
}

async function createPortal(request, env, user) {
  const row = await subscriptionRow(env, user.tenant_id);
  if (!row?.stripe_customer_id) return json({ error: 'No Stripe customer is linked to this workspace yet.' }, 404);
  const origin = new URL(request.url).origin;
  const session = await stripePost(env, 'billing_portal/sessions', {
    customer: String(row.stripe_customer_id),
    return_url: `${origin}/billing`
  });
  return json({ url: session.url });
}

async function ownerRevenue(env) {
  const [totalUsers, premium, revenue, recent] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) count FROM users WHERE active=1 AND role<>'owner'").first(),
    env.DB.prepare("SELECT COUNT(*) count FROM subscriptions WHERE status IN ('active','trialing')").first(),
    env.DB.prepare("SELECT COALESCE(SUM(amount_cents),0) cents FROM billing_events WHERE event_type='invoice.paid'").first(),
    env.DB.prepare(`SELECT event_type,amount_cents,currency,status,created_at,tenant_id
      FROM billing_events ORDER BY created_at DESC,id DESC LIMIT 20`).all()
  ]);
  const premiumCount = Number(premium?.count || 0);
  const userCount = Number(totalUsers?.count || 0);
  return {
    premium_price_cents: PREMIUM_AMOUNT_CENTS,
    currency: PREMIUM_CURRENCY,
    interval: 'month',
    active_premium: premiumCount,
    free_users: Math.max(0, userCount - premiumCount),
    registered_users: userCount,
    mrr_cents: premiumCount * PREMIUM_AMOUNT_CENTS,
    captured_revenue_cents: Number(revenue?.cents || 0),
    recent_events: recent?.results || []
  };
}

async function ownerSubscriptions(env) {
  const { results } = await env.DB.prepare(`SELECT s.*,u.email,u.name user_name,t.name tenant_name
    FROM subscriptions s
    LEFT JOIN users u ON CAST(u.id AS TEXT)=CAST(s.user_id AS TEXT)
    LEFT JOIN tenants t ON CAST(t.id AS TEXT)=CAST(s.tenant_id AS TEXT)
    ORDER BY s.updated_at DESC LIMIT 500`).all();
  return results || [];
}

export async function handleBilling(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const relevant = path.startsWith('/api/billing') || path.startsWith('/api/admin/revenue') || path.startsWith('/api/admin/subscriptions');
  if (!relevant) return null;
  if (!env?.DB) return json({ error: 'Billing database is not configured.' }, 503);

  try {
    await ensureTables(env);

    if (path === '/api/billing/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }

    const user = await currentUser(request, env);
    if (!user) return json({ error: 'Sign in to manage billing.' }, 401);

    if (path === '/api/billing/status' && request.method === 'GET') {
      return json(planPayload(user, await subscriptionRow(env, user.tenant_id), env));
    }

    if (path === '/api/billing/checkout' && request.method === 'POST') {
      if (user.role === 'owner') return json({ error: 'The owner account already has full platform access.' }, 409);
      return createCheckout(request, env, user);
    }

    if (path === '/api/billing/portal' && request.method === 'POST') {
      return createPortal(request, env, user);
    }

    if (path === '/api/admin/revenue' && request.method === 'GET') {
      if (user.role !== 'owner') return json({ error: 'Owner access is required.' }, 403);
      return json({ ...(await ownerRevenue(env)), stripe_configured: stripeConfigured(env), webhook_configured: webhookConfigured(env) });
    }

    if (path === '/api/admin/subscriptions' && request.method === 'GET') {
      if (user.role !== 'owner') return json({ error: 'Owner access is required.' }, 403);
      return json({ subscriptions: await ownerSubscriptions(env) });
    }

    return json({ error: 'Billing route not found.' }, 404);
  } catch (error) {
    console.error('billing error', error);
    return json({ error: error?.message || 'Billing error.' }, Number(error?.status || 500));
  }
}