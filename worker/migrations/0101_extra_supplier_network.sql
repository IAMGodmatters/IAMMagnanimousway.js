-- Extra supplier network metadata and expanded print-on-demand product forms.
-- Provider identities remain owner-only; no public store response exposes this table.
CREATE TABLE IF NOT EXISTS store_supplier_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'dropship',
  integration_status TEXT NOT NULL DEFAULT 'approval_required',
  free_entry INTEGER NOT NULL DEFAULT 1 CHECK(free_entry IN (0,1)),
  supports_api INTEGER NOT NULL DEFAULT 0 CHECK(supports_api IN (0,1)),
  priority INTEGER NOT NULL DEFAULT 100,
  notes TEXT NOT NULL DEFAULT ''
);

INSERT OR REPLACE INTO store_supplier_providers(id,name,role,integration_status,free_entry,supports_api,priority,notes) VALUES
('cj','CJdropshipping','dropship','native_adapter',1,1,10,'Native Magnanimous adapter; customer payment, freight, margin and 24-hour refund guards remain mandatory.'),
('eprolo','EPROLO','dropship','approval_required',1,1,20,'Free API access is available after account signup and API approval through EPROLO support.'),
('sup','Sup Dropshipping','dropship','approval_required',1,1,30,'Open API is available by request through the assigned Sup agent.'),
('hypersku','HyperSKU','dropship-pod','integration_required',1,0,40,'No-subscription sourcing and fulfillment candidate; keep disabled until an approved integration contract/credential is supplied.'),
('zendrop','Zendrop','research','research_only',1,0,90,'Useful catalog/shipping research source; automatic native fulfillment stays disabled while plan/API economics are not verified as no-recurring-cost.');

INSERT OR REPLACE INTO store_pod_product_types(id,name,category_slug,sort_order,active) VALUES
('pod_sweatshirt','Sweatshirt','clothing-fashion',25,1),
('pod_travel_cup','Travel Cup','books-faith-gifts',45,1),
('pod_bottle','Water Bottle','fitness-outdoors',47,1);
