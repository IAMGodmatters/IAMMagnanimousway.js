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

// Exercise the actual proxy function with a response whose headers arrive before
// its body fails. A 200 response must not escape the fallback boundary early.
const {runInNewContext}=await import('node:vm');
const {readTelecomProxyBody}=await import('../../worker/src/magnanimous-telecom-edge-guard.js');
const proxySource=entrypoint.slice(entrypoint.indexOf('async function proxyApiToStandalone('),entrypoint.indexOf('\nfunction credentialVaultPath('));
let bodyFailed=false;
const calls=[];
const context={URL,Headers,Response,AbortSignal,telecomReadProxyTimeoutMs,readTelecomProxyBody,
 configuredStandaloneApiOrigin:()=> 'https://runtime.example',standaloneApiReady:async()=>true,
 standaloneProviderUnavailable:async()=>false,console:{warn(){},error(){}},
 fetch:async(url,init)=>{
  calls.push({url,init});
  return new Response(new ReadableStream({start(controller){
   setTimeout(()=>{bodyFailed=true;controller.error(new DOMException('Body deadline expired','TimeoutError'));},10);
  }}),{headers:{'content-type':'application/json'}});
 }
};
const proxy=runInNewContext(proxySource+';proxyApiToStandalone',context);
assert.equal(await proxy(request('/api/telecom','GET','Bearer qa-session'),{}),null,'body timeout must select fallback');
assert.equal(bodyFailed,true,'proxy must await body before deciding success');
context.fetch=async(url,init)=>{calls.push({url,init});return Response.json({ok:true});};
for(const path of ['/api/auth/me','/api/billing/status','/api/customer/code-studio','/api/customer/code-studio/projects']){
 const response=await proxy(request(path,'GET','Bearer qa-session'),{});
 assert.equal(response.headers.get('x-magnanimous-data-plane'),'standalone');
 assert.equal(calls.at(-1).url,'https://runtime.example'+path);
 assert.equal(calls.at(-1).init.headers.get('authorization'),'Bearer qa-session');
}
const intact=await proxy(request('/api/telecom','GET','Bearer qa-session'),{});
assert.deepEqual(await intact.json(),{ok:true});
await assert.rejects(()=>readTelecomProxyBody(new Response('12345'),4),/safe buffer limit/);

// Execute the real early rejection branch, including its real CORS postflight.
const {securityPostflight}=await import('../../worker/src/security-hardening.js');
const earlySource=entrypoint.slice(guardLocation,proxyLocation);
const early=runInNewContext('(async(request,env)=>{'+earlySource+'})',{
 unauthenticatedTelecomRead,Response,securityPostflight,finalizeResponse:(_request,response)=>response
});
for(const [origin,allowed] of [['https://customer.example',true],['https://untrusted.example',false]]){
 const response=await early(new Request(host+'/api/telecom',{headers:{origin}}),{ALLOWED_ORIGINS:'https://customer.example'});
 assert.equal(response.status,401);
 assert.equal(response.headers.get('access-control-allow-origin'),allowed?origin:null);
}
console.log('PASS: actual proxy delayed-body fallback, buffer cap, shared customer data plane, and Telecom CORS rejection.');
