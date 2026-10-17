import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const runtime=read('worker/src/magnanimous-local-bridge-artifact-runtime.js');
const progress=read('worker/src/progress-entrypoint.js');
const page=read('frontend/app/local-bridge/page.tsx');
const migration=read('worker/migrations/0106_local_bridge_private_artifacts.sql');
const workflow=read('.github/workflows/local-bridge-private-artifacts.yml');

for(const needle of [
  "x-magnanimous-pairing-code",
  "used_at IS NULL",
  "expires_at>=?",
  "requirePlatformOwner",
  "currentUser",
  "magnanimous_local_bridge_artifacts",
  "metadata')==='1'",
  "cache-control':'no-store, private'",
  "x-magnanimous-artifact-sha256",
  "install.ps1",
  "uninstall.ps1",
  "bridge_agent.py",
  "ncs2_edge.py"
]) assert(runtime.includes(needle),`private artifact runtime missing: ${needle}`);

assert(progress.includes("handleMagnanimousLocalBridgeArtifact"),'secured Worker entrypoint must import the private artifact handler');
assert(progress.indexOf('handleMagnanimousLocalBridgeArtifact(request,env)') < progress.indexOf('handleMagnanimousLocalBridge(request,env)'),'private artifact route must be handled before the general Local Bridge runtime');

const rawRepo='raw.githubusercontent.com/IAMGodmatters/IAMMagnanimousway.js';
assert(!page.includes(rawRepo),'Local Bridge page must not generate public raw GitHub downloads');
for(const needle of [
  '/api/magnanimous/local-bridge/artifacts/install.ps1',
  '/api/magnanimous/local-bridge/artifacts/uninstall.ps1',
  'X-Magnanimous-Pairing-Code'
]) assert(page.includes(needle),`Local Bridge page private-delivery contract missing: ${needle}`);

assert(migration.includes('CREATE TABLE IF NOT EXISTS magnanimous_local_bridge_artifacts'));
assert(migration.includes('content_base64 TEXT NOT NULL'));
assert(migration.includes('sha256 TEXT NOT NULL'));
assert(migration.includes('byte_length INTEGER NOT NULL'));

for(const needle of [
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'iam-magnanimous-db',
  'install.ps1',
  'uninstall.ps1',
  'bridge_agent.py',
  'ncs2_edge.py',
  "assert raw_prefix not in text",
  '/api/magnanimous/local-bridge/artifacts/bridge_agent.py',
  '/api/magnanimous/local-bridge/artifacts/ncs2_edge.py',
  'X-Magnanimous-Pairing-Code',
  'Get-FileHash -Path $agent -Algorithm SHA256',
  'Private Local Bridge artifacts published and verified in D1.'
]) assert(workflow.includes(needle),`artifact sync workflow missing: ${needle}`);

console.log('Private Local Bridge artifact distribution lock passed.');
