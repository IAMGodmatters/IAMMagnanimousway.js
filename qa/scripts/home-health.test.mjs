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

// Guard the production edge routing rule as well as the frontend health display.
// This endpoint must stay fast even when the database or provider vault is down.
test('public tools serve ahead of mutable Worker bootstrap and retain one shared catalog',async()=>{
 const fs=await import('node:fs');
 const security=fs.readFileSync(new URL('../../worker/src/security-entrypoint.js',import.meta.url),'utf8');
 const provider=fs.readFileSync(new URL('../../worker/src/provider-entrypoint.js',import.meta.url),'utf8');
 const toolsModule=await import('../../worker/src/public-tool-catalog.js');
 assert.equal(security.includes("import { PUBLIC_TOOLS } from './public-tool-catalog.js'"),true);
 assert.equal(provider.includes("import { PUBLIC_TOOLS as TOOLS } from './public-tool-catalog.js'"),true);
 const early=security.indexOf("outerUrl.pathname==='/api/tools'");
 const routed=security.indexOf('const standaloneApiResponse=await proxyApiToStandalone(request,env)');
 assert(early>0 && early<routed,'tools must be served before proxy/DB bootstrap');
 assert(Array.isArray(toolsModule.PUBLIC_TOOLS) && toolsModule.PUBLIC_TOOLS.length>=15);
 const ids=toolsModule.PUBLIC_TOOLS.map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length);
 assert(ids.includes('magnanimous')&&ids.includes('ai-chat')&&ids.includes('native-web'));
});

test('both public health aliases bypass DB and provider bootstrap',async()=>{
 const fs=await import('node:fs');
 const security=fs.readFileSync(new URL('../../worker/src/security-entrypoint.js',import.meta.url),'utf8');
 const health=security.indexOf("outerUrl.pathname==='/health'||outerUrl.pathname==='/api/health'");
 const proxy=security.indexOf('const standaloneApiResponse=await proxyApiToStandalone(request,env)');
 assert(health>0&&health<proxy,'both health routes must bypass the standalone proxy and database bootstrap');
 assert(security.includes("database_bootstrap:'bypassed-for-health'"),'health must truthfully report deferred database bootstrap');
});
