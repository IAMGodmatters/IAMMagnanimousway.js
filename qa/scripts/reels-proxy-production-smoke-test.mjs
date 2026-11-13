import assert from 'node:assert/strict';

const originalFetch=globalThis.fetch;
const originalLog=console.log;
const originalError=console.error;
const moduleUrl='./reels-proxy-production-smoke.mjs';

async function runCase(name,response,shouldReject=false){
  globalThis.fetch=async(url,init)=>{
    assert.equal(new URL(url).pathname,'/reels-proxy/');
    assert.equal(init.method,'GET');
    assert.equal(init.redirect,'follow');
    return response;
  };
  const load=import(moduleUrl+'?case='+encodeURIComponent(name));
  if(shouldReject)await assert.rejects(load);
  else await load;
}

try{
  console.log=()=>{};
  console.error=()=>{};
  await runCase('healthy',new Response('<html><head><title>Magnanimous Reels</title></head><body>Magnanimous Reels</body></html>',{
    status:200,
    headers:{'content-type':'text/html; charset=utf-8','x-magnanimous-surface':'reels'}
  }));
  await runCase('outage',new Response('<html><body><h1>Magnanimous Reels is temporarily unavailable</h1><a href="/video-studio/">Open Video Studio</a><a href="/movie-maker/">Open Movie Maker</a></body></html>',{
    status:503,
    headers:{'content-type':'text/html; charset=utf-8','x-magnanimous-surface':'reels','x-magnanimous-reels-status':'temporarily-unavailable','cache-control':'no-store'}
  }));
  await runCase('provider-capacity-leak',new Response('<html><body>Waiting for capacity</body></html>',{
    status:200,
    headers:{'content-type':'text/html; charset=utf-8','x-magnanimous-surface':'reels'}
  }),true);
  await runCase('unexpected-status',new Response('<html><body>Bad gateway</body></html>',{
    status:502,
    headers:{'content-type':'text/html; charset=utf-8','x-magnanimous-surface':'reels'}
  }),true);
  process.stdout.write('Magnanimous Reels production smoke validator: 4 cases passed without live traffic.\n');
}finally{
  globalThis.fetch=originalFetch;
  console.log=originalLog;
  console.error=originalError;
}
