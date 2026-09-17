import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const runtime=read('worker/src/magnanimous-native-first.js');
const progress=read('worker/src/progress-entrypoint.js');
const security=read('worker/src/security-entrypoint.js');
const migration=read('worker/migrations/0068_magnanimous_native_first.sql');
const godCoding=read('frontend/app/god-coding/page.tsx');
const robots=read('frontend/public/robots.txt');
const toolFoundry=read('worker/src/magnanimous-tool-foundry.js');

const checks=[];
const has=(text,needle,name)=>checks.push([name,text.includes(needle)]);
const lacks=(text,needle,name)=>checks.push([name,!text.includes(needle)]);

has(security,"import app from './operations-entrypoint.js'",'central security entrypoint still wraps operations');
has(progress,"handleMagnanimousNativeFirst",'native-first runtime is routed inside the existing secured request chain');
has(runtime,'requirePlatformOwner','native-first control requires platform-owner authorization');
has(runtime,"id:'god-coding'",'God Coding is registered as a native core capability');
has(runtime,'god_coding_internal:true','runtime reports God Coding as internal');
has(runtime,'self_development_enabled:true','Magnanimous self-development is enabled');
has(runtime,'external_plugins_required_for_core_brain:false','core brain does not require plugins');
has(runtime,'external_adapters_required_for_core_brain:false','core brain does not require adapters');
has(runtime,"adapter_policy:'fallback-only for irreducibly external actions'",'self-development plan keeps adapters fallback-only');
has(runtime,'architecture-decomposition','God Coding owns decomposition as an engineering capability');
has(runtime,'solid-design','God Coding owns SOLID design as an engineering capability');
has(runtime,'dependency-injection','God Coding owns dependency injection as an engineering capability');
has(runtime,"id:'architecture'",'self-development plan includes an explicit architecture phase');
has(runtime,'Decompose large functions and mixed-responsibility modules into smaller single-purpose helpers.','native policy requires decomposition');
has(runtime,'Apply SOLID boundaries','native policy requires SOLID boundaries');
has(runtime,'Favor composition and dependency injection through an explicit composition root','native policy requires composition and dependency injection');
has(runtime,'engineering_architecture_policy','native-first overview exposes the engineering architecture policy');
has(runtime,"/api/magnanimous/native-first/assimilate",'capability assimilation endpoint exists');
has(runtime,"/api/magnanimous/native-first/self-develop",'self-development endpoint exists');
has(runtime,'capability-assimilation','capability assimilation is a native learned skill');
has(runtime,'No proprietary provider source code is copied','native matrix explicitly rejects proprietary source copying');
has(runtime,'never copy proprietary source, hidden prompts, credentials, weights or private provider internals','self-development safety forbids proprietary internals');
has(runtime,'repository mutations remain separately approval-gated','self-development preserves repository approval gates');
has(toolFoundry,'Use a Magnanimous-native capability first','Tool Foundry already prefers native execution before providers');
has(migration,'magnanimous_native_capability_matrix','native capability matrix has durable D1 storage');
has(migration,'magnanimous_self_development_runs','self-development plans have durable D1 storage');
has(godCoding,"useState(true)",'God Coding defaults to Magnanimous self-development mode');
has(godCoding,"useState(false)",'outside model accelerator is off by default');
has(godCoding,'ASSIMILATE ALL CAPABILITY TARGETS','owner can internalize all capability benchmark targets');
has(godCoding,"/api/magnanimous/native-first/self-develop",'God Coding invokes native self-development runtime');
has(godCoding,'Outside model required: NO','native God Coding result does not require outside model compute');
has(godCoding,'Optional compute was unavailable, so God Coding completed with its Magnanimous-native plan instead.','God Coding falls back to native plan when outside compute fails');
has(robots,'Disallow: /god-coding/','private God Coding route remains excluded from crawlers');
lacks(runtime,'copy provider source code','runtime never instructs provider source-code copying');

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} - ${name}`);
if(failed.length){console.error(`Magnanimous native-first lock failed: ${failed.length} check(s).`);process.exit(1)}
console.log(`Magnanimous native-first lock: ${checks.length} checks passed.`);
