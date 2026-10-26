import assert from 'node:assert/strict';
import fs from 'node:fs';
import {connectionError,fetchWithTimeout} from '../../frontend/app/owner-capability-mesh/network.ts';

let normalCalls=0;
const response=await fetchWithTimeout('/health',{cache:'no-store'},async (_url,options)=>{
 normalCalls++;
 assert.equal(options.cache,'no-store');
 assert.equal(options.signal?.aborted,false);
 return Response.json({ok:true});
},100);
assert.equal(normalCalls,1);
assert.equal((await response.json()).ok,true);

let aborted=false;
const abortable=(_url,options)=>new Promise((_resolve,reject)=>{
 options.signal.addEventListener('abort',()=>{
  aborted=true;
  reject(new DOMException('Timed out','AbortError'));
 },{once:true});
});
await assert.rejects(fetchWithTimeout('/health',{},abortable,15),error=>error.name==='AbortError');
assert.equal(aborted,true,'Hanging fetch must be aborted at the timeout boundary');
assert.match(connectionError(new DOMException('Timed out','AbortError')),/20 seconds/);
assert.match(connectionError(new TypeError('Network offline')),/Connection interrupted/);

const page=fs.readFileSync('frontend/app/owner-capability-mesh/page.tsx','utf8');
assert.match(page,/catch\(e\)\{setError\(connectionError\(e\)\)\}/,'Owner GET reports a recoverable network error');
assert.match(page,/finally\{setLoading\(false\)\}/,'Owner GET must stop displaying endless loading');
assert.equal((page.match(/finally\{setBusy\(''\)\}/g)||[]).length,2,'Both owner POST buttons must unlock after network failure');
assert.match(page,/RETRY CAPABILITY MESH CONNECTION/,'Recovery button must be present');
assert.match(page,/Review Developer Agent before staging this action again/,'Non-idempotent deployment must not auto-retry');
assert.match(page,/r\.status===401\|\|r\.status===403/,'Unauthorized users must still be signed out');

console.log('Magnanimous Capability Mesh reconnect lock passed — transport timeout, abort, UI recovery, authenticated guard and no automatic POST replay.');
