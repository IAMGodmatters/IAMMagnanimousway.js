-- Magnanimous Telecom SIM/eSIM control foundation.
-- This schema stores operational metadata only. Never store Ki, OPc, ADM keys,
-- raw carrier authentication material, or reusable eSIM activation secrets here.

CREATE TABLE IF NOT EXISTS telecom_mobile_adapters (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'mvno',
  endpoint_ref TEXT NOT NULL DEFAULT '',
  secret_binding_name TEXT NOT NULL DEFAULT '',
  capabilities_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'configured',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_sim_inventory (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sim_type TEXT NOT NULL DEFAULT 'physical',
  iccid TEXT NOT NULL DEFAULT '',
  eid TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  mobile_adapter_id TEXT,
  provider_profile_ref TEXT NOT NULL DEFAULT '',
  activation_handle TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inventory',
  assigned_customer_id TEXT,
  assigned_number_id TEXT,
  device_ref TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,iccid),
  UNIQUE(tenant_id,eid,provider_profile_ref)
);

CREATE TABLE IF NOT EXISTS telecom_esim_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  number_id TEXT,
  mobile_adapter_id TEXT,
  device_eid TEXT NOT NULL DEFAULT '',
  provider_order_ref TEXT NOT NULL DEFAULT '',
  activation_handle TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested',
  error_code TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_sim_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  sim_id TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL,
  actor_user_id TEXT NOT NULL DEFAULT '',
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telecom_mobile_adapters_tenant_status ON telecom_mobile_adapters(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_telecom_sim_inventory_tenant_status ON telecom_sim_inventory(tenant_id,status,sim_type);
CREATE INDEX IF NOT EXISTS idx_telecom_esim_orders_tenant_status ON telecom_esim_orders(tenant_id,status,updated_at);
CREATE INDEX IF NOT EXISTS idx_telecom_sim_events_tenant_time ON telecom_sim_events(tenant_id,created_at);
