CREATE TABLE IF NOT EXISTS billing_usage_wallet (
  tenant_id TEXT PRIMARY KEY,
  balance_usd REAL NOT NULL DEFAULT 0,
  total_funded_usd REAL NOT NULL DEFAULT 0,
  total_consumed_usd REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS billing_usage_wallet_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  amount_usd REAL NOT NULL,
  reference_id TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  UNIQUE(tenant_id, event_type, reference_id)
);
CREATE INDEX IF NOT EXISTS idx_usage_wallet_events_tenant ON billing_usage_wallet_events(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS enterprise_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  primary_contact_name TEXT NOT NULL DEFAULT '',
  primary_contact_email TEXT NOT NULL DEFAULT '',
  primary_contact_phone TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  data_classification TEXT NOT NULL DEFAULT 'standard',
  security_requirements TEXT NOT NULL DEFAULT '[]',
  authorized_systems TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'prospect',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_enterprise_accounts_tenant ON enterprise_accounts(tenant_id, status, name);

CREATE TABLE IF NOT EXISTS enterprise_contracts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  title TEXT NOT NULL,
  service_lines TEXT NOT NULL DEFAULT '[]',
  billing_model TEXT NOT NULL DEFAULT 'monthly-plus-usage',
  monthly_commitment_usd REAL NOT NULL DEFAULT 0,
  setup_fee_usd REAL NOT NULL DEFAULT 0,
  included_usage_usd REAL NOT NULL DEFAULT 0,
  target_gross_margin_percent REAL NOT NULL DEFAULT 20,
  payment_terms_days INTEGER NOT NULL DEFAULT 15,
  start_at INTEGER,
  end_at INTEGER,
  renewal_mode TEXT NOT NULL DEFAULT 'manual',
  security_addendum_required INTEGER NOT NULL DEFAULT 0,
  data_processing_addendum_required INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id TEXT,
  stripe_quote_id TEXT,
  external_contract_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_enterprise_contracts_tenant ON enterprise_contracts(tenant_id, status, account_id);

CREATE TABLE IF NOT EXISTS enterprise_opportunities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'direct',
  stage TEXT NOT NULL DEFAULT 'identified',
  estimated_monthly_value_usd REAL NOT NULL DEFAULT 0,
  estimated_setup_value_usd REAL NOT NULL DEFAULT 0,
  probability_percent REAL NOT NULL DEFAULT 10,
  next_action TEXT NOT NULL DEFAULT '',
  next_action_at INTEGER,
  owner_user_id TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_enterprise_opportunities_tenant ON enterprise_opportunities(tenant_id, stage, next_action_at);

CREATE TABLE IF NOT EXISTS enterprise_revenue_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  account_id TEXT,
  contract_id TEXT,
  event_type TEXT NOT NULL,
  amount_usd REAL NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT '',
  reference_id TEXT NOT NULL DEFAULT '',
  occurred_at INTEGER NOT NULL,
  UNIQUE(tenant_id, event_type, reference_id)
);
CREATE INDEX IF NOT EXISTS idx_enterprise_revenue_events_tenant ON enterprise_revenue_events(tenant_id, occurred_at DESC);
