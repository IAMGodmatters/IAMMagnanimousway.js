-- Move hot-path runtime schema creation into deployment migrations.
-- This prevents repeated DDL/write-style bootstrap work from consuming D1 Free daily row-write quota.

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY(tenant_id,key)
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

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO settings(key,value)
VALUES('site_name','I AM Magnanimous AI Platform')
ON CONFLICT(key) DO NOTHING;

INSERT INTO settings(key,value)
VALUES('tagline','Free-first AI tools, Magnanimous orchestration, and creator tools in one place.')
ON CONFLICT(key) DO NOTHING;

CREATE TABLE IF NOT EXISTS security_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_rate_limits_updated
  ON security_rate_limits(updated_at);
