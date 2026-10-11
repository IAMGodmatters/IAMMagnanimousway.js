-- Magnanimous Store catalog expansion: categories, upsells, social feed metadata,
-- shipping/handling budgets, and supplier-safe automated fulfillment fields.

CREATE TABLE IF NOT EXISTS store_categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  art_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);

CREATE TABLE IF NOT EXISTS store_product_upsells (
  product_id TEXT NOT NULL,
  upsell_product_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Add this too',
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(product_id,upsell_product_id),
  FOREIGN KEY(product_id) REFERENCES store_products(id) ON DELETE CASCADE,
  FOREIGN KEY(upsell_product_id) REFERENCES store_products(id) ON DELETE CASCADE
);

ALTER TABLE store_products ADD COLUMN external_url TEXT NOT NULL DEFAULT '';
ALTER TABLE store_products ADD COLUMN product_kind TEXT NOT NULL DEFAULT 'dropship';
ALTER TABLE store_products ADD COLUMN supplier_origin_country TEXT NOT NULL DEFAULT 'CN';
ALTER TABLE store_products ADD COLUMN supplier_cost_hint_cents INTEGER;
ALTER TABLE store_products ADD COLUMN handling_cents INTEGER NOT NULL DEFAULT 199;
ALTER TABLE store_products ADD COLUMN facebook_enabled INTEGER NOT NULL DEFAULT 1 CHECK(facebook_enabled IN (0,1));
ALTER TABLE store_products ADD COLUMN source_note TEXT NOT NULL DEFAULT '';

ALTER TABLE store_orders ADD COLUMN shipping_handling_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE store_orders ADD COLUMN supplier_budget_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE store_orders ADD COLUMN supplier_quote_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE store_orders ADD COLUMN destination_country TEXT NOT NULL DEFAULT '';
ALTER TABLE store_orders ADD COLUMN logistic_name TEXT NOT NULL DEFAULT '';
ALTER TABLE store_orders ADD COLUMN refund_id TEXT NOT NULL DEFAULT '';
ALTER TABLE store_orders ADD COLUMN refund_status TEXT NOT NULL DEFAULT '';
ALTER TABLE store_orders ADD COLUMN refunded_at INTEGER;
ALTER TABLE store_orders ADD COLUMN refund_reason TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_store_orders_refund_deadline ON store_orders(status,paid_at,fulfillment_status);

INSERT OR REPLACE INTO store_categories(id,slug,name,description,art_url,sort_order,active) VALUES
('cat-solar','solar-emergency-power','Solar & Emergency Power','Backup power, solar charging and off-grid essentials.','/store/categories/solar.svg',10,1),
('cat-electronics','electronics','Electronics','Useful everyday consumer electronics and audio.','/store/categories/electronics.svg',20,1),
('cat-mobile','mobile-accessories','Mobile Accessories','Charging, mounting and phone accessories.','/store/categories/mobile.svg',30,1),
('cat-kitchen','kitchen-dining','Kitchen & Dining','Practical food-prep and dining tools.','/store/categories/kitchen.svg',40,1),
('cat-home','home-organization','Home & Organization','Simple storage, cleaning and organization helpers.','/store/categories/home.svg',50,1),
('cat-fashion','clothing-fashion','Clothing & Fashion','Comfortable everyday apparel and accessories.','/store/categories/fashion.svg',60,1),
('cat-beauty','beauty-personal-care','Beauty & Personal Care','Personal-care tools and beauty accessories.','/store/categories/beauty.svg',70,1),
('cat-fitness','fitness-outdoors','Fitness & Outdoors','Portable fitness, exercise and outdoor essentials.','/store/categories/fitness.svg',80,1),
('cat-pets','pet-supplies','Pet Supplies','Helpful products for cats, dogs and pet households.','/store/categories/pets.svg',90,1),
('cat-baby','baby-kids','Baby & Kids','Family-friendly baby and child essentials.','/store/categories/baby.svg',100,1),
('cat-auto','automotive-travel','Automotive & Travel','Car convenience and travel organization.','/store/categories/auto.svg',110,1),
('cat-office','office-business','Office & Business','Desk, organization and workday helpers.','/store/categories/office.svg',120,1),
('cat-tools','tools-home-improvement','Tools & Home Improvement','Compact tools for repairs and practical home projects.','/store/categories/tools.svg',130,1),
('cat-toys','toys-hobbies','Toys & Hobbies','Creative, educational and family activity products.','/store/categories/toys.svg',140,1),
('cat-books','books-faith-gifts','Books & Faith Gifts','Books and faith-centered resources from God Matters.','/store/categories/books.svg',150,1);

-- Retire the original incomplete placeholder rows; their improved replacements follow below.
UPDATE store_products SET active=0 WHERE id IN ('store_solar_bank_2pk','store_solar_fountain','store_solar_panel_60w','store_computer_desk','store_pet_feeder');

INSERT INTO store_products(
 id,slug,title,description,category,price_cents,currency,image_url,active,featured,
 supplier_provider,supplier_product_id,supplier_variant_id,supplier_sku,supplier_url,
 fulfillment_mode,inventory_mode,stock_qty,created_at,updated_at,
 external_url,product_kind,supplier_origin_country,supplier_cost_hint_cents,handling_cents,facebook_enabled,source_note
) VALUES
('mkt_solar_bank','solar-emergency-power-bank','Solar Emergency Power Bank','Portable solar-capable backup charging for travel, outages and emergency kits.','Solar & Emergency Power',1499,'USD','/store/products/solar-bank.svg',1,1,'cj','CJXFLPDC00059','','CJXFLPDC00059-Black','https://cjdropshipping.com/product/solar-power-bank-p-CJXFLPDC00059.html','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',522,199,1,'CJ catalog SKU verified from public supplier listing.'),
('mkt_solar_light','solar-camping-garden-light','Split Solar Camping & Garden Light','Rechargeable solar lighting for camping, patios, walkways and emergency use.','Solar & Emergency Power',1299,'USD','/store/products/solar-light.svg',1,1,'cj','CJLE219252701AZ','','CJLE219252701AZ','','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',614,199,1,'CJ catalog product.'),
('mkt_earbuds','wireless-bluetooth-headset','Wireless Bluetooth Headset','Compact wireless audio for calls, music and everyday listening.','Electronics',1499,'USD','/store/products/earbuds.svg',1,0,'cj','CJYP202270501AZ','','CJYP202270501AZ','','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',369,199,1,'CJ catalog product.'),
('mkt_cable','three-in-one-charging-cable','3-in-1 Fast Charging Cable','One travel-friendly cable for multiple common phone charging connections.','Mobile Accessories',1799,'USD','/store/products/charging-cable.svg',1,0,'cj','CJSJ233158302BY','','CJSJ233158302BY','','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',863,199,1,'CJ catalog product.'),
('mkt_chopper','multifunction-vegetable-cutter','Multifunction Vegetable Cutter','Hand-operated kitchen slicer with multiple blades for faster meal preparation.','Kitchen & Dining',1499,'USD','/store/products/kitchen-chopper.svg',1,0,'cj','CJJT169443501AZ','','CJJT169443501AZ','https://cjdropshipping.com/product/kitchen-hand-operated-multi-functional-vegetable-cutter-rust-resistant-practical-manual-vegetable-slicer-for-home-p-1630393947791044608.html','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',609,199,1,'CJ catalog SKU CJJT169443501AZ.'),
('mkt_home_set','laundry-cleansing-organizer-set','Laundry & Cleansing Organizer Set','Lightweight home organization helper for laundry and everyday storage.','Home & Organization',799,'USD','/store/products/home-organizer.svg',1,0,'cj','CJJT142272901AZ','','CJJT142272901AZ','https://cjdropshipping.com/product/laundrycleansing-set-p-1496427300244295680.html','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',177,199,1,'CJ catalog SKU CJJT142272901AZ.'),
('mkt_hoodie','positive-message-unisex-hoodie','Positive Message Unisex Hoodie','Comfortable casual hoodie with an uplifting everyday message.','Clothing & Fashion',1499,'USD','/store/products/hoodie.svg',1,0,'cj','CJWY182558501AZ','','CJWY182558501AZ','','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',344,199,1,'CJ catalog product; exact selectable variant is resolved at checkout.'),
('mkt_brushes','makeup-brush-set','Makeup Brush Set','Multi-brush beauty set for everyday makeup and travel.','Beauty & Personal Care',1199,'USD','/store/products/makeup-brushes.svg',1,0,'cj','CJHZ103034401AZ','','CJHZ103034401AZ','','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',410,199,1,'CJ catalog product.'),
('mkt_bands','five-level-resistance-band-set','5-Level Resistance Band Set','Portable resistance bands for stretching, strength, yoga and home workouts.','Fitness & Outdoors',1199,'USD','/store/products/resistance-bands.svg',1,0,'cj','CJYDQTJM00353','','CJYDQTJM00353-5 colors setA','https://cjdropshipping.com/product/yoga-resistance-rubber-bands-indoor-outdoor-fitness-equipment-0.35mm-1.1mm-pilates-sport-training-workout-elastic-bands-p-F1B26962-F15C-41B6-A6BB-438B9FB64108.html','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',340,199,1,'CJ variant SKU verified from public supplier listing.'),
('mkt_pet_feeder','automatic-pet-feeder','Automatic Pet Feeder','Scheduled feeder for cats and dogs to support regular meal routines.','Pet Supplies',1999,'USD','/store/products/pet-feeder.svg',1,0,'cj','CJMY163699601AZ','','CJMY163699601AZ','','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',753,199,1,'CJ catalog product.'),
('mkt_baby_teether','baby-silicone-teether-accessories','Baby Silicone Teether Accessories','Soft silicone teething and pacifier-chain accessories for supervised baby use.','Baby & Kids',1299,'USD','/store/products/baby-teether.svg',1,0,'cj','CJJT190484303CX','','CJJT190484303CX','https://cjdropshipping.com/product/baby-silicone-dental-gel-diy-pacifier-chain-accessories-p-1727871951282118656.html','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',1525,199,1,'CJ catalog product; live variant price guard prevents selling below cost.'),
('mkt_car_mount','car-phone-holder','Car Phone Holder','Compact in-car phone mounting for navigation and hands-free convenience.','Automotive & Travel',999,'USD','/store/products/car-mount.svg',1,0,'cj','CJSJ191857702BY','','CJSJ191857702BY','','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',176,199,1,'CJ catalog product.'),
('mkt_travel_cubes','travel-packing-cubes','8-Piece Travel Packing Cubes','Reusable organizer set for clothing, shoes, toiletries and travel accessories.','Automotive & Travel',1299,'USD','/store/products/travel-cubes.svg',1,0,'cj','CJNS110086901AZ','','CJNS110086901AZ','https://cjdropshipping.com/product/8-piece-set-luggage-divider-bag-travel-storage-clothes-underwear-shoes-organizer-packing-cube-bag-p-1386852733046362112.html','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',462,199,1,'CJ catalog SKU CJNS110086901AZ.'),
('mkt_desk_box','desktop-stackable-organizer','Desktop Stackable Organizer','Stackable desktop storage for office supplies, cables, cosmetics and small items.','Office & Business',1299,'USD','/store/products/desk-organizer.svg',1,0,'cj','CJJT110132001AZ','','CJJT110132001AZ','https://cjdropshipping.com/product/desktop-storage-box-office-accessories-makeup-plastic-storage-container-bathroom-storage-stackable-organizer-drawer-p-1386883997170274304.html','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',558,199,1,'CJ catalog SKU CJJT110132001AZ.'),
('mkt_screwdriver','usb-electric-screwdriver-set','USB Electric Screwdriver Set','Rechargeable compact screwdriver with accessories for small repairs and projects.','Tools & Home Improvement',2999,'USD','/store/products/electric-screwdriver.svg',1,0,'cj','CJYD205633601AZ','','CJYD205633601AZ','https://cjdropshipping.com/product/small-electric-screwdriver-170rpm-multifunctional-p-2406081037551611800.html','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',1374,199,1,'CJ catalog SKU CJYD205633601AZ.'),
('mkt_blocks','magnetic-building-blocks','Magnetic Building Blocks','Creative construction toy for building, imagination and hands-on play.','Toys & Hobbies',1999,'USD','/store/products/magnetic-blocks.svg',1,0,'cj','CJYD201360201AZ','','CJYD201360201AZ','','dropship','supplier',NULL,1791726000,1791726000,'','dropship','CN',879,199,1,'CJ catalog product.'),
('mkt_book_holy_spirit','the-holy-spirit-speaks','THE HOLY SPIRIT SPEAKS','A Testimony of Faith, Truth, and Serving the Lamb of God by Jessie Hardin.','Books & Faith Gifts',0,'USD','/store/products/holy-spirit-speaks.svg',1,1,'','','','','','external','external',NULL,1791726000,1791726000,'https://a.co/d/02rFwv8H','external','',NULL,0,0,'Author-owned Amazon listing; ISBN 9798173450265.');

INSERT OR REPLACE INTO store_product_upsells(product_id,upsell_product_id,label,sort_order) VALUES
('mkt_solar_bank','mkt_cable','Add a multi-device charging cable',1),
('mkt_solar_light','mkt_solar_bank','Add backup phone power',1),
('mkt_earbuds','mkt_cable','Add a travel charging cable',1),
('mkt_cable','mkt_solar_bank','Add emergency backup power',1),
('mkt_chopper','mkt_home_set','Add a home organization helper',1),
('mkt_home_set','mkt_desk_box','Add a stackable organizer',1),
('mkt_hoodie','mkt_travel_cubes','Add travel packing cubes',1),
('mkt_brushes','mkt_travel_cubes','Keep beauty items organized while traveling',1),
('mkt_bands','mkt_solar_bank','Add outdoor/emergency power',1),
('mkt_pet_feeder','mkt_travel_cubes','Add travel organization',1),
('mkt_baby_teether','mkt_home_set','Add a home organization helper',1),
('mkt_car_mount','mkt_cable','Add an in-car charging cable',1),
('mkt_travel_cubes','mkt_solar_bank','Add travel backup power',1),
('mkt_desk_box','mkt_cable','Add cable convenience for your desk',1),
('mkt_screwdriver','mkt_solar_light','Add portable solar lighting',1),
('mkt_blocks','mkt_book_holy_spirit','Add a faith-centered family book',1),
('mkt_book_holy_spirit','mkt_hoodie','Pair the book with a positive-message hoodie',1);
