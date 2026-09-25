import assert from 'node:assert/strict';
import { MagnanimousAiBinding } from '../src/ai-binding.mjs';

const originalFetch=globalThis.fetch;

async function testWorkerFreeFirst(){
  const calls=[];
  globalThis.fetch=async (url,init={})=>{
    calls.push({url:String(url),init});
    return new Response(JSON.stringify({output:'Free-first worker answer.'}),{
      status:200,headers:{'content-type':'application/json'}
    });
  };
  const binding=new MagnanimousAiBinding({
    PUBLIC_SITE_URL:'https://iammagnanimousway.com',
    RAILWAY_PUBLIC_DOMAIN:'magnanimous-production.up.railway.app',
    ENABLE_METERED_PROVIDERS:'false'
  });
  const result=await binding.run('legacy',{messages:[{role:'user',content:'Hello Magnanimous'}]});
  assert.equal(result.response,'Free-first worker answer.');
  assert.equal(result.provider,'magnanimous-worker-free-first');
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://iammagnanimousway.com/api/chat/compute');
  const body=JSON.parse(String(calls[0].init.body||'{}'));
  assert.equal(body.compute_only,true);
  assert.equal(body.allow_metered_accelerator,false);
  assert.equal(body.use_knowledge,false);
  assert.equal(body.use_tools,false);
  assert.match(body.message,/USER:\nHello Magnanimous/);
}

async function testMeteredDisabled(){
  const calls=[];
  globalThis.fetch=async (url)=>{
    calls.push(String(url));
    return new Response(JSON.stringify({detail:'temporary free rail failure'}),{
      status:503,headers:{'content-type':'application/json'}
    });
  };
  const binding=new MagnanimousAiBinding({
    PUBLIC_SITE_URL:'https://iammagnanimousway.com',
    RAILWAY_PUBLIC_DOMAIN:'magnanimous-production.up.railway.app',
    OPENAI_API_KEY:'must-not-be-used',
    ENABLE_METERED_PROVIDERS:'false'
  });
  await assert.rejects(
    ()=>binding.run('legacy',{prompt:'Do not spend money'}),
    /Metered OpenAI remains disabled/
  );
  assert.equal(calls.length,2);
  assert.ok(calls.every(url=>url.endsWith('/api/chat/compute')));
}

async function testExplicitMeteredFallback(){
  const calls=[];
  globalThis.fetch=async (url)=>{
    const target=String(url);calls.push(target);
    if(target.endsWith('/api/chat/compute')){
      return new Response(JSON.stringify({detail:'temporary free rail failure'}),{
        status:503,headers:{'content-type':'application/json'}
      });
    }
    if(target==='https://api.openai.com/v1/responses'){
      return new Response(JSON.stringify({output_text:'Explicit metered fallback answer.'}),{
        status:200,headers:{'content-type':'application/json'}
      });
    }
    throw new Error('unexpected URL '+target);
  };
  const binding=new MagnanimousAiBinding({
    PUBLIC_SITE_URL:'https://iammagnanimousway.com',
    RAILWAY_PUBLIC_DOMAIN:'magnanimous-production.up.railway.app',
    OPENAI_API_KEY:'test-key',
    ENABLE_METERED_PROVIDERS:'true'
  });
  const result=await binding.run('legacy',{prompt:'Allowed paid fallback'});
  assert.equal(result.response,'Explicit metered fallback answer.');
  assert.equal(result.provider,'magnanimous-metered-fallback');
  assert.deepEqual(calls,[
    'https://iammagnanimousway.com/api/chat/compute',
    'https://iammagnanimousway.com/api/chat/compute',
    'https://api.openai.com/v1/responses'
  ]);
}

async function testStandaloneRecursionGuard(){
  let called=false;
  globalThis.fetch=async ()=>{called=true;throw new Error('should not fetch')};
  const binding=new MagnanimousAiBinding({
    PUBLIC_SITE_URL:'https://magnanimous-production.up.railway.app',
    RAILWAY_PUBLIC_DOMAIN:'magnanimous-production.up.railway.app',
    ENABLE_METERED_PROVIDERS:'false'
  });
  await assert.rejects(()=>binding.run('legacy',{prompt:'No recursion'}),/resolves to the standalone service/);
  assert.equal(called,false);
}

try{
  await testWorkerFreeFirst();
  await testMeteredDisabled();
  await testExplicitMeteredFallback();
  await testStandaloneRecursionGuard();
  console.log('Magnanimous AI binding free-first compute fallback verification PASS');
}finally{
  globalThis.fetch=originalFetch;
}
