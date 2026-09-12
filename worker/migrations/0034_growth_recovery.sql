-- Consent-aware revenue funnel, lead memory, abandoned-checkout recovery, and outreach receipts.
CREATE TABLE IF NOT EXISTS growth_leads (
  id TEXT PRIMARY KEY,
  scope_tenant_id TEXT NOT NULL,
  customer_tenant_id TEXT NOT NULL DEFAULT '',
  user_id TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'platform',
  source_ref TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'lead',
  intent TEXT NOT NULL DEFAULT '',
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  consent_source TEXT NOT NULL DEFAULT '',
  consent_updated_at INTEGER,
  checkout_provider TEXT NOT NULL DEFAULT '',
  checkout_reference TEXT NOT NULL DEFAULT '',
  checkout_url TEXT NOT NULL DEFAULT '',
  checkout_started_at INTEGER,
  converted_at INTEGER,
  last_activity_at INTEGER NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  unsubscribe_token TEXT NOT NULL UNIQUE,
  unsubscribed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(scope_tenant_id,email)
);
CREATE INDEX IF NOT EXISTS idx_growth_leads_stage ON growth_leads(scope_tenant_id,stage,last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_leads_checkout ON growth_leads(checkout_provider,checkout_reference);

CREATE TABLE IF NOT EXISTS growth_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope_tenant_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'platform',
  detail TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_growth_events_lead ON growth_events(scope_tenant_id,lead_id,id DESC);

CREATE TABLE IF NOT EXISTS growth_outreach_queue (
  id TEXT PRIMARY KEY,
  scope_tenant_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  sequence_key TEXT NOT NULL,
  step INTEGER NOT NULL DEFAULT 1,
  scheduled_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  subject TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  action_url TEXT NOT NULL DEFAULT '',
  transport TEXT NOT NULL DEFAULT 'auto',
  provider_receipt TEXT NOT NULL DEFAULT '',
  last_error TEXT NOT NULL DEFAULT '',
  sent_at INTEGER,
  cancelled_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(lead_id,sequence_key,step)
);
CREATE INDEX IF NOT EXISTS idx_growth_outreach_due ON growth_outreach_queue(status,scheduled_at);

CREATE TABLE IF NOT EXISTS growth_funnels (
  id TEXT PRIMARY KEY,
  scope_tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  stages_json TEXT NOT NULL DEFAULT '[]',
  source_scope TEXT NOT NULL DEFAULT 'all-platform',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(scope_tenant_id,slug)
);

CREATE TABLE IF NOT EXISTS growth_sync_state (
  scope_tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  cursor TEXT NOT NULL DEFAULT '',
  last_sync_at INTEGER,
  last_error TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(scope_tenant_id,provider)
);
