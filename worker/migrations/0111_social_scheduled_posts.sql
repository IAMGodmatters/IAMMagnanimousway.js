-- Native Magnanimous scheduled social publishing.
-- Each post is tenant-scoped, bound to its approved account/content/time and never auto-retried after an uncertain provider response.
CREATE TABLE IF NOT EXISTS social_scheduled_posts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('youtube','tiktok','linkedin')),
  external_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  scheduled_at INTEGER NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','publishing','published','failed','outcome_unknown','cancelled')),
  idempotency_key TEXT NOT NULL,
  approval_hash TEXT,
  approved_at INTEGER,
  approved_by TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_at INTEGER,
  provider_receipt_json TEXT,
  last_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_social_scheduled_due ON social_scheduled_posts(status,scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_scheduled_tenant ON social_scheduled_posts(tenant_id,scheduled_at);
