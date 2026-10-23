import assert from 'node:assert/strict';
import {test} from 'node:test';
import {coreHomeServicesHealthy,fetchHomeJson} from '../../frontend/lib/home-health.ts';

test('homepage reports core service success only with both a healthy endpoint and a nonempty tool catalog',()=>{
 assert.equal(coreHomeServicesHealthy({status:'ok'},{tools:[{id:'a'}]}),true);
 assert.equal(coreHomeServicesHealthy({status:'error'},{tools:[{id:'a'}]}),false);
 assert.equal(coreHomeServicesHealthy({status:'ok'},{tools:[]}),false);
 assert.equal(coreHomeServicesHealthy({status:'ok'},{}),false);
});

test('homepage ignores unsuccessful HTTP JSON and bypasses caches',async()=>{
 const controller=new AbortController();
 let requestedOptions;
 const result=await fetchHomeJson('/api/tools',controller.signal,async(_url,options)=>{
  requestedOptions=options;
  return new Response(JSON.stringify({tools:[{id:'wrong'}]}),{status:503,headers:{'content-type':'application/json'}});
 });
 assert.deepEqual(result,{});
 assert.equal(requestedOptions.cache,'no-store');
 assert.equal(requestedOptions.signal,controller.signal);
});

test('homepage treats invalid JSON and aborted network requests as unavailable',async()=>{
 const controller=new AbortController();
 assert.deepEqual(await fetchHomeJson('/health',controller.signal,async()=>new Response('broken')) ,{});
 assert.deepEqual(await fetchHomeJson('/health',controller.signal,async()=>new Response('null',{headers:{'content-type':'application/json'}})),{});
 const pending=fetchHomeJson('/health',controller.signal,async(_url,options)=>new Promise((_resolve,reject)=>{
  options.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true});
 }));
 controller.abort();
 assert.deepEqual(await pending,{});
});
