-- Customer-facing real media + product detail foundation.
CREATE TABLE IF NOT EXISTS store_product_media (
  product_id TEXT NOT NULL,
  url TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(product_id,url),
  FOREIGN KEY(product_id) REFERENCES store_products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_store_product_media_product ON store_product_media(product_id,sort_order);

-- Retire the old abstract marketplace cards. Keep the author's book listing.
UPDATE store_products SET active=0
WHERE id LIKE 'mkt_%' AND id<>'mkt_book_holy_spirit';

-- Reuse durable product IDs that already existed before the expanded catalog. This avoids
-- replacing rows that could be referenced by historical orders while upgrading their customer media.
UPDATE store_products SET
  title='Computer Home Desk',
  description='A practical 55-inch workspace desk for a home office, study area, or business workspace.',
  category='Office & Business',price_cents=10900,currency='USD',image_url='/store/products/real/desk.jpg',active=1,featured=1,
  supplier_provider='cj',supplier_product_id='',supplier_variant_id='',supplier_sku='CJJT218255401AZ',supplier_url='',
  fulfillment_mode='dropship',inventory_mode='supplier',stock_qty=96,updated_at=1791800000,
  external_url='',product_kind='dropship',supplier_origin_country='CN',supplier_cost_hint_cents=NULL,handling_cents=199,facebook_enabled=1,
  source_note='Exact God Matters catalog product; first-party copy of merchant-owned product media.'
WHERE id='store_computer_desk';

UPDATE store_products SET
  title='Smart Automatic Pet Feeder with Timer & Wi-Fi',
  description='Schedule regular meals for cats or dogs with a convenient automatic feeder and Wi-Fi control option.',
  category='Pet Supplies',price_cents=9900,currency='USD',image_url='/store/products/real/pet-feeder.jpg',active=1,featured=1,
  supplier_provider='cj',supplier_product_id='',supplier_variant_id='',supplier_sku='CJYD212524908HS',supplier_url='',
  fulfillment_mode='dropship',inventory_mode='supplier',stock_qty=10650,updated_at=1791800000,
  external_url='',product_kind='dropship',supplier_origin_country='CN',supplier_cost_hint_cents=NULL,handling_cents=199,facebook_enabled=1,
  source_note='Exact God Matters catalog product; first-party copy of merchant-owned product media.'
WHERE id='store_pet_feeder';

UPDATE store_products SET
  title='60W Foldable Solar Panel - USB-C PD, USB-A QC & DC',
  description='Portable foldable solar charging panel for camping, RV use, emergency kits and compatible power stations.',
  category='Solar & Emergency Power',price_cents=0,currency='USD',image_url='/store/products/real/solar-panel-60w.jpg',active=1,featured=1,
  supplier_provider='',supplier_product_id='',supplier_variant_id='',supplier_sku='B0D635PKR1',supplier_url='',
  fulfillment_mode='preview',inventory_mode='supplier',stock_qty=NULL,updated_at=1791800000,
  external_url='',product_kind='catalog',supplier_origin_country='',supplier_cost_hint_cents=NULL,handling_cents=0,facebook_enabled=1,
  source_note='Merchant-owned catalog media; native fulfillment source still being verified.'
WHERE id='store_solar_panel_60w';

UPDATE store_products SET
  title='Solar Power Bank Phone Chargers - 2-Pack',
  description='Portable solar-capable backup power banks for travel, camping and emergency kits.',
  category='Solar & Emergency Power',price_cents=0,currency='USD',image_url='/store/products/real/solar-power-bank-2pk.jpg',active=1,featured=1,
  supplier_provider='',supplier_product_id='',supplier_variant_id='',supplier_sku='FR353-BLK',supplier_url='',
  fulfillment_mode='preview',inventory_mode='supplier',stock_qty=250,updated_at=1791800000,
  external_url='',product_kind='catalog',supplier_origin_country='',supplier_cost_hint_cents=NULL,handling_cents=0,facebook_enabled=1,
  source_note='Merchant-owned catalog media; native fulfillment source still being verified.'
WHERE id='store_solar_bank_2pk';

UPDATE store_products SET
  title='Solar Bird Bath Fountain - 1.4W with 4 Spray Nozzles',
  description='Solar fountain pump for bird baths, small ponds, and garden water features.',
  category='Home & Organization',price_cents=0,currency='USD',image_url='/store/products/real/solar-fountain.jpg',active=1,featured=0,
  supplier_provider='',supplier_product_id='',supplier_variant_id='',supplier_sku='AB01_BIRD_FOUNTAIN',supplier_url='',
  fulfillment_mode='preview',inventory_mode='supplier',stock_qty=173,updated_at=1791800000,
  external_url='',product_kind='catalog',supplier_origin_country='',supplier_cost_hint_cents=NULL,handling_cents=0,facebook_enabled=1,
  source_note='Merchant-owned catalog media; native fulfillment source still being verified.'
WHERE id='store_solar_fountain';

-- Additional exact merchant-owned catalog products with unique native IDs.
INSERT OR IGNORE INTO store_products(
 id,slug,title,description,category,price_cents,currency,image_url,active,featured,
 supplier_provider,supplier_product_id,supplier_variant_id,supplier_sku,supplier_url,
 fulfillment_mode,inventory_mode,stock_qty,created_at,updated_at,
 external_url,product_kind,supplier_origin_country,supplier_cost_hint_cents,handling_cents,facebook_enabled,source_note
) VALUES
('real_vacuum_bags','vacuum-storage-bags-12-pack','12-Pack Space Saver Vacuum Storage Bags','Compression storage bags for clothing, comforters, blankets and travel organization.','Home & Organization',0,'USD','/store/products/real/vacuum-bags.jpg',1,0,'','','','B09CYNMNND','','preview','supplier',50000,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.'),
('real_pet_hair_brush','pet-hair-remover-brush','Pet Hair Remover Brush','Reusable pet-hair remover for clothing, furniture, cats and dogs.','Pet Supplies',0,'USD','/store/products/real/pet-hair-brush.jpg',1,0,'','','','B0CZDF75BY','','preview','supplier',50000,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.'),
('real_bath_mat','quick-dry-bath-mat','Quick-Dry Thin Bathroom Mat','Low-profile absorbent bathroom mat designed to dry quickly and fit beneath doors.','Home & Organization',0,'USD','/store/products/real/bath-mat.jpg',1,0,'','','','B0CNQLR6GJ','','preview','supplier',50000,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.'),
('real_pink_office','pink-binder-paper-clip-set','Pink Binder & Paper Clip Set','Coordinated binder and paper-clip set for school, planners, and office organization.','Office & Business',0,'USD','/store/products/real/pink-office-set.jpg',1,0,'','','','CEO123-PK','','preview','supplier',67,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.'),
('real_rosegold_office','rose-gold-binder-paper-clip-set','Rose Gold Binder & Paper Clip Set','Polished binder and paper-clip set for notes, schoolwork, planners, and office use.','Office & Business',0,'USD','/store/products/real/rose-gold-office-set.jpg',1,0,'','','','CEO123-RG','','preview','supplier',72,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.');

INSERT OR IGNORE INTO store_product_media(product_id,url,alt,sort_order) VALUES
('store_computer_desk','/store/products/real/desk.jpg','Computer Home Desk',0),
('store_pet_feeder','/store/products/real/pet-feeder.jpg','Smart Automatic Pet Feeder with Timer & Wi-Fi',0),
('store_solar_panel_60w','/store/products/real/solar-panel-60w.jpg','60W Foldable Solar Panel',0),
('store_solar_bank_2pk','/store/products/real/solar-power-bank-2pk.jpg','Solar Power Bank Phone Chargers - 2-Pack',0),
('store_solar_fountain','/store/products/real/solar-fountain.jpg','Solar Bird Bath Fountain',0),
('real_vacuum_bags','/store/products/real/vacuum-bags.jpg','12-Pack Space Saver Vacuum Storage Bags',0),
('real_pet_hair_brush','/store/products/real/pet-hair-brush.jpg','Pet Hair Remover Brush',0),
('real_bath_mat','/store/products/real/bath-mat.jpg','Quick-Dry Thin Bathroom Mat',0),
('real_pink_office','/store/products/real/pink-office-set.jpg','Pink Binder & Paper Clip Set',0),
('real_rosegold_office','/store/products/real/rose-gold-office-set.jpg','Rose Gold Binder & Paper Clip Set',0),
('mkt_book_holy_spirit','/store/products/holy-spirit-speaks.svg','THE HOLY SPIRIT SPEAKS',0);

INSERT OR REPLACE INTO store_product_upsells(product_id,upsell_product_id,label,sort_order) VALUES
('store_computer_desk','real_pink_office','Add a desk organization set',1),
('store_pet_feeder','real_pet_hair_brush','Add a pet hair helper',1),
('store_solar_panel_60w','store_solar_bank_2pk','Pair with portable backup power',1),
('store_solar_bank_2pk','store_solar_panel_60w','Add portable solar charging',1),
('real_vacuum_bags','real_bath_mat','Add another home essential',1),
('real_pink_office','real_rosegold_office','See another office color',1),
('real_rosegold_office','store_computer_desk','Pair with a workspace desk',1);
