CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  delivery_provider TEXT NOT NULL DEFAULT '',
  delivery_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user_expiry
  ON password_reset_tokens(user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_expiry
  ON password_reset_tokens(expires_at);
