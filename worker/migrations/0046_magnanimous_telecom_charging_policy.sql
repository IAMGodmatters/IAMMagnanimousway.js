-- Magnanimous Telecom real-time charging, policy, device and billing-control layer.
-- Additive only. Magnanimous Telecom remains the provider; Magnanimous AI remains the brain.
-- External networks, rate sources and infrastructure remain internal/replaceable adapters.

CREATE TABLE IF NOT EXISTS telecom_charging_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  line_id TEXT,
  service_type TEXT NOT NULL CHECK(service_type IN ('voice','sms','data','roaming_voice','roaming_sms','roaming_data','call_center','other')),
  idempotency_key TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'requested' CHECK(state IN ('requested','reserved','committed','released','denied','expired','held')),
  requested_units REAL NOT NULL DEFAULT 0 CHECK(requested_units>=0),
  reserved_units REAL NOT NULL DEFAULT 0 CHECK(reserved_units>=0),
  committed_units REAL NOT NULL DEFAULT 0 CHECK(committed_units>=0),
  unit_name TEXT NOT NULL DEFAULT 'unit',
  estimated_charge REAL NOT NULL DEFAULT 0 CHECK(estimated_charge>=0),
  final_charge REAL NOT NULL DEFAULT 0 CHECK(final_charge>=0),
  currency TEXT NOT NULL DEFAULT 'USD',
  policy_decision_id TEXT,
  provider_session_ref TEXT NOT NULL DEFAULT '',
  expires_at INTEGER,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,idempotency_key)
);

CREATE TABLE IF NOT EXISTS telecom_balance_reservations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  charging_session_id TEXT NOT NULL,
  bucket_id TEXT NOT NULL,
  reserved_units REAL NOT NULL DEFAULT 0 CHECK(reserved_units>=0),
  committed_units REAL NOT NULL DEFAULT 0 CHECK(committed_units>=0),
  state TEXT NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','committed','released','expired')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,charging_session_id,bucket_id)
);

CREATE TABLE IF NOT EXISTS telecom_balance_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  balance_account_id TEXT NOT NULL,
  bucket_id TEXT,
  charging_session_id TEXT,
  idempotency_key TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('grant','topup','reserve','commit','release','adjustment','reversal','transfer_in','transfer_out','expire')),
  units REAL NOT NULL DEFAULT 0,
  unit_name TEXT NOT NULL DEFAULT 'unit',
  balance_after REAL,
  source_ref TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  UNIQUE(tenant_id,idempotency_key)
);

CREATE TABLE IF NOT EXISTS telecom_balance_groups (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  name TEXT NOT NULL,
  group_kind TEXT NOT NULL DEFAULT 'family' CHECK(group_kind IN ('family','business','shared_pool')),
  balance_account_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','closed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_balance_group_members (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  line_id TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  spend_limit_units REAL NOT NULL DEFAULT 0 CHECK(spend_limit_units>=0),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','removed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,group_id,line_id)
);

CREATE TABLE IF NOT EXISTS telecom_policy_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  plan_id TEXT,
  service_type TEXT NOT NULL DEFAULT 'data' CHECK(service_type IN ('voice','sms','data','roaming_voice','roaming_sms','roaming_data','call_center','other')),
  roaming_allowed INTEGER NOT NULL DEFAULT 0 CHECK(roaming_allowed IN (0,1)),
  international_allowed INTEGER NOT NULL DEFAULT 0 CHECK(international_allowed IN (0,1)),
  premium_rate_allowed INTEGER NOT NULL DEFAULT 0 CHECK(premium_rate_allowed IN (0,1)),
  require_sim_registration INTEGER NOT NULL DEFAULT 0 CHECK(require_sim_registration IN (0,1)),
  max_event_units REAL NOT NULL DEFAULT 0 CHECK(max_event_units>=0),
  max_daily_units REAL NOT NULL DEFAULT 0 CHECK(max_daily_units>=0),
  max_daily_spend REAL NOT NULL DEFAULT 0 CHECK(max_daily_spend>=0),
  max_event_charge REAL NOT NULL DEFAULT 0 CHECK(max_event_charge>=0),
  fair_use_units REAL NOT NULL DEFAULT 0 CHECK(fair_use_units>=0),
  throttle_kbps INTEGER NOT NULL DEFAULT 0 CHECK(throttle_kbps>=0),
  block_risk_score REAL NOT NULL DEFAULT 0 CHECK(block_risk_score>=0),
  blocked_destinations_json TEXT NOT NULL DEFAULT '[]',
  allowed_destinations_json TEXT NOT NULL DEFAULT '[]',
  qos_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','retired')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_policy_decisions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  line_id TEXT,
  charging_session_id TEXT,
  policy_profile_id TEXT,
  decision TEXT NOT NULL CHECK(decision IN ('allow','throttle','block','review')),
  reason_code TEXT NOT NULL DEFAULT 'policy_default',
  effective_qos_json TEXT NOT NULL DEFAULT '{}',
  input_summary_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_devices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  line_id TEXT,
  imei_hash TEXT NOT NULL DEFAULT '',
  tac TEXT NOT NULL DEFAULT '',
  manufacturer TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT 'phone' CHECK(device_type IN ('phone','tablet','router','iot','modem','other')),
  esim_capable INTEGER NOT NULL DEFAULT 0 CHECK(esim_capable IN (0,1)),
  volte_capable INTEGER NOT NULL DEFAULT 0 CHECK(volte_capable IN (0,1)),
  vonr_capable INTEGER NOT NULL DEFAULT 0 CHECK(vonr_capable IN (0,1)),
  wifi_calling_capable INTEGER NOT NULL DEFAULT 0 CHECK(wifi_calling_capable IN (0,1)),
  rcs_capable INTEGER NOT NULL DEFAULT 0 CHECK(rcs_capable IN (0,1)),
  capabilities_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'unknown' CHECK(status IN ('unknown','compatible','limited','blocked','retired')),
  first_seen_at INTEGER,
  last_seen_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_apn_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  apn TEXT NOT NULL,
  pdp_type TEXT NOT NULL DEFAULT 'IPv4v6' CHECK(pdp_type IN ('IPv4','IPv6','IPv4v6')),
  roaming_apn TEXT NOT NULL DEFAULT '',
  provider_ref TEXT NOT NULL DEFAULT '',
  qos_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','lab','active','retired')),
  customer_visible INTEGER NOT NULL DEFAULT 0 CHECK(customer_visible=0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_line_network_policies (
  tenant_id TEXT NOT NULL,
  line_id TEXT NOT NULL,
  apn_profile_id TEXT,
  roaming_enabled INTEGER NOT NULL DEFAULT 0 CHECK(roaming_enabled IN (0,1)),
  international_calling_enabled INTEGER NOT NULL DEFAULT 0 CHECK(international_calling_enabled IN (0,1)),
  sms_enabled INTEGER NOT NULL DEFAULT 1 CHECK(sms_enabled IN (0,1)),
  mms_enabled INTEGER NOT NULL DEFAULT 1 CHECK(mms_enabled IN (0,1)),
  rcs_enabled INTEGER NOT NULL DEFAULT 0 CHECK(rcs_enabled IN (0,1)),
  wifi_calling_enabled INTEGER NOT NULL DEFAULT 0 CHECK(wifi_calling_enabled IN (0,1)),
  volte_enabled INTEGER NOT NULL DEFAULT 0 CHECK(volte_enabled IN (0,1)),
  vonr_enabled INTEGER NOT NULL DEFAULT 0 CHECK(vonr_enabled IN (0,1)),
  data_cap_mb REAL NOT NULL DEFAULT 0 CHECK(data_cap_mb>=0),
  throttle_kbps INTEGER NOT NULL DEFAULT 0 CHECK(throttle_kbps>=0),
  qos_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,line_id)
);

CREATE TABLE IF NOT EXISTS telecom_sim_registration_state (
  tenant_id TEXT NOT NULL,
  sim_id TEXT NOT NULL,
  line_id TEXT,
  jurisdiction TEXT NOT NULL DEFAULT '',
  registration_state TEXT NOT NULL DEFAULT 'unregistered' CHECK(registration_state IN ('unregistered','pending','verified','rejected','expired','not_required')),
  verification_reference TEXT NOT NULL DEFAULT '',
  registered_at INTEGER,
  expires_at INTEGER,
  retention_until INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,sim_id)
);

CREATE TABLE IF NOT EXISTS telecom_rate_decks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  region TEXT NOT NULL DEFAULT '',
  source_kind TEXT NOT NULL DEFAULT 'internal' CHECK(source_kind IN ('internal','wholesale','interconnect','roaming')),
  source_ref TEXT NOT NULL DEFAULT '',
  effective_from INTEGER,
  effective_to INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','retired')),
  customer_visible INTEGER NOT NULL DEFAULT 0 CHECK(customer_visible=0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_rate_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  rate_deck_id TEXT NOT NULL,
  service_type TEXT NOT NULL,
  destination_prefix TEXT NOT NULL DEFAULT '',
  destination_zone TEXT NOT NULL DEFAULT '',
  unit_name TEXT NOT NULL DEFAULT 'unit',
  unit_size REAL NOT NULL DEFAULT 1 CHECK(unit_size>0),
  unit_rate REAL NOT NULL DEFAULT 0 CHECK(unit_rate>=0),
  connection_charge REAL NOT NULL DEFAULT 0 CHECK(connection_charge>=0),
  minimum_charge REAL NOT NULL DEFAULT 0 CHECK(minimum_charge>=0),
  priority INTEGER NOT NULL DEFAULT 100,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  billing_account_ref TEXT NOT NULL DEFAULT '',
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  tax_total REAL NOT NULL DEFAULT 0,
  credit_total REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','open','partially_paid','paid','overdue','void','disputed')),
  due_at INTEGER,
  issued_at INTEGER,
  paid_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_invoice_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  line_id TEXT,
  rating_entry_id TEXT,
  item_type TEXT NOT NULL DEFAULT 'usage' CHECK(item_type IN ('recurring','usage','overage','addon','roaming','tax','credit','adjustment')),
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_payment_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  invoice_id TEXT,
  payment_reference TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0 CHECK(amount>=0),
  currency TEXT NOT NULL DEFAULT 'USD',
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','confirmed','failed','refunded','reversed')),
  provider_ref TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telecom_charging_line_state ON telecom_charging_sessions(tenant_id,line_id,state,created_at);
CREATE INDEX IF NOT EXISTS idx_telecom_reservations_session ON telecom_balance_reservations(tenant_id,charging_session_id,state);
CREATE INDEX IF NOT EXISTS idx_telecom_balance_tx_account ON telecom_balance_transactions(tenant_id,balance_account_id,created_at);
CREATE INDEX IF NOT EXISTS idx_telecom_balance_group_line ON telecom_balance_group_members(tenant_id,line_id,status,priority);
CREATE INDEX IF NOT EXISTS idx_telecom_policy_plan_service ON telecom_policy_profiles(tenant_id,plan_id,service_type,status);
CREATE INDEX IF NOT EXISTS idx_telecom_policy_decision_line ON telecom_policy_decisions(tenant_id,line_id,created_at);
CREATE INDEX IF NOT EXISTS idx_telecom_devices_line ON telecom_devices(tenant_id,line_id,status);
CREATE INDEX IF NOT EXISTS idx_telecom_sim_registration_line ON telecom_sim_registration_state(tenant_id,line_id,registration_state);
CREATE INDEX IF NOT EXISTS idx_telecom_rate_rules_lookup ON telecom_rate_rules(tenant_id,rate_deck_id,service_type,priority);
CREATE INDEX IF NOT EXISTS idx_telecom_invoices_customer ON telecom_invoices(tenant_id,customer_id,state,period_end);
CREATE INDEX IF NOT EXISTS idx_telecom_invoice_items_invoice ON telecom_invoice_items(tenant_id,invoice_id);
CREATE INDEX IF NOT EXISTS idx_telecom_payment_events_invoice ON telecom_payment_events(tenant_id,invoice_id,state);
