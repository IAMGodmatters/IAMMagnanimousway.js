const now = () => Math.floor(Date.now() / 1000);
const AD_PAYMENT_LINK = 'https://buy.stripe.com/3cI9ATeZkeY62rCgId6kg01';
const AD_PRICE_USD = 49;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
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

async function ensureSchema(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT 'Sponsored',
    placement TEXT NOT NULL DEFAULT 'home',
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sponsored_ad_orders (
    stripe_checkout_session_id TEXT PRIMARY KEY,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    ad_id INTEGER,
    headline TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    ad_copy TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sponsored_ad_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    processed_at INTEGER NOT NULL
  )`).run();
  try { await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_sponsored_ad_subscription ON sponsored_ad_orders(stripe_subscription_id)').run(); } catch (_) {}
}

function customFieldMap(object) {
  const result = {};
  for (const field of Array.isArray(object?.custom_fields) ? object.custom_fields : []) {
    const key = String(field?.key || '');
    const value = field?.text?.value ?? field?.dropdown?.value ?? field?.numeric?.value ?? '';
    if (key) result[key] = String(value || '').trim();
  }
  return result;
}

function normalizeDestination(value) {
  let raw = String(value || '').trim();
  if (!raw) return '';
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch (_) {
    return '';
  }
}

function isSponsoredObject(object) {
  return String(object?.metadata?.product_type || '') === 'sponsored_ad';
}

async function activateFromCheckout(env, object) {
  if (!isSponsoredObject(object)) return false;
  if (String(object?.status || '') !== 'complete') return true;
  if (!['paid', 'no_payment_required'].includes(String(object?.payment_status || ''))) return true;

  const sessionId = String(object?.id || '').trim();
  if (!sessionId) return true;
  const existing = await env.DB.prepare('SELECT ad_id FROM sponsored_ad_orders WHERE stripe_checkout_session_id=?').bind(sessionId).first();
  if (existing?.ad_id) {
    await env.DB.prepare('UPDATE ads SET active=1 WHERE id=?').bind(existing.ad_id).run();
    return true;
  }

  const fields = customFieldMap(object);
  const headline = String(fields.ad_headline || 'Sponsored Partner').trim().slice(0, 120) || 'Sponsored Partner';
  const destination = normalizeDestination(fields.ad_url);
  const copy = String(fields.ad_copy || '').trim().slice(0, 200);
  if (!destination) return true;

  const label = copy ? `Sponsored · ${copy}`.slice(0, 240) : 'Sponsored';
  const created = now();
  const insert = await env.DB.prepare(
    'INSERT INTO ads(title,url,label,placement,active,created_at) VALUES(?,?,?,?,?,?)'
  ).bind(headline, destination, label, 'home', 1, created).run();
  const adId = Number(insert?.meta?.last_row_id || 0) || null;
  await env.DB.prepare(`
    INSERT INTO sponsored_ad_orders(
      stripe_checkout_session_id,stripe_subscription_id,stripe_customer_id,ad_id,
      headline,destination_url,ad_copy,status,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?)
  `).bind(
    sessionId,
    String(object?.subscription || '') || null,
    String(object?.customer || '') || null,
    adId,
    headline,
    destination,
    copy,
    'active',
    created,
    created
  ).run();
  return true;
}

async function syncSubscriptionStatus(env, type, object) {
  if (!isSponsoredObject(object)) return false;
  const subscriptionId = String(object?.id || '').trim();
  if (!subscriptionId) return true;
  const status = String(object?.status || (type.endsWith('.deleted') ? 'canceled' : 'inactive'));
  const active = ['active', 'trialing'].includes(status) && !type.endsWith('.deleted');
  const row = await env.DB.prepare('SELECT ad_id FROM sponsored_ad_orders WHERE stripe_subscription_id=?').bind(subscriptionId).first();
  if (row?.ad_id) await env.DB.prepare('UPDATE ads SET active=? WHERE id=?').bind(active ? 1 : 0, row.ad_id).run();
  await env.DB.prepare('UPDATE sponsored_ad_orders SET status=?,updated_at=? WHERE stripe_subscription_id=?')
    .bind(status, now(), subscriptionId).run();
  return true;
}

async function processSponsoredEvent(env, event) {
  const type = String(event?.type || '');
  const object = event?.data?.object || {};
  if (type === 'checkout.session.completed') return activateFromCheckout(env, object);
  if (type === 'customer.subscription.created' || type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    return syncSubscriptionStatus(env, type, object);
  }
  return false;
}

export async function handleSponsoredAds(request, env) {
  const url = new URL(request.url);

  if (url.pathname === '/api/advertising/config' && request.method === 'GET') {
    return json({
      enabled: true,
      placement: 'free_tier',
      price_usd: AD_PRICE_USD,
      cadence: 'month',
      payment_link: AD_PAYMENT_LINK,
      automatic_activation: true
    });
  }

  if (url.pathname !== '/api/billing/webhook' || request.method !== 'POST') return null;
  if (!env.STRIPE_WEBHOOK_SECRET || !env.DB) return null;

  const clone = request.clone();
  const rawBody = await clone.text();
  let event;
  try { event = JSON.parse(rawBody); } catch (_) { return null; }

  const object = event?.data?.object || {};
  const type = String(event?.type || '');
  const potentiallySponsored = isSponsoredObject(object) && (
    type === 'checkout.session.completed' ||
    type === 'customer.subscription.created' ||
    type === 'customer.subscription.updated' ||
    type === 'customer.subscription.deleted'
  );
  if (!potentiallySponsored) return null;

  const signature = request.headers.get('stripe-signature') || '';
  if (!await verifyStripeWebhook(rawBody, signature, String(env.STRIPE_WEBHOOK_SECRET))) {
    return json({ detail: 'Invalid Stripe webhook signature.' }, 401);
  }

  await ensureSchema(env);
  const eventId = String(event?.id || '');
  if (!eventId) return json({ detail: 'Stripe event id is required.' }, 400);
  const seen = await env.DB.prepare('SELECT event_id FROM sponsored_ad_webhook_events WHERE event_id=?').bind(eventId).first();
  if (seen) return json({ received: true, duplicate: true, sponsored_ad: true });

  await processSponsoredEvent(env, event);
  await env.DB.prepare('INSERT INTO sponsored_ad_webhook_events(event_id,event_type,processed_at) VALUES(?,?,?)')
    .bind(eventId, type, now()).run();
  return json({ received: true, sponsored_ad: true });
}
