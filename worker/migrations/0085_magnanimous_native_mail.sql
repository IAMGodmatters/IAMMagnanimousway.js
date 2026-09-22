CREATE TABLE IF NOT EXISTS magnanimous_mail_outbox (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'transactional',
  to_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  sensitive INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT '',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sent_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_mail_outbox_status
ON magnanimous_mail_outbox(status,updated_at);

CREATE INDEX IF NOT EXISTS idx_magnanimous_mail_outbox_recipient
ON magnanimous_mail_outbox(to_address,created_at);
