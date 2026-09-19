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
const uninstaller=read('local-bridge/uninstall.ps1');
const migration=read('worker/migrations/0074_magnanimous_local_bridge.sql');
const progress=read('worker/src/progress-entrypoint.js');
const provider=read('worker/src/provider-entrypoint.js');
const page=read('frontend/app/local-bridge/page.tsx');
const robots=read('frontend/public/robots.txt');
const deploy=read('.github/workflows/deploy.yml');

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
 "findReadyLocalBridgeDevice",
 "activation_task_id",
 "needs_confirmation",
 "Device revocation requires confirm=true.",
 "status='revoked'"
]) assert(runtime.includes(needle),`runtime contract missing: ${needle}`);

for(const needle of [
 "shell=False",
 "outside the bridge allowlisted roots",
 'branch in {"main","master",""}',
 "git apply --check",
 "Core-Dv1 / Netwalk toolkit is not configured",
 "The Netwalk tool itself enforces scope.json authorization",
 "MAX_OUTPUT",
 "authorization was revoked or expired"
]) assert(agent.includes(needle),`agent safety contract missing: ${needle}`);

assert(!agent.includes('shell=True'),'local agent must not enable shell execution');
assert(!agent.includes('subprocess.Popen('),'local agent must not expose unsupervised background process spawning');
assert(installer.includes('New-ScheduledTaskAction'),'Windows installer should create the outbound bridge startup task');
assert(installer.includes('Python.Python.3.13'),'Windows bootstrap should be able to install Python when missing');
assert(installer.includes('Git.Git'),'Windows bootstrap should optionally install Git when missing');
assert(installer.includes('MagnanimousWorkspace'),'Windows bootstrap should provide a safe default workspace');
assert(installer.includes('automatic health check'),'Windows bootstrap should explain activation verification');
assert(installer.includes('No inbound port was opened.'),'installer must state the inbound-listener boundary');
assert(uninstaller.includes('Unregister-ScheduledTask'),'Windows uninstall must remove the startup task');
assert(uninstaller.includes('Remove-Item -Path $homeDir -Recurse -Force'),'Windows uninstall must remove local bridge credentials/files');
assert(migration.includes('magnanimous_local_bridge_devices'));
assert(migration.includes('magnanimous_local_bridge_tasks'));
assert(progress.includes('handleMagnanimousLocalBridge'),'secured runtime must route local bridge endpoints');
assert(provider.includes('hasAnyReadyLocalBridge'),'public health must use actual heartbeat state');
assert(provider.includes("ogenicPlan.classification==='LOCAL'"),'chat must auto-initiate local OGENIC work when a bridge is available');
assert(provider.includes("ogenicPlan.classification==='HYBRID'"),'chat must auto-initiate hybrid OGENIC work when a bridge is available');
assert(page.includes('CREATE ACTIVATION'));
assert(page.includes('DOWNLOAD WINDOWS ACTIVATION FILE'));
assert(page.includes('READY LOCAL — VERIFIED'));
assert(page.includes('REVOKE DEVICE'));
assert(page.includes('LOCAL BRIDGE REQUIRED'));
assert(robots.includes('Disallow: /local-bridge/'));
assert(deploy.includes('Local Bridge customer isolation expected HTTP 403'),'production smoke must preserve platform-owner-only Local Bridge control');
assert(deploy.includes("assert d.get('local_bridge_runtime') is True"),'production smoke must verify Local Bridge runtime is live');
assert(deploy.includes("assert b.get('raw_shell') is False"),'production smoke must verify raw shell stays disabled');

const local=buildMagnanimousOgenicPlan('Check my local computer health',{MAGNANIMOUS_LOCAL_BRIDGE_READY:true});
assert.equal(local.classification,'LOCAL');
assert.equal(local.status,'READY_LOCAL');

const missing=buildMagnanimousOgenicPlan('Check my local computer health',{});
assert.equal(missing.status,'LOCAL_BRIDGE_REQUIRED');

const netwalk=buildMagnanimousOgenicPlan('Use netwalk to survey this LAN',{MAGNANIMOUS_LOCAL_BRIDGE_READY:true});
assert.equal(netwalk.status,'READY_LOCAL');
assert.equal(netwalk.netwalk?.mode,'read-only-network-survey');

console.log('Magnanimous Local Bridge lock passed.');
