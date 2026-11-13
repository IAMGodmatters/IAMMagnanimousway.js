import assert from 'node:assert/strict';
import { handleMagnanimousReelsProxy } from '../../worker/src/reels-proxy.js';

const originalFetch=globalThis.fetch;
const originalError=console.error;
console.error=()=>{};
try{
  globalThis.fetch=async()=>new Response('<!doctype html><html><body><h1>Waiting for capacity</h1></body></html>',{status:200,headers:{'content-type':'text/html'}});
  let response=await handleMagnanimousReelsProxy(new Request('https://iammagnanimousway.com/reels-proxy/'));
  assert.equal(response.status,503,'A 200 provider capacity page must become a service-unavailable response');
  let html=await response.text();
  assert.match(html,/Magnanimous Reels is temporarily unavailable/);
  assert.match(html,/href="\/video-studio\/"/);
  assert.match(html,/href="\/movie-maker\/"/);
  assert.doesNotMatch(html,/BasicDeploy|basicdeploy\.com|Waiting for capacity/i);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('x-magnanimous-reels-status'),'temporarily-unavailable');

  globalThis.fetch=async()=>new Response('<html><body>Account suspended for storage over quota</body></html>',{status:402,headers:{'content-type':'text/html'}});
  response=await handleMagnanimousReelsProxy(new Request('https://iammagnanimousway.com/reels-proxy/'));
  assert.equal(response.status,503,'A suspended upstream must be normalized to a branded 503');
  assert.match(await response.text(),/Open Video Studio/);

  globalThis.fetch=async()=>new Response('<html><body>maintenance</body></html>',{status:503,headers:{'content-type':'text/html'}});
  response=await handleMagnanimousReelsProxy(new Request('https://iammagnanimousway.com/reels-proxy/'));
  assert.equal(response.status,503,'An upstream 503 must use the branded fallback');

  globalThis.fetch=async()=>new Response('<!doctype html><html><head><title>Reels</title></head><body><script>fetch("/api/stories")</script></body></html>',{status:200,headers:{'content-type':'text/html'}});
  response=await handleMagnanimousReelsProxy(new Request('https://iammagnanimousway.com/reels-proxy/'));
  assert.equal(response.status,200,'A healthy Reels document must pass through');
  html=await response.text();
  assert.match(html,/Magnanimous Reels/);
  assert.match(html,/\/reels-proxy\/api\/stories/);

  globalThis.fetch=async()=>{throw new Error('upstream offline')};
  response=await handleMagnanimousReelsProxy(new Request('https://iammagnanimousway.com/reels-proxy/'));
  assert.equal(response.status,503,'A root-document network failure must show the branded fallback');
  assert.match(await response.text(),/Open Movie Maker/);

  response=await handleMagnanimousReelsProxy(new Request('https://iammagnanimousway.com/reels-proxy/api/stories'));
  assert.equal(response.status,502,'An API network failure must remain a machine-readable error');
  assert.equal((await response.json()).code,'MAGNANIMOUS_REELS_PROXY_UNAVAILABLE');

  globalThis.fetch=async()=>new Response(JSON.stringify({detail:'temporarily unavailable'}),{status:503,headers:{'content-type':'application/json'}});
  response=await handleMagnanimousReelsProxy(new Request('https://iammagnanimousway.com/reels-proxy/api/stories'));
  assert.equal(response.status,503,'API errors must retain their original status and format');
  assert.match(response.headers.get('content-type'),/application\/json/);

  response=await handleMagnanimousReelsProxy(new Request('https://iammagnanimousway.com/not-reels'));
  assert.equal(response,null,'Unrelated routes must not be intercepted');
  console.log('Magnanimous Reels proxy fallback: 8 behavioral checks passed.');
}finally{
  globalThis.fetch=originalFetch;
  console.error=originalError;
}
