-- Magnanimous-owned normalized Mux control-plane state.
-- No Mux access-token secrets, stream keys, private signing keys, webhook signing secrets,
-- raw media bytes, DRM license secrets, billing credentials, or other provider secrets are stored here.

CREATE TABLE IF NOT EXISTS magnanimous_mux_environments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_environment_id TEXT NOT NULL DEFAULT '',
  environment_name TEXT NOT NULL DEFAULT '',
  environment_type TEXT NOT NULL DEFAULT '',
  organization_id TEXT NOT NULL DEFAULT '',
  organization_name TEXT NOT NULL DEFAULT '',
  permission_summary_json TEXT NOT NULL DEFAULT '[]',
  last_synced_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_mux_environments_tenant ON magnanimous_mux_environments(tenant_id);

CREATE TABLE IF NOT EXISTS magnanimous_mux_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_asset_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  duration_seconds REAL,
  aspect_ratio TEXT NOT NULL DEFAULT '',
  resolution_tier TEXT NOT NULL DEFAULT '',
  video_quality TEXT NOT NULL DEFAULT '',
  creator_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  external_id TEXT NOT NULL DEFAULT '',
  passthrough TEXT NOT NULL DEFAULT '',
  primary_audio_track_id TEXT NOT NULL DEFAULT '',
  created_at_provider INTEGER,
  last_synced_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,external_asset_id)
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_mux_assets_tenant_status ON magnanimous_mux_assets(tenant_id,status);

CREATE TABLE IF NOT EXISTS magnanimous_mux_playback_ids (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_playback_id TEXT NOT NULL DEFAULT '',
  external_asset_id TEXT NOT NULL DEFAULT '',
  external_live_stream_id TEXT NOT NULL DEFAULT '',
  policy TEXT NOT NULL DEFAULT '',
  drm_configuration_id TEXT NOT NULL DEFAULT '',
  playback_restriction_id TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,external_playback_id)
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_mux_playback_ids_asset ON magnanimous_mux_playback_ids(tenant_id,external_asset_id);

CREATE TABLE IF NOT EXISTS magnanimous_mux_live_streams (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_live_stream_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  latency_mode TEXT NOT NULL DEFAULT '',
  reconnect_window_seconds INTEGER,
  active_asset_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  passthrough TEXT NOT NULL DEFAULT '',
  test_mode INTEGER NOT NULL DEFAULT 0,
  created_at_provider INTEGER,
  last_synced_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,external_live_stream_id)
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_mux_live_streams_status ON magnanimous_mux_live_streams(tenant_id,status);

CREATE TABLE IF NOT EXISTS magnanimous_mux_uploads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_upload_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  external_asset_id TEXT NOT NULL DEFAULT '',
  timeout_seconds INTEGER,
  error_type TEXT NOT NULL DEFAULT '',
  created_at_provider INTEGER,
  last_synced_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,external_upload_id)
);

CREATE TABLE IF NOT EXISTS magnanimous_mux_tracks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_track_id TEXT NOT NULL DEFAULT '',
  external_asset_id TEXT NOT NULL DEFAULT '',
  track_type TEXT NOT NULL DEFAULT '',
  text_type TEXT NOT NULL DEFAULT '',
  text_source TEXT NOT NULL DEFAULT '',
  language_code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  duration_seconds REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,external_track_id)
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_mux_tracks_asset ON magnanimous_mux_tracks(tenant_id,external_asset_id);

CREATE TABLE IF NOT EXISTS magnanimous_mux_webhooks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_webhook_id TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 0,
  last_event_type TEXT NOT NULL DEFAULT '',
  last_event_id TEXT NOT NULL DEFAULT '',
  last_event_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,external_webhook_id)
);

CREATE TABLE IF NOT EXISTS magnanimous_mux_robots_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_job_id TEXT NOT NULL DEFAULT '',
  external_asset_id TEXT NOT NULL DEFAULT '',
  workflow TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  passthrough TEXT NOT NULL DEFAULT '',
  result_summary_json TEXT NOT NULL DEFAULT '{}',
  created_at_provider INTEGER,
  completed_at_provider INTEGER,
  last_synced_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,external_job_id)
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_mux_robots_asset ON magnanimous_mux_robots_jobs(tenant_id,external_asset_id,workflow);

CREATE TABLE IF NOT EXISTS magnanimous_mux_data_snapshots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  scope_type TEXT NOT NULL DEFAULT '',
  scope_id TEXT NOT NULL DEFAULT '',
  timeframe_start INTEGER,
  timeframe_end INTEGER,
  views INTEGER,
  watch_time_seconds REAL,
  concurrent_viewers REAL,
  startup_time_ms REAL,
  rebuffer_percentage REAL,
  playback_failure_percentage REAL,
  average_bitrate_kbps REAL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_mux_data_scope ON magnanimous_mux_data_snapshots(tenant_id,scope_type,scope_id,created_at);

CREATE TABLE IF NOT EXISTS magnanimous_mux_simulcast_targets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_target_id TEXT NOT NULL DEFAULT '',
  external_live_stream_id TEXT NOT NULL DEFAULT '',
  protocol TEXT NOT NULL DEFAULT '',
  destination_host TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  passthrough TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,external_target_id)
);

CREATE TABLE IF NOT EXISTS magnanimous_mux_playback_restrictions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_restriction_id TEXT NOT NULL DEFAULT '',
  allowed_domains_json TEXT NOT NULL DEFAULT '[]',
  allow_no_referrer INTEGER NOT NULL DEFAULT 0,
  allow_no_user_agent INTEGER NOT NULL DEFAULT 1,
  allow_high_risk_user_agent INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,external_restriction_id)
);

CREATE TABLE IF NOT EXISTS magnanimous_mux_usage_snapshots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  environment_id TEXT NOT NULL DEFAULT '',
  usage_date TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  quantity REAL NOT NULL DEFAULT 0,
  creator_id TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_mux_usage_date ON magnanimous_mux_usage_snapshots(tenant_id,usage_date,category);

CREATE TABLE IF NOT EXISTS magnanimous_mux_player_configs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT '',
  default_playback_policy TEXT NOT NULL DEFAULT '',
  captions_default INTEGER NOT NULL DEFAULT 0,
  max_auto_resolution TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
