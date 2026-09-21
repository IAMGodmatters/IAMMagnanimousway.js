import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const runtime=read('worker/src/magnanimous-native-web-runtime.js');
const bridge=read('worker/src/magnanimous-local-bridge-runtime.js');
const agent=read('local-bridge/bridge_agent.py');
const installer=read('local-bridge/install.ps1');
const operations=read('worker/src/operations-entrypoint.js');
const provider=read('worker/src/provider-entrypoint.js');
const universal=read('worker/src/magnanimous-universal-capabilities.js');
const migration=read('worker/migrations/0077_magnanimous_native_web.sql');
const ownerPage=read('frontend/app/owner-web-agent/page.tsx');
const ownerLayout=read('frontend/app/owner-web-agent/layout.tsx');
const localPage=read('frontend/app/local-bridge/page.tsx');
const ownerCenter=read('frontend/app/owner-center/page.tsx');
const docs=read('local-bridge/README.md');

for(const needle of [
 "browser_search:{risk:'low',auto:true,confirmation:false",
 "browser_fetch:{risk:'low',auto:true,confirmation:false",
 "browser_fetch_batch:{risk:'low',auto:true,confirmation:false",
 "browser_research:{risk:'low',auto:true,confirmation:false",
 "browser_read_flow:{risk:'low',auto:true,confirmation:false",
 "browser_action_flow:{risk:'high',auto:false,confirmation:true",
 "browser_profile_setup:{risk:'medium',auto:false,confirmation:true",
 "browser_profile_delete:{risk:'high',auto:false,confirmation:true",
 "browser_session_start:{risk:'low',auto:true,confirmation:false",
 "browser_session_read:{risk:'low',auto:true,confirmation:false",
 "browser_session_action:{risk:'high',auto:false,confirmation:true",
 "browser_session_end:{risk:'low',auto:true,confirmation:false",
 "browser_secret_fill_from_remote_task:false",
 "browser_private_network_targets:false",
 "browser_profiles_local_only:true",
 "browser_proxy_credentials_local_only:true",
 "native_webhooks_https_only:true",
 "queueLocalBridgeTask",
 "localBridgeTask",
 "hasAnyReadyLocalBridgeCapability"
])assert(bridge.includes(needle),'Local Bridge native web contract missing: '+needle);

for(const needle of [
 'from playwright.sync_api import sync_playwright',
 'launch_persistent_context',
 'browser_search',
 'browser_fetch',
 'browser_fetch_batch',
 'browser_research',
 'browser_read_flow',
 'browser_action_flow',
 'browser_profile_list',
 'browser_profile_setup',
 'browser_profile_create',
 'browser_profile_delete',
 'browser_session_start',
 'browser_session_read',
 'browser_session_action',
 'browser_session_end',
 'Local/private browser targets are blocked',
 'Password/secret fields cannot be filled from a remote task',
 'BROWSER_DIR = APP_DIR / "browser-profiles"',
 'provider_dependency": False',
 '"extract_elements"',
 'Screenshot exceeds the safe bridge result size.'
])assert(agent.includes(needle),'Native browser agent contract missing: '+needle);

assert(!agent.includes('shell=True'),'native browser must not reopen a generic shell surface');
assert(!agent.includes('subprocess.Popen('),'native browser must not add unsupervised process spawning');
assert(installer.includes('"playwright==1.63.0"'),'Local Bridge installer must pin the researched Playwright release');
assert(installer.includes('-m playwright install chromium'),'Local Bridge installer must install Chromium');
assert(installer.includes('will continue without native browser automation'),'browser setup failure must preserve existing Local Bridge capability');

for(const needle of [
 "tinyfish_required:false",
 "external_web_agent_required:false",
 "architecture:'native-first-local-browser'",
 "'/api/magnanimous/native-web/capabilities'",
 "'/api/magnanimous/native-web/runs'",
 "'/api/magnanimous/native-web/research'",
 "'/api/magnanimous/native-web/fetch-batch'",
 "'/api/magnanimous/native-web/runs/batch'",
 "'/api/magnanimous/native-web/parity'",
 "'/api/magnanimous/native-web/usage'",
 "'/api/magnanimous/native-web/sessions'",
 "'/api/magnanimous/native-web/profiles'",
 "'/api/magnanimous/native-web/monitors'",
 "Math.max(15",
 "requirePlatformOwner",
 "scheduledNativeWeb",
 "'/api/magnanimous/native-web/goals'",
 "planBrowserGoal",
 "MAGNANIMOUS_WEB_PARITY",
 "blocking_sync_endpoint:false",
 "dedicated_native_web_cli:false",
 "remote_cdp_exposed:false",
 "owned_geo_proxy_fleet:false",
 "third_party_wallet_required:false",
 "tinyfish_runtime_dependency:false",
 "sseRun",
 "Maximum 30 steps",
 "'/api/magnanimous/native-web/runs'"
])assert(runtime.includes(needle),'Magnanimous Native Web runtime contract missing: '+needle);

assert(!runtime.includes("from './tinyfish"),'Magnanimous Native Web must not import TinyFish as a required runtime');
assert(!runtime.includes('sync_contract:true'),'Native Web must not falsely claim a blocking sync endpoint');
assert(!runtime.includes('owned_geo_proxy_fleet:true'),'Native Web must not falsely claim an owned geo/residential proxy fleet');
assert(!runtime.includes('remote_cdp_exposed:true'),'Native Web must not falsely claim a remote CDP tunnel');
assert(agent.includes('Remote browser tasks may not carry proxy credentials'),'authenticated proxy credentials must remain local');
assert(bridge.includes('deliverNativeWebWebhook'),'native browser completion webhook delivery must remain wired through the Local Bridge result path');
assert(agent.includes('Browser session is not active on this bridge.'),'persistent session lifecycle must fail truthfully after bridge/session loss');
assert(operations.includes('handleMagnanimousNativeWeb'),'secured operations runtime must mount Native Web endpoints');
assert(operations.includes('scheduledNativeWeb'),'platform cron must run native web monitors');
assert(migration.includes('CREATE TABLE IF NOT EXISTS magnanimous_web_monitors'),'native web monitor migration missing');

for(const needle of [
 'native_web_agent:true',
 'tinyfish_required:false',
 "hasAnyReadyLocalBridgeCapability(env,'browser_fetch')",
 'native_web_runtime:true',
 'native_browser_ready:nativeBrowserReady'
])assert(provider.includes(needle),'Magnanimous capability reporting missing: '+needle);

for(const needle of [
 'browser-search',
 'rendered-page-extraction',
 'structured-web-extraction',
 'persistent-browser-profiles',
 'scheduled-web-monitoring',
 'batch-web-fetch',
 'source-backed-web-research',
 'persistent-browser-sessions',
 'native-web-completion-webhooks',
 'native-local-browser',
 'Magnanimous-owned Local Bridge + local Chromium'
])assert(universal.includes(needle),'Universal native browser capability missing: '+needle);

assert(ownerPage.includes('Native Web Agent'),'owner Native Web dashboard missing');
assert(ownerPage.includes('/api/magnanimous/native-web/capabilities'),'owner dashboard must read native capability truth');
assert(ownerPage.includes('TinyFish required:'),'owner dashboard must expose dependency truth');
assert(ownerPage.includes('/api/magnanimous/native-web/goals'),'owner dashboard must expose plain-English browser goals');
assert(ownerLayout.includes('index:false')&&ownerLayout.includes('follow:false'),'owner Native Web dashboard must be noindex/nofollow');
assert(localPage.includes('NATIVE BROWSER UPDATE NEEDED'),'Local Bridge page must show browser-upgrade state');
assert(ownerCenter.includes('/owner-web-agent'),'Owner Center must link Native Web Agent');
assert(docs.includes('Magnanimous Native Browser'),'Local Bridge documentation must explain native browser capability');
assert(docs.includes('does not silently replace its local executable'),'existing Local Bridge upgrade requirement must remain explicit');

console.log('Magnanimous Native Web lock passed — native Chromium browser capability is provider-independent, governed, local-profile based, and TinyFish is optional.');
