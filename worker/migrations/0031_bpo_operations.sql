CREATE TABLE IF NOT EXISTS bpo_clients (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  service_lines TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  data_classification TEXT NOT NULL DEFAULT 'standard',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bpo_clients_tenant ON bpo_clients(tenant_id,status,name);

CREATE TABLE IF NOT EXISTS bpo_programs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'omnichannel',
  queue_id TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  operating_hours_json TEXT NOT NULL DEFAULT '{}',
  sla_response_seconds INTEGER NOT NULL DEFAULT 30,
  sla_resolution_seconds INTEGER NOT NULL DEFAULT 86400,
  target_service_level REAL NOT NULL DEFAULT 80,
  target_quality REAL NOT NULL DEFAULT 90,
  target_csat REAL NOT NULL DEFAULT 4.5,
  required_skills TEXT NOT NULL DEFAULT '[]',
  knowledge_scope TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bpo_programs_tenant ON bpo_programs(tenant_id,client_id,status);

CREATE TABLE IF NOT EXISTS bpo_work_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  external_ref TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL DEFAULT 'task',
  priority INTEGER NOT NULL DEFAULT 50,
  subject TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL DEFAULT '',
  customer_ref TEXT NOT NULL DEFAULT '',
  assigned_agent_id TEXT,
  assigned_ai_agent_id TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  due_at INTEGER,
  first_response_at INTEGER,
  resolved_at INTEGER,
  disposition TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bpo_work_items_queue ON bpo_work_items(tenant_id,program_id,status,priority,created_at);

CREATE TABLE IF NOT EXISTS bpo_audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  client_id TEXT,
  program_id TEXT,
  work_item_id TEXT,
  actor_type TEXT NOT NULL DEFAULT 'user',
  actor_id TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bpo_audit_tenant ON bpo_audit_events(tenant_id,created_at);
