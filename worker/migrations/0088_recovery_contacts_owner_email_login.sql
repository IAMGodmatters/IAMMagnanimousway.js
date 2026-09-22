CREATE TABLE IF NOT EXISTS user_recovery_contacts (
  user_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  recovery_email TEXT NOT NULL DEFAULT '',
  recovery_email_verified_at INTEGER NOT NULL DEFAULT 0,
  phone_e164 TEXT NOT NULL DEFAULT '',
  phone_verified_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_recovery_contacts_email
  ON user_recovery_contacts(recovery_email, recovery_email_verified_at);

CREATE TABLE IF NOT EXISTS recovery_contact_challenges (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  target TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_recovery_contact_challenges_user
  ON recovery_contact_challenges(user_id, kind, expires_at, consumed_at);

CREATE TABLE IF NOT EXISTS owner_email_login_challenges (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at INTEGER,
  delivery_provider TEXT NOT NULL DEFAULT '',
  delivery_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_owner_email_login_active
  ON owner_email_login_challenges(user_id, expires_at, consumed_at);
