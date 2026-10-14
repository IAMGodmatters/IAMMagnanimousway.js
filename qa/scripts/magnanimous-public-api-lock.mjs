import fs from 'node:fs';
import assert from 'node:assert/strict';
import { APIVAULT_DISCOVERY_RESEARCH, MAGNANIMOUS_PUBLIC_API_PROVIDERS, MAGNANIMOUS_PUBLIC_API_REVIEW_QUEUE, getPublicApiCapabilityManifest, getPublicApiAbsorptionSummary } from '../../worker/src/magnanimous-public-api-capability-registry.js';
import { classifyCapabilityRealization } from '../../worker/src/magnanimous-capability-realization.js';

const runtime=fs.readFileSync('worker/src/magnanimous-public-data-runtime.js','utf8');
const entrypoint=fs.readFileSync('worker/src/entrypoint.js','utf8');
const registry=fs.readFileSync('worker/src/magnanimous-public-api-capability-registry.js','utf8');
const toolSeed=fs.readFileSync('worker/src/public-api-tool-seed.js','utf8');
const deploy=fs.readFileSync('.github/workflows/deploy.yml','utf8');
const includes=(text,value,message)=>assert.ok(text.includes(value),message);
const excludes=(text,value,message)=>assert.ok(!text.includes(value),message);

assert.equal(APIVAULT_DISCOVERY_RESEARCH.use,'discovery-only');
assert.equal(APIVAULT_DISCOVERY_RESEARCH.commercial_source_copy_allowed,false);
assert.equal(APIVAULT_DISCOVERY_RESEARCH.derivative_source_copy_allowed,false);
assert.equal(APIVAULT_DISCOVERY_RESEARCH.observed_license,'CC BY-NC-ND 4.0');
assert.equal(APIVAULT_DISCOVERY_RESEARCH.observed_categories,51);
includes(registry,'https://github.com/exa-studio/ApiVault','ApiVault discovery source must remain attributable.');
includes(registry,'no API Vault source code or catalog data is copied','Commercial clean-room boundary must be explicit.');

for(const id of ['frankfurter','crossref','world-bank','usgs-earthquake','mdn-observatory','nvd','usajobs','openverse','free-dictionary','datamuse','nhtsa-vpic','federal-register','nasa-eonet','treasury-fiscal-data','nws','sec-edgar','wikidata','art-institute-chicago','met-museum','bible-api']){
  assert.ok(MAGNANIMOUS_PUBLIC_API_PROVIDERS.some(row=>row.id===id),`${id} active provider research is missing.`);
}
for(const id of ['open-meteo','nager-date','rest-countries','urlhaus','arbeitnow','open-library','us-census']){
  assert.ok(MAGNANIMOUS_PUBLIC_API_REVIEW_QUEUE.some(row=>row.id===id),`${id} terms/review decision is missing.`);
}

includes(runtime,"import { currentUser }",'Public-data tools must require Magnanimous authentication.');
includes(runtime,"if(!user)return json({detail:'Sign in to Magnanimous AI to use public data tools.'},401)",'Unauthenticated public-data proxying must be blocked.');
includes(runtime,"if(request.method!=='GET')",'Public-data adapter must remain read-only.');
includes(runtime,"arbitrary_url_proxy:false",'Capability response must advertise that arbitrary proxying is disabled.');
includes(runtime,'new AbortController()','Provider calls need a bounded timeout.');
includes(runtime,'MAX_PROVIDER_BYTES','Provider response sizes must be bounded.');
includes(runtime,'https://api.frankfurter.dev/v2/rate/','Frankfurter endpoint must be fixed to the official host.');
includes(runtime,'https://api.crossref.org/works?','Crossref endpoint must be fixed to the official host.');
includes(runtime,'https://api.worldbank.org/v2/country/','World Bank endpoint must be fixed to the official host.');
includes(runtime,'https://earthquake.usgs.gov/fdsnws/event/1/query?','USGS endpoint must be fixed to the official host.');
includes(runtime,'https://bible-api.com/','Bible API endpoint must be fixed to the official host.');
includes(runtime,'https://observatory-api.mdn.mozilla.net/api/v2/scan?host=','Observatory endpoint must be fixed to the official host.');
includes(runtime,'OWNED_SECURITY_HOST_SUFFIX','Security scan must be restricted to owned Magnanimous domains.');
includes(runtime,'https://services.nvd.nist.gov/rest/json/cves/2.0?','NVD endpoint must use the official 2.0 API.');
includes(runtime,"import { getProviderRuntimeEnv } from './provider-runtime-env.js';",'Credentialed public-data adapters must use the encrypted provider runtime overlay.');
includes(runtime,'https://data.usajobs.gov/api/Search?','USAJOBS search endpoint must be fixed to the official host.');
includes(runtime,'https://data.usajobs.gov/api/codelist/','USAJOBS codelist endpoint must use the live official no-key route.');
includes(runtime,"required_credentials:['USAJOBS_API_KEY','USAJOBS_API_EMAIL']",'USAJOBS search must fail truthfully when owner credentials are missing.');
includes(runtime,'https://api.openverse.org/v1/images/?','Openverse endpoint must be fixed to the official host.');
includes(runtime,"OPENVERSE_COMMERCIAL_LICENSES='cc0,pdm,by,by-sa'",'Openverse discovery must exclude noncommercial license classes by default.');
includes(runtime,'license_verification_required:true','Openverse results must preserve license-verification warning.');
includes(runtime,'https://api.dictionaryapi.dev/api/v2/entries/en/','Dictionary endpoint must be fixed to the official host.');
includes(runtime,'Free Dictionary API unavailable; using Datamuse definition fallback','Dictionary API must have a Datamuse resilience fallback.');
includes(runtime,'https://api.datamuse.com/words?','Datamuse word endpoint must be fixed to the official host.');
includes(runtime,'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/','NHTSA vPIC endpoint must be fixed to the official host.');
includes(runtime,'MAX_PROVIDER_CACHE_ENTRIES','Public-data provider caching must stay bounded.');
includes(runtime,'providerInflight','Duplicate provider requests must be coalesced.');
includes(runtime,'publicDataBurstGuard','Signed-in public-data calls need a bounded burst guard.');
includes(runtime,"path==='/api/public-data/health'",'Public-data health visibility must exist.');
includes(runtime,'https://www.federalregister.gov/api/v1/documents.json?','Federal Register endpoint must be fixed to the official host.');
includes(runtime,'https://eonet.gsfc.nasa.gov/api/v3/events?','NASA EONET endpoint must be fixed to the official host.');
includes(runtime,'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?','Treasury fiscal endpoint must be fixed to the official host.');
includes(runtime,'https://api.weather.gov/alerts/active?area=','NWS alert endpoint must be fixed to the official host.');
includes(runtime,"if(path==='/api/public-data/us-weather-alerts')",'NWS alert route must be mounted under authenticated public-data.');
includes(runtime,'https://data.sec.gov/submissions/CIK','SEC submissions endpoint must be fixed to the official host.');
includes(runtime,'https://data.sec.gov/api/xbrl/companyconcept/CIK','SEC XBRL company-concept endpoint must be fixed to the official host.');
includes(runtime,"Godmattersinc@iammagnanimousway.com",'SEC automation must use an identifiable Magnanimous contact in the User-Agent.');
includes(runtime,'https://www.wikidata.org/w/api.php?','Wikidata endpoint must be fixed to the official host.');
includes(runtime,"props:'labels|descriptions|aliases|sitelinks'",'Wikidata entity lookup must remain bounded to descriptive metadata instead of arbitrary claims export.');
includes(runtime,'https://api.artic.edu/api/v1/artworks/search?','Art Institute search must use the official API host.');
includes(runtime,'.filter(x=>x.is_public_domain)','Art Institute image discovery must remain public-domain filtered.');
includes(runtime,'https://collectionapi.metmuseum.org/public/collection/v1.1/search?','The Met search must use the current paginated v1.1 endpoint.');
includes(runtime,'image_url:isPublicDomain?','The Met image links must remain gated by the public-domain flag.');
includes(runtime,'official Federal Register edition','Federal Register adapter must preserve official-source verification warning.');
includes(runtime,'not an emergency-warning or evacuation service','NASA EONET adapter must preserve emergency-safety boundary.');
includes(runtime,'decimal strings to avoid JavaScript integer precision loss','Treasury high-precision amounts must not be silently coerced to floating point.');
includes(runtime,"const SCRIPTURE_TRANSLATIONS=new Set(['kjv','web','asv'])",'Scripture adapter must use a translation allowlist with KJV support.');
includes(runtime,'abstracts_included:false','Crossref adapter must explicitly exclude abstracts.');
includes(runtime,'metadata_only:true','Crossref adapter must remain metadata-only.');
includes(runtime,'bulk_mirroring:false','Scripture adapter must not become a bulk Bible mirror.');
includes(runtime,'reference-rate-not-payment-settlement','FX adapter must not be used as a payment settlement authority.');
includes(runtime,'not an emergency-warning service','USGS adapter must keep the emergency-safety boundary explicit.');
excludes(runtime,"url.searchParams.get('url')",'Runtime must not accept arbitrary provider URLs from users.');

includes(toolSeed,'for(const provider of MAGNANIMOUS_PUBLIC_API_PROVIDERS)','Every active public-data provider must be materialized through the Tool Foundry seed.');
includes(toolSeed,"risk:'low'",'Public-data Tool Foundry seeds must remain low-risk read-only tools.');
includes(toolSeed,'requiresConnection:false','No-key public-data evidence tools must not pretend a user connection is required.');
includes(toolSeed,'getPublicApiCapabilityManifest()','Tool Foundry must derive public-data capabilities from the authoritative manifest.');

includes(deploy,'/api/public-data/health','Production smoke must permanently verify the public-data health boundary.');
includes(deploy,'/api/public-data/capabilities','Production smoke must permanently verify the public-data capability surface.');
includes(deploy,'Authenticated Magnanimous public-data health and capability fabric passed.','Full production smoke must prove signed-in public-data runtime metadata.');
includes(deploy,'Unauthenticated public-data route $public_data_path expected HTTP 401','Worker-only production smoke must prove public-data routes stay authentication-gated.');
includes(deploy,'Public-data route $public_data_path incorrectly fell through to the Railway standalone plane.','Worker-only smoke must fail if public-data routing leaves the Cloudflare Worker plane.');

includes(entrypoint,"import { handleMagnanimousPublicData } from './magnanimous-public-data-runtime.js';",'Public-data runtime must be mounted in the Worker.');
includes(entrypoint,'const publicData=await handleMagnanimousPublicData(request,env);','Worker must route requests through public-data runtime.');

const manifest=getPublicApiCapabilityManifest();
assert.ok(manifest.length>=27,'Expected the expanded public API capability set to include at least twenty-seven contracts.');
for(const row of manifest){
  assert.equal(row.category,'public-api');
  assert.equal(row.source_kind,'official-public-api');
  assert.equal(row.initiative?.auto_initiate,true);
  assert.equal(row.initiative?.requires_confirmation,false);
  assert.equal(row.research?.proprietary_implementation_copied,false);
  const realized=classifyCapabilityRealization(row);
  assert.ok(['native-ready','hybrid-ready'].includes(realized.status),`${row.capability} must resolve to an existing Magnanimous execution surface; got ${realized.status}.`);
}

const summary=getPublicApiAbsorptionSummary();
assert.equal(summary.active_read_only_providers,20);
assert.equal(summary.capability_contracts,manifest.length);
assert.equal(summary.policy.no_proprietary_copying,true);
assert.equal(summary.policy.no_arbitrary_proxy,true);

console.log(`Magnanimous public API fabric verified: ${manifest.length} capability contracts across ${summary.active_read_only_providers} clean-room read-only sources.`);
