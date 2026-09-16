// Magnanimous AI owns the research workflow and public identity.
// SciSpace and any future scholarly providers remain replaceable internal evidence engines.

export const MAGNANIMOUS_ACADEMIC_RESEARCH_CAPABILITIES = Object.freeze([
  {id:'semantic-paper-search',domain:'discovery',capability:'semantic_academic_search',actions:['natural_language_question','title','abstract','authors','year','journal','citation_count']},
  {id:'paper-metadata',domain:'evidence',capability:'scholarly_metadata_normalization',actions:['doi','journal','authors','publication_type','open_access','source_links']},
  {id:'structured-columns',domain:'analysis',capability:'paper_table_enrichment',actions:['methodology','results','conclusions','limitations','relevance','population','sample_size','evidence_quality']},
  {id:'evidence-table',domain:'analysis',capability:'structured_evidence_matrix',actions:['compare_papers','filter','sort','deduplicate','source_traceability']},
  {id:'literature-review',domain:'synthesis',capability:'literature_review_support',actions:['theme_clustering','consensus','disagreement','research_gaps','citation_ready_notes']},
  {id:'research-memory',domain:'memory',capability:'normalized_research_memory',actions:['store_query','store_source','store_enrichment','reuse_evidence','provenance']},
  {id:'mission-research',domain:'space',capability:'satellite_research_feed',actions:['mission_design','autonomy','ground_segment','communications','cybersecurity','fault_tolerance','end_of_life']}
]);

export const MAGNANIMOUS_RESEARCH_PROVIDER_PATTERNS = Object.freeze([
  {
    id:'scispace',
    provider_internal_only:true,
    role:'replaceable academic evidence engine',
    live_tools_observed:['semantic paper search','structured column enrichment'],
    corpus_copy_allowed:false,
    provider_brand_override_allowed:false,
    notes:'Magnanimous may use normalized outputs and citations returned through authorized connections. Do not scrape, mirror, or claim ownership of a provider proprietary corpus.'
  }
]);

export function researchCapabilitySummary(){
  return {
    identity:'Magnanimous AI Research',
    brain_identity:'Magnanimous AI',
    provider_internal_only:true,
    provider_brand_override_allowed:false,
    normalized_research_memory:true,
    proprietary_corpus_copy_allowed:false,
    capability_count:MAGNANIMOUS_ACADEMIC_RESEARCH_CAPABILITIES.length,
    capabilities:MAGNANIMOUS_ACADEMIC_RESEARCH_CAPABILITIES,
    provider_patterns:MAGNANIMOUS_RESEARCH_PROVIDER_PATTERNS
  };
}
