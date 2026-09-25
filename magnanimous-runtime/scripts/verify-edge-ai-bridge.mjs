import assert from 'node:assert/strict';
import { handleEdgeAiBridge } from '../../worker/src/edge-ai-bridge.js';

const url='https://iammagnanimousway.com/api/internal/edge-ai/run';
const body=JSON.stringify({
  model:'@cf/meta/llama-3.1-8b-instruct-fast',
  messages:[{role:'user',content:'Confirm edge bridge.'}],
  max_tokens:64
});
let calls=0;
const env={
  MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN:'verification-bridge-secret',
  AI:{async run(model,input){
    calls++;
    assert.equal(model,'@cf/meta/llama-3.1-8b-instruct-fast');
    assert.equal(input.max_tokens,64);
    return{response:'Private edge AI bridge verification passed.'};
  }}
};

const denied=await handleEdgeAiBridge(new Request(url,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer wrong-secret'},body}),env);
assert.equal(denied.status,401);
assert.equal(calls,0);

const disallowed=await handleEdgeAiBridge(new Request(url,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer verification-bridge-secret'},body:JSON.stringify({model:'@cf/not-approved/model',messages:[{role:'user',content:'x'}]})}),env);
assert.equal(disallowed.status,400);
assert.equal(calls,0);

const ok=await handleEdgeAiBridge(new Request(url,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer verification-bridge-secret'},body}),env);
assert.equal(ok.status,200);
const data=await ok.json();
assert.equal(data.ok,true);
assert.equal(data.bridge_version,'2026-09-25.1');
assert.equal(data.response,'Private edge AI bridge verification passed.');
assert.equal(calls,1);

const standalone=await handleEdgeAiBridge(new Request(url,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer verification-bridge-secret'},body}),{...env,MAGNANIMOUS_RUNTIME:'standalone-node'});
assert.equal(standalone.status,404);
assert.equal(calls,1);

console.log('Magnanimous private Edge AI bridge verification PASS');
