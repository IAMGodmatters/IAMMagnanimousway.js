-- Store integrity follow-up: finite-stock protection, safe refund retries, and POD job reconciliation.
ALTER TABLE store_orders ADD COLUMN refund_attempt INTEGER NOT NULL DEFAULT 0;
ALTER TABLE store_pod_jobs ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE store_pod_jobs ADD COLUMN next_attempt_at INTEGER NOT NULL DEFAULT 0;

-- Finite inventory is decremented exactly once when an order first becomes paid.
-- SQLite trigger execution is atomic with the order status update, preventing concurrent
-- paid orders from overselling the final available units.
CREATE TRIGGER IF NOT EXISTS trg_store_reserve_stock_on_paid
BEFORE UPDATE OF status ON store_orders
WHEN NEW.status='paid' AND OLD.status<>'paid'
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1
    FROM store_order_items i
    JOIN store_products p ON p.id=i.product_id
    WHERE i.order_id=NEW.id
      AND p.stock_qty IS NOT NULL
      AND p.stock_qty < i.quantity
  ) THEN RAISE(ABORT,'STORE_STOCK_UNAVAILABLE') END;

  UPDATE store_products
  SET stock_qty = stock_qty - COALESCE((
    SELECT SUM(i.quantity)
    FROM store_order_items i
    WHERE i.order_id=NEW.id AND i.product_id=store_products.id
  ),0),
      updated_at=NEW.updated_at
  WHERE stock_qty IS NOT NULL
    AND id IN (SELECT product_id FROM store_order_items WHERE order_id=NEW.id);
END;

-- Automatic pre-fulfillment refunds return finite inventory to the catalog exactly once.
CREATE TRIGGER IF NOT EXISTS trg_store_restore_stock_on_refund
AFTER UPDATE OF status ON store_orders
WHEN NEW.status='refunded' AND OLD.status IN ('paid','refund_pending')
BEGIN
  UPDATE store_products
  SET stock_qty = stock_qty + COALESCE((
    SELECT SUM(i.quantity)
    FROM store_order_items i
    WHERE i.order_id=NEW.id AND i.product_id=store_products.id
  ),0),
      updated_at=NEW.updated_at
  WHERE stock_qty IS NOT NULL
    AND id IN (SELECT product_id FROM store_order_items WHERE order_id=NEW.id);
END;

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
