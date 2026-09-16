-- Research-driven Magnanimous Telecom OSS/BSS operating foundation.
-- Provider identity remains Magnanimous Telecom; external systems remain replaceable infrastructure.

CREATE TABLE IF NOT EXISTS telecom_offer_extensions (
  tenant_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  billing_mode TEXT NOT NULL DEFAULT 'postpaid' CHECK(billing_mode IN ('postpaid','prepaid','hybrid')),
  validity_seconds INTEGER NOT NULL DEFAULT 0 CHECK(validity_seconds>=0),
  auto_renew INTEGER NOT NULL DEFAULT 1 CHECK(auto_renew IN (0,1)),
  no_expiry INTEGER NOT NULL DEFAULT 0 CHECK(no_expiry IN (0,1)),
  roaming_enabled INTEGER NOT NULL DEFAULT 0 CHECK(roaming_enabled IN (0,1)),
  shared_balance_enabled INTEGER NOT NULL DEFAULT 0 CHECK(shared_balance_enabled IN (0,1)),
  convertible_allowances INTEGER NOT NULL DEFAULT 0 CHECK(convertible_allowances IN (0,1)),
  unlimited_voice INTEGER NOT NULL DEFAULT 0 CHECK(unlimited_voice IN (0,1)),
  unlimited_sms INTEGER NOT NULL DEFAULT 0 CHECK(unlimited_sms IN (0,1)),
  unlimited_data INTEGER NOT NULL DEFAULT 0 CHECK(unlimited_data IN (0,1)),
  fair_use_json TEXT NOT NULL DEFAULT '{}',
  app_bundle_json TEXT NOT NULL DEFAULT '[]',
  perks_json TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,plan_id)
);

CREATE TABLE IF NOT EXISTS telecom_balance_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  line_id TEXT,
  account_kind TEXT NOT NULL DEFAULT 'prepaid' CHECK(account_kind IN ('prepaid','postpaid_credit','allowance','deposit')),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','closed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_balance_buckets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  balance_account_id TEXT NOT NULL,
  bucket_kind TEXT NOT NULL CHECK(bucket_kind IN ('currency','minute','sms','mb','gb','roaming_minute','roaming_mb','perk_credit')),
  initial_units REAL NOT NULL DEFAULT 0,
  remaining_units REAL NOT NULL DEFAULT 0,
  starts_at INTEGER,
  expires_at INTEGER,
  source_ref TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','exhausted','expired','cancelled')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_usage_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_system TEXT NOT NULL DEFAULT 'magnanimous',
  external_event_id TEXT NOT NULL,
  line_id TEXT,
  customer_id TEXT,
  service_type TEXT NOT NULL CHECK(service_type IN ('voice','sms','data','roaming_voice','roaming_sms','roaming_data','call_center','other')),
  direction TEXT NOT NULL DEFAULT 'unknown' CHECK(direction IN ('inbound','outbound','unknown')),
  destination TEXT NOT NULL DEFAULT '',
  units REAL NOT NULL DEFAULT 0,
  unit_name TEXT NOT NULL DEFAULT 'unit',
  event_at INTEGER NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  UNIQUE(tenant_id,source_system,external_event_id)
);

CREATE TABLE IF NOT EXISTS telecom_rating_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  usage_event_id TEXT NOT NULL,
  plan_id TEXT,
  rated_units REAL NOT NULL DEFAULT 0,
  included_units_used REAL NOT NULL DEFAULT 0,
  charge REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  rate_source TEXT NOT NULL DEFAULT 'plan',
  status TEXT NOT NULL DEFAULT 'rated' CHECK(status IN ('pending','rated','reversed','disputed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_service_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  line_id TEXT,
  plan_id TEXT,
  order_type TEXT NOT NULL CHECK(order_type IN ('activate','change_plan','add_on','suspend','resume','cancel','port_in','port_out','sim_swap','esim_swap','roaming_enable')),
  state TEXT NOT NULL DEFAULT 'acknowledged' CHECK(state IN ('acknowledged','in_progress','held','completed','failed','cancelled')),
  external_reference TEXT NOT NULL DEFAULT '',
  requested_payload_json TEXT NOT NULL DEFAULT '{}',
  result_json TEXT NOT NULL DEFAULT '{}',
  requested_at INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_trouble_tickets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  line_id TEXT,
  category TEXT NOT NULL DEFAULT 'service',
  severity TEXT NOT NULL DEFAULT 'normal' CHECK(severity IN ('low','normal','high','critical')),
  state TEXT NOT NULL DEFAULT 'open' CHECK(state IN ('open','investigating','waiting_customer','waiting_provider','resolved','closed')),
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  root_cause TEXT NOT NULL DEFAULT '',
  resolution TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_network_functions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  function_role TEXT NOT NULL,
  implementation_family TEXT NOT NULL DEFAULT 'magnanimous-native',
  host_ref TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','lab','configured','active','degraded','offline','retired')),
  health_status TEXT NOT NULL DEFAULT 'unknown',
  capabilities_json TEXT NOT NULL DEFAULT '{}',
  customer_visible INTEGER NOT NULL DEFAULT 0 CHECK(customer_visible=0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_routing_policies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'voice',
  name TEXT NOT NULL,
  strategy TEXT NOT NULL DEFAULT 'priority' CHECK(strategy IN ('priority','least_cost','latency','health','weighted','geo','hybrid')),
  max_unit_cost REAL NOT NULL DEFAULT 0,
  max_latency_ms INTEGER NOT NULL DEFAULT 0,
  require_healthy INTEGER NOT NULL DEFAULT 1 CHECK(require_healthy IN (0,1)),
  policy_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','retired')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_roaming_partners (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  partner_ref TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  capabilities_json TEXT NOT NULL DEFAULT '{}',
  settlement_model TEXT NOT NULL DEFAULT 'wholesale',
  status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','contracting','active','suspended','retired')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,partner_ref)
);

CREATE TABLE IF NOT EXISTS telecom_settlement_ledger (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  partner_ref TEXT NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  charge REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  units REAL NOT NULL DEFAULT 0,
  unit_name TEXT NOT NULL DEFAULT 'unit',
  status TEXT NOT NULL DEFAULT 'estimated' CHECK(status IN ('estimated','reconciled','invoiced','paid','disputed')),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_fraud_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  line_id TEXT,
  fraud_type TEXT NOT NULL,
  risk_score REAL NOT NULL DEFAULT 0 CHECK(risk_score>=0),
  state TEXT NOT NULL DEFAULT 'open' CHECK(state IN ('open','reviewing','blocked','cleared','confirmed','closed')),
  signal_json TEXT NOT NULL DEFAULT '{}',
  action_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_architecture_patterns (
  pattern_key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'absorbed_design' CHECK(status IN ('researched','absorbed_design','implemented','lab','production')),
  source_family TEXT NOT NULL DEFAULT '',
  external_reference TEXT NOT NULL DEFAULT '',
  magnanimous_use TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_standards_baseline (
  standard_key TEXT PRIMARY KEY,
  standard_family TEXT NOT NULL,
  version TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL DEFAULT 'active',
  source_reference TEXT NOT NULL DEFAULT '',
  magnanimous_scope TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_operations_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL,
  subject_type TEXT NOT NULL DEFAULT '',
  subject_id TEXT NOT NULL DEFAULT '',
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telecom_usage_events_line_time ON telecom_usage_events(tenant_id,line_id,event_at);
CREATE INDEX IF NOT EXISTS idx_telecom_rating_entries_usage ON telecom_rating_entries(tenant_id,usage_event_id);
CREATE INDEX IF NOT EXISTS idx_telecom_service_orders_state ON telecom_service_orders(tenant_id,state,requested_at);
CREATE INDEX IF NOT EXISTS idx_telecom_trouble_tickets_state ON telecom_trouble_tickets(tenant_id,state,severity);
CREATE INDEX IF NOT EXISTS idx_telecom_network_functions_role ON telecom_network_functions(tenant_id,function_role,status);
CREATE INDEX IF NOT EXISTS idx_telecom_fraud_cases_state ON telecom_fraud_cases(tenant_id,state,risk_score);
CREATE INDEX IF NOT EXISTS idx_telecom_balance_buckets_account ON telecom_balance_buckets(tenant_id,balance_account_id,status,expires_at);
