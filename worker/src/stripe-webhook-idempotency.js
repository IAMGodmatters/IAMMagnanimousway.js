const PROCESSORS = new Set(['billing', 'business-plan', 'music']);
const CREATE_SQL = [
  'CREATE TABLE IF NOT EXISTS stripe_webhook_event_claims (',
  'event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL, processor TEXT NOT NULL,',
  "status TEXT NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','processed','failed')),",
  "claimed_at INTEGER NOT NULL DEFAULT 0, claim_token TEXT NOT NULL DEFAULT '',",
  'attempt_count INTEGER NOT NULL DEFAULT 0, processed_at INTEGER,',
  "last_error TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0",
  ')'
].join(' ');
const INDEX_SQL = 'CREATE INDEX IF NOT EXISTS idx_stripe_webhook_claim_status ON stripe_webhook_event_claims(status,claimed_at)';
const now = () => Math.floor(Date.now() / 1000);

export async function ensureStripeWebhookEventClaims(env) {
  await env.DB.prepare(CREATE_SQL).run();
  await env.DB.prepare(INDEX_SQL).run();
}

export async function claimStripeWebhookEvent(env, { eventId, eventType, processor, nowSeconds = now(), leaseSeconds = 300 }) {
  const id = String(eventId || '').trim();
  const type = String(eventType || '').trim();
  const owner = String(processor || '').trim();
  if (!id || !type || !PROCESSORS.has(owner)) throw new Error('A valid Stripe event id, type, and processor are required.');
  const token = crypto.randomUUID();
  const cutoff = Number(nowSeconds) - Math.max(30, Number(leaseSeconds) || 300);
  const sql = [
    'INSERT INTO stripe_webhook_event_claims(event_id,event_type,processor,status,claimed_at,claim_token,attempt_count,processed_at,last_error,created_at,updated_at)',
    "VALUES(?,?,?,'processing',?,?,1,NULL,'',?,?)",
    'ON CONFLICT(event_id) DO UPDATE SET',
    "event_type=excluded.event_type,status='processing',claimed_at=excluded.claimed_at,claim_token=excluded.claim_token,",
    "attempt_count=stripe_webhook_event_claims.attempt_count+1,processed_at=NULL,last_error='',updated_at=excluded.updated_at",
    'WHERE stripe_webhook_event_claims.processor=excluded.processor',
    "AND stripe_webhook_event_claims.status!='processed'",
    "AND (stripe_webhook_event_claims.status!='processing' OR stripe_webhook_event_claims.claimed_at<=?)",
    'RETURNING event_id'
  ].join(' ');
  const claimed = await env.DB.prepare(sql).bind(id, type, owner, Number(nowSeconds), token, Number(nowSeconds), Number(nowSeconds), cutoff).first();
  if (claimed?.event_id) return { claimed: true, claimToken: token, attemptedAt: Number(nowSeconds) };
  const existing = await env.DB.prepare('SELECT status,processor,claimed_at FROM stripe_webhook_event_claims WHERE event_id=?').bind(id).first();
  if (String(existing?.status || '') === 'processed') return { duplicate: true };
  return { busy: true, reason: existing && String(existing.processor || '') !== owner ? 'processor_mismatch' : 'processing' };
}

export async function completeStripeWebhookEvent(env, { eventId, processor, claimToken, nowSeconds = now() }) {
  const result = await env.DB.prepare("UPDATE stripe_webhook_event_claims SET status='processed',processed_at=?,claimed_at=0,claim_token='',last_error='',updated_at=? WHERE event_id=? AND processor=? AND status='processing' AND claim_token=?")
    .bind(Number(nowSeconds), Number(nowSeconds), String(eventId), String(processor), String(claimToken)).run();
  if (Number(result?.meta?.changes || 0) !== 1) throw new Error('Stripe webhook claim ownership was lost before completion.');
  return true;
}

export async function failStripeWebhookEvent(env, { eventId, processor, claimToken, errorCode = 'processing_failed', nowSeconds = now() }) {
  const safeCode = String(errorCode || 'processing_failed').replace(/[^a-z0-9_-]/gi, '').slice(0, 64) || 'processing_failed';
  const result = await env.DB.prepare("UPDATE stripe_webhook_event_claims SET status='failed',claimed_at=0,claim_token='',last_error=?,updated_at=? WHERE event_id=? AND processor=? AND status='processing' AND claim_token=?")
    .bind(safeCode, Number(nowSeconds), String(eventId), String(processor), String(claimToken)).run();
  return Number(result?.meta?.changes || 0) === 1;
}
