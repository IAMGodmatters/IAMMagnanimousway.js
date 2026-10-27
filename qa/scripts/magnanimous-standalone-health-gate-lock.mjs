import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  resetStandaloneHealthGateForTest,
  standaloneApiReady,
} from '../../worker/src/magnanimous-standalone-health-gate.js';

const ORIGIN = 'https://magnanimous-production.up.railway.app';
let now = 1_000;
const calls = [];
let healthy = false;
const fetcher = async (url, options) => {
  calls.push({ url, options });
  return new Response(healthy ? '{"status":"ok"}' : '{"status":"error"}', {
    status: healthy ? 200 : 404,
    headers: { 'content-type': 'application/json' },
  });
};
const clock = () => now;

resetStandaloneHealthGateForTest();
const dead = await Promise.all(Array.from({ length: 8 }, () => standaloneApiReady(ORIGIN, { fetcher, clock })));
assert.deepEqual(dead, Array(8).fill(false), 'missing Railway app must never be treated as ready');
assert.equal(calls.length, 1, 'simultaneous requests must share a single health probe');
assert.equal(calls[0].url, `${ORIGIN}/health`);
assert.equal(calls[0].options.method, 'GET');
assert.equal(calls[0].options.redirect, 'manual');
assert.equal(calls[0].options.headers['x-magnanimous-standalone-proxy'], '1');
assert.equal(calls[0].options.body, undefined, 'health preflight must not transmit customer payloads');
assert.ok(calls[0].options.signal instanceof AbortSignal, 'the health check must have a deadline');
assert.equal(await standaloneApiReady(ORIGIN, { fetcher, clock }), false);
assert.equal(calls.length, 1, 'failed readiness must be cached briefly to avoid request storms');

healthy = true;
now += 45_001;
assert.equal(await standaloneApiReady(ORIGIN, { fetcher, clock }), true, 'recovered runtime must be discoverable');
assert.equal(calls.length, 2);
assert.equal(await standaloneApiReady(ORIGIN, { fetcher, clock }), true);
assert.equal(calls.length, 2, 'healthy readiness must also be cached');

resetStandaloneHealthGateForTest();
assert.equal(
  await standaloneApiReady(ORIGIN, { fetcher: async () => { throw new Error('timeout'); }, clock }),
  false,
  'timeouts must fall back to native Worker capabilities',
);
assert.equal(await standaloneApiReady('', { fetcher, clock }), false);

for(const [caseName,payload,contentType] of [
 ['HTML 200 provider page','<html>Not Magnanimous</html>','text/html'],
 ['JSON 200 unhealthy','{"status":"error"}','application/json'],
 ['JSON 200 other service','{"status":"ok","service":"unrelated"}','application/json'],
 ['JSON 200 malformed','not JSON','application/json']
]){
 resetStandaloneHealthGateForTest();
 assert.equal(await standaloneApiReady(ORIGIN,{
  fetcher:async()=>new Response(payload,{status:200,headers:{'content-type':contentType}}),clock
 }),false,caseName+' must not send any customer traffic to standby');
}


const entrypoint = readFileSync(new URL('../../worker/src/security-entrypoint.js', import.meta.url), 'utf8');
const gate = entrypoint.indexOf('if(!await standaloneApiReady(origin))return null;');
const proxy = entrypoint.indexOf('const target=new URL(url.pathname+url.search,origin);');
assert.ok(gate >= 0 && proxy > gate, 'standalone readiness must precede forwarding any request');
assert.ok(entrypoint.includes('if(!origin||origin===url.origin)return null;'), 'canonical self-proxy must be rejected');
assert.ok(entrypoint.includes("if(!['GET','HEAD'].includes(request.method))init.body=request.body;"), 'customer writes must not be replayed by preflight');

console.log('PASS: bounded, coalesced Railway readiness gate protects native API fallback and customer payloads');
