-- Native Magnanimous work + CRM control plane.
-- Additive schema: preserves the existing CRM, work-engine and professional-workspace tables.

CREATE TABLE IF NOT EXISTS magnanimous_ops_workspaces (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'workspace',
  description TEXT NOT NULL DEFAULT '',
  settings_json TEXT NOT NULL DEFAULT '{}',
  permissions_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ops_workspaces_tenant ON magnanimous_ops_workspaces(tenant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS magnanimous_ops_boards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  singular_name TEXT NOT NULL DEFAULT 'record',
  kind TEXT NOT NULL DEFAULT 'board',
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(workspace_id) REFERENCES magnanimous_ops_workspaces(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ops_boards_workspace ON magnanimous_ops_boards(tenant_id, workspace_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS magnanimous_ops_fields (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  board_id TEXT NOT NULL,
  name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  required INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(board_id, field_key),
  FOREIGN KEY(board_id) REFERENCES magnanimous_ops_boards(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ops_fields_board ON magnanimous_ops_fields(tenant_id, board_id, position, created_at);

CREATE TABLE IF NOT EXISTS magnanimous_ops_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  board_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '',
  owner_user_id TEXT NOT NULL DEFAULT '',
  group_key TEXT NOT NULL DEFAULT '',
  parent_id TEXT,
  due_at INTEGER,
  sort_order REAL NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(board_id) REFERENCES magnanimous_ops_boards(id) ON DELETE CASCADE,
  FOREIGN KEY(parent_id) REFERENCES magnanimous_ops_records(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_ops_records_board ON magnanimous_ops_records(tenant_id, board_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_records_due ON magnanimous_ops_records(tenant_id, due_at, status);
CREATE INDEX IF NOT EXISTS idx_ops_records_parent ON magnanimous_ops_records(tenant_id, parent_id, sort_order);

CREATE TABLE IF NOT EXISTS magnanimous_ops_links (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  from_record_id TEXT NOT NULL,
  to_record_id TEXT NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'related',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  UNIQUE(tenant_id, from_record_id, to_record_id, relation_type)
);
CREATE INDEX IF NOT EXISTS idx_ops_links_from ON magnanimous_ops_links(tenant_id, from_record_id);
CREATE INDEX IF NOT EXISTS idx_ops_links_to ON magnanimous_ops_links(tenant_id, to_record_id);

CREATE TABLE IF NOT EXISTS magnanimous_ops_views (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  board_id TEXT NOT NULL,
  name TEXT NOT NULL,
  view_type TEXT NOT NULL DEFAULT 'table',
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(board_id) REFERENCES magnanimous_ops_boards(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ops_views_board ON magnanimous_ops_views(tenant_id, board_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS magnanimous_ops_automations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  board_id TEXT,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  trigger_json TEXT NOT NULL DEFAULT '{}',
  conditions_json TEXT NOT NULL DEFAULT '[]',
  actions_json TEXT NOT NULL DEFAULT '[]',
  run_count INTEGER NOT NULL DEFAULT 0,
  last_run_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(workspace_id) REFERENCES magnanimous_ops_workspaces(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ops_automations_event ON magnanimous_ops_automations(tenant_id, enabled, workspace_id, board_id);

CREATE TABLE IF NOT EXISTS magnanimous_ops_sequences (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  audience_json TEXT NOT NULL DEFAULT '{}',
  steps_json TEXT NOT NULL DEFAULT '[]',
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(workspace_id) REFERENCES magnanimous_ops_workspaces(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ops_sequences_workspace ON magnanimous_ops_sequences(tenant_id, workspace_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS magnanimous_ops_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL DEFAULT '',
  board_id TEXT NOT NULL DEFAULT '',
  record_id TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ops_activity_tenant ON magnanimous_ops_activity(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_activity_record ON magnanimous_ops_activity(tenant_id, record_id, created_at DESC);
