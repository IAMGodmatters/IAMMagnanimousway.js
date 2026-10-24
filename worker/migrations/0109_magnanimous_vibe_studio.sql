-- Magnanimous native Vibe Studio: private, tenant-scoped source and checkpoints.
-- Nothing here exposes preview source publicly or grants deployment authority.
CREATE TABLE IF NOT EXISTS magnanimous_vibe_projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  brief TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL DEFAULT 'landing',
  html TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_vibe_owner_updated ON magnanimous_vibe_projects(tenant_id,user_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS magnanimous_vibe_versions (
  project_id TEXT NOT NULL REFERENCES magnanimous_vibe_projects(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  html TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (project_id,revision)
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_vibe_versions_owner ON magnanimous_vibe_versions(tenant_id,user_id,project_id,revision DESC);
