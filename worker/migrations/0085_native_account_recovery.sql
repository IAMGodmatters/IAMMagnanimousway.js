CREATE TABLE IF NOT EXISTS account_recovery_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  code_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_account_recovery_codes_user
  ON account_recovery_codes(user_id, tenant_id, used_at);

CREATE INDEX IF NOT EXISTS idx_account_recovery_codes_created
  ON account_recovery_codes(created_at);
