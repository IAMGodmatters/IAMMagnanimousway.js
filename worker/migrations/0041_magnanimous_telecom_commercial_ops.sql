-- Magnanimous Telecom commercial-operations foundation.
-- Additive only. Prices/rates are data, not payment authorization.

CREATE TABLE IF NOT EXISTS telecom_service_plans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  monthly_price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  included_minutes REAL NOT NULL DEFAULT 0,
  overage_rate REAL NOT NULL DEFAULT 0,
  capabilities_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  service_plan_id TEXT NOT NULL,
  crm_contact_id INTEGER,
  user_id TEXT,
  number_id TEXT,
  billing_customer_ref TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  started_at INTEGER,
  suspended_at INTEGER,
  ended_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_caller_id_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  number_id TEXT,
  e164 TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  attestation_target TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_fraud_controls (
  tenant_id TEXT PRIMARY KEY,
  max_call_seconds INTEGER NOT NULL DEFAULT 14400,
  daily_call_limit INTEGER NOT NULL DEFAULT 0,
  daily_spend_limit REAL NOT NULL DEFAULT 0,
  international_enabled INTEGER NOT NULL DEFAULT 0,
  premium_rate_enabled INTEGER NOT NULL DEFAULT 0,
  blocked_destinations_json TEXT NOT NULL DEFAULT '[]',
  velocity_rules_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL DEFAULT '',
  object_id TEXT NOT NULL DEFAULT '',
  before_json TEXT NOT NULL DEFAULT '{}',
  after_json TEXT NOT NULL DEFAULT '{}',
  reason TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telecom_plans_tenant_status ON telecom_service_plans(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_telecom_subscriptions_tenant_status ON telecom_subscriptions(tenant_id,status,updated_at);
CREATE INDEX IF NOT EXISTS idx_telecom_caller_id_tenant_status ON telecom_caller_id_profiles(tenant_id,verification_status);
CREATE INDEX IF NOT EXISTS idx_telecom_audit_tenant_time ON telecom_audit_log(tenant_id,created_at);
