CREATE TABLE IF NOT EXISTS white_label_whatsapp_routes (
 phone_number_id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 client_id TEXT NOT NULL,
 integration_external_account_id TEXT NOT NULL,
 created_by TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_white_label_whatsapp_routes_client ON white_label_whatsapp_routes(tenant_id,client_id);

CREATE TABLE IF NOT EXISTS white_label_whatsapp_inbox (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 client_id TEXT NOT NULL,
 phone_number_id TEXT NOT NULL,
 sender TEXT NOT NULL,
 customer_text TEXT NOT NULL,
 suggested_text TEXT NOT NULL,
 received_at INTEGER NOT NULL,
 reply_status TEXT NOT NULL DEFAULT 'review',
 reply_text TEXT NOT NULL DEFAULT '',
 provider_reply_id TEXT NOT NULL DEFAULT '',
 assistant_action_id TEXT NOT NULL DEFAULT '',
 sent_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_white_label_whatsapp_inbox_client ON white_label_whatsapp_inbox(tenant_id,client_id,received_at DESC);
