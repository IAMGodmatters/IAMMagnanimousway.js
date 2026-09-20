import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { openMagnanimousDb } from '../src/d1-compat.mjs';
import { applyMagnanimousMigrations } from '../src/migrations.mjs';
import { openMagnanimousObjectStore } from '../src/object-store.mjs';
import { openMagnanimousKvStore } from '../src/kv-cache.mjs';
import { openMagnanimousDurableWork } from '../src/durable-work.mjs';
import { openMagnanimousEventHub } from '../src/event-hub.mjs';
import { MagnanimousRateLimiter } from '../src/rate-limit.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'magnanimous-runtime-'));
const db = openMagnanimousDb(path.join(dir, 'test.sqlite'));

try {
  const result = applyMagnanimousMigrations(db, path.join(root, 'worker/migrations'));
  assert.ok(result.total > 50, 'expected full migration set, got ' + result.total);

  await db.prepare(
    'CREATE TABLE IF NOT EXISTS runtime_compat_test(' +
    'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
    'name TEXT NOT NULL)'
  ).run();

  const insert = await db
    .prepare('INSERT INTO runtime_compat_test(name) VALUES(?)')
    .bind('Magnanimous')
    .run();

  assert.equal(insert.success, true);
  assert.equal(insert.meta.changes, 1);

  const first = await db
    .prepare('SELECT id,name FROM runtime_compat_test WHERE name=?')
    .bind('Magnanimous')
    .first();

  assert.equal(first.name, 'Magnanimous');

  const all = await db
    .prepare('SELECT id,name FROM runtime_compat_test')
    .all();

  assert.equal(all.results.length, 1);

  await db.batch([
    db
      .prepare('UPDATE runtime_compat_test SET name=? WHERE id=?')
      .bind('Magnanimous AI', first.id),
    db
      .prepare('INSERT INTO runtime_compat_test(name) VALUES(?)')
      .bind('Magnanimous Runtime')
  ]);

  const count = await db
    .prepare('SELECT COUNT(*) count FROM runtime_compat_test')
    .first();

  assert.equal(Number(count.count), 2);

  const objects=openMagnanimousObjectStore(path.join(dir,'objects'));
  await objects.put('proof/hello.txt','Magnanimous',{customMetadata:{owner:'Magnanimous AI'}});
  const stored=await objects.get('proof/hello.txt');
  assert.equal(await stored.text(),'Magnanimous');
  assert.equal((await objects.list({prefix:'proof/'})).objects.length,1);
  await objects.delete('proof/hello.txt');
  assert.equal(await objects.get('proof/hello.txt'),null);

  const kv=openMagnanimousKvStore(db,'verify');
  await kv.put('identity',{name:'Magnanimous AI'},{metadata:{scope:'runtime'},expirationTtl:60});
  assert.deepEqual(await kv.get('identity','json'),{name:'Magnanimous AI'});
  const kvMeta=await kv.getWithMetadata('identity','json');
  assert.equal(kvMeta.metadata.scope,'runtime');

  const work=openMagnanimousDurableWork(db);
  const queued=await work.send({task:'verify'},{queue:'qa',idempotencyKey:'runtime-proof'});
  const claimed=await work.claim({queue:'qa',limit:1,consumer:'verify-runtime'});
  assert.equal(claimed.length,1);
  assert.equal(claimed[0].id,queued.id);
  await work.ack(queued.id);
  assert.equal((await work.stats('qa')).completed,1);

  const workflow=await work.startWorkflow('runtime-proof',{step:1},{idempotencyKey:'runtime-proof'});
  await work.checkpoint(workflow.id,{step:2});
  await work.complete(workflow.id,{ok:true});
  const workflowRow=await work.getWorkflow(workflow.id);
  assert.equal(workflowRow.status,'completed');
  assert.deepEqual(workflowRow.output,{ok:true});

  const events=openMagnanimousEventHub(db);
  const event=await events.publish('qa',{ok:true});
  const eventRows=await events.since('qa',event.id-1);
  assert.equal(eventRows.length,1);
  assert.deepEqual(eventRows[0].payload,{ok:true});

  const limiter=new MagnanimousRateLimiter();
  assert.equal(limiter.check('proof',{limit:1,windowMs:60000}).allowed,true);
  assert.equal(limiter.check('proof',{limit:1,windowMs:60000}).allowed,false);

  console.log(
    'Magnanimous standalone SQL compatibility verified across ' +
    result.total +
    ' migrations; object store, KV/cache, durable queue/workflows, event coordination and rate limiting verified.'
  );
} finally {
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
}
