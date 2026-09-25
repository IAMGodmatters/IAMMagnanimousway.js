const state=new Map();
const now=()=>Date.now();

function bucket(id){
  const key=String(id||'unknown');
  if(!state.has(key))state.set(key,{failures:0,opened_until:0,last_failure:'',last_success:0});
  return state.get(key);
}
export function classifyExecutionFailure(error){
  const text=String(error?.message||error||'').toLowerCase();
  if(/401|403|auth|credential|invalid.*key|unauthorized|forbidden/.test(text))return'auth';
  if(/429|rate limit|quota|capacity|overloaded/.test(text))return'capacity';
  if(/timeout|timed out|abort/.test(text))return'timeout';
  if(/502|503|504|gateway|unavailable|connection|network/.test(text))return'transient';
  if(/empty response/.test(text))return'empty';
  return'unknown';
}
function cooldownMs(kind,failures){
  if(kind==='auth')return 15*60*1000;
  if(kind==='capacity')return Math.min(10*60*1000,60*1000*Math.max(2,failures));
  if(kind==='timeout'||kind==='transient')return Math.min(5*60*1000,30*1000*Math.max(1,failures));
  return Math.min(2*60*1000,20*1000*Math.max(1,failures));
}
export function executionRailAvailable(id){
  return Number(bucket(id).opened_until||0)<=now();
}
export function noteExecutionSuccess(id){
  const b=bucket(id);b.failures=0;b.opened_until=0;b.last_failure='';b.last_success=now();
}
export function noteExecutionFailure(id,error){
  const b=bucket(id),kind=classifyExecutionFailure(error);
  b.failures=Math.min(20,Number(b.failures||0)+1);
  b.last_failure=kind;
  b.opened_until=now()+cooldownMs(kind,b.failures);
  return{kind,failures:b.failures,retry_after_ms:b.opened_until-now()};
}
export function selfHealSnapshot(){
  const t=now();
  return [...state.entries()].map(([rail,v])=>({
    rail,
    status:Number(v.opened_until||0)>t?'cooldown':'ready',
    failures:Number(v.failures||0),
    retry_after_ms:Math.max(0,Number(v.opened_until||0)-t),
    last_failure:String(v.last_failure||''),
    last_success:Number(v.last_success||0)||null
  }));
}
