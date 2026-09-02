CREATE TABLE IF NOT EXISTS professional_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  module TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  priority TEXT NOT NULL DEFAULT 'normal',
  related_contact_id INTEGER,
  due_at INTEGER,
  input_json TEXT NOT NULL DEFAULT '{}',
  output_text TEXT NOT NULL DEFAULT '',
  sources_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_professional_records_tenant_module ON professional_records(tenant_id,module,updated_at);
CREATE INDEX IF NOT EXISTS idx_professional_records_due ON professional_records(tenant_id,status,due_at);
CREATE INDEX IF NOT EXISTS idx_professional_records_contact ON professional_records(tenant_id,related_contact_id,updated_at);

CREATE TABLE IF NOT EXISTS professional_context (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  scope_type TEXT NOT NULL DEFAULT 'workspace',
  scope_id TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'user',
  source_ref TEXT NOT NULL DEFAULT '',
  confidence REAL NOT NULL DEFAULT 1,
  pinned INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_professional_context_scope ON professional_context(tenant_id,scope_type,scope_id,active,pinned,updated_at);

CREATE TABLE IF NOT EXISTS professional_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  record_id TEXT NOT NULL DEFAULT '',
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_professional_activity_tenant ON professional_activity(tenant_id,created_at);
