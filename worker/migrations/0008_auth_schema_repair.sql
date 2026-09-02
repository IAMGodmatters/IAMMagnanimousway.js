-- Normalize legacy auth tables so the live UUID-based signup/login code works on
-- databases originally created with INTEGER PRIMARY KEY auth tables.
-- Existing rows are preserved and identifiers are converted to TEXT.
PRAGMA foreign_keys=OFF;

ALTER TABLE tenants RENAME TO tenants_legacy_0008;
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_user_id TEXT,
  created_at INTEGER NOT NULL
);
INSERT INTO tenants(id,name,slug,owner_user_id,created_at)
SELECT CAST(id AS TEXT), name, slug, NULL, created_at
FROM tenants_legacy_0008;
DROP TABLE tenants_legacy_0008;

ALTER TABLE users RENAME TO users_legacy_0008;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL DEFAULT 'User',
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE(tenant_id,email)
);
INSERT INTO users(id,tenant_id,name,email,role,password_hash,password_salt,active,created_at)
SELECT
  CAST(id AS TEXT),
  CASE WHEN tenant_id IS NULL OR tenant_id='' THEN NULL ELSE CAST(tenant_id AS TEXT) END,
  COALESCE(NULLIF(name,''),'User'),
  lower(trim(email)),
  COALESCE(NULLIF(role,''),'member'),
  password_hash,
  COALESCE(password_salt,''),
  COALESCE(active,1),
  created_at
FROM users_legacy_0008;
DROP TABLE users_legacy_0008;

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
PRAGMA foreign_keys=ON;
