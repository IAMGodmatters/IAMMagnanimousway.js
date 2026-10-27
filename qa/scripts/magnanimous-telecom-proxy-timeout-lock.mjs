import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {unauthenticatedTelecomRead,telecomReadProxyTimeoutMs} from '../../worker/src/magnanimous-telecom-edge-guard.js';

const host='https://iammagnanimousway.com';
const request=(path,method='GET',auth='')=>new Request(host+path,{
  method,headers:auth?{authorization:auth}:{}
});
const telecomPaths=['/api/telecom','/api/telecom/overview','/api/telecom/charging/overview'];
for(const path of telecomPaths){
  assert.equal(unauthenticatedTelecomRead(request(path)),true,`${path} anonymous read must fail fast`);
  assert.equal(unauthenticatedTelecomRead(request(path,'HEAD')),true,`${path} anonymous HEAD must fail fast`);
  assert.equal(unauthenticatedTelecomRead(request(path,'GET','Bearer ms1_example')),false,`${path} session must reach auth`);
  assert.equal(telecomReadProxyTimeoutMs(request(path)),12000,`${path} GET proxy header timeout`);
  assert.equal(telecomReadProxyTimeoutMs(request(path,'HEAD')),12000,`${path} HEAD proxy header timeout`);
  for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS']){
    assert.equal(unauthenticatedTelecomRead(request(path,method)),false,`${method} must keep existing routing`);
    assert.equal(telecomReadProxyTimeoutMs(request(path,method)),0,`${method} cannot acquire a retryable proxy timeout`);
  }
}
for(const path of ['/health','/api/telecommunications','/api/telecomx','/api/auth/me','/api/magnanimous/dev-agent/repo-index']){
  assert.equal(unauthenticatedTelecomRead(request(path)),false,`${path} must not be blocked`);
  assert.equal(telecomReadProxyTimeoutMs(request(path)),0,`${path} must not receive timeout`);
}

const entrypoint=readFileSync(new URL('../../worker/src/security-entrypoint.js',import.meta.url),'utf8');
const guardLocation=entrypoint.indexOf('if(unauthenticatedTelecomRead(request))');
const proxyLocation=entrypoint.indexOf('const standaloneApiResponse=await proxyApiToStandalone(request,env)');
assert.ok(guardLocation>0&&proxyLocation>guardLocation,'anonymous Telecom guard must run before proxy');
assert.ok(entrypoint.includes('if(telecomTimeoutMs)init.signal=AbortSignal.timeout(telecomTimeoutMs)'),
  'Telecom standalone read timeout must be bounded with AbortSignal');
assert.ok(entrypoint.includes("Sign in to Magnanimous Telecom."),'Native Telecom sign-in semantics must be preserved');
console.log('PASS: Telecom anonymous read guard and read-only proxy fallback bounded; mutations and unrelated APIs unchanged.');
