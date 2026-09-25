ALTER TABLE ads ADD COLUMN revenue_authorized INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ads ADD COLUMN owner_owned INTEGER NOT NULL DEFAULT 0;
UPDATE ads SET revenue_authorized=1
WHERE id IN (
  SELECT ad_id FROM sponsored_ad_orders
  WHERE ad_id IS NOT NULL AND status IN ('active','trialing')
);
