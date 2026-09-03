CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_user_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

DROP TRIGGER IF EXISTS trg_workspace_owner_role;
CREATE TRIGGER trg_workspace_owner_role
AFTER INSERT ON users
WHEN EXISTS (
  SELECT 1
  FROM tenants
  WHERE tenants.id = NEW.tenant_id
    AND tenants.owner_user_id = NEW.id
)
BEGIN
  UPDATE users SET role='owner' WHERE id=NEW.id;
END;

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY(tenant_id,key)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Sponsored',
  placement TEXT NOT NULL DEFAULT 'home',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO settings(key,value) VALUES ('site_name','I AM Magnanimous AI Platform');
INSERT OR IGNORE INTO settings(key,value) VALUES ('tagline','Free AI tools, Magnanimous AI orchestration, and creator tools in one place.');
INSERT OR IGNORE INTO settings(key,value) VALUES ('canva_url','');
