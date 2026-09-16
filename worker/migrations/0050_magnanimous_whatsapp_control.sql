-- Magnanimous-owned normalized WhatsApp control-plane state.
-- No provider access tokens, message bodies, media bytes, payment credentials or raw identity documents are stored here.

CREATE TABLE IF NOT EXISTS magnanimous_whatsapp_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_waba_id TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  timezone_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'observed',
  source_provider TEXT NOT NULL DEFAULT 'meta-whatsapp',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, external_waba_id)
);

CREATE TABLE IF NOT EXISTS magnanimous_whatsapp_phone_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  whatsapp_account_id TEXT NOT NULL DEFAULT '',
  external_phone_number_id TEXT NOT NULL DEFAULT '',
  display_phone_number_masked TEXT NOT NULL DEFAULT '',
  display_name_status TEXT NOT NULL DEFAULT '',
  quality_rating TEXT NOT NULL DEFAULT '',
  registration_state TEXT NOT NULL DEFAULT 'unknown',
  two_step_verification_state TEXT NOT NULL DEFAULT 'unknown',
  calling_eligibility TEXT NOT NULL DEFAULT 'unknown',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, external_phone_number_id)
);

CREATE TABLE IF NOT EXISTS magnanimous_whatsapp_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_template_id TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  quality_score TEXT NOT NULL DEFAULT '',
  components_schema_json TEXT NOT NULL DEFAULT '{}',
  last_synced_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, name, language)
);

CREATE TABLE IF NOT EXISTS magnanimous_whatsapp_flows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_flow_id TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  categories_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  json_version TEXT NOT NULL DEFAULT '',
  data_api_version TEXT NOT NULL DEFAULT '',
  health_status TEXT NOT NULL DEFAULT '',
  endpoint_configured INTEGER NOT NULL DEFAULT 0 CHECK(endpoint_configured IN (0,1)),
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, external_flow_id)
);

CREATE TABLE IF NOT EXISTS magnanimous_whatsapp_message_state (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_message_id TEXT NOT NULL DEFAULT '',
  phone_asset_id TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL CHECK(direction IN ('inbound','outbound','unknown')),
  message_type TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  recipient_hash TEXT NOT NULL DEFAULT '',
  sender_hash TEXT NOT NULL DEFAULT '',
  template_name TEXT NOT NULL DEFAULT '',
  provider_timestamp INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, external_message_id)
);

CREATE TABLE IF NOT EXISTS magnanimous_whatsapp_webhook_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_hash TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT '',
  object_type TEXT NOT NULL DEFAULT 'whatsapp_business_account',
  external_waba_id TEXT NOT NULL DEFAULT '',
  external_phone_number_id TEXT NOT NULL DEFAULT '',
  external_message_id TEXT NOT NULL DEFAULT '',
  signature_valid INTEGER NOT NULL DEFAULT 0 CHECK(signature_valid IN (0,1)),
  processing_status TEXT NOT NULL DEFAULT 'observed',
  received_at INTEGER NOT NULL,
  processed_at INTEGER,
  UNIQUE(tenant_id, event_hash)
);

CREATE TABLE IF NOT EXISTS magnanimous_whatsapp_consent (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_hash TEXT NOT NULL,
  consent_type TEXT NOT NULL DEFAULT 'messaging',
  state TEXT NOT NULL CHECK(state IN ('opted_in','opted_out','unknown')),
  source TEXT NOT NULL DEFAULT '',
  evidence_ref TEXT NOT NULL DEFAULT '',
  effective_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, contact_hash, consent_type)
);

CREATE TABLE IF NOT EXISTS magnanimous_whatsapp_quality_snapshots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_waba_id TEXT NOT NULL DEFAULT '',
  external_phone_number_id TEXT NOT NULL DEFAULT '',
  phone_quality TEXT NOT NULL DEFAULT '',
  messaging_limit TEXT NOT NULL DEFAULT '',
  template_quality_json TEXT NOT NULL DEFAULT '{}',
  delivery_health_json TEXT NOT NULL DEFAULT '{}',
  captured_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS magnanimous_whatsapp_commerce_state (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_waba_id TEXT NOT NULL DEFAULT '',
  catalog_id TEXT NOT NULL DEFAULT '',
  commerce_settings_json TEXT NOT NULL DEFAULT '{}',
  payments_region TEXT NOT NULL DEFAULT '',
  payments_eligibility TEXT NOT NULL DEFAULT 'unknown',
  captured_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_whatsapp_accounts_tenant ON magnanimous_whatsapp_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnanimous_whatsapp_phone_assets_tenant ON magnanimous_whatsapp_phone_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnanimous_whatsapp_templates_tenant_status ON magnanimous_whatsapp_templates(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_magnanimous_whatsapp_flows_tenant_status ON magnanimous_whatsapp_flows(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_magnanimous_whatsapp_message_state_tenant_created ON magnanimous_whatsapp_message_state(tenant_id,created_at);
CREATE INDEX IF NOT EXISTS idx_magnanimous_whatsapp_webhook_events_tenant_received ON magnanimous_whatsapp_webhook_events(tenant_id,received_at);
CREATE INDEX IF NOT EXISTS idx_magnanimous_whatsapp_consent_tenant_state ON magnanimous_whatsapp_consent(tenant_id,state);
