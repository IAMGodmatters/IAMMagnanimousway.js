const states=new Map();
const now=()=>Date.now();
const MAX_ENTRIES=200;

function classify(message){
  const value=String(message||'').toLowerCase();
  if(/(?:authentication|unauthorized|forbidden|invalid api key|\b401\b|\b403\b)/.test(value))return'authorization';
  if(/(?:quota|rate limit|too many requests|daily free allocation|out of capacity|\b429\b|\b3036\b|\b3040\b)/.test(value))return'capacity';
  if(/(?:timed out|timeout|abort)/.test(value))return'timeout';
  if(/(?:empty response|returned no text)/.test(value))return'empty';
  if(/(?:\b500\b|\b502\b|\b503\b|\b504\b|upstream|temporarily unavailable)/.test(value))return'upstream';
  if(/(?:invalid|unsupported|schema|contract|bad request|\b400\b|\b422\b)/.test(value))return'contract';
  return'unavailable';
}
function cooldownMs(kind,failures){
  if(kind==='authorization')return 10*60_000;
  if(kind==='capacity')return Math.min(10*60_000,60_000*Math.max(2,failures));
  if(kind==='contract')return 5*60_000;
  if(kind==='timeout'||kind==='upstream')return Math.min(5*60_000,15_000*(2**Math.min(5,Math.max(0,failures-1))));
  if(kind==='empty')return Math.min(2*60_000,10_000*Math.max(1,failures));
  return Math.min(3*60_000,15_000*Math.max(1,failures));
}
function trim(){
  if(states.size<=MAX_ENTRIES)return;
  const ordered=[...states.entries()].sort((a,b)=>(a[1].updated_at||0)-(b[1].updated_at||0));
  for(const[key]of ordered.slice(0,states.size-MAX_ENTRIES))states.delete(key);
}
export function providerCircuitKey(provider,model=''){return `${String(provider||'unknown').toLowerCase()}:${String(model||'*')}`}
export function providerAttemptAllowed(provider,model=''){
  const key=providerCircuitKey(provider,model),state=states.get(key);
  if(!state)return{allowed:true,key,state:'closed'};
  const current=now();
  if(state.open_until&&current<state.open_until)return{allowed:false,key,state:'open',failure_class:state.failure_class,retry_after_ms:state.open_until-current,failures:state.failures};
  if(state.open_until&&current>=state.open_until)return{allowed:true,key,state:'half-open',failures:state.failures};
  return{allowed:true,key,state:'closed',failures:state.failures||0};
}
export function recordProviderSuccess(provider,model=''){
  const key=providerCircuitKey(provider,model);states.set(key,{failures:0,successes:(states.get(key)?.successes||0)+1,open_until:0,failure_class:'',last_error:'',updated_at:now()});trim();
  return states.get(key);
}
export function recordProviderFailure(provider,model='',error=''){
  const key=providerCircuitKey(provider,model),previous=states.get(key)||{},failures=(previous.failures||0)+1,failure_class=classify(error);
  const shouldOpen=failure_class==='authorization'||failure_class==='capacity'||failures>=2;
  const open_until=shouldOpen?now()+cooldownMs(failure_class,failures):0;
  const state={failures,successes:previous.successes||0,open_until,failure_class,last_error:String(error||'').slice(0,240),updated_at:now()};
  states.set(key,state);trim();return state;
}
export function selfHealSnapshot(){
  const current=now();
  return[...states.entries()].map(([key,state])=>({
    key,state:state.open_until>current?'open':state.open_until?'half-open':'closed',
    failure_class:state.failure_class||'',failures:state.failures||0,
    retry_after_ms:Math.max(0,(state.open_until||0)-current),
    updated_at:state.updated_at||0
  })).filter(row=>row.state!=='closed'||row.failures>0).slice(-50);
}
export function resetProviderCircuit(provider,model=''){states.delete(providerCircuitKey(provider,model))}
export const SELF_HEAL_POLICY=Object.freeze({
  automatic_failover:true,
  zero_user_intervention:true,
  authorization_cooldown_minutes:10,
  capacity_cooldown_max_minutes:10,
  transient_backoff:true,
  no_automatic_paid_upgrade:true
});
