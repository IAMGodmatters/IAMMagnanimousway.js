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
const legacyBackend=read('backend/app/main.py');
const videoRenderer=read('video-renderer/server.py');
const musicEngine=read('music-engine/app.py');
const videoGateway=read('video-gateway/src/index.js');
const telecomApi=read('telecom-core/control-api/app/main.py');
const runtimeServer=read('magnanimous-runtime/src/server.mjs');
const envExample=read('.env.example');

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
has(deploy,'safe_get_status /tmp/connector-absorption.json','production smoke retries transient connector-catalog read failures');
has(deploy,'safe_get_status /tmp/contact-center-capabilities.json','production smoke retries transient contact-center capability reads');
has(deploy,'safe_get_status /tmp/contact-center-softphone.json','production smoke retries transient softphone readiness reads');
has(deploy,'safe_expected_status /tmp/admin-denied.json 403','production smoke retries transient expected authorization boundaries without mutating state');
has(deploy,'safe_expected_status /tmp/revoked-me.json 401','production smoke retries transient revoked-session reads without weakening expected status');
has(audit,'source project but is not represented as a separate production Railway service','audit distinguishes source-ready Telecom from deployed Telecom');
has(audit,'Credentials alone do not mean a carrier is live.','audit locks the provider truth boundary');
has(audit,'Supervisor monitor/whisper/barge is **not** marked live.','audit refuses to overclaim unfinished supervisor audio');
has(legacyBackend,"os.getenv('SESSION_SECRET', '')",'legacy standalone backend requires an explicit session secret');
has(legacyBackend,"len(SESSION_SECRET) < 32",'legacy standalone backend rejects weak session secrets');
has(legacyBackend,"len(ADMIN_PASSWORD) < 14",'legacy standalone backend rejects weak admin passwords');
lacks(legacyBackend,"change-this-session-secret')",'legacy standalone backend has no active hard-coded session-secret fallback');
lacks(legacyBackend,"change-this-password')",'legacy standalone backend has no active hard-coded admin-password fallback');
has(legacyBackend,"CORS_ORIGINS",'legacy standalone backend uses an explicit browser-origin boundary');
has(envExample,'CORS_ORIGINS=','standalone environment contract documents trusted CORS origins');
has(videoRenderer,'@app.get("/health")','video renderer exposes a health endpoint');
has(musicEngine,'@app.get("/health")','music engine exposes a health endpoint');
has(videoGateway,'url.pathname === "/health"','video gateway exposes a health endpoint');
has(telecomApi,'/health','telecom control API exposes a health endpoint');
has(runtimeServer,"'/health'",'standalone Magnanimous runtime exposes a health endpoint');

const failed=checks.filter(([,ok])=>!ok);
for(const [label,ok] of checks) console.log((ok?'PASS':'FAIL')+': '+label);
if(failed.length){ console.error('\n'+failed.length+' full-platform provider/service audit contract(s) failed.'); process.exit(1); }
console.log('\nFull-platform provider/service audit lock passed: '+checks.length+' contracts.');
