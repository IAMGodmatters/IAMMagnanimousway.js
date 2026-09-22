CREATE TABLE IF NOT EXISTS user_totp (
  user_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  secret_ciphertext TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  verified_at INTEGER NOT NULL DEFAULT 0,
  last_counter INTEGER NOT NULL DEFAULT -1
);

CREATE INDEX IF NOT EXISTS idx_user_totp_tenant
  ON user_totp(tenant_id, enabled);

CREATE TABLE IF NOT EXISTS auth_mfa_challenges (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_auth_mfa_challenges_user
  ON auth_mfa_challenges(user_id, expires_at, consumed_at);
