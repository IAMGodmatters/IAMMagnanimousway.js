import { getPublicApiCapabilityManifest, getPublicApiAbsorptionSummary } from './magnanimous-public-api-capability-registry.js';

// Magnanimous AI owns the research workflow and public identity.
// External scholarly and public-data providers remain replaceable evidence engines.

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

export const MAGNANIMOUS_MODEL_INTERNAL_COMPUTING_CAPABILITIES = Object.freeze([
  Object.freeze({
    id: 'qwenputer-riscv-experimental',
    domain: 'experimental-computing',
    capability: 'model_internal_riscv_execution_research',
    status: 'research_only',
    production_dispatch: false,
    automatic_model_download: false,
    actions: ['architecture_review','cpu_reference_simulation','hardware_preflight','reproducibility_evaluation'],
    resource_requirements: Object.freeze({minimum_gpu_vram_gb:24,checkpoint_size_gb:18.8,gpu_acceleration:true}),
    upstream: Object.freeze({
      source_code: 'https://github.com/divagr18/qwenputer',
      model_weights: 'https://huggingface.co/divagr1925/Qwen3.5-4B-Qwenputer',
      technical_article: 'https://divagr.com/blog/qwenputer'
    }),
    boundary: 'Optional research adapter only; no production dispatch, no automatic downloads, no paid GPU provisioning, and no change to Magnanimous AI core orchestration.'
  })
]);

export function researchCapabilitySummary(){
  const publicApiCapabilities=getPublicApiCapabilityManifest(),publicApis=getPublicApiAbsorptionSummary();
  return {
    identity:'Magnanimous AI Research',
    brain_identity:'Magnanimous AI',
    provider_internal_only:true,
    provider_brand_override_allowed:false,
    normalized_research_memory:true,
    proprietary_corpus_copy_allowed:false,
    capability_count:MAGNANIMOUS_ACADEMIC_RESEARCH_CAPABILITIES.length+publicApiCapabilities.length,
    academic_capability_count:MAGNANIMOUS_ACADEMIC_RESEARCH_CAPABILITIES.length,
    public_api_capability_count:publicApiCapabilities.length,
    capabilities:MAGNANIMOUS_ACADEMIC_RESEARCH_CAPABILITIES,
    public_api_capabilities:publicApiCapabilities.map(row=>({id:row.id,capability:row.capability,native_target:row.native_target,boundary:row.boundary})),
    public_api_fabric:publicApis,
    provider_patterns:MAGNANIMOUS_RESEARCH_PROVIDER_PATTERNS,
    model_internal_computing_capabilities:MAGNANIMOUS_MODEL_INTERNAL_COMPUTING_CAPABILITIES,
    model_internal_computing_policy:Object.freeze({status:'research_only',production_dispatch:false,automatic_model_downloads:false,paid_gpu_provisioning:false,core_orchestration_unchanged:true})
  };
}
