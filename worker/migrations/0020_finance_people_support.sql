CREATE TABLE IF NOT EXISTS finance_settings (
  tenant_id TEXT PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  reporting_currency TEXT NOT NULL DEFAULT 'USD',
  home_country TEXT NOT NULL DEFAULT '',
  fiscal_year_start_month INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS finance_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, code)
);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_tenant ON finance_accounts(tenant_id,type,active);

CREATE TABLE IF NOT EXISTS finance_journals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  journal_date INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  reference TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'posted',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_finance_journals_tenant_date ON finance_journals(tenant_id,journal_date);

CREATE TABLE IF NOT EXISTS finance_journal_lines (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  debit_micros INTEGER NOT NULL DEFAULT 0,
  credit_micros INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  original_micros INTEGER NOT NULL DEFAULT 0,
  fx_rate REAL NOT NULL DEFAULT 1,
  base_micros INTEGER NOT NULL DEFAULT 0,
  memo TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  FOREIGN KEY(journal_id) REFERENCES finance_journals(id) ON DELETE CASCADE,
  FOREIGN KEY(account_id) REFERENCES finance_accounts(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_finance_lines_tenant_account ON finance_journal_lines(tenant_id,account_id,created_at);
CREATE INDEX IF NOT EXISTS idx_finance_lines_journal ON finance_journal_lines(journal_id);

CREATE TABLE IF NOT EXISTS finance_documents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  document_no TEXT NOT NULL DEFAULT '',
  counterparty TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL,
  subtotal_micros INTEGER NOT NULL DEFAULT 0,
  tax_micros INTEGER NOT NULL DEFAULT 0,
  total_micros INTEGER NOT NULL DEFAULT 0,
  issue_date INTEGER,
  due_date INTEGER,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_finance_documents_due ON finance_documents(tenant_id,kind,status,due_date);

CREATE TABLE IF NOT EXISTS finance_fx_cache (
  currency TEXT PRIMARY KEY,
  rate_per_eur REAL NOT NULL,
  as_of TEXT NOT NULL,
  fetched_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS finance_tax_tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT '',
  tax_type TEXT NOT NULL,
  period_label TEXT NOT NULL DEFAULT '',
  due_at INTEGER,
  status TEXT NOT NULL DEFAULT 'planned',
  estimated_micros INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  source_url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  professional_review_required INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_finance_tax_due ON finance_tax_tasks(tenant_id,status,due_at);

CREATE TABLE IF NOT EXISTS hr_workers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  work_email TEXT NOT NULL DEFAULT '',
  worker_type TEXT NOT NULL DEFAULT 'employee',
  country_code TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  pay_micros INTEGER NOT NULL DEFAULT 0,
  pay_frequency TEXT NOT NULL DEFAULT 'monthly',
  department TEXT NOT NULL DEFAULT '',
  role_title TEXT NOT NULL DEFAULT '',
  manager_name TEXT NOT NULL DEFAULT '',
  start_date INTEGER,
  end_date INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  classification_review TEXT NOT NULL DEFAULT 'not-reviewed',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hr_workers_tenant ON hr_workers(tenant_id,status,worker_type,country_code);

CREATE TABLE IF NOT EXISTS hr_leave_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  leave_type TEXT NOT NULL DEFAULT 'vacation',
  start_at INTEGER NOT NULL,
  end_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(worker_id) REFERENCES hr_workers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_hr_leave_tenant ON hr_leave_requests(tenant_id,status,start_at);

CREATE TABLE IF NOT EXISTS hr_payroll_runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '',
  period_start INTEGER,
  period_end INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  gross_micros INTEGER NOT NULL DEFAULT 0,
  employee_tax_micros INTEGER NOT NULL DEFAULT 0,
  employer_tax_micros INTEGER NOT NULL DEFAULT 0,
  benefits_micros INTEGER NOT NULL DEFAULT 0,
  net_micros INTEGER NOT NULL DEFAULT 0,
  employer_cost_micros INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_tenant ON hr_payroll_runs(tenant_id,period_end,status);

CREATE TABLE IF NOT EXISTS hr_expenses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  worker_id TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  currency TEXT NOT NULL DEFAULT 'USD',
  amount_micros INTEGER NOT NULL DEFAULT 0,
  incurred_at INTEGER,
  status TEXT NOT NULL DEFAULT 'submitted',
  description TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(worker_id) REFERENCES hr_workers(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_hr_expenses_tenant ON hr_expenses(tenant_id,status,incurred_at);

CREATE TABLE IF NOT EXISTS support_feedback (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'feedback',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  page_url TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  owner_response TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_support_feedback_owner ON support_feedback(status,priority,created_at);
CREATE INDEX IF NOT EXISTS idx_support_feedback_tenant ON support_feedback(tenant_id,user_id,created_at);
