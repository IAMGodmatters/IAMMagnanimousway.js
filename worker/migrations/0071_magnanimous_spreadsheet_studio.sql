CREATE TABLE IF NOT EXISTS magnanimous_workbooks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_workbooks_user ON magnanimous_workbooks(tenant_id,user_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS magnanimous_sheets (
  id TEXT PRIMARY KEY,
  workbook_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sheets_workbook ON magnanimous_sheets(tenant_id,user_id,workbook_id,position);

CREATE TABLE IF NOT EXISTS magnanimous_cells (
  sheet_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  row_num INTEGER NOT NULL,
  col_num INTEGER NOT NULL,
  raw_value TEXT NOT NULL DEFAULT '',
  formula TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(sheet_id,row_num,col_num)
);
CREATE INDEX IF NOT EXISTS idx_cells_user_sheet ON magnanimous_cells(tenant_id,user_id,sheet_id,row_num,col_num);
