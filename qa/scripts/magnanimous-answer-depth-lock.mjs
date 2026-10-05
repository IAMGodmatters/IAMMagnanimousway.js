import fs from 'node:fs';
import assert from 'node:assert/strict';
import { MagnanimousAiBinding } from '../../magnanimous-runtime/src/ai-binding.mjs';

const transport=fs.readFileSync(new URL('../../frontend/lib/magnanimous-chat-transport.ts',import.meta.url),'utf8');
const businessEmail=fs.readFileSync(new URL('../../frontend/app/business-email/email-writer-client.tsx',import.meta.url),'utf8');
for(const contract of [
  'PUBLIC_INFO_INTENT',
  'ssdi',
  'social\\s+security',
  'official\\s+(?:site|page|link|website)',
  'application',
  'live_search:true',
  'use_knowledge:true',
  'automatic-public-information-grounding',
  'payload?.live_search===false',
  'payload?.external_search===false'
])assert.ok(transport.includes(contract),`Standalone public-information grounding/privacy contract missing: ${contract}`);
assert.ok(businessEmail.includes('live_search:false'),'Business Email must explicitly opt out of live web search to protect recipient/purpose content.');

const originalFetch=globalThis.fetch;
const bodies=[];
globalThis.fetch=async(_url,init={})=>{
  bodies.push(JSON.parse(String(init.body||'{}')));
  return new Response(JSON.stringify({response:'ok'}),{status:200,headers:{'content-type':'application/json'}});
};

try{
  const ai=new MagnanimousAiBinding({
    MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN:'test-token',
    MAGNANIMOUS_EDGE_AI_BRIDGE_URL:'https://example.test/edge',
    MAGNANIMOUS_AI_LONGFORM_MIN_TOKENS:'3200',
    MAGNANIMOUS_AI_HARD_TOKEN_CAP:'8192'
  });
  await ai.run('@cf/test/model',{messages:[{role:'user',content:'Help me with SSDI and give me the official link.'}],max_tokens:1400});
  assert.equal(bodies.at(-1)?.max_tokens,3200,'Long-form free-first requests must expand above the old 1400-token ceiling.');

  await ai.run('@cf/test/model',{messages:[{role:'user',content:'Say hello.'}],max_tokens:220});
  assert.equal(bodies.at(-1)?.max_tokens,220,'Short voice/tool requests must keep their compact token budget.');

  const capped=new MagnanimousAiBinding({
    MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN:'test-token',
    MAGNANIMOUS_EDGE_AI_BRIDGE_URL:'https://example.test/edge',
    MAGNANIMOUS_AI_LONGFORM_MIN_TOKENS:'3200',
    MAGNANIMOUS_AI_HARD_TOKEN_CAP:'4096'
  });
  await capped.run('@cf/test/model',{messages:[{role:'user',content:'Long answer'}],max_tokens:9000});
  assert.equal(bodies.at(-1)?.max_tokens,4096,'Long-form expansion must remain bounded by the configured hard cap.');

  const lowCap=new MagnanimousAiBinding({
    MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN:'test-token',
    MAGNANIMOUS_EDGE_AI_BRIDGE_URL:'https://example.test/edge',
    MAGNANIMOUS_AI_LONGFORM_MIN_TOKENS:'3200',
    MAGNANIMOUS_AI_HARD_TOKEN_CAP:'1024'
  });
  await lowCap.run('@cf/test/model',{messages:[{role:'user',content:'Respect a lower owner-defined hard cap.'}],max_tokens:1400});
  assert.equal(bodies.at(-1)?.max_tokens,1024,'Owner-defined hard caps must win even when below the long-form floor.');
}finally{
  globalThis.fetch=originalFetch;
}

console.log('Magnanimous answer depth + privacy lock PASS');
