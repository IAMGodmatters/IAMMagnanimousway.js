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

-- Do not publish the old abstract placeholder cards as customer products.
UPDATE store_products SET active=0
WHERE id LIKE 'mkt_%' AND id<>'mkt_book_holy_spirit';

-- Exact products already owned in the God Matters catalog, now mirrored with first-party media.
INSERT OR REPLACE INTO store_products(
 id,slug,title,description,category,price_cents,currency,image_url,active,featured,
 supplier_provider,supplier_product_id,supplier_variant_id,supplier_sku,supplier_url,
 fulfillment_mode,inventory_mode,stock_qty,created_at,updated_at,
 external_url,product_kind,supplier_origin_country,supplier_cost_hint_cents,handling_cents,facebook_enabled,source_note
) VALUES
('real_desk','computer-home-desk','Computer Home Desk','A practical 55-inch workspace desk for a home office, study area, or business workspace.','Office & Business',10900,'USD','/store/products/real/desk.jpg',1,1,'cj','','','CJJT218255401AZ','','dropship','supplier',96,1791800000,1791800000,'','dropship','CN',NULL,199,1,'Exact God Matters catalog product; first-party copy of merchant-owned product media.'),
('real_pet_feeder','smart-automatic-pet-feeder','Smart Automatic Pet Feeder with Timer & Wi-Fi','Schedule regular meals for cats or dogs with a convenient automatic feeder and Wi-Fi control option.','Pet Supplies',9900,'USD','/store/products/real/pet-feeder.jpg',1,1,'cj','','','CJYD212524908HS','','dropship','supplier',10650,1791800000,1791800000,'','dropship','CN',NULL,199,1,'Exact God Matters catalog product; first-party copy of merchant-owned product media.'),
('real_solar_panel','60w-foldable-solar-panel','60W Foldable Solar Panel — USB-C PD, USB-A QC & DC','Portable foldable solar charging panel for camping, RV use, emergency kits and compatible power stations.','Solar & Emergency Power',0,'USD','/store/products/real/solar-panel-60w.jpg',1,1,'','','','B0D635PKR1','','preview','supplier',NULL,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.'),
('real_solar_bank','solar-power-bank-phone-chargers-2-pack','Solar Power Bank Phone Chargers — 2-Pack','Portable solar-capable backup power banks for travel, camping and emergency kits.','Solar & Emergency Power',0,'USD','/store/products/real/solar-power-bank-2pk.jpg',1,1,'','','','FR353-BLK','','preview','supplier',250,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.'),
('real_solar_fountain','solar-bird-bath-fountain','Solar Bird Bath Fountain — 1.4W with 4 Spray Nozzles','Solar fountain pump for bird baths, small ponds, and garden water features.','Home & Organization',0,'USD','/store/products/real/solar-fountain.jpg',1,0,'','','','AB01_BIRD_FOUNTAIN','','preview','supplier',173,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.'),
('real_vacuum_bags','vacuum-storage-bags-12-pack','12-Pack Space Saver Vacuum Storage Bags','Compression storage bags for clothing, comforters, blankets and travel organization.','Home & Organization',0,'USD','/store/products/real/vacuum-bags.jpg',1,0,'','','','B09CYNMNND','','preview','supplier',50000,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.'),
('real_pet_hair_brush','pet-hair-remover-brush','Pet Hair Remover Brush','Reusable pet-hair remover for clothing, furniture, cats and dogs.','Pet Supplies',0,'USD','/store/products/real/pet-hair-brush.jpg',1,0,'','','','B0CZDF75BY','','preview','supplier',50000,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.'),
('real_bath_mat','quick-dry-bath-mat','Quick-Dry Thin Bathroom Mat','Low-profile absorbent bathroom mat designed to dry quickly and fit beneath doors.','Home & Organization',0,'USD','/store/products/real/bath-mat.jpg',1,0,'','','','B0CNQLR6GJ','','preview','supplier',50000,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.'),
('real_pink_office','pink-binder-paper-clip-set','Pink Binder & Paper Clip Set','Coordinated binder and paper-clip set for school, planners, and office organization.','Office & Business',0,'USD','/store/products/real/pink-office-set.jpg',1,0,'','','','CEO123-PK','','preview','supplier',67,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.'),
('real_rosegold_office','rose-gold-binder-paper-clip-set','Rose Gold Binder & Paper Clip Set','Polished binder and paper-clip set for notes, schoolwork, planners, and office use.','Office & Business',0,'USD','/store/products/real/rose-gold-office-set.jpg',1,0,'','','','CEO123-RG','','preview','supplier',72,1791800000,1791800000,'','catalog','',NULL,0,1,'Merchant-owned catalog media; native fulfillment source still being verified.');

INSERT OR IGNORE INTO store_product_media(product_id,url,alt,sort_order)
SELECT id,image_url,title,0 FROM store_products WHERE id LIKE 'real_%';
INSERT OR IGNORE INTO store_product_media(product_id,url,alt,sort_order)
VALUES('mkt_book_holy_spirit','/store/products/holy-spirit-speaks.svg','THE HOLY SPIRIT SPEAKS',0);

INSERT OR REPLACE INTO store_product_upsells(product_id,upsell_product_id,label,sort_order) VALUES
('real_desk','real_pink_office','Add a desk organization set',1),
('real_pet_feeder','real_pet_hair_brush','Add a pet hair helper',1),
('real_solar_panel','real_solar_bank','Pair with portable backup power',1),
('real_solar_bank','real_solar_panel','Add portable solar charging',1),
('real_vacuum_bags','real_bath_mat','Add another home essential',1),
('real_pink_office','real_rosegold_office','See another office color',1),
('real_rosegold_office','real_desk','Pair with a workspace desk',1);
