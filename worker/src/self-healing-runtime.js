import {currentUser} from './integrations.js';
import {requirePlatformOwner} from './platform-owner-guard.js';
import {checkpointProgress,listProgressCheckpoints} from './progress-checkpoint-runtime.js';
import {premiumVoiceHealth} from './premium-voice-runtime.js';

const RETRYABLE_STATUS=new Set([408,425,429,500,502,503,504]);
export const SELF_HEAL_POLICY=Object.freeze({
  maxAttempts:3,
  timeoutMs:5000,
  backoffMs:[250,750],
  retryMethods:['GET','HEAD'],
  neverUsePaidFallbackWithoutFunding:true,
  neverBypassAuthOrBilling:true
});

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const clip=(value,n=500)=>String(value??'').slice(0,n);

async function ownerAuditUser(env){
  if(!env?.DB)return null;
  try{
    return await env.DB.prepare(`SELECT u.id,u.tenant_id,u.role
      FROM users u JOIN tenants t ON t.id=u.tenant_id
      WHERE u.active=1 AND u.role='owner' AND t.slug='owner'
      ORDER BY u.created_at ASC LIMIT 1`).first();
  }catch{return null}
}

async function audit(env,user,{sessionKey,stage,content,status='saved',metadata={}}){
  if(!user)return null;
  return checkpointProgress(env,user,{
    sessionKey,
    scope:'self-healing',
    kind:'platform-repair',
    stage,
    content,
    status,
    metadata
  }).catch(()=>null);
}

function runtimeRevision(env){
  return clip(env?.RAILWAY_GIT_COMMIT_SHA||env?.MAGNANIMOUS_RELEASE_SHA||env?.GIT_COMMIT_SHA||'',80)||'unreported';
}

function freeFirstProviderState(env){
  const privateEdge=Boolean(String(env?.MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN||env?.INTEGRATION_CREDENTIALS_KEY||'').trim());
  const local=Boolean(String(env?.OLLAMA_BASE_URL||'').trim());
  const compatible=Boolean(String(env?.MAGNANIMOUS_AI_BASE_URL||'').trim());
  const metered=String(env?.ENABLE_METERED_PROVIDERS||'').toLowerCase()==='true'&&Boolean(String(env?.OPENAI_API_KEY||'').trim());
  const freeReady=privateEdge||local;
  return {
    free_first_ready:freeReady,
    private_edge_bridge:{configured:privateEdge,status:privateEdge?'ready':'not-configured'},
    local_model:{configured:local,status:local?'ready':'not-configured'},
    compatible_private_rail:{configured:compatible,status:compatible?'configured-cost-unverified':'not-configured'},
    paid_fallback:{configured:metered,status:metered?'available-if-funded':'disabled'},
    paid_fallback_required:!freeReady&&(compatible||metered),
    funding_verification_required:!freeReady&&compatible
  };
}

async function fetchOnce(url,{method='GET',timeoutMs=SELF_HEAL_POLICY.timeoutMs}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  const started=Date.now();
  try{
    const response=await fetch(url,{method,headers:{'cache-control':'no-cache','x-magnanimous-health-probe':'self-healing'},signal:controller.signal});
    let body=null;
    if(String(response.headers.get('content-type')||'').includes('application/json'))body=await response.clone().json().catch(()=>null);
    return {ok:response.ok,status:response.status,latency_ms:Date.now()-started,body,error:''};
  }catch(error){
    return {ok:false,status:0,latency_ms:Date.now()-started,body:null,error:clip(error?.name==='AbortError'?'timeout':error?.message||'network failure',180)};
  }finally{clearTimeout(timer)}
}

export async function probeWithRepair(url,options={}){
  const method=String(options.method||'GET').toUpperCase();
  const safeRetry=SELF_HEAL_POLICY.retryMethods.includes(method);
  const attempts=[];
  for(let index=0;index<SELF_HEAL_POLICY.maxAttempts;index++){
    const result=await fetchOnce(url,{...options,method});
    attempts.push(result);
    if(result.ok)return {ok:true,recovered:index>0,attempt_count:index+1,last:result,attempts};
    const retryable=safeRetry&&(result.status===0||RETRYABLE_STATUS.has(result.status));
    if(!retryable||index===SELF_HEAL_POLICY.maxAttempts-1)break;
    await sleep(SELF_HEAL_POLICY.backoffMs[Math.min(index,SELF_HEAL_POLICY.backoffMs.length-1)]||750);
  }
  return {ok:false,recovered:false,attempt_count:attempts.length,last:attempts[attempts.length-1]||null,attempts};
}

async function productionProbe(env,origin,user,{record=true}={}){
  const sessionKey='self-heal:production-health';
  const result=await probeWithRepair(origin.replace(/\/$/,'')+'/health');
  const meta={
    category:'production-health',
    retry_count:Math.max(0,result.attempt_count-1),
    http_status:Number(result.last?.status||0),
    latency_ms:Number(result.last?.latency_ms||0),
    deployment_revision:runtimeRevision(env),
    cost_impact_usd:0,
    paid_fallback_required:false,
    customer_impact:result.ok?'none':'production-health-degraded'
  };
  if(record&&result.recovered)await audit(env,user,{sessionKey,stage:'repaired',content:'Production health recovered after a capped safe retry.',metadata:meta});
  if(record&&!result.ok)await audit(env,user,{sessionKey,stage:'escalated',content:'Production health remained unhealthy after capped safe retries. Owner attention is required.',status:'failed',metadata:meta});
  return {status:result.ok?'healthy':'attention',...meta,attempt_count:result.attempt_count,recovered:result.recovered,error:result.last?.error||''};
}

async function providerProbe(env,user,{record=true}={}){
  const state=freeFirstProviderState(env);
  const sessionKey='self-heal:free-first-provider';
  if(record&&!state.free_first_ready){
    await audit(env,user,{
      sessionKey,
      stage:'escalated',
      content:'No free-first AI execution rail is currently configured. Paid fallback will not be used without funding and policy approval.',
      status:'failed',
      metadata:{category:'provider-health',retry_count:0,cost_impact_usd:0,paid_fallback_required:state.paid_fallback_required,customer_impact:'ai-routing-degraded'}
    });
  }
  return state;
}

function summarizeEvents(rows=[]){
  const events=rows.filter(row=>row.scope==='self-healing');
  const latestByKey=new Map();
  for(const row of events)if(!latestByKey.has(row.session_key))latestByKey.set(row.session_key,row);
  const currentIncidents=[...latestByKey.values()].filter(row=>row.status==='failed'||row.stage==='escalated');
  return {
    current_incidents:currentIncidents.slice(0,25),
    attempted_repairs:events.filter(row=>['retrying','repair-attempt','repaired','escalated'].includes(row.stage)).slice(0,50),
    successful_repairs:events.filter(row=>row.stage==='repaired'&&row.status!=='failed').slice(0,50),
    failed_repairs:events.filter(row=>row.status==='failed'||row.stage==='escalated').slice(0,50),
    recent_events:events.slice(0,80)
  };
}

export async function selfHealingSnapshot(env,origin,{record=false}={}){
  const owner=await ownerAuditUser(env);
  const [production,provider]=await Promise.all([
    productionProbe(env,origin,owner,{record}),
    providerProbe(env,owner,{record})
  ]);
  const rows=owner?await listProgressCheckpoints(env,owner,{limit:300}).catch(()=>[]):[];
  return {
    identity:'Magnanimous AI',
    policy:SELF_HEAL_POLICY,
    production_health:production,
    provider_health:provider,
    voice_audio_health:{
      ...premiumVoiceHealth(env),
      note:'Browser/native speech remains the default. Optional premium synthesis is used only when commercially authorized and funded; synthesis requests are not auto-retried.'
    },
    deployment_revision:runtimeRevision(env),
    cost_impact_usd:0,
    paid_fallback_required:Boolean(provider.paid_fallback_required),
    ...summarizeEvents(rows),
    audit_evidence_available:Boolean(owner),
    generated_at:new Date().toISOString()
  };
}

export async function handleSelfHealing(request,env){
  const url=new URL(request.url);
  const path=url.pathname;
  if(path!=='/api/operations/self-healing'&&path!=='/api/operations/self-healing/check-now')return null;
  const denied=await requirePlatformOwner(request,env);
  if(denied)return denied;
  const user=await currentUser(request,env);
  if(!user)return json({detail:'Platform owner access required.'},403);
  const origin=String(env?.PUBLIC_SITE_URL||url.origin||'https://iammagnanimousway.com').replace(/\/$/,'');
  if(path==='/api/operations/self-healing'&&request.method==='GET')return json(await selfHealingSnapshot(env,origin,{record:false}));
  if(path==='/api/operations/self-healing/check-now'&&request.method==='POST')return json(await selfHealingSnapshot(env,origin,{record:true}));
  return json({detail:'Method not allowed.'},405);
}

export async function scheduledSelfHealing(env,origin='https://iammagnanimousway.com'){
  const owner=await ownerAuditUser(env);
  const [production,provider]=await Promise.all([
    productionProbe(env,String(origin).replace(/\/$/,''),owner,{record:true}),
    providerProbe(env,owner,{record:true})
  ]);
  return {production,provider,checked_at:new Date().toISOString()};
}
