-- Native Magnanimous White Label drafts and cash/external POS bookkeeping.
-- No payment processor, phone carrier, or publication side effect is created here.
CREATE TABLE IF NOT EXISTS white_label_native_documents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,client_id,kind,title)
);
CREATE INDEX IF NOT EXISTS idx_white_label_native_documents
  ON white_label_native_documents(tenant_id,client_id,kind,updated_at DESC);

CREATE TABLE IF NOT EXISTS white_label_pos_products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK(price_cents>=0),
  stock INTEGER NOT NULL CHECK(stock>=0),
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE(tenant_id,client_id,sku)
);
CREATE INDEX IF NOT EXISTS idx_white_label_pos_products
  ON white_label_pos_products(tenant_id,client_id,active);

CREATE TABLE IF NOT EXISTS white_label_pos_sales (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  items_json TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
