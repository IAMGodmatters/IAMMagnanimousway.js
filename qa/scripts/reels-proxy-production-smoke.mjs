import assert from 'node:assert/strict';

const baseUrl=process.env.BASE_URL||'https://iammagnanimousway.com';
const target=new URL('/reels-proxy/',baseUrl);
const response=await fetch(target,{
  method:'GET',
  headers:{accept:'text/html'},
  redirect:'follow',
  signal:AbortSignal.timeout(30000),
});
const body=await response.text();
const contentType=String(response.headers.get('content-type')||'');
const surface=response.headers.get('x-magnanimous-surface');
const providerLeak=/BasicDeploy|basicdeploy\.com|Waiting for capacity|account.{0,80}suspended|storage.{0,80}over.?quota/i;

assert.equal(surface,'reels','The Reels route must identify the Magnanimous surface.');
assert.match(contentType,/text\/html/i,'The Reels entry document must return HTML.');
assert.doesNotMatch(body,providerLeak,'Provider outage branding or capacity pages must never reach customers.');

if(response.status===200){
  assert.match(body,/Magnanimous Reels/i,'A healthy Reels response must carry Magnanimous branding.');
  console.log('Magnanimous Reels production smoke passed: HTTP 200 healthy Reels document.');
}else if(response.status===503){
  assert.equal(response.headers.get('x-magnanimous-reels-status'),'temporarily-unavailable','A 503 must be the explicit branded fallback.');
  assert.equal(response.headers.get('cache-control'),'no-store','The outage fallback must not be cached.');
  assert.match(body,/Magnanimous Reels is temporarily unavailable/);
  assert.match(body,/href=["']\/video-studio\/["']/);
  assert.match(body,/href=["']\/movie-maker\/["']/);
  console.log('Magnanimous Reels production smoke passed: HTTP 503 branded fallback with working alternatives.');
}else{
  throw new Error("Magnanimous Reels entry route returned unexpected HTTP "+response.status+".");
}
