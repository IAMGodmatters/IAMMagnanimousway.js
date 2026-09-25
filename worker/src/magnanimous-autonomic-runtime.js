const circuits=new Map();

function classify(error){
 const text=String(error?.message||error||'').toLowerCase();
 if(/401|403|unauthor|forbidden|invalid (?:api )?key|authentication|credential/.test(text))return'auth';
 if(/402|payment|billing|paid plan|quota requires|plan required/.test(text))return'billing';
 if(/429|rate.?limit|too many|quota|capacity|overload/.test(text))return'capacity';
 if(/timeout|timed out|aborted/.test(text))return'timeout';
 if(/network|fetch failed|econn|enotfound|socket|502|503|504/.test(text))return'network';
 if(/empty response|returned no text/.test(text))return'empty';
 return'unknown';
}
function policy(kind,failures){
 if(kind==='auth'||kind==='billing')return{threshold:1,cooldownMs:15*60*1000};
 if(kind==='capacity')return{threshold:1,cooldownMs:90*1000};
 if(kind==='timeout'||kind==='network')return{threshold:2,cooldownMs:60*1000};
 if(kind==='empty')return{threshold:2,cooldownMs:45*1000};
 return{threshold:3,cooldownMs:90*1000};
}
function entry(id){return circuits.get(String(id))||{failures:0,openUntil:0,lastFailure:'',lastSuccess:0,kind:'healthy'}}

export function recordExecutionSuccess(id,at=Date.now()){
 const key=String(id||'unknown');
 circuits.set(key,{failures:0,openUntil:0,lastFailure:'',lastSuccess:at,kind:'healthy'});
}
export function recordExecutionFailure(id,error,at=Date.now()){
 const key=String(id||'unknown'),previous=entry(key),kind=classify(error),failures=previous.failures+1,p=policy(kind,failures);
 const openUntil=failures>=p.threshold?Math.max(previous.openUntil,at+p.cooldownMs):previous.openUntil;
 circuits.set(key,{...previous,failures,openUntil,lastFailure:at,lastError:String(error?.message||error||'').slice(0,240),kind});
 return{kind,failures,openUntil,circuit_open:openUntil>at};
}
export function orderHealthyExecutionCandidates(candidates,at=Date.now()){
 const source=Array.isArray(candidates)?candidates:[];
 if(source.length<2)return source;
 const healthy=[],open=[];
 for(const candidate of source){
  const state=entry(candidate?.id);
  (state.openUntil>at?open:healthy).push({candidate,state});
 }
 if(healthy.length)return healthy.map(x=>x.candidate);
 open.sort((a,b)=>a.state.openUntil-b.state.openUntil);
 return open.length?[open[0].candidate]:[];
}
export function autonomicExecutionSnapshot(at=Date.now()){
 return [...circuits.entries()].map(([id,state])=>({
  id,status:state.openUntil>at?'recovering':'ready',
  failures:state.failures,
  retry_after_ms:Math.max(0,state.openUntil-at),
  failure_class:state.kind,
  last_success_at:state.lastSuccess||0,
  last_failure_at:state.lastFailure||0
 }));
}
export function resetAutonomicExecutionState(){circuits.clear()}
