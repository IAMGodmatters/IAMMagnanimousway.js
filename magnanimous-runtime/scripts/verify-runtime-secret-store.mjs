import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

import { stageRuntimeSecrets, loadRuntimeSecrets } from '../src/runtime-secret-store.mjs';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'magnanimous-runtime-secrets-'));
const target=path.join(root,'runtime.json');
const previous=process.env.INTEGRATION_CREDENTIALS_KEY;
const previousCloudflareToken=process.env.CLOUDFLARE_API_TOKEN;
const previousCloudflareAccount=process.env.CLOUDFLARE_ACCOUNT_ID;
const previousBridgeToken=process.env.MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN;
const previousBridgeUrl=process.env.MAGNANIMOUS_EDGE_AI_BRIDGE_URL;

try{
  const staged=await stageRuntimeSecrets({
    INTEGRATION_CREDENTIALS_KEY:'verification-integration-key-2026',
    CLOUDFLARE_API_TOKEN:'verification-cloudflare-token-2026',
    CLOUDFLARE_ACCOUNT_ID:'verification-cloudflare-account-2026',
    MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN:'verification-edge-bridge-token-2026',
    MAGNANIMOUS_EDGE_AI_BRIDGE_URL:'https://iammagnanimousway.com/api/internal/edge-ai/run',
    TWILIO_ACCOUNT_SID:'AC-verification'
  },{root,targetPath:target});

  assert.equal(staged.ok,true);
  assert.equal(staged.count,6);
  assert.deepEqual(staged.keys,['CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_API_TOKEN','INTEGRATION_CREDENTIALS_KEY','MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN','MAGNANIMOUS_EDGE_AI_BRIDGE_URL','TWILIO_ACCOUNT_SID']);
  const stat=await fs.stat(target);
  assert.equal(stat.mode & 0o777,0o600);

  process.env.INTEGRATION_CREDENTIALS_KEY='stale-value';
  const loaded=await loadRuntimeSecrets({file:target,override:true});
  assert.equal(loaded.loaded,true);
  assert.equal(loaded.count,6);
  assert.equal(process.env.INTEGRATION_CREDENTIALS_KEY,'verification-integration-key-2026');
  assert.equal(process.env.CLOUDFLARE_API_TOKEN,'verification-cloudflare-token-2026');
  assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,'verification-cloudflare-account-2026');
  assert.equal(process.env.MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN,'verification-edge-bridge-token-2026');
  assert.equal(process.env.MAGNANIMOUS_EDGE_AI_BRIDGE_URL,'https://iammagnanimousway.com/api/internal/edge-ai/run');
  assert.equal(process.env.TWILIO_ACCOUNT_SID,'AC-verification');

  await assert.rejects(
    ()=>stageRuntimeSecrets({NOT_ALLOWED:'x'},{root,targetPath:target}),
    /not allowed/
  );
  await assert.rejects(
    ()=>stageRuntimeSecrets({INTEGRATION_CREDENTIALS_KEY:'x'},{root,targetPath:path.join(root,'..','escape.json')}),
    /inside the configured secret root/
  );

  console.log('Magnanimous runtime secret continuity verification PASS');
} finally {
  if(previous===undefined)delete process.env.INTEGRATION_CREDENTIALS_KEY;
  else process.env.INTEGRATION_CREDENTIALS_KEY=previous;
  if(previousCloudflareToken===undefined)delete process.env.CLOUDFLARE_API_TOKEN;
  else process.env.CLOUDFLARE_API_TOKEN=previousCloudflareToken;
  if(previousCloudflareAccount===undefined)delete process.env.CLOUDFLARE_ACCOUNT_ID;
  else process.env.CLOUDFLARE_ACCOUNT_ID=previousCloudflareAccount;
  if(previousBridgeToken===undefined)delete process.env.MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN;
  else process.env.MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN=previousBridgeToken;
  if(previousBridgeUrl===undefined)delete process.env.MAGNANIMOUS_EDGE_AI_BRIDGE_URL;
  else process.env.MAGNANIMOUS_EDGE_AI_BRIDGE_URL=previousBridgeUrl;
  delete process.env.TWILIO_ACCOUNT_SID;
  await fs.rm(root,{recursive:true,force:true});
}
