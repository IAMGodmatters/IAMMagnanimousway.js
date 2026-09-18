-- Magnanimous Music Studio: tenant-scoped projects, assets, generations and exports.
CREATE TABLE IF NOT EXISTS music_projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'song',
  creative_brief TEXT NOT NULL DEFAULT '',
  lyrics TEXT NOT NULL DEFAULT '',
  bpm INTEGER,
  musical_key TEXT,
  time_signature TEXT NOT NULL DEFAULT '4/4',
  rights_status TEXT NOT NULL DEFAULT 'original',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS music_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  storage_key TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT '',
  source_rights TEXT NOT NULL DEFAULT 'original',
  consent_record TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS music_generations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  engine TEXT NOT NULL DEFAULT 'unconfigured',
  input_json TEXT NOT NULL DEFAULT '{}',
  output_json TEXT NOT NULL DEFAULT '{}',
  cost_units INTEGER NOT NULL DEFAULT 0,
  error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS music_exports (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  format TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  storage_key TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_music_projects_tenant ON music_projects(tenant_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_music_assets_project ON music_assets(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_music_generations_project ON music_generations(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_music_exports_project ON music_exports(tenant_id, project_id);
