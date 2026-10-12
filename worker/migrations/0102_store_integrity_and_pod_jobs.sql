-- Store integrity follow-up: finite-stock protection, safe refund retries, and POD job reconciliation.
-- Stock reservation is intentionally enforced by the Worker with guarded D1 batch statements.
-- Cloudflare D1's migration splitter cannot reliably parse SQLite trigger bodies that contain
-- internal semicolons, so keeping trigger SQL out of migrations is required for portable deploys.
ALTER TABLE store_orders ADD COLUMN refund_attempt INTEGER NOT NULL DEFAULT 0;
ALTER TABLE store_orders ADD COLUMN stock_reserved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE store_orders ADD COLUMN stock_reservation_token TEXT NOT NULL DEFAULT '';
ALTER TABLE store_pod_jobs ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE store_pod_jobs ADD COLUMN next_attempt_at INTEGER NOT NULL DEFAULT 0;

-- Migration 0101 added three product forms after some daily designs could already exist.
-- Reconcile every active design/product-type pair so those designs are not permanently skipped.
INSERT OR IGNORE INTO store_pod_jobs(
  id,design_id,product_type_id,status,provider,provider_product_id,provider_variant_id,
  external_order_id,last_error,created_at,updated_at,attempt_count,next_attempt_at
)
SELECT
  'podjob_' || d.id || '_' || t.id,
  d.id,t.id,'design_ready','','','','','',d.created_at,d.created_at,0,0
FROM store_pod_designs d
CROSS JOIN store_pod_product_types t
WHERE d.status IN ('ready','published') AND t.active=1;
