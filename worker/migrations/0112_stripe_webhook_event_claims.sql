CREATE TABLE IF NOT EXISTS stripe_webhook_event_claims (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processor TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','processed','failed')),
  claimed_at INTEGER NOT NULL DEFAULT 0,
  claim_token TEXT NOT NULL DEFAULT '',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  processed_at INTEGER,
  last_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_claim_status
  ON stripe_webhook_event_claims(status, claimed_at);

CREATE TABLE IF NOT EXISTS business_plan_subscription_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at INTEGER NOT NULL
);

-- Preserve the existing replay history before switching handlers to the atomic claim ledger.
INSERT OR IGNORE INTO stripe_webhook_event_claims
  (event_id,event_type,processor,status,claimed_at,claim_token,attempt_count,processed_at,last_error,created_at,updated_at)
SELECT event_id,event_type,'billing','processed',0,'',1,processed_at,'',processed_at,processed_at
FROM billing_webhook_events;

INSERT OR IGNORE INTO stripe_webhook_event_claims
  (event_id,event_type,processor,status,claimed_at,claim_token,attempt_count,processed_at,last_error,created_at,updated_at)
SELECT event_id,event_type,'business-plan','processed',0,'',1,processed_at,'',processed_at,processed_at
FROM business_plan_subscription_events;

INSERT OR IGNORE INTO stripe_webhook_event_claims
  (event_id,event_type,processor,status,claimed_at,claim_token,attempt_count,processed_at,last_error,created_at,updated_at)
SELECT id,event_type,'music','processed',0,'',1,processed_at,'',processed_at,processed_at
FROM stripe_events;
