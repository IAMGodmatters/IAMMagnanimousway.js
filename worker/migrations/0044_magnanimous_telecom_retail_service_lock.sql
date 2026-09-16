-- Magnanimous Telecom retail-service lock and subscription catalog.
-- Telecom is a Magnanimous-operated service, not a white-label/reseller carrier platform.

CREATE TABLE IF NOT EXISTS telecom_provider_policy (
  tenant_id TEXT PRIMARY KEY,
  provider_identity TEXT NOT NULL DEFAULT 'Magnanimous Telecom' CHECK(provider_identity='Magnanimous Telecom'),
  brain_identity TEXT NOT NULL DEFAULT 'Magnanimous AI' CHECK(brain_identity='Magnanimous AI'),
  service_model TEXT NOT NULL DEFAULT 'retail_service_provider' CHECK(service_model='retail_service_provider'),
  white_label_allowed INTEGER NOT NULL DEFAULT 0 CHECK(white_label_allowed=0),
  reseller_allowed INTEGER NOT NULL DEFAULT 0 CHECK(reseller_allowed=0),
  subcarrier_allowed INTEGER NOT NULL DEFAULT 0 CHECK(subcarrier_allowed=0),
  customer_number_resale_allowed INTEGER NOT NULL DEFAULT 0 CHECK(customer_number_resale_allowed=0),
  external_provider_brand_override_allowed INTEGER NOT NULL DEFAULT 0 CHECK(external_provider_brand_override_allowed=0),
  customer_number_assignment_only INTEGER NOT NULL DEFAULT 1 CHECK(customer_number_assignment_only=1),
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_retail_plans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  plan_kind TEXT NOT NULL DEFAULT 'bundle' CHECK(plan_kind IN ('sim','esim','phone_number','minutes','call_center','bundle')),
  description TEXT NOT NULL DEFAULT '',
  monthly_price REAL NOT NULL DEFAULT 0 CHECK(monthly_price>=0),
  currency TEXT NOT NULL DEFAULT 'USD',
  activation_fee REAL NOT NULL DEFAULT 0 CHECK(activation_fee>=0),
  included_minutes REAL NOT NULL DEFAULT 0 CHECK(included_minutes>=0),
  included_sms INTEGER NOT NULL DEFAULT 0 CHECK(included_sms>=0),
  included_data_mb INTEGER NOT NULL DEFAULT 0 CHECK(included_data_mb>=0),
  included_numbers INTEGER NOT NULL DEFAULT 0 CHECK(included_numbers>=0),
  included_sims INTEGER NOT NULL DEFAULT 0 CHECK(included_sims>=0),
  overage_per_minute REAL NOT NULL DEFAULT 0 CHECK(overage_per_minute>=0),
  overage_per_sms REAL NOT NULL DEFAULT 0 CHECK(overage_per_sms>=0),
  overage_per_mb REAL NOT NULL DEFAULT 0 CHECK(overage_per_mb>=0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','retired')),
  features_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_customer_lines (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  number_id TEXT,
  sim_id TEXT,
  line_label TEXT NOT NULL DEFAULT '',
  line_kind TEXT NOT NULL DEFAULT 'voice' CHECK(line_kind IN ('voice','mobile','call_center','data','bundle')),
  service_role TEXT NOT NULL DEFAULT 'customer' CHECK(service_role IN ('customer','business_customer')),
  provider_identity TEXT NOT NULL DEFAULT 'Magnanimous Telecom' CHECK(provider_identity='Magnanimous Telecom'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended','cancelled')),
  billing_cycle_day INTEGER NOT NULL DEFAULT 1 CHECK(billing_cycle_day BETWEEN 1 AND 28),
  started_at INTEGER,
  renews_at INTEGER,
  suspended_at INTEGER,
  ended_at INTEGER,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_usage_cycles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  line_id TEXT NOT NULL,
  cycle_start INTEGER NOT NULL,
  cycle_end INTEGER NOT NULL,
  included_minutes REAL NOT NULL DEFAULT 0,
  used_minutes REAL NOT NULL DEFAULT 0,
  included_sms INTEGER NOT NULL DEFAULT 0,
  used_sms INTEGER NOT NULL DEFAULT 0,
  included_data_mb INTEGER NOT NULL DEFAULT 0,
  used_data_mb INTEGER NOT NULL DEFAULT 0,
  overage_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','invoiced')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,line_id,cycle_start,cycle_end)
);

CREATE TABLE IF NOT EXISTS telecom_policy_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL,
  attempted_mode TEXT NOT NULL DEFAULT '',
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telecom_retail_plans_status ON telecom_retail_plans(tenant_id,status,plan_kind);
CREATE INDEX IF NOT EXISTS idx_telecom_customer_lines_customer ON telecom_customer_lines(tenant_id,customer_id,status);
CREATE INDEX IF NOT EXISTS idx_telecom_customer_lines_assets ON telecom_customer_lines(tenant_id,number_id,sim_id);
CREATE INDEX IF NOT EXISTS idx_telecom_usage_cycles_line ON telecom_usage_cycles(tenant_id,line_id,cycle_start);
CREATE INDEX IF NOT EXISTS idx_telecom_policy_events_time ON telecom_policy_events(tenant_id,created_at);
