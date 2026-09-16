# SciSpace absorption into Magnanimous AI Research

## Identity rule

Magnanimous AI owns the research workflow, research memory, synthesis, provenance and public identity.

SciSpace is treated as a replaceable internal scholarly-evidence engine. The platform must not present SciSpace as the Magnanimous identity, must not claim ownership of SciSpace's proprietary corpus, and must not mirror or scrape that corpus without an authorized data right.

## Live capabilities observed through the authorized ChatGPT connection

The connected SciSpace tool currently exposes two important primitives:

1. Semantic paper search from a natural-language research question. Results include scholarly metadata such as title, abstract, authors, year/date, journal/publication source, DOI when available, citation counts when available, open-access/full-text indicators and source links.
2. Structured column enrichment over previously returned papers. This pattern is suitable for fields such as methodology, results, conclusions, limitations, contributions, practical implications, objectives, findings, research gaps, future research, variables, datasets, population/sample, problem statements, challenges and applications.

Magnanimous absorbs the capability pattern, not the provider brand.

## Magnanimous-owned research architecture

The platform now normalizes academic research into provider-independent records:

- research questions
- papers and stable external references
- title and abstract
- DOI
- year
- journal/publication source
- publication type
- authors
- citation count
- open-access flag
- source URLs
- structured enrichment columns
- query-to-paper ranking links
- research syntheses with explicit evidence-paper IDs and limitations

This permits Magnanimous to use SciSpace today while remaining able to substitute or combine other scholarly sources later.

## Research patterns absorbed from current scholarly literature

Current SciSpace research results support several design decisions for the Magnanimous research stack:

- Hybrid retrieval is stronger than relying only on literal keyword search. Magnanimous should support lexical retrieval plus vector/semantic retrieval and rank fusion.
- Research systems benefit from multiple granularities: paper-level, passage-level and knowledge-graph/entity-level retrieval.
- Scientific-paper parsing should preserve semantic sections such as abstract, introduction, methodology, results and conclusions.
- Retrieval-augmented generation must retain source provenance so synthesis can be traced back to the evidence.
- Evidence tables should store structured fields rather than only free-form summaries.
- Literature review automation should preserve human checkpoints for screening, quality assessment and interpretation.
- Multi-agent research can separate planning, literature retrieval, evidence analysis, synthesis and novelty/gap detection while maintaining a persistent shared research state.
- Quality evaluation should measure retrieval relevance and citation/evidence accuracy, not just answer fluency.

Examples identified through the connected research tool include work on neural scholarly search, hybrid semantic/lexical retrieval, systematic-review automation, LLM/RAG literature QA, and interactive multi-agent scientific discovery. These papers are used as architectural evidence, not copied into the application corpus.

## Magnanimous research workflow

1. User asks Magnanimous a research question.
2. Magnanimous decomposes it into evidence needs and search questions.
3. One or more authorized research adapters retrieve candidate papers.
4. Results are normalized into Magnanimous research memory.
5. Duplicates are reconciled by source/external ID and DOI where available.
6. Selected papers receive structured enrichment columns.
7. Magnanimous compares methods, populations, findings, limitations and disagreements.
8. Magnanimous synthesizes a research brief with explicit evidence IDs and uncertainty/limitations.
9. The evidence stays reusable by Space, Telecom, Bible Study, Business, Coding or other Magnanimous modes without changing Magnanimous identity.

## Provider adapter contract

A scholarly provider adapter should normalize into this minimum shape:

```json
{
  "source_kind": "provider-id",
  "external_id": "provider-paper-id",
  "title": "...",
  "abstract": "...",
  "doi": "...",
  "publication_year": 2026,
  "journal": "...",
  "publication_type": "...",
  "authors": ["..."],
  "citation_count": 0,
  "open_access": false,
  "source_urls": ["..."],
  "metadata": {}
}
```

Enrichment adapters normalize to:

```json
{
  "paper_id": "paper_...",
  "column_key": "methodology",
  "value": "...",
  "source_kind": "provider-id",
  "evidence_ref": "provider-result-or-source-reference"
}
```

## Safety and data-rights rules

- Do not scrape or clone a proprietary research corpus simply to remove the provider.
- Store normalized results returned through authorized access and public/open research data where permitted.
- Keep DOI, source URLs and evidence references so claims remain auditable.
- Do not fabricate citation counts, DOI values, publication status or peer-review status.
- Distinguish peer-reviewed articles, proceedings, preprints and repository copies.
- Do not treat citation count as a direct measure of truth or study quality.
- Preserve conflicting findings instead of forcing false consensus.

## Independent-growth path

Magnanimous can progressively reduce dependence on any single research provider by adding lawful sources such as open-access repositories, Crossref-style DOI metadata, PubMed-like domain indexes, arXiv-style repositories, institutional repositories and licensed scholarly APIs. A future Magnanimous-native index can combine BM25/lexical search, vector embeddings, reciprocal-rank fusion, section-aware chunking, knowledge graphs and citation/provenance tracking while keeping external sources replaceable.
