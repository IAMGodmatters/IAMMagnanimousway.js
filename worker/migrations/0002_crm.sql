CREATE TABLE IF NOT EXISTS crm_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'lead',
  source TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);

CREATE TABLE IF NOT EXISTS crm_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'note',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  due_at INTEGER,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_due ON crm_activities(due_at, completed);

CREATE TABLE IF NOT EXISTS crm_opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'new',
  value REAL NOT NULL DEFAULT 0,
  probability REAL NOT NULL DEFAULT 0,
  expected_close_at INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON crm_opportunities(stage);
