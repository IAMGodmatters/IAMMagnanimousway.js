import fs from 'node:fs';

const registry=fs.readFileSync('worker/src/magnanimous-ecosystem-capability-registry.js','utf8');
const runtime=fs.readFileSync('worker/src/magnanimous-ecosystem-runtime.js','utf8');
const entry=fs.readFileSync('worker/src/entrypoint.js','utf8');
const docs=fs.readFileSync('ecosystem-core/PROVIDER_ECOSYSTEM_ABSORPTION.md','utf8');
const failures=[];
const must=(text,needle,label)=>{if(!text.includes(needle))failures.push(`${label}: missing ${needle}`)};

for(const value of [
 "identity:'Magnanimous AI Ecosystem'",
 "brain_identity:'Magnanimous AI'",
 "owner_identity:'God Matters'",
 "affiliation:'I AM MAGNANIMOUS WAY™'",
 'provider_brand_override_allowed:false',
 'external_provider_memory_ownership_allowed:false',
 "normalized_memory_owner:'Magnanimous AI'",
 'proprietary_dataset_copy_allowed:false',
 'purchase_actions_enabled:false',
 'ad_spend_actions_enabled:false',
 'carrier_provisioning_enabled:false',
 'sim_esim_activation_enabled:false',
 'domain_purchase_enabled:false',
 'destructive_devops_enabled:false',
 'secret_exposure_allowed:false'
])must(registry,value,'identity/safety policy');

for(const id of ['att-network','tmobile-devedge','metro-by-tmobile','verizon-thingspace','dsers','github','porkbun','world-wide-web','openai-chatgpt'])must(registry,`id:'${id}'`,'provider registry');
must(registry,"network_parent:'tmobile-devedge'",'Metro parent-network lock');
must(registry,'independent_network_api_claimed:false','Metro independent-network claim lock');
must(registry,"legacy_pilot_retired_on:'2026-06-04'",'T-Mobile retired-pilot awareness');
must(registry,'public_api_verified:false','DSers API verification boundary');
must(registry,"cap('domain-register'",'Porkbun domain capability');
must(registry,"'spend-locked'",'Porkbun spend lock');
must(registry,"cap('responses'",'OpenAI Responses capability');
must(registry,"cap('realtime'",'OpenAI Realtime capability');
must(registry,"cap('computer-use'",'OpenAI computer-use capability');
must(registry,"cap('image-generation'",'OpenAI image-generation capability');
must(registry,"cap('speech-generation'",'OpenAI speech-generation capability');
must(registry,"cap('transcription'",'OpenAI transcription capability');
must(registry,"cap('provenance-citations'",'Web provenance capability');

must(runtime,"path.startsWith('/api/ecosystem')",'ecosystem route');
must(runtime,"request.method!=='GET'",'read-only control plane');
must(runtime,"code:'ECOSYSTEM_CONTROL_PLANE_READ_ONLY'",'read-only error code');
must(runtime,"ownerOnly(user)",'owner-only gate');
must(runtime,"'/api/ecosystem/readiness'",'readiness route');
must(runtime,"'/api/ecosystem/providers/'",'provider detail route');

must(entry,"./magnanimous-ecosystem-runtime.js",'entrypoint import');
must(entry,'handleMagnanimousEcosystem(request,env)','entrypoint routing');

must(docs,'former DevEdge pilot APIs/services were retired on 2026-06-04','T-Mobile docs warning');
must(docs,'No general public DSers API is marked verified','DSers docs boundary');
must(docs,'The Web is not treated as one vendor','World Wide Web boundary');
must(docs,'OpenAI does not own Magnanimous memory or identity','OpenAI identity boundary');
must(docs,'guarded computer use','OpenAI computer-use documentation');

if(failures.length){console.error(`Ecosystem absorption lock failed (${failures.length}):`);for(const failure of failures)console.error(`- ${failure}`);process.exit(1)}
console.log('Magnanimous Ecosystem absorption lock: PASS');
console.log('AT&T, T-Mobile/Metro, Verizon, DSers, GitHub, Porkbun, World Wide Web and ChatGPT/OpenAI remain replaceable capabilities beneath Magnanimous AI with spend/provisioning/destructive locks intact.');
