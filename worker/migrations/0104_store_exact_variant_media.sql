-- Native store truthfulness hardening.
-- Exact supplier variants remain closed until the live provider verifier writes supplier_variant_id.
-- Additional product media below is copied into Magnanimous-owned static storage; no Shopify CDN dependency remains.

UPDATE store_products SET
  title='55-Inch Brown Computer Home Desk',
  description='A practical 55-inch brown workspace desk for a home office, study area, gaming setup, or business workspace.',
  supplier_variant_id='',
  updated_at=1791803000
WHERE id='store_computer_desk';

UPDATE store_products SET
  title='Smart Automatic Pet Feeder — Black Wi-Fi / US',
  description='A black Wi-Fi automatic feeder for cats or dogs with scheduled meal control. This listing stays closed until its exact supplier variant, live product cost, and destination freight are verified.',
  image_url='/store/products/real/pet-feeder-black-wifi.jpg',
  supplier_variant_id='',
  supplier_sku='CJYD212524908HS',
  updated_at=1791803000
WHERE id='store_pet_feeder';

-- Never carry a stale supplier variant identifier across this stricter verification boundary.
UPDATE store_products SET supplier_variant_id=''
WHERE active=1 AND fulfillment_mode='dropship' AND lower(supplier_provider)='cj';

DELETE FROM store_product_media WHERE product_id='store_pet_feeder';
INSERT OR REPLACE INTO store_product_media(product_id,url,alt,sort_order) VALUES
('store_pet_feeder','/store/products/real/pet-feeder-black-wifi.jpg','Black Wi-Fi automatic pet feeder',0),
('store_pet_feeder','/store/products/real/pet-feeder-black-wifi-lifestyle.jpg','Black Wi-Fi automatic pet feeder shown with a cat and dog',1),
('store_computer_desk','/store/products/real/desk-3.jpg','55-inch brown computer desk alternate view',1),
('store_computer_desk','/store/products/real/desk-4.jpg','55-inch brown computer desk detail view',2);

-- Confirmed independently published children's book. Public book metadata is verified by ISBN/ASIN;
-- purchase remains an external Amazon author listing, never a dropshipping source.
INSERT OR REPLACE INTO store_products(
 id,slug,title,description,category,price_cents,currency,image_url,active,featured,
 supplier_provider,supplier_product_id,supplier_variant_id,supplier_sku,supplier_url,
 fulfillment_mode,inventory_mode,stock_qty,created_at,updated_at,
 external_url,product_kind,supplier_origin_country,supplier_cost_hint_cents,handling_cents,facebook_enabled,source_note
) VALUES(
 'mkt_book_jesus_did_it','jesus-did-it-for-me','Jesus Did It For Me: A Little Book About Why Jesus Came',
 'A gentle Christian children’s book for ages 0–4 using simple lessons and King James Version Scripture to teach who Jesus is and why He came.',
 'Books & Faith Gifts',0,'USD','/store/products/jesus-did-it-for-me.svg',1,1,
 '','','','','','external','external',NULL,1791803000,1791803000,
 'https://www.amazon.com/dp/B0HLDBF24D','external','',NULL,0,0,
 'Confirmed independently published paperback; ISBN 9798177798233; ASIN B0HLDBF24D.'
);

INSERT OR REPLACE INTO store_product_media(product_id,url,alt,sort_order) VALUES
('mkt_book_jesus_did_it','/store/products/jesus-did-it-for-me.svg','Jesus Did It For Me author listing artwork',0);

INSERT OR REPLACE INTO store_product_upsells(product_id,upsell_product_id,label,sort_order) VALUES
('mkt_book_holy_spirit','mkt_book_jesus_did_it','Also see the children’s faith book',1),
('mkt_book_jesus_did_it','mkt_book_holy_spirit','Also see THE HOLY SPIRIT SPEAKS',1);
