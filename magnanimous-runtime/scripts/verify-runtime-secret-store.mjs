import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

import { stageRuntimeSecrets, loadRuntimeSecrets } from '../src/runtime-secret-store.mjs';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'magnanimous-runtime-secrets-'));
const target=path.join(root,'runtime.json');
const previous=process.env.INTEGRATION_CREDENTIALS_KEY;

try{
  const staged=await stageRuntimeSecrets({
    INTEGRATION_CREDENTIALS_KEY:'verification-integration-key-2026',
    TWILIO_ACCOUNT_SID:'AC-verification'
  },{root,targetPath:target});

  assert.equal(staged.ok,true);
  assert.equal(staged.count,2);
  assert.deepEqual(staged.keys,['INTEGRATION_CREDENTIALS_KEY','TWILIO_ACCOUNT_SID']);
  const stat=await fs.stat(target);
  assert.equal(stat.mode & 0o777,0o600);

  process.env.INTEGRATION_CREDENTIALS_KEY='stale-value';
  const loaded=await loadRuntimeSecrets({file:target,override:true});
  assert.equal(loaded.loaded,true);
  assert.equal(loaded.count,2);
  assert.equal(process.env.INTEGRATION_CREDENTIALS_KEY,'verification-integration-key-2026');
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
  delete process.env.TWILIO_ACCOUNT_SID;
  await fs.rm(root,{recursive:true,force:true});
}
