-- Travel supplier acquisition and activation control plane.

CREATE TABLE IF NOT EXISTS travel_supplier_onboarding (
  tenant_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  priority INTEGER NOT NULL DEFAULT 50,
  outreach_channel TEXT NOT NULL DEFAULT '',
  contact_destination TEXT NOT NULL DEFAULT '',
  last_outreach_at INTEGER,
  next_action TEXT NOT NULL DEFAULT '',
  external_reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (tenant_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_travel_supplier_onboarding_status
  ON travel_supplier_onboarding(tenant_id,status,priority,updated_at);

CREATE TABLE IF NOT EXISTS travel_supplier_onboarding_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT '',
  destination TEXT NOT NULL DEFAULT '',
  external_reference TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_travel_supplier_onboarding_events
  ON travel_supplier_onboarding_events(tenant_id,supplier_id,created_at);
