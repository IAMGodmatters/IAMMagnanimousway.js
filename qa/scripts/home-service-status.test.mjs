import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchHomeJson, homeCoreReachable, HOME_CORE_STATUS} from '../../frontend/lib/home-service-status.ts';

test('a catalog and healthy core do not claim universal readiness', () => {
 assert.equal(homeCoreReachable({status:'ok'}, {tools:[{id:'test'}]}), true);
 for (const catalog of [{}, {tools:[]}, {tools:'ready'}, null]) {
  assert.equal(homeCoreReachable({status:'ok'}, catalog), false);
 }
 assert.equal(homeCoreReachable({status:'down'}, {tools:[{}]}), false);
 assert.match(HOME_CORE_STATUS, /Individual services may require setup or sign-in/);
 assert.doesNotMatch(HOME_CORE_STATUS, /Systems ready/);
});

test('failed HTTP responses cannot report healthy even with a healthy-looking body', async () => {
 assert.deepEqual(await fetchHomeJson('/health', async () => new Response('{"status":"ok"}', {status:503})), {});
 assert.deepEqual(await fetchHomeJson('/health', async () => new Response('not json')), {});
 assert.deepEqual(await fetchHomeJson('/health', async () => new Response('null')), {});
 assert.deepEqual(await fetchHomeJson('/health', async () => new Response('[]')), {});
});

test('health probes bypass cache and abort stalled requests', async () => {
 let options;
 const result = await fetchHomeJson('/health', async (_, opts) => {
  options = opts;
  return new Promise((_, reject) => opts.signal.addEventListener('abort', () => reject(new Error('aborted')), {once:true}));
 }, 10);
 assert.deepEqual(result, {});
 assert.equal(options.cache, 'no-store');
 assert.equal(options.signal.aborted, true);
});

test('valid health payload is preserved', async () => {
 assert.deepEqual(await fetchHomeJson('/health', async () => new Response('{"status":"ok"}')), {status:'ok'});
});
