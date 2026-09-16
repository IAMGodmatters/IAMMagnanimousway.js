-- Magnanimous AI normalized research memory.
-- External scholarly services remain replaceable evidence sources; their proprietary corpora are not mirrored.

CREATE TABLE IF NOT EXISTS magnanimous_research_queries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  question TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'recorded',
  result_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_research_queries_tenant_created
  ON magnanimous_research_queries(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS magnanimous_research_papers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'normalized',
  external_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  abstract TEXT NOT NULL DEFAULT '',
  doi TEXT NOT NULL DEFAULT '',
  publication_year INTEGER,
  journal TEXT NOT NULL DEFAULT '',
  publication_type TEXT NOT NULL DEFAULT '',
  authors_json TEXT NOT NULL DEFAULT '[]',
  citation_count INTEGER,
  open_access INTEGER NOT NULL DEFAULT 0,
  source_urls_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, source_kind, external_id)
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_research_papers_tenant_year
  ON magnanimous_research_papers(tenant_id, publication_year DESC);
CREATE INDEX IF NOT EXISTS idx_magnanimous_research_papers_tenant_doi
  ON magnanimous_research_papers(tenant_id, doi);

CREATE TABLE IF NOT EXISTS magnanimous_research_query_results (
  query_id TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  rank_order INTEGER NOT NULL DEFAULT 0,
  relevance_note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY(query_id, paper_id)
);

CREATE TABLE IF NOT EXISTS magnanimous_research_enrichments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  column_key TEXT NOT NULL,
  value_text TEXT NOT NULL DEFAULT '',
  source_kind TEXT NOT NULL DEFAULT 'normalized',
  evidence_ref TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, paper_id, column_key, source_kind)
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_research_enrichments_paper
  ON magnanimous_research_enrichments(tenant_id, paper_id, column_key);

CREATE TABLE IF NOT EXISTS magnanimous_research_syntheses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  query_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  synthesis_type TEXT NOT NULL DEFAULT 'research_brief',
  body_text TEXT NOT NULL DEFAULT '',
  evidence_paper_ids_json TEXT NOT NULL DEFAULT '[]',
  limitations_text TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
