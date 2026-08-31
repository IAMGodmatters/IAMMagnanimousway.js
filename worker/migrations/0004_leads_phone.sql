CREATE TABLE IF NOT EXISTS lead_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  query TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  score INTEGER NOT NULL DEFAULT 0,
  fit_score INTEGER NOT NULL DEFAULT 0,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(tenant_id,score);

CREATE TABLE IF NOT EXISTS phone_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  contact_id INTEGER,
  direction TEXT NOT NULL,
  caller TEXT NOT NULL DEFAULT '',
  callee TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'created',
  started_at INTEGER,
  ended_at INTEGER,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phone_calls_tenant ON phone_calls(tenant_id,created_at);
CREATE INDEX IF NOT EXISTS idx_phone_calls_contact ON phone_calls(tenant_id,contact_id);
