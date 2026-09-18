-- Magnanimous CRM enterprise flexibility: accounts + multi-pipeline sales processes.
CREATE TABLE IF NOT EXISTS crm_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'prospect',
  owner_user_id TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS crm_pipelines (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_default INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  name TEXT NOT NULL,
  stage_key TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  probability REAL NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'open',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(pipeline_id, stage_key)
);

ALTER TABLE crm_contacts ADD COLUMN account_id INTEGER;
ALTER TABLE crm_opportunities ADD COLUMN account_id INTEGER;
ALTER TABLE crm_opportunities ADD COLUMN pipeline_id TEXT;
ALTER TABLE crm_opportunities ADD COLUMN stage_id TEXT;

CREATE INDEX IF NOT EXISTS idx_crm_accounts_tenant_name ON crm_accounts(tenant_id,name);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_account ON crm_contacts(tenant_id,account_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_account ON crm_opportunities(tenant_id,account_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_pipeline ON crm_opportunities(tenant_id,pipeline_id,stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_pipelines_tenant ON crm_pipelines(tenant_id,active,is_default);
CREATE INDEX IF NOT EXISTS idx_crm_pipeline_stages_pipeline ON crm_pipeline_stages(tenant_id,pipeline_id,position);
