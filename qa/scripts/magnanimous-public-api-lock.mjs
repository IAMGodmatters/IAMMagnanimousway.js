import fs from 'node:fs';
import assert from 'node:assert/strict';
import { APIVAULT_DISCOVERY_RESEARCH, MAGNANIMOUS_PUBLIC_API_PROVIDERS, MAGNANIMOUS_PUBLIC_API_REVIEW_QUEUE, getPublicApiCapabilityManifest, getPublicApiAbsorptionSummary } from '../../worker/src/magnanimous-public-api-capability-registry.js';
import { classifyCapabilityRealization } from '../../worker/src/magnanimous-capability-realization.js';

const runtime=fs.readFileSync('worker/src/magnanimous-public-data-runtime.js','utf8');
const entrypoint=fs.readFileSync('worker/src/entrypoint.js','utf8');
const registry=fs.readFileSync('worker/src/magnanimous-public-api-capability-registry.js','utf8');
const includes=(text,value,message)=>assert.ok(text.includes(value),message);
const excludes=(text,value,message)=>assert.ok(!text.includes(value),message);

assert.equal(APIVAULT_DISCOVERY_RESEARCH.use,'discovery-only');
assert.equal(APIVAULT_DISCOVERY_RESEARCH.commercial_source_copy_allowed,false);
assert.equal(APIVAULT_DISCOVERY_RESEARCH.derivative_source_copy_allowed,false);
assert.equal(APIVAULT_DISCOVERY_RESEARCH.observed_license,'CC BY-NC-ND 4.0');
includes(registry,'https://github.com/exa-studio/ApiVault','ApiVault discovery source must remain attributable.');
includes(registry,'no API Vault source code or catalog data is copied','Commercial clean-room boundary must be explicit.');

for(const id of ['frankfurter','crossref','world-bank','usgs-earthquake','mdn-observatory','nvd','usajobs','openverse','free-dictionary','datamuse','nhtsa-vpic','bible-api']){
  assert.ok(MAGNANIMOUS_PUBLIC_API_PROVIDERS.some(row=>row.id===id),`${id} active provider research is missing.`);
}
for(const id of ['open-meteo','nager-date','rest-countries','urlhaus','arbeitnow','open-library']){
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
includes(runtime,"const SCRIPTURE_TRANSLATIONS=new Set(['kjv','web','asv'])",'Scripture adapter must use a translation allowlist with KJV support.');
includes(runtime,'abstracts_included:false','Crossref adapter must explicitly exclude abstracts.');
includes(runtime,'metadata_only:true','Crossref adapter must remain metadata-only.');
includes(runtime,'bulk_mirroring:false','Scripture adapter must not become a bulk Bible mirror.');
includes(runtime,'reference-rate-not-payment-settlement','FX adapter must not be used as a payment settlement authority.');
includes(runtime,'not an emergency-warning service','USGS adapter must keep the emergency-safety boundary explicit.');
excludes(runtime,"url.searchParams.get('url')",'Runtime must not accept arbitrary provider URLs from users.');

includes(entrypoint,"import { handleMagnanimousPublicData } from './magnanimous-public-data-runtime.js';",'Public-data runtime must be mounted in the Worker.');
includes(entrypoint,'const publicData=await handleMagnanimousPublicData(request,env);','Worker must route requests through public-data runtime.');

const manifest=getPublicApiCapabilityManifest();
assert.ok(manifest.length>=17,'Expected the expanded public API capability set to include at least seventeen contracts.');
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
assert.equal(summary.active_read_only_providers,12);
assert.equal(summary.capability_contracts,manifest.length);
assert.equal(summary.policy.no_proprietary_copying,true);
assert.equal(summary.policy.no_arbitrary_proxy,true);

console.log(`Magnanimous public API fabric verified: ${manifest.length} capability contracts across ${summary.active_read_only_providers} clean-room read-only sources.`);
