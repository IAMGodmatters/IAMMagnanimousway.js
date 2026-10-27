// Standalone capacity is optional. Never send customer writes to a known-dead
// origin, and never require optional Railway availability for native edge APIs.
const HEALTH_TTL_MS=45000;
const PROBE_TIMEOUT_MS=2500;
const recent=new Map();
const pending=new Map();

export async function standaloneApiReady(origin,{fetcher=fetch,clock=Date.now}={}){
 const key=String(origin||'');
 if(!key)return false;
 const cached=recent.get(key);
 if(cached&&cached.until>clock())return cached.ready;
 if(pending.has(key))return pending.get(key);
 const probe=(async()=>{
  let ready=false;
  try{
   const response=await fetcher(new URL('/health',key).toString(),{
    method:'GET',redirect:'manual',
    headers:{'x-magnanimous-standalone-proxy':'1'},
    signal:AbortSignal.timeout(PROBE_TIMEOUT_MS)
   });
   // A provider error page can have HTTP 200. Trust only Magnanimous JSON health.
   if(response.status===200&&String(response.headers.get('content-type')||'').toLowerCase().includes('application/json')){
    const body=await response.json();
    ready=body?.status==='ok'&&(!body.service||body.service==='iamagnanimous-ai');
   }
  }catch{ready=false;}
  recent.set(key,{ready,until:clock()+HEALTH_TTL_MS});
  return ready;
 })();
 pending.set(key,probe);
 try{return await probe}finally{pending.delete(key)}
}

export function resetStandaloneHealthGateForTest(){
 recent.clear();
 pending.clear();
}
