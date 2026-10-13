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
    id:'mdn-observatory',
    name:'MDN HTTP Observatory',
    status:'active-read-only-owned-domain-scan',
    official_docs:'https://developer.mozilla.org/en-US/observatory/docs/faq',
    base_url:'https://observatory-api.mdn.mozilla.net/api/v2/scan',
    auth:'none',
    use_case:'HTTP security-header posture scans for owned I AM MAGNANIMOUS WAY domains.',
    terms_note:'Scans are public provider-side observations and the same site is limited to a fresh scan about once per minute.',
    guardrail:'Only Magnanimous-owned iammagnanimousway.com hosts may be scanned; a good grade is not a complete security audit.'
  }),
  Object.freeze({
    id:'nvd',
    name:'NIST National Vulnerability Database',
    status:'active-read-only',
    official_docs:'https://nvd.nist.gov/developers/vulnerabilities',
    base_url:'https://services.nvd.nist.gov/rest/json/cves/2.0',
    auth:'optional-api-key',
    use_case:'CVE vulnerability lookup and bounded keyword search for platform security review.',
    terms_note:'NVD 2.0 is the current API family. Anonymous access is rate-limited; an owner API key may raise provider allowance.',
    guardrail:'Use as vulnerability evidence, not proof that a dependency is affected; confirm actual package/product/version applicability before remediation.'
  }),
  Object.freeze({
    id:'usajobs',
    name:'USAJOBS',
    status:'active-read-only-credential-gated-search',
    official_docs:'https://developer.usajobs.gov/',
    base_url:'https://data.usajobs.gov',
    auth:'api-key-plus-registered-email-for-search',
    use_case:'Official U.S. federal job discovery for Opportunity Vault plus unauthenticated reference codelists.',
    terms_note:'Job search requires an owner-obtained USAJOBS API key and the matching registered email; codelist endpoints do not require authentication.',
    guardrail:'Do not claim job-search connectivity until the owner credentials are configured; preserve the official USAJOBS application link.'
  }),
  Object.freeze({
    id:'openverse',
    name:'Openverse',
    status:'active-read-only',
    official_docs:'https://api.openverse.org/v1/',
    base_url:'https://api.openverse.org/v1',
    auth:'none-for-bounded-anonymous-search',
    use_case:'Openly licensed image discovery for Magnanimous Media Library, Kids, ministry, social and creative workflows.',
    terms_note:'Anonymous access is rate-limited. This adapter restricts results to CC0, public-domain mark, CC BY and CC BY-SA classes.',
    guardrail:'Openverse does not guarantee license accuracy; verify the individual work and retain required attribution before publishing.'
  }),
  Object.freeze({
    id:'free-dictionary',
    name:'Free Dictionary API',
    status:'active-read-only-best-effort',
    official_docs:'https://dictionaryapi.dev/',
    base_url:'https://api.dictionaryapi.dev/api/v2/entries/en',
    auth:'none',
    use_case:'English definitions, pronunciation metadata, examples, synonyms and antonyms for learning and writing.',
    terms_note:'Provider describes the service as free and intended for learning, games, speech and text applications.',
    guardrail:'Dictionary entries are reference material; do not present a definition as legal, medical or specialist professional advice.'
  }),
  Object.freeze({
    id:'datamuse',
    name:'Datamuse',
    status:'active-read-only-transition-aware',
    official_docs:'https://www.datamuse.com/api/',
    base_url:'https://api.datamuse.com',
    auth:'none-currently',
    use_case:'Word relationships, reverse-dictionary search, spelling/sound matching and suggestions for Magnanimous Kids and writing tools.',
    terms_note:'Anonymous API use is currently supported; Datamuse has announced API-key requirements beginning February 1, 2027.',
    guardrail:'Keep the adapter isolated and bounded so credential migration can occur without changing Magnanimous product behavior.'
  }),
  Object.freeze({
    id:'nhtsa-vpic',
    name:'NHTSA vPIC',
    status:'active-read-only',
    official_docs:'https://vpic.nhtsa.dot.gov/api/',
    base_url:'https://vpic.nhtsa.dot.gov/api/vehicles',
    auth:'none',
    use_case:'VIN and partial-VIN decoding for vehicle, transportation and research workflows.',
    terms_note:'NHTSA encourages application use subject to automated traffic controls; the API reflects manufacturer-submitted vPIC data.',
    guardrail:'Vehicle data is informational and must not be used as a substitute for title, safety-recall, insurance, registration or ownership verification.'
  }),
  Object.freeze({
    id:'federal-register',
    name:'FederalRegister.gov',
    status:'active-read-only',
    official_docs:'https://www.federalregister.gov/developers/documentation/api/v1',
    base_url:'https://www.federalregister.gov/api/v1',
    auth:'none',
    use_case:'Federal rules, proposed rules, notices and presidential-document discovery for legal and regulatory research.',
    terms_note:'Official developer resources state that the public API requires no API key. Federal Register material is government information; official logos and seals must not be reused as branding.',
    guardrail:'FederalRegister.gov is informational; verify legal reliance against the official Federal Register/GovInfo edition.'
  }),
  Object.freeze({
    id:'nasa-eonet',
    name:'NASA EONET',
    status:'active-read-only',
    official_docs:'https://eonet.gsfc.nasa.gov/docs/v3',
    base_url:'https://eonet.gsfc.nasa.gov/api/v3',
    auth:'none',
    use_case:'Natural-event situational awareness including wildfires, severe storms, volcanoes and other curated Earth events.',
    terms_note:'Version 3 is the current stable NASA EONET API; source/event metadata remains attributable to NASA EONET and its upstream sources.',
    guardrail:'Situational-awareness research only; not an emergency-warning, evacuation or disaster-response authority.'
  }),
  Object.freeze({
    id:'treasury-fiscal-data',
    name:'U.S. Treasury Fiscal Data',
    status:'active-read-only',
    official_docs:'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/',
    base_url:'https://api.fiscaldata.treasury.gov/services/api/fiscal_service',
    auth:'none',
    use_case:'Official U.S. federal fiscal datasets, beginning with daily Debt to the Penny evidence.',
    terms_note:'Fiscal Data publishes machine-readable public datasets and associated metadata for public use.',
    guardrail:'Government fiscal evidence is informational research; do not present it as investment advice or silently convert high-precision currency strings to floating point.'
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
  Object.freeze({id:'open-library',status:'manual-low-volume-only',reason:'Open Library asks consumers not to use the public API as a high-traffic production backend.'}),
  Object.freeze({id:'us-census',status:'credential-behavior-review',reason:'Official Census guidance describes a no-key allowance below 500 queries/day, but a 2026-10-14 live ACS probe returned a Missing Key response. Keep production disabled until current behavior is reconciled or an owner key is explicitly configured.'})
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
  Object.freeze({...shared,id:'public-api:mdn-observatory:http-security-header-scan',connector_id:'public-api:mdn-observatory',connector_name:'MDN HTTP Observatory',capability:'http-security-header-scan',native_target:'security-auditor',research:{official_docs:'https://developer.mozilla.org/en-US/observatory/docs/faq',verified_at:'2026-10-13',proprietary_implementation_copied:false,owned_domains_only:true}}),
  Object.freeze({...shared,id:'public-api:nvd:cve-vulnerability-lookup',connector_id:'public-api:nvd',connector_name:'NIST National Vulnerability Database',capability:'cve-vulnerability-lookup',native_target:'security-auditor',research:{official_docs:'https://nvd.nist.gov/developers/vulnerabilities',verified_at:'2026-10-13',proprietary_implementation_copied:false}}),
  Object.freeze({...shared,id:'public-api:nvd:vulnerability-keyword-search',connector_id:'public-api:nvd',connector_name:'NIST National Vulnerability Database',capability:'vulnerability-keyword-search',native_target:'security-auditor',research:{official_docs:'https://nvd.nist.gov/developers/vulnerabilities',verified_at:'2026-10-13',proprietary_implementation_copied:false}}),
  Object.freeze({...shared,id:'public-api:usajobs:federal-job-search',connector_id:'public-api:usajobs',connector_name:'USAJOBS',capability:'federal-job-search',native_target:'professional-intelligence',research:{official_docs:'https://developer.usajobs.gov/api-reference/get-api-search',verified_at:'2026-10-13',proprietary_implementation_copied:false,credential_gated:true}}),
  Object.freeze({...shared,id:'public-api:usajobs:job-reference-codelists',connector_id:'public-api:usajobs',connector_name:'USAJOBS',capability:'job-reference-codelists',native_target:'professional-intelligence',research:{official_docs:'https://developer.usajobs.gov/api-reference/code-lists',verified_at:'2026-10-13',proprietary_implementation_copied:false}}),
  Object.freeze({...shared,id:'public-api:openverse:licensed-image-search',connector_id:'public-api:openverse',connector_name:'Openverse',capability:'licensed-image-search',native_target:'media-library',research:{official_docs:'https://api.openverse.org/v1/',verified_at:'2026-10-13',proprietary_implementation_copied:false,license_verification_required:true}}),
  Object.freeze({...shared,id:'public-api:free-dictionary:english-dictionary-lookup',connector_id:'public-api:free-dictionary',connector_name:'Free Dictionary API',capability:'english-dictionary-lookup',native_target:'knowledge-workspace',research:{official_docs:'https://dictionaryapi.dev/',verified_at:'2026-10-13',proprietary_implementation_copied:false}}),
  Object.freeze({...shared,id:'public-api:datamuse:word-relationship-search',connector_id:'public-api:datamuse',connector_name:'Datamuse',capability:'word-relationship-search',native_target:'knowledge-workspace',research:{official_docs:'https://www.datamuse.com/api/',verified_at:'2026-10-13',proprietary_implementation_copied:false,api_key_required_from:'2027-02-01'}}),
  Object.freeze({...shared,id:'public-api:nhtsa-vpic:vin-decode',connector_id:'public-api:nhtsa-vpic',connector_name:'NHTSA vPIC',capability:'vin-decode',native_target:'research-orchestrator',research:{official_docs:'https://vpic.nhtsa.dot.gov/api/',verified_at:'2026-10-13',proprietary_implementation_copied:false,informational_only:true}}),
  Object.freeze({...shared,id:'public-api:federal-register:federal-regulatory-document-search',connector_id:'public-api:federal-register',connector_name:'FederalRegister.gov',capability:'federal-regulatory-document-search',native_target:'legal-research-engine',research:{official_docs:'https://www.federalregister.gov/developers/documentation/api/v1',verified_at:'2026-10-14',proprietary_implementation_copied:false,official_verification_required:true}}),
  Object.freeze({...shared,id:'public-api:nasa-eonet:natural-event-tracking',connector_id:'public-api:nasa-eonet',connector_name:'NASA EONET',capability:'natural-event-tracking',native_target:'research-orchestrator',research:{official_docs:'https://eonet.gsfc.nasa.gov/docs/v3',verified_at:'2026-10-14',proprietary_implementation_copied:false,safety_advisory:'informational-only'}}),
  Object.freeze({...shared,id:'public-api:treasury-fiscal-data:us-public-debt-research',connector_id:'public-api:treasury-fiscal-data',connector_name:'U.S. Treasury Fiscal Data',capability:'us-public-debt-research',native_target:'finance-research',research:{official_docs:'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/',verified_at:'2026-10-14',proprietary_implementation_copied:false,high_precision_strings:true}}),
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
