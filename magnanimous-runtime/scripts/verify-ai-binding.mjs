import assert from 'node:assert/strict';
import { MagnanimousAiBinding } from '../src/ai-binding.mjs';

const originalFetch=globalThis.fetch;

async function workersAiFreeFirst(){
  const calls=[];
  globalThis.fetch=async(url,init={})=>{
    calls.push({url:String(url),init});
    return new Response(JSON.stringify({
      ok:true,
      response:'Magnanimous bridge works.'
    }),{status:200,headers:{'content-type':'application/json'}});
  };

  const binding=new MagnanimousAiBinding({
    MAGNANIMOUS_WORKERS_AI_BRIDGE_TOKEN:'test-bridge-token',
    MAGNANIMOUS_WORKERS_AI_BRIDGE_URL:'https://iammagnanimousway.com/api/internal/ai/run',
    CLOUDFLARE_PLATFORM_API_TOKEN:'must-not-win-while-bridge-ready',
    CLOUDFLARE_PLATFORM_ACCOUNT_ID:'must-not-win-account',
    CLOUDFLARE_API_TOKEN:'broad-deploy-token-must-never-be-used-for-inference',
    CLOUDFLARE_ACCOUNT_ID:'broad-account-must-never-be-used-for-inference',
    OPENAI_API_KEY:'must-not-be-used',
    ENABLE_METERED_PROVIDERS:'false'
  });

  const result=await binding.run('@cf/meta/llama-3.1-8b-instruct-fast',{
    messages:[{role:'user',content:'Say hello.'}],
    max_tokens:321
  });

  assert.equal(result.response,'Magnanimous bridge works.');
  assert.equal(result.provider,'magnanimous-workers-ai-bridge');
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://iammagnanimousway.com/api/internal/ai/run');
  assert.equal(calls[0].init.method,'POST');
  assert.equal(calls[0].init.headers.authorization,'Bearer test-bridge-token');
  const body=JSON.parse(calls[0].init.body);
  assert.equal(body.model,'@cf/meta/llama-3.1-8b-instruct-fast');
  assert.equal(body.max_tokens,321);
  assert.deepEqual(body.messages,[{role:'user',content:'Say hello.'}]);
}

async function dedicatedPlatformFallback(){
  const calls=[];
  globalThis.fetch=async(url,init={})=>{
    calls.push({url:String(url),init});
    return new Response(JSON.stringify({
      result:{response:'Dedicated platform fallback works.'},
      success:true,
      errors:[],
      messages:[]
    }),{status:200,headers:{'content-type':'application/json'}});
  };
  const binding=new MagnanimousAiBinding({
    CLOUDFLARE_PLATFORM_API_TOKEN:'test-platform-workers-ai-token',
    CLOUDFLARE_PLATFORM_ACCOUNT_ID:'test-platform-account-id',
    CLOUDFLARE_API_TOKEN:'broad-deploy-token-must-not-win',
    CLOUDFLARE_ACCOUNT_ID:'broad-account-must-not-win',
    ENABLE_METERED_PROVIDERS:'false'
  });
  const result=await binding.run('@cf/meta/llama-3.1-8b-instruct-fast',{prompt:'Say hello.',max_tokens:123});
  assert.equal(result.response,'Dedicated platform fallback works.');
  assert.equal(result.provider,'cloudflare-workers-ai-rest');
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://api.cloudflare.com/client/v4/accounts/test-platform-account-id/ai/run/%40cf/meta/llama-3.1-8b-instruct-fast');
  assert.equal(calls[0].init.headers.authorization,'Bearer test-platform-workers-ai-token');
}

async function meteredDisabledByDefault(){
  let called=false;
  globalThis.fetch=async()=>{called=true;throw new Error('metered provider must not be called')};
  const binding=new MagnanimousAiBinding({
    OPENAI_API_KEY:'present-but-disabled',
    ENABLE_METERED_PROVIDERS:'false'
  });
  await assert.rejects(
    ()=>binding.run('legacy',{prompt:'Do not spend money.'}),
    /ENABLE_METERED_PROVIDERS=true/
  );
  assert.equal(called,false);
}

async function meteredRequiresExplicitOptIn(){
  const calls=[];
  globalThis.fetch=async(url)=>{
    calls.push(String(url));
    return new Response(JSON.stringify({output_text:'Explicit paid fallback works.'}),{
      status:200,headers:{'content-type':'application/json'}
    });
  };
  const binding=new MagnanimousAiBinding({
    OPENAI_API_KEY:'test-openai-key',
    ENABLE_METERED_PROVIDERS:'true'
  });
  const result=await binding.run('legacy',{prompt:'Paid fallback is explicitly enabled.'});
  assert.equal(result.response,'Explicit paid fallback works.');
  assert.equal(result.provider,'magnanimous-metered-fallback');
  assert.deepEqual(calls,['https://api.openai.com/v1/responses']);
}

try{
  await workersAiFreeFirst();
  await dedicatedPlatformFallback();
  await meteredDisabledByDefault();
  await meteredRequiresExplicitOptIn();
  console.log('Magnanimous standalone free-first AI binding verification PASS');
}finally{
  globalThis.fetch=originalFetch;
}
