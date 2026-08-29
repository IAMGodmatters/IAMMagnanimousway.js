-- Multi-tenant CRM foundation.
-- The master owner workspace is kept separate from every customer workspace.
CREATE TABLE IF NOT EXISTS crm_workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS crm_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(workspace_id,email),
  FOREIGN KEY(workspace_id) REFERENCES crm_workspaces(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_crm_users_email ON crm_users(email);
CREATE INDEX IF NOT EXISTS idx_crm_users_workspace ON crm_users(workspace_id);

-- Existing owner CRM becomes the master workspace after the application initializes it.
INSERT OR IGNORE INTO crm_workspaces(id,name,slug,owner_email,plan,created_at,updated_at)
VALUES(1,'I AM Magnanimous Way™ Master CRM','master','OWNER', 'owner',strftime('%s','now'),strftime('%s','now'));

-- workspace_id is intentionally nullable during migration so existing owner data is not lost.
ALTER TABLE crm_contacts ADD COLUMN workspace_id INTEGER REFERENCES crm_workspaces(id) ON DELETE CASCADE;
ALTER TABLE crm_activities ADD COLUMN workspace_id INTEGER REFERENCES crm_workspaces(id) ON DELETE CASCADE;
ALTER TABLE crm_opportunities ADD COLUMN workspace_id INTEGER REFERENCES crm_workspaces(id) ON DELETE CASCADE;
UPDATE crm_contacts SET workspace_id=1 WHERE workspace_id IS NULL;
UPDATE crm_activities SET workspace_id=1 WHERE workspace_id IS NULL;
UPDATE crm_opportunities SET workspace_id=1 WHERE workspace_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_workspace ON crm_contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_workspace ON crm_activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_workspace ON crm_opportunities(workspace_id);
