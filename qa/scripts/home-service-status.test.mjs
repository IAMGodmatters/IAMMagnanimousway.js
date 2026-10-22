import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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

test('public shells do not claim every service is operational', () => {
 for (const file of ['page.tsx', 'platform-chrome.tsx', 'login/page.tsx']) {
  const source = readFileSync(new URL('../../frontend/app/' + file, import.meta.url), 'utf8');
  assert.doesNotMatch(source, /All Systems Operational|Systems ready|AI SYSTEMS ACTIVE|NETWORK ACTIVE/, file);
  if (file === 'page.tsx') {
   assert.match(source, /setOnline\(homeCoreReachable\(health,t\)\)/);
   assert.equal(source.split('HOME_CORE_STATUS').length - 1, 3, 'desktop and mobile must use the scoped health message');
  }
 }
});
