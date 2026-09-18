-- Magnanimous Data Studio + Open License Media Library
CREATE TABLE IF NOT EXISTS data_studio_workbooks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  columns_json TEXT NOT NULL DEFAULT '[]',
  rows_json TEXT NOT NULL DEFAULT '[]',
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_data_studio_owner ON data_studio_workbooks(tenant_id,user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_studio_workspace ON data_studio_workbooks(tenant_id,visibility,updated_at DESC);

CREATE TABLE IF NOT EXISTS media_library_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  external_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  creator TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  asset_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  landing_url TEXT NOT NULL DEFAULT '',
  license TEXT NOT NULL DEFAULT '',
  license_url TEXT NOT NULL DEFAULT '',
  attribution TEXT NOT NULL DEFAULT '',
  license_verified INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_library_owner ON media_library_assets(tenant_id,user_id,updated_at DESC);
