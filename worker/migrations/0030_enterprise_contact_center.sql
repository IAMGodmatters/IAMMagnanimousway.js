CREATE TABLE IF NOT EXISTS cc_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'preview',
  status TEXT NOT NULL DEFAULT 'draft',
  queue_id TEXT,
  agent_id TEXT,
  caller_id TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  daily_cap INTEGER NOT NULL DEFAULT 100,
  hourly_cap INTEGER NOT NULL DEFAULT 20,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  retry_seconds INTEGER NOT NULL DEFAULT 86400,
  consent_required INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_campaigns_tenant ON cc_campaigns(tenant_id,status,updated_at);

CREATE TABLE IF NOT EXISTS cc_campaign_members (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  lead_id INTEGER,
  phone TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at INTEGER,
  next_attempt_at INTEGER,
  disposition TEXT NOT NULL DEFAULT '',
  consent_confirmed INTEGER NOT NULL DEFAULT 0,
  timezone TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(campaign_id,phone)
);
CREATE INDEX IF NOT EXISTS idx_cc_campaign_members_next ON cc_campaign_members(tenant_id,campaign_id,status,next_attempt_at);

CREATE TABLE IF NOT EXISTS cc_ivr_flows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0,
  greeting TEXT NOT NULL DEFAULT '',
  invalid_message TEXT NOT NULL DEFAULT 'That selection was not recognized.',
  timeout_message TEXT NOT NULL DEFAULT 'I did not receive a selection.',
  after_hours_message TEXT NOT NULL DEFAULT 'We are currently closed. Please leave a message or request a callback.',
  business_hours_json TEXT NOT NULL DEFAULT '{}',
  nodes_json TEXT NOT NULL DEFAULT '{}',
  default_queue_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_ivr_flows_tenant ON cc_ivr_flows(tenant_id,active,updated_at);

CREATE TABLE IF NOT EXISTS cc_callbacks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  queue_id TEXT,
  phone TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at INTEGER NOT NULL,
  scheduled_at INTEGER,
  assigned_agent_id TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_callbacks_queue ON cc_callbacks(tenant_id,status,scheduled_at,requested_at);

CREATE TABLE IF NOT EXISTS cc_voicemails (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  queue_id TEXT,
  phone TEXT NOT NULL DEFAULT '',
  provider_call_id TEXT NOT NULL DEFAULT '',
  recording_url TEXT NOT NULL DEFAULT '',
  transcription TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  assigned_agent_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_voicemails_tenant ON cc_voicemails(tenant_id,status,created_at);

CREATE TABLE IF NOT EXISTS cc_dispositions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'neutral',
  retryable INTEGER NOT NULL DEFAULT 0,
  retry_seconds INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,code)
);

CREATE TABLE IF NOT EXISTS cc_agent_assist_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger_phrase TEXT NOT NULL,
  guidance TEXT NOT NULL,
  queue_id TEXT,
  priority INTEGER NOT NULL DEFAULT 100,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_agent_assist_rules ON cc_agent_assist_rules(tenant_id,active,priority);

CREATE TABLE IF NOT EXISTS cc_call_intelligence (
  call_id INTEGER NOT NULL,
  tenant_id TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  sentiment TEXT NOT NULL DEFAULT 'unknown',
  topics_json TEXT NOT NULL DEFAULT '[]',
  action_items_json TEXT NOT NULL DEFAULT '[]',
  qa_flags_json TEXT NOT NULL DEFAULT '[]',
  compliance_risk TEXT NOT NULL DEFAULT 'none',
  generated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,call_id)
);

CREATE TABLE IF NOT EXISTS cc_interactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'inbound',
  customer_key TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  priority INTEGER NOT NULL DEFAULT 50,
  queue_id TEXT,
  assigned_agent_id TEXT,
  sentiment TEXT NOT NULL DEFAULT 'unknown',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  last_message_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_interactions_inbox ON cc_interactions(tenant_id,status,priority,last_message_at);

CREATE TABLE IF NOT EXISTS cc_interaction_messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  interaction_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_key TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  provider_message_id TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_interaction_messages_thread ON cc_interaction_messages(tenant_id,interaction_id,created_at);
