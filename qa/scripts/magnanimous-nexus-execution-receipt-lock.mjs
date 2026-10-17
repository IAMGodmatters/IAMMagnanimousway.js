import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

import { openMagnanimousDb } from '../../magnanimous-runtime/src/d1-compat.mjs';
import { openMagnanimousDurableWork } from '../../magnanimous-runtime/src/durable-work.mjs';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'magnanimous-nexus-receipts-'));
const db=openMagnanimousDb(path.join(dir,'receipt-test.sqlite'));

try{
  const work=openMagnanimousDurableWork(db,{signingKey:'test-only-nexus-receipt-key'});

  const queued=await work.send({task:'nexus-research-proof'},{queue:'qa',idempotencyKey:'nexus-research-proof'});
  const claimed=await work.claim({queue:'qa',limit:1,consumer:'nexus-research-lock'});
  assert.equal(claimed.length,1);
  assert.equal(claimed[0].id,queued.id);
  await work.ack(queued.id);

  const workflow=await work.startWorkflow('nexus-workgraph-proof',{goal:'finish safely'},{idempotencyKey:'nexus-workgraph-proof'});
  await work.checkpoint(workflow.id,{stage:'verified'});
  await work.complete(workflow.id,{ok:true});

  const receipts=await work.listReceipts({limit:50});
  assert.ok(receipts.length>=6,'expected queue + workflow execution receipts');
  assert.ok(receipts.every(row=>row.chain_hash&&row.content_hash),'every receipt must be hash chained');
  assert.ok(receipts.every(row=>row.signature&&row.signature_algorithm==='HMAC-SHA-256'),'configured signing key must sign every receipt');

  const verification=await work.verifyReceiptChain();
  assert.equal(verification.ok,true);
  assert.equal(verification.chain_failures,0);
  assert.equal(verification.content_failures,0);
  assert.equal(verification.signature_failures,0);
  assert.equal(verification.signed,true);

  const first=db.db.prepare('SELECT id,detail_json FROM magnanimous_work_receipts ORDER BY id LIMIT 1').get();
  db.db.prepare('UPDATE magnanimous_work_receipts SET detail_json=? WHERE id=?').run('{"tampered":true}',first.id);
  const tampered=await work.verifyReceiptChain();
  assert.equal(tampered.ok,false,'tampering must invalidate the receipt ledger');
  assert.ok(tampered.content_failures>0||tampered.chain_failures>0,'tampering must be observable');

  console.log('Magnanimous Nexus research lock: durable jobs/workflows emit signed hash-chained receipts and tampering is detected.');
}finally{
  db.close();
  fs.rmSync(dir,{recursive:true,force:true});
}
