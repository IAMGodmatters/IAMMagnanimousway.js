import assert from 'node:assert/strict';
import { MagnanimousAiBinding } from '../src/ai-binding.mjs';

const originalFetch=globalThis.fetch;
const calls=[];

try{
  globalThis.fetch=async(url,init={})=>{
    calls.push({url:String(url),init});
    return new Response(JSON.stringify({
      result:{response:'Magnanimous REST fallback works.'},
      success:true,
      errors:[],
      messages:[]
    }),{status:200,headers:{'content-type':'application/json'}});
  };

  const binding=new MagnanimousAiBinding({
    CLOUDFLARE_API_TOKEN:'test-workers-ai-token',
    CLOUDFLARE_ACCOUNT_ID:'test-account-id'
  });

  const result=await binding.run('@cf/meta/llama-3.1-8b-instruct-fast',{
    messages:[{role:'user',content:'Say hello.'}],
    max_tokens:321
  });

  assert.equal(result.response,'Magnanimous REST fallback works.');
  assert.equal(result.provider,'cloudflare-workers-ai-rest');
  assert.equal(calls.length,1);
  assert.equal(
    calls[0].url,
    'https://api.cloudflare.com/client/v4/accounts/test-account-id/ai/run/%40cf/meta/llama-3.1-8b-instruct-fast'
  );
  assert.equal(calls[0].init.method,'POST');
  assert.equal(calls[0].init.headers.authorization,'Bearer test-workers-ai-token');
  const body=JSON.parse(calls[0].init.body);
  assert.equal(body.max_tokens,321);
  assert.deepEqual(body.messages,[{role:'user',content:'Say hello.'}]);

  console.log('Magnanimous standalone Workers AI REST binding verification PASS');
}finally{
  globalThis.fetch=originalFetch;
}
