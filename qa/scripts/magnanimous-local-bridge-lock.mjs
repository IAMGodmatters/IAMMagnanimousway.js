import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {LOCAL_BRIDGE_ACTIONS,LOCAL_BRIDGE_POLICY} from '../../worker/src/magnanimous-local-bridge-runtime.js';
import {buildMagnanimousOgenicPlan} from '../../worker/src/magnanimous-ogenic-god-toolkit.js';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(repoRoot,p),'utf8');
const runtime=read('worker/src/magnanimous-local-bridge-runtime.js');
const agent=read('local-bridge/bridge_agent.py');
const installer=read('local-bridge/install.ps1');
const migration=read('worker/migrations/0074_magnanimous_local_bridge.sql');
const progress=read('worker/src/progress-entrypoint.js');
const provider=read('worker/src/provider-entrypoint.js');
const page=read('frontend/app/local-bridge/page.tsx');
const robots=read('frontend/public/robots.txt');

assert.equal(LOCAL_BRIDGE_POLICY.transport,'outbound-polling-over-https');
assert.equal(LOCAL_BRIDGE_POLICY.inbound_listener_required,false);
assert.equal(LOCAL_BRIDGE_POLICY.raw_shell_exposed,false);
assert.equal(LOCAL_BRIDGE_POLICY.arbitrary_process_execution,false);
assert.equal(LOCAL_BRIDGE_POLICY.workspace_roots_required,true);
assert.equal(LOCAL_BRIDGE_POLICY.netwalk_read_only,true);
assert.equal(LOCAL_BRIDGE_POLICY.netwalk_scope_authorization_required,true);
assert.equal(LOCAL_BRIDGE_ACTIONS.apply_patch.confirmation,true);
assert.equal(LOCAL_BRIDGE_ACTIONS.git_commit.confirmation,true);
assert.equal(LOCAL_BRIDGE_ACTIONS.git_create_branch.confirmation,true);
assert.equal(LOCAL_BRIDGE_ACTIONS.health.auto,true);
assert.equal(LOCAL_BRIDGE_ACTIONS.system_info.auto,true);
assert(!Object.hasOwn(LOCAL_BRIDGE_ACTIONS,'shell'));
assert(!Object.hasOwn(LOCAL_BRIDGE_ACTIONS,'process_run'));

for(const needle of [
 "code_hash TEXT NOT NULL UNIQUE",
 "token_hash TEXT NOT NULL UNIQUE",
 "Pairing code is invalid, expired, or already used.",
 "requirePlatformOwner",
 "currentUser",
 "Bridge ",
 "Recorded owner authorization is required for this Netwalk action.",
 "No local mutation has executed. Confirm this exact task separately.",
 "hasReadyLocalBridge",
 "findReadyLocalBridgeDevice"
]) assert(runtime.includes(needle),`runtime contract missing: ${needle}`);

for(const needle of [
 "shell=False",
 "outside the bridge allowlisted roots",
 'branch in {"main","master",""}',
 "git apply --check",
 "Core-Dv1 / Netwalk toolkit is not configured",
 "The Netwalk tool itself enforces scope.json authorization",
 "MAX_OUTPUT"
]) assert(agent.includes(needle),`agent safety contract missing: ${needle}`);

assert(!agent.includes('shell=True'),'local agent must not enable shell execution');
assert(!agent.includes('subprocess.Popen('),'local agent must not expose unsupervised background process spawning');
assert(installer.includes('New-ScheduledTaskAction'),'Windows installer should create the outbound bridge startup task');
assert(installer.includes('No inbound port was opened.'),'installer must state the inbound-listener boundary');
assert(migration.includes('magnanimous_local_bridge_devices'));
assert(migration.includes('magnanimous_local_bridge_tasks'));
assert(progress.includes('handleMagnanimousLocalBridge'),'secured runtime must route local bridge endpoints');
assert(provider.includes('hasAnyReadyLocalBridge'),'public health must use actual heartbeat state');
assert(page.includes('CREATE PAIRING CODE'));
assert(page.includes('LOCAL BRIDGE REQUIRED'));
assert(robots.includes('Disallow: /local-bridge/'));

const local=buildMagnanimousOgenicPlan('Check my local computer health',{MAGNANIMOUS_LOCAL_BRIDGE_READY:true});
assert.equal(local.classification,'LOCAL');
assert.equal(local.status,'READY_LOCAL');

const missing=buildMagnanimousOgenicPlan('Check my local computer health',{});
assert.equal(missing.status,'LOCAL_BRIDGE_REQUIRED');

const netwalk=buildMagnanimousOgenicPlan('Use netwalk to survey this LAN',{MAGNANIMOUS_LOCAL_BRIDGE_READY:true});
assert.equal(netwalk.status,'READY_LOCAL');
assert.equal(netwalk.netwalk?.mode,'read-only-network-survey');

console.log('Magnanimous Local Bridge lock passed.');
