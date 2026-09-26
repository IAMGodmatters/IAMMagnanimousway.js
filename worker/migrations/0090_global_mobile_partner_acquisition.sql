-- Magnanimous Telecom carrier acquisition control.
-- Owner-only commercial/onboarding metadata. No provider API secrets.

CREATE TABLE IF NOT EXISTS telecom_mobile_partner_acquisition (
  tenant_id TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'researching'
    CHECK(status IN ('researching','contacted','case_open','sales_handoff','sandbox_pending','sandbox_ready','commercial_review','contract_pending','contract_verified','blocked','declined','retired')),
  contact_channel TEXT NOT NULL DEFAULT '',
  contact_destination TEXT NOT NULL DEFAULT '',
  case_reference TEXT NOT NULL DEFAULT '',
  evidence_reference TEXT NOT NULL DEFAULT '',
  pricing_reference TEXT NOT NULL DEFAULT '',
  commercial_reference TEXT NOT NULL DEFAULT '',
  sandbox_reference TEXT NOT NULL DEFAULT '',
  countries_json TEXT NOT NULL DEFAULT '[]',
  capabilities_json TEXT NOT NULL DEFAULT '[]',
  next_action TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  last_contact_at INTEGER,
  updated_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,provider_key)
);

CREATE INDEX IF NOT EXISTS idx_mobile_partner_acquisition_status
ON telecom_mobile_partner_acquisition(tenant_id,status,updated_at);
