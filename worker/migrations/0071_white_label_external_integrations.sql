-- White Label external integrations: domains, e-signatures, agency payment connections.
ALTER TABLE agency_client_settings ADD COLUMN billing_email TEXT NOT NULL DEFAULT '';
ALTER TABLE agency_client_settings ADD COLUMN billing_currency TEXT NOT NULL DEFAULT 'usd';

CREATE TABLE IF NOT EXISTS agency_custom_domains (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  hostname TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'cloudflare-saas',
  provider_hostname_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  ssl_status TEXT NOT NULL DEFAULT 'pending',
  cname_target TEXT NOT NULL DEFAULT '',
  ownership_name TEXT NOT NULL DEFAULT '',
  ownership_value TEXT NOT NULL DEFAULT '',
  ssl_txt_name TEXT NOT NULL DEFAULT '',
  ssl_txt_value TEXT NOT NULL DEFAULT '',
  last_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,hostname)
);
CREATE INDEX IF NOT EXISTS idx_agency_custom_domains_client ON agency_custom_domains(tenant_id,client_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS agency_payment_connections (
  tenant_id TEXT PRIMARY KEY,
  stripe_account_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not_started',
  charges_enabled INTEGER NOT NULL DEFAULT 0,
  payouts_enabled INTEGER NOT NULL DEFAULT 0,
  details_submitted INTEGER NOT NULL DEFAULT 0,
  country TEXT NOT NULL DEFAULT '',
  default_currency TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS agency_payment_states (
  state TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS agency_client_charge_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  usage_id TEXT,
  connected_account_id TEXT NOT NULL,
  stripe_session_id TEXT NOT NULL DEFAULT '',
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'created',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agency_charge_sessions_tenant ON agency_client_charge_sessions(tenant_id,client_id,created_at DESC);

CREATE TABLE IF NOT EXISTS agency_esign_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  consent_text TEXT NOT NULL,
  document_title TEXT NOT NULL,
  document_body TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  signature_text TEXT NOT NULL DEFAULT '',
  signer_user_agent TEXT NOT NULL DEFAULT '',
  signer_ip_hash TEXT NOT NULL DEFAULT '',
  sent_at INTEGER,
  viewed_at INTEGER,
  signed_at INTEGER,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agency_esign_tenant ON agency_esign_requests(tenant_id,client_id,contract_id,updated_at DESC);
