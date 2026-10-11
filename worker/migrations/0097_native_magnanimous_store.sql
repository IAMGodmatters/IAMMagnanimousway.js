-- Native I AM MAGNANIMOUS WAY / God Matters commerce plane.
-- Shopify-independent catalog, orders and provider-neutral dropship queue.

CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'PHP',
  image_url TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  featured INTEGER NOT NULL DEFAULT 0 CHECK(featured IN (0,1)),
  supplier_provider TEXT NOT NULL DEFAULT '',
  supplier_product_id TEXT NOT NULL DEFAULT '',
  supplier_variant_id TEXT NOT NULL DEFAULT '',
  supplier_sku TEXT NOT NULL DEFAULT '',
  supplier_url TEXT NOT NULL DEFAULT '',
  fulfillment_mode TEXT NOT NULL DEFAULT 'dropship',
  inventory_mode TEXT NOT NULL DEFAULT 'supplier',
  stock_qty INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_store_products_active_featured
ON store_products(active, featured, updated_at DESC);

CREATE TABLE IF NOT EXISTS store_orders (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  stripe_session_id TEXT UNIQUE,
  payment_intent_id TEXT,
  customer_email TEXT NOT NULL DEFAULT '',
  amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'PHP',
  status TEXT NOT NULL DEFAULT 'pending',
  fulfillment_status TEXT NOT NULL DEFAULT 'not_ready',
  shipping_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  paid_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_store_orders_status_created
ON store_orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS store_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  title_snapshot TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents >= 0),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  supplier_provider TEXT NOT NULL DEFAULT '',
  supplier_product_id TEXT NOT NULL DEFAULT '',
  supplier_variant_id TEXT NOT NULL DEFAULT '',
  supplier_sku TEXT NOT NULL DEFAULT '',
  supplier_cost_cents INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES store_products(id)
);

CREATE INDEX IF NOT EXISTS idx_store_order_items_order
ON store_order_items(order_id);

CREATE TABLE IF NOT EXISTS store_fulfillment_jobs (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'awaiting_supplier_activation',
  external_order_id TEXT NOT NULL DEFAULT '',
  last_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES store_orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_store_fulfillment_jobs_status
ON store_fulfillment_jobs(status, created_at);

-- Seed a small native catalog from products already owned by God Matters.
-- Supplier fields are private and intentionally incomplete until each item is
-- verified/mapped to an authorized dropshipping account.
INSERT OR IGNORE INTO store_products(
  id,slug,title,description,category,price_cents,currency,image_url,active,featured,
  supplier_provider,supplier_product_id,supplier_variant_id,supplier_sku,supplier_url,
  fulfillment_mode,inventory_mode,stock_qty,created_at,updated_at
) VALUES
('store_solar_bank_2pk','solar-power-bank-2-pack','Solar Power Bank Phone Chargers — 2-Pack','Portable 5000mAh solar-capable backup power banks for travel, camping and emergency kits.','Power & Outdoors',249900,'PHP','/store/solar-power-bank.svg',1,1,'external','','','FR353-BLK','','dropship','supplier',NULL,1791726000,1791726000),
('store_solar_fountain','solar-bird-bath-fountain','Solar Bird Bath Fountain — 1.4W with 4 Spray Nozzles','Solar fountain pump for bird baths, small ponds and garden water features.','Home & Garden',229900,'PHP','/store/solar-fountain.svg',1,1,'external','','','AB01_BIRD_FOUNTAIN','','dropship','supplier',NULL,1791726000,1791726000),
('store_solar_panel_60w','60w-foldable-solar-panel','60W Foldable Solar Panel — USB-C PD, USB-A QC & DC','Portable foldable solar charging panel for camping, emergency kits and compatible power stations.','Power & Outdoors',629900,'PHP','/store/solar-panel.svg',1,1,'external','','','B0D635PKR1','','dropship','supplier',NULL,1791726000,1791726000),
('store_computer_desk','computer-home-desk','Computer Home Desk','A practical 55-inch workspace desk for home, study or office use.','Home & Office',562500,'PHP','/store/computer-desk.svg',1,0,'cj','','','CJJT218255401AZ','','dropship','supplier',NULL,1791726000,1791726000),
('store_pet_feeder','smart-automatic-pet-feeder','Smart Automatic Pet Feeder with Timer & Wi-Fi Options','Automatic scheduled feeding for cats or dogs with button and Wi-Fi model options.','Pet Care',562500,'PHP','/store/pet-feeder.svg',1,0,'cj','','','CJYD212524908HS','','dropship','supplier',NULL,1791726000,1791726000);