-- Magnanimous Telecom native carrier / regulator mailbox watch
-- Durable dedupe and audit state for the owner-authorized Gmail watch.

CREATE TABLE IF NOT EXISTS telecom_email_watch_events (
  message_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider_key TEXT NOT NULL DEFAULT '',
  thread_id TEXT NOT NULL DEFAULT '',
  sender TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  classification TEXT NOT NULL DEFAULT 'observed',
  action TEXT NOT NULL DEFAULT 'recorded',
  reply_message_id TEXT NOT NULL DEFAULT '',
  snippet TEXT NOT NULL DEFAULT '',
  attachment_names_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  processed_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telecom_email_watch_tenant_processed
  ON telecom_email_watch_events(tenant_id, processed_at DESC);

CREATE TABLE IF NOT EXISTS telecom_email_watch_state (
  tenant_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_run_at INTEGER,
  last_message_at INTEGER,
  last_action TEXT NOT NULL DEFAULT '',
  last_error TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);
