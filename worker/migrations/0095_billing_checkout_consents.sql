CREATE TABLE IF NOT EXISTS billing_checkout_consents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  terms_version TEXT NOT NULL,
  recurring_disclosure_accepted INTEGER NOT NULL DEFAULT 1 CHECK(recurring_disclosure_accepted IN (0,1)),
  checkout_mode TEXT NOT NULL,
  accepted_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_billing_checkout_consents_tenant_accepted
  ON billing_checkout_consents(tenant_id, accepted_at DESC);
