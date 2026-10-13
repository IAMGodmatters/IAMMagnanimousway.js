// Public API capability research for Magnanimous AI.
// API Vault is used only as a discovery directory. Its repository is CC BY-NC-ND 4.0,
// so no API Vault source code or catalog data is copied into this commercial platform.
// Each active adapter below is independently implemented from the provider's official
// public API contract and provider-specific usage/licensing terms.

export const APIVAULT_DISCOVERY_RESEARCH=Object.freeze({
  source:'https://apivault.dev/',
  repository:'https://github.com/exa-studio/ApiVault',
  observed_license:'CC BY-NC-ND 4.0',
  verified_at:'2026-10-13',
  use:'discovery-only',
  commercial_source_copy_allowed:false,
  derivative_source_copy_allowed:false,
  implementation_rule:'Discover candidates through API Vault, then independently verify and implement only against official provider documentation and terms.'
});

export const MAGNANIMOUS_PUBLIC_API_PROVIDERS=Object.freeze([
  Object.freeze({
    id:'frankfurter',
    name:'Frankfurter',
    status:'active-read-only',
    official_docs:'https://frankfurter.dev/',
    base_url:'https://api.frankfurter.dev',
    auth:'none',
    use_case:'Reference and historical foreign-exchange rates.',
    terms_note:'Official documentation states the API is free for commercial use; underlying data-provider terms remain applicable.',
    guardrail:'Reference-rate intelligence only; never use as a card/payment settlement FX authority.'
  }),
  Object.freeze({
    id:'crossref',
    name:'Crossref REST API',
    status:'active-read-only',
    official_docs:'https://www.crossref.org/documentation/retrieve-metadata/rest-api/',
    base_url:'https://api.crossref.org',
    auth:'none',
    use_case:'DOI and scholarly publication metadata search.',
    terms_note:'Use the public REST API at conservative rates. Metadata is normalized; abstracts/full text are not copied by this adapter.',
    guardrail:'Metadata-only adapter; do not mirror copyrighted article text or abstracts.'
  }),
  Object.freeze({
    id:'world-bank',
    name:'World Bank Indicators API',
    status:'active-read-only',
    official_docs:'https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information',
    base_url:'https://api.worldbank.org/v2',
    auth:'none',
    use_case:'Country, development, demographic and economic indicator series.',
    terms_note:'World Bank open-data licensing applies per dataset; keep source attribution and dataset-specific terms visible.',
    guardrail:'Treat values as sourced statistical evidence, not financial advice or a guaranteed real-time feed.'
  }),
  Object.freeze({
    id:'usgs-earthquake',
    name:'USGS Earthquake Hazards Program',
    status:'active-read-only',
    official_docs:'https://earthquake.usgs.gov/fdsnws/event/1/',
    base_url:'https://earthquake.usgs.gov/fdsnws/event/1/query',
    auth:'none',
    use_case:'Recent and historical earthquake event search.',
    terms_note:'USGS-authored data is generally public-domain U.S. government information; source credit is retained.',
    guardrail:'Informational risk evidence only; not an emergency-warning replacement. Follow local authorities for safety decisions.'
  }),
  Object.freeze({
    id:'bible-api',
    name:'Bible API',
    status:'active-read-only-best-effort',
    official_docs:'https://bible-api.com/',
    base_url:'https://bible-api.com',
    auth:'none',
    use_case:'Low-volume Scripture passage lookup.',
    terms_note:'Use only explicitly allowed translations in this adapter and respect the service rate limit and translation-specific licensing.',
    guardrail:'No bulk mirroring; KJV is the default translation for Magnanimous Bible study.'
  })
]);

export const MAGNANIMOUS_PUBLIC_API_REVIEW_QUEUE=Object.freeze([
  Object.freeze({id:'open-meteo',status:'not-activated',reason:'The free public offering is described for non-commercial use; do not attach it to a commercial runtime without appropriate commercial terms.'}),
  Object.freeze({id:'nager-date',status:'not-activated',reason:'Commercial use requires active sponsorship under the provider terms.'}),
  Object.freeze({id:'rest-countries',status:'not-activated',reason:'The free plan is not suitable for commercial production under current provider terms.'}),
  Object.freeze({id:'urlhaus',status:'not-activated',reason:'Commercial/for-profit usage and authentication terms require separate review before production activation.'}),
  Object.freeze({id:'arbeitnow',status:'not-activated',reason:'Free API availability was observed, but commercial reuse terms are not clear enough for automatic production activation.'}),
  Object.freeze({id:'open-library',status:'manual-low-volume-only',reason:'Open Library asks consumers not to use the public API as a high-traffic production backend.'})
]);

const shared={
  category:'public-api',
  source_kind:'official-public-api',
  direct_connector:false,
  boundary:'fresh-external-data',
  implementation_status:'hybrid-runtime-proven-by-contract',
  magnanimous_owned:['intent-understanding','input-validation','planning','policy','normalization','verification','memory-selection','failure-recovery'],
  external_only:['fresh-external-data'],
  initiative:Object.freeze({suggestive:true,auto_initiate:true,requires_confirmation:false,action_class:'read-inspect-verify'})
};

export const MAGNANIMOUS_PUBLIC_API_CAPABILITIES=Object.freeze([
  Object.freeze({...shared,id:'public-api:frankfurter:currency-reference-rate',connector_id:'public-api:frankfurter',connector_name:'Frankfurter',capability:'currency-reference-rate',native_target:'finance-research',research:{official_docs:'https://frankfurter.dev/',verified_at:'2026-10-13',proprietary_implementation_copied:false}}),
  Object.freeze({...shared,id:'public-api:frankfurter:currency-historical-rates',connector_id:'public-api:frankfurter',connector_name:'Frankfurter',capability:'currency-historical-rates',native_target:'finance-research',research:{official_docs:'https://frankfurter.dev/',verified_at:'2026-10-13',proprietary_implementation_copied:false}}),
  Object.freeze({...shared,id:'public-api:crossref:scholarly-metadata-search',connector_id:'public-api:crossref',connector_name:'Crossref REST API',capability:'scholarly-metadata-search',native_target:'scientific-research',research:{official_docs:'https://www.crossref.org/documentation/retrieve-metadata/rest-api/',verified_at:'2026-10-13',proprietary_implementation_copied:false,metadata_only:true}}),
  Object.freeze({...shared,id:'public-api:crossref:doi-metadata-lookup',connector_id:'public-api:crossref',connector_name:'Crossref REST API',capability:'doi-metadata-lookup',native_target:'research-orchestrator',research:{official_docs:'https://www.crossref.org/documentation/retrieve-metadata/rest-api/',verified_at:'2026-10-13',proprietary_implementation_copied:false,metadata_only:true}}),
  Object.freeze({...shared,id:'public-api:world-bank:global-economic-indicators',connector_id:'public-api:world-bank',connector_name:'World Bank Indicators API',capability:'global-economic-indicators',native_target:'business-analytics',research:{official_docs:'https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information',verified_at:'2026-10-13',proprietary_implementation_copied:false}}),
  Object.freeze({...shared,id:'public-api:world-bank:country-development-series',connector_id:'public-api:world-bank',connector_name:'World Bank Indicators API',capability:'country-development-series',native_target:'research-orchestrator',research:{official_docs:'https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information',verified_at:'2026-10-13',proprietary_implementation_copied:false}}),
  Object.freeze({...shared,id:'public-api:usgs-earthquake:earthquake-event-search',connector_id:'public-api:usgs-earthquake',connector_name:'USGS Earthquake Hazards Program',capability:'earthquake-event-search',native_target:'research-orchestrator',research:{official_docs:'https://earthquake.usgs.gov/fdsnws/event/1/',verified_at:'2026-10-13',proprietary_implementation_copied:false,safety_advisory:'informational-only'}}),
  Object.freeze({...shared,id:'public-api:bible-api:scripture-passage-lookup',connector_id:'public-api:bible-api',connector_name:'Bible API',capability:'scripture-passage-lookup',native_target:'bible-study-engine',research:{official_docs:'https://bible-api.com/',verified_at:'2026-10-13',proprietary_implementation_copied:false,bulk_mirroring:false,default_translation:'kjv'}})
]);

export function getPublicApiCapabilityManifest(){
  return MAGNANIMOUS_PUBLIC_API_CAPABILITIES.map(row=>({...row,research:{...row.research,discovery_source:'https://apivault.dev/',discovery_source_use:'discovery-only'}}));
}

export function getPublicApiAbsorptionSummary(){
  return {
    identity:'Magnanimous AI',
    discovery:APIVAULT_DISCOVERY_RESEARCH,
    evaluated_providers:MAGNANIMOUS_PUBLIC_API_PROVIDERS.length+MAGNANIMOUS_PUBLIC_API_REVIEW_QUEUE.length,
    active_read_only_providers:MAGNANIMOUS_PUBLIC_API_PROVIDERS.length,
    capability_contracts:MAGNANIMOUS_PUBLIC_API_CAPABILITIES.length,
    providers:MAGNANIMOUS_PUBLIC_API_PROVIDERS.map(({id,name,status,use_case,official_docs,guardrail})=>({id,name,status,use_case,official_docs,guardrail})),
    review_queue:MAGNANIMOUS_PUBLIC_API_REVIEW_QUEUE,
    policy:{free_first:true,read_only:true,no_arbitrary_proxy:true,no_proprietary_copying:true,provider_terms_control:true,source_attribution:true}
  };
}
