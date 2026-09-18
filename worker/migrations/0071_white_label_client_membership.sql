CREATE TABLE IF NOT EXISTS agency_client_users(
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,client_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_agency_client_users_user ON agency_client_users(tenant_id,user_id,active);
CREATE TABLE IF NOT EXISTS agency_client_user_invites(
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  revoked_at INTEGER,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agency_client_invites_client ON agency_client_user_invites(tenant_id,client_id,created_at DESC);
