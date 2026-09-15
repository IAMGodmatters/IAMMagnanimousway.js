import { MAGNANIMOUS_UNIVERSAL_CAPABILITY_DOMAINS } from './magnanimous-universal-capabilities.js';
import { getIntegrationCatalog } from './magnanimous-integration-catalog.js';

const now=()=>Math.floor(Date.now()/1000);
const clip=(v,n=4000)=>String(v??'').trim().slice(0,n);
const normalize=v=>clip(v,180).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

// These are families that Magnanimous knows how to route at the platform level.
// A declared family is architectural support, not proof that a provider/account is configured.
export const MAGNANIMOUS_BUILTIN_CAPABILITY_FAMILIES=[
 'web-search','deep-research','calculator','weather','currency','unit-conversion','time','maps-local-search',
 'files-documents','spreadsheets','slides','pdf','image-generation','image-editing','voice','text-to-speech','speech-to-text',
 'video-generation','cinema','avatars','lipsync','translation','coding','github','email','calendar','contacts','cloud-drive',
 'crm','sales','payments','commerce','social-media','music','database','communications','telephony','automation','knowledge-memory'
];

async function tableExists(env,name){
 try{return Boolean(await env.DB.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first())}catch{return false}
}
async function ensureGapSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_tool_gaps (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,capability TEXT NOT NULL,example_task TEXT NOT NULL DEFAULT '',count INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'observed',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,user_id,capability))`).run();
}
async function rowsIf(env,table,sql,binds=[]){
 if(!await tableExists(env,table))return[];
 try{const{results=[]}=await env.DB.prepare(sql).bind(...binds).all();return results}catch{return[]}
}
function tokenSet(value){return new Set(String(value||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2))}
function relevance(needle,haystack){
 const n=tokenSet(needle),h=tokenSet(haystack);if(!n.size)return 0;
 let hits=0;for(const word of n)if(h.has(word))hits++;
 return hits/n.size;
}

export async function recordMagnanimousCapabilityGap(env,{tenant,userId,capability,task='',source='runtime'}={}){
 if(!env?.DB||!tenant||!userId||!capability)return null;
 await ensureGapSchema(env);
 const safeCapability=normalize(capability);if(!safeCapability)return null;
 const example=clip(`${source?`[${source}] `:''}${task}`,1500),ts=now();
 await env.DB.prepare(`INSERT INTO magnanimous_tool_gaps(tenant_id,user_id,capability,example_task,count,status,created_at,updated_at) VALUES(?,?,?,?,1,'observed',?,?) ON CONFLICT(tenant_id,user_id,capability) DO UPDATE SET example_task=CASE WHEN excluded.example_task<>'' THEN excluded.example_task ELSE magnanimous_tool_gaps.example_task END,count=magnanimous_tool_gaps.count+1,status=CASE WHEN magnanimous_tool_gaps.status='learned' THEN 'learned' ELSE magnanimous_tool_gaps.status END,updated_at=excluded.updated_at`).bind(String(tenant),String(userId),safeCapability,example,ts,ts).run();
 return env.DB.prepare('SELECT capability,example_task,count,status,updated_at FROM magnanimous_tool_gaps WHERE tenant_id=? AND user_id=? AND capability=?').bind(String(tenant),String(userId),safeCapability).first();
}

export async function getMagnanimousCapabilityRadar(env,{tenant,userId}={}){
 if(!env?.DB||!tenant||!userId)return{identity:'Magnanimous AI',mode:'runtime-capability-radar',available:false,reason:'D1 and signed-in tenant context are required.'};
 await ensureGapSchema(env);
 const t=String(tenant),u=String(userId);
 const [native,gaps,servers,mcpTools,audit]=await Promise.all([
  rowsIf(env,'magnanimous_native_tool_specs',"SELECT name,purpose,family,risk,status,uses,successes,updated_at FROM magnanimous_native_tool_specs WHERE ((tenant_id=? AND user_id=?) OR (tenant_id='__magnanimous_global__' AND user_id='system:auto-qa')) ORDER BY updated_at DESC LIMIT 500",[t,u]),
  rowsIf(env,'magnanimous_tool_gaps','SELECT capability,example_task,count,status,updated_at FROM magnanimous_tool_gaps WHERE tenant_id=? AND user_id=? ORDER BY count DESC,updated_at DESC LIMIT 250',[t,u]),
  rowsIf(env,'magnanimous_tool_servers','SELECT id,name,status,tool_count,enabled,last_error,updated_at FROM magnanimous_tool_servers WHERE tenant_id=? ORDER BY name',[t]),
  rowsIf(env,'magnanimous_discovered_tools','SELECT t.server_id,t.tool_name,t.description,t.enabled,s.name AS server_name,s.status AS server_status FROM magnanimous_discovered_tools t JOIN magnanimous_tool_servers s ON s.id=t.server_id WHERE t.tenant_id=? AND t.enabled=1 AND s.enabled=1 ORDER BY s.name,t.tool_name LIMIT 2500',[t]),
  rowsIf(env,'magnanimous_tool_audit',"SELECT server_id,tool_name,success,detail,created_at FROM magnanimous_tool_audit WHERE tenant_id=? AND action='call' ORDER BY id DESC LIMIT 1000",[t])
 ]);
 const verifiedCalls=new Map(),failureMap=new Map();
 for(const row of audit){
  if(Number(row.success)===1&&row.tool_name&&!verifiedCalls.has(row.tool_name))verifiedCalls.set(row.tool_name,row.created_at);
  if(Number(row.success)!==1&&row.tool_name){const current=failureMap.get(row.tool_name)||{tool_name:row.tool_name,server_id:row.server_id,count:0,last_error:'',last_failed_at:0};current.count++;if(Number(row.created_at||0)>=Number(current.last_failed_at||0)){current.last_failed_at=row.created_at;current.last_error=clip(row.detail,500)}failureMap.set(row.tool_name,current)}
 }
 const runtimeFailures=[...failureMap.values()].sort((a,b)=>b.count-a.count||Number(b.last_failed_at||0)-Number(a.last_failed_at||0));
 const nativeRuntime=native.map(row=>{const uses=Number(row.uses||0),successes=Number(row.successes||0);return{...row,uses,successes,success_rate:uses?successes/uses:null,runtime_evidence:uses>0?'outcome-scored':'not-yet-outcome-scored',execution_status:uses>0&&successes>0?'verified-by-outcome':row.status==='ready'?'ready-unverified':row.status}});
 const mcpRuntime=mcpTools.map(row=>({...row,execution_status:verifiedCalls.has(row.tool_name)?'verified-by-successful-call':row.server_status==='ready'?'discovered-unverified':'unavailable',last_verified_at:verifiedCalls.get(row.tool_name)||null,observed_failures:failureMap.get(row.tool_name)?.count||0}));
 const catalog=getIntegrationCatalog();
 const desired=[];for(const domain of MAGNANIMOUS_UNIVERSAL_CAPABILITY_DOMAINS)for(const capability of domain.capabilities)desired.push({domain:domain.name,capability});
 const evidenceHay=nativeRuntime.map(x=>`${x.name} ${x.family} ${x.purpose}`).join(' ');
 const mcpHay=mcpRuntime.map(x=>`${x.tool_name} ${x.description}`).join(' ');
 const builtinHay=MAGNANIMOUS_BUILTIN_CAPABILITY_FAMILIES.join(' ');
 const targetHay=catalog.flatMap(x=>x.capabilities).join(' ');
 const matrix=desired.map(item=>{
  const nativeScore=relevance(item.capability,evidenceHay),mcpScore=relevance(item.capability,mcpHay),builtinScore=relevance(item.capability,builtinHay),targetScore=relevance(item.capability,targetHay);
  const gap=gaps.find(g=>relevance(item.capability,g.capability)>=.6||relevance(g.capability,item.capability)>=.6);
  const status=nativeScore>=.75||mcpScore>=.75?'runtime-evidence':builtinScore>=.75?'declared-platform-family':targetScore>=.75?'adapter-target':'architectural-goal';
  return{...item,status,observed_gap:gap?{capability:gap.capability,count:Number(gap.count||0),status:gap.status}:null};
 });
 const readyNative=nativeRuntime.filter(x=>x.status==='ready'),verifiedNative=nativeRuntime.filter(x=>x.execution_status==='verified-by-outcome'),readyServers=servers.filter(x=>x.enabled&&x.status==='ready'),verifiedMcp=mcpRuntime.filter(x=>x.execution_status==='verified-by-successful-call');
 const nextBuild=runtimeFailures.filter(x=>x.count>=2).slice(0,6).map(x=>({type:'runtime-tool-reliability-gap',capability:`tool-${normalize(x.tool_name)}`,count:x.count,last_error:x.last_error,last_failed_at:x.last_failed_at}));
 for(const gap of [...gaps].filter(x=>x.status!=='learned').sort((a,b)=>Number(b.count||0)-Number(a.count||0))){if(nextBuild.length>=12)break;if(!nextBuild.some(x=>x.capability===gap.capability))nextBuild.push({type:'observed-gap',capability:gap.capability,count:Number(gap.count||0),example_task:gap.example_task,status:gap.status})}
 if(nextBuild.length<12){
  const existing=nativeRuntime.map(x=>`${x.name} ${x.purpose} ${x.family}`).join(' ');
  for(const item of catalog.filter(x=>['critical','high'].includes(x.priority))){if(nextBuild.length>=12)break;const represented=item.capabilities.some(c=>relevance(c,existing)>=.75)||item.capabilities.some(c=>relevance(c,mcpHay)>=.75);if(!represented)nextBuild.push({type:'adapter-target',capability:item.native_target||item.id,priority:item.priority,benchmark_capabilities:item.capabilities.slice(0,8),requires_connection:true});}
 }
 return{
  identity:'Magnanimous AI',mode:'runtime-capability-radar',available:true,generated_at:now(),
  truth_policy:{rule:'Capability claims must distinguish architecture, declared routing families, discovered connections, and verified execution evidence.',architectural_goal_is_not_runtime_proof:true,adapter_target_is_not_connected:true,discovered_tool_is_not_verified_until_successful_call:true,ready_recipe_is_not_outcome_verified_until_scored:true},
  counts:{universal_capability_goals:desired.length,declared_builtin_families:MAGNANIMOUS_BUILTIN_CAPABILITY_FAMILIES.length,native_recipes:nativeRuntime.length,ready_native_recipes:readyNative.length,outcome_verified_native_recipes:verifiedNative.length,connected_ready_mcp_servers:readyServers.length,discovered_mcp_tools:mcpRuntime.length,verified_mcp_tools:verifiedMcp.length,runtime_tool_failure_signals:runtimeFailures.length,observed_capability_gaps:gaps.filter(x=>x.status!=='learned').length,integration_benchmark_targets:catalog.length},
  builtin_families:MAGNANIMOUS_BUILTIN_CAPABILITY_FAMILIES,
  native_recipes:nativeRuntime.slice(0,200),
  mcp:{servers:servers.slice(0,100),tools:mcpRuntime.slice(0,500),recent_failure_signals:runtimeFailures.slice(0,50)},
  universal_matrix:matrix,
  top_gaps:gaps.slice(0,40),
  next_build:nextBuild,
  evolution_rule:'Detect → observe → propose → test → score → promote or rollback. Runtime failures are learning signals, not permission to bypass authorization or safety. Never manufacture a connection, permission, successful action, or capability claim.'
 };
}
