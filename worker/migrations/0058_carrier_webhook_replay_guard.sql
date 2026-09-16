-- Replay/idempotency ledger for signed carrier webhook callbacks.
CREATE TABLE IF NOT EXISTS carrier_webhook_events (
  event_id TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  received_at INTEGER NOT NULL,
  processed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_carrier_webhook_events_received
  ON carrier_webhook_events(received_at);
