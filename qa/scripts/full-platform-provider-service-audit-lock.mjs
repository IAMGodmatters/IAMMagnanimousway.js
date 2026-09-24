import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);
const checks=[];
const has=(source,text,label)=>checks.push([label,source.includes(text)]);
const lacks=(source,text,label)=>checks.push([label,!source.includes(text)]);
const file=(p,label)=>checks.push([label,exists(p)]);

for(const [p,label] of [
 ['magnanimous-runtime/Dockerfile','standalone Magnanimous runtime has a deployable image'],
 ['magnanimous-runtime/docker-compose.yml','standalone Magnanimous runtime has a local composition'],
 ['telecom-core/docker-compose.yml','standalone Telecom core has an owned service composition'],
 ['telecom-core/asterisk/Dockerfile','Telecom owns an Asterisk PBX image'],
 ['telecom-core/sip-core/Dockerfile','Telecom owns a SIP registrar image'],
 ['telecom-core/control-api/Dockerfile','Telecom owns a protected control API image'],
 ['music-engine/Dockerfile','music engine has a deployable service image'],
 ['video-renderer/Dockerfile','video renderer has a deployable service image'],
 ['video-gateway/package.json','video gateway has an independent runtime manifest'],
 ['worker/package.json','edge Worker has an independent runtime manifest'],
 ['local-bridge/README.md','Local Bridge documents its device-bound standalone runtime'],
 ['docs/FULL-PLATFORM-TELECOM-AUDIT-2026-09-24.md','full provider/service audit evidence is versioned']
]) file(p,label);

const entry=read('worker/src/entrypoint.js');
const contact=read('worker/src/contact-center-runtime.js');
const carrier=read('worker/src/magnanimous-carrier-core.js');
const network=read('worker/src/magnanimous-telecom-network-runtime.js');
const dialplan=read('telecom-core/asterisk/templates/extensions.conf.template');
const telecomEnv=read('telecom-core/.env.owned.example');
const networkUi=read('frontend/app/telecom/network/page.tsx');
const deploy=read('.github/workflows/deploy.yml');
const audit=read('docs/FULL-PLATFORM-TELECOM-AUDIT-2026-09-24.md');

has(entry,"import { handleContactCenter } from './contact-center-runtime.js';",'live Worker imports Contact Center');
has(entry,'env=await getProviderRuntimeEnv(env);','live Worker overlays protected Provider Vault credentials');
has(contact,"truth_boundary:'An upstream account is not counted as a live call route",'configured upstream accounts cannot masquerade as live routes');
has(contact,"native_pbx_target:'Asterisk WebRTC'",'agent phone keeps owned Asterisk WebRTC as native target');
has(contact,'async function queueBrowserAgents','inbound queue can ring registered browser agents');
has(carrier,"['balanced','least-cost','priority']",'carrier planner supports balanced, least-cost and priority routing');
has(carrier,"['down','unavailable','failed']",'carrier planner avoids unhealthy routes');
has(carrier,'quality_score','carrier planner carries an explicit quality signal');
has(carrier,'estimated_rate','carrier planner carries an explicit rate signal');
has(network,"architecture:'Magnanimous-owned PBX/SIP core with replaceable upstream interconnects'",'telecom network names the owned PBX/SIP boundary');
has(network,"preferred_upstream_candidate:{provider_key:'telnyx'",'Telnyx is a candidate rather than platform identity');
has(network,"secondary_upstream_candidate:{provider_key:'plivo'",'Plivo remains a replaceable secondary candidate');
has(network,"compatibility_upstream:{provider_key:'twilio'",'Twilio remains a compatibility transport');
has(telecomEnv,'CARRIER_SIP_SECONDARY_HOST=','standalone PBX documents an optional secondary SIP interconnect');
has(dialplan,'DIALSTATUS}"="CHANUNAVAIL','secondary interconnect handles network-unavailable failure');
has(dialplan,'DIALSTATUS}"="CONGESTION','secondary interconnect handles congestion failure');
lacks(dialplan,'DIALSTATUS}"="BUSY"]?secondary','a real busy result is not re-dialed through another carrier');
lacks(dialplan,'DIALSTATUS}"="NOANSWER"]?secondary','a real no-answer result is not re-dialed through another carrier');
has(networkUi,'Carrier Route Planner','owner UI can preview carrier routing');
has(networkUi,"<option value='least-cost'>",'owner UI exposes least-cost preview');
has(networkUi,"<option value='PH'>Philippines</option>",'carrier-access number search includes Philippines');
has(deploy,'/api/contact-center/capabilities','production deploy proves Contact Center is live after rollout');
has(deploy,'/api/contact-center/softphone/config','production deploy proves Softphone readiness contract after rollout');
has(audit,'source project but is not represented as a separate production Railway service','audit distinguishes source-ready Telecom from deployed Telecom');
has(audit,'Credentials alone do not mean a carrier is live.','audit locks the provider truth boundary');
has(audit,'Supervisor monitor/whisper/barge is **not** marked live.','audit refuses to overclaim unfinished supervisor audio');

const failed=checks.filter(([,ok])=>!ok);
for(const [label,ok] of checks) console.log((ok?'PASS':'FAIL')+': '+label);
if(failed.length){ console.error('\n'+failed.length+' full-platform provider/service audit contract(s) failed.'); process.exit(1); }
console.log('\nFull-platform provider/service audit lock passed: '+checks.length+' contracts.');
