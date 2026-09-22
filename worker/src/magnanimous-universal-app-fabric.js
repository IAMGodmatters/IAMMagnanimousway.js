import {
 ABSORPTION_POLICY,
 getCapabilityAbsorptionManifest,
 getConnectorAbsorptionSummary
} from './magnanimous-connector-absorption.js';

const clip=(value,n=300)=>String(value??'').trim().slice(0,n);
const words=value=>[...new Set(String(value||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2))];

export const MAGNANIMOUS_UNIVERSAL_APP_FABRIC_POLICY=Object.freeze({
 identity:'Magnanimous Universal App Fabric',
 brain:'Magnanimous AI',
 identity_owner:'Magnanimous AI',
 reasoning_owner:'Magnanimous AI',
 orchestration_owner:'Magnanimous AI',
 memory_owner:'Magnanimous AI',
 verification_owner:'Magnanimous AI',
 learning_owner:'Magnanimous AI',
 provider_neutral:true,
 native_first:true,
 plugin_visibility_is_authorization:false,
 connection_truth:'A tool or plugin being visible never means an account is connected. Connected status comes only from tenant-scoped platform connection records.',
 implementation_truth:'An absorbed tool or skill contract is a Magnanimous capability specification until runtime evidence proves a native implementation.',
 proprietary_copying:false,
 external_boundary:'OAuth, live provider data, regulated/network rails and proprietary provider compute stay behind replaceable authorized adapters.',
 absorption_policy:ABSORPTION_POLICY
});

function safeRecipe(row){
 return{
  id:clip(row?.id,260),
  connector_id:clip(row?.connector_id,220),
  connector_name:clip(row?.connector_name,220),
  category:clip(row?.category,100),
  capability:clip(row?.capability,220),
  native_target:clip(row?.native_target,180),
  priority:clip(row?.priority,80),
  source_kind:clip(row?.source_kind,140),
  boundary:clip(row?.boundary,220),
  absorption_status:clip(row?.absorption_status,100),
  implementation_status:clip(row?.implementation_status,120),
  direct_connector:Boolean(row?.direct_connector),
  plugin_namespace:clip(row?.plugin_namespace,180),
  skill_name:clip(row?.skill_name,180),
  authorization_state:clip(row?.authorization_state||'not-assumed',100),
  visibility_state:clip(row?.visibility_state,100),
  initiative:row?.initiative&&typeof row.initiative==='object'?{
   suggestive:Boolean(row.initiative.suggestive),
   auto_initiate:Boolean(row.initiative.auto_initiate),
   requires_confirmation:Boolean(row.initiative.requires_confirmation),
   action_class:clip(row.initiative.action_class,100)
  }:null
 };
}

function buildIndex(){
 const rows=getCapabilityAbsorptionManifest();
 const sources={},targets={},categories={},connectors=new Set();
 for(const row of rows){
  const source=clip(row?.source_kind||'unknown',140)||'unknown';
  const target=clip(row?.native_target||'unmapped',180)||'unmapped';
  const category=clip(row?.category||'uncategorized',100)||'uncategorized';
  sources[source]=(sources[source]||0)+1;
  targets[target]=(targets[target]||0)+1;
  categories[category]=(categories[category]||0)+1;
  if(row?.connector_id)connectors.add(String(row.connector_id));
 }
 return{rows,sources,targets,categories,connectors};
}

export function getUniversalCapabilityIndexSummary(){
 const {rows,sources,targets,categories,connectors}=buildIndex();
 return{
  ...MAGNANIMOUS_UNIVERSAL_APP_FABRIC_POLICY,
  absorbed_capability_specs:rows.length,
  connector_skill_sources:connectors.size,
  source_kind_counts:sources,
  native_target_counts:targets,
  category_counts:categories,
  connector_absorption:getConnectorAbsorptionSummary()
 };
}

function scoreRecipe(row,terms){
 if(!terms.length)return 1;
 const hay=[
  row?.id,row?.connector_id,row?.connector_name,row?.category,row?.capability,row?.native_target,
  row?.source_kind,row?.plugin_namespace,row?.skill_name,row?.search_text
 ].join(' ').toLowerCase();
 let score=0;
 for(const term of terms){
  if(String(row?.capability||'').toLowerCase()===term)score+=12;
  else if(String(row?.capability||'').toLowerCase().includes(term))score+=8;
  if(String(row?.connector_name||'').toLowerCase().includes(term))score+=6;
  if(String(row?.native_target||'').toLowerCase().includes(term))score+=5;
  if(hay.includes(term))score+=2;
 }
 if(row?.direct_connector)score+=1;
 return score;
}

export function getUniversalCapabilityCatalog({query='',native_target='',source_kind='',limit=200,offset=0}={}){
 const index=buildIndex(),terms=words(query),target=clip(native_target,180).toLowerCase(),source=clip(source_kind,140).toLowerCase();
 const ranked=index.rows
  .map(row=>({row,score:scoreRecipe(row,terms)}))
  .filter(x=>(!terms.length||x.score>0)
   &&(!target||String(x.row?.native_target||'').toLowerCase()===target)
   &&(!source||String(x.row?.source_kind||'').toLowerCase()===source))
  .sort((a,b)=>b.score-a.score||String(a.row?.connector_name||'').localeCompare(String(b.row?.connector_name||'')));
 const start=Math.max(0,Number(offset)||0),take=Math.min(500,Math.max(1,Number(limit)||200));
 return{
  query:clip(query,500),
  total_matches:ranked.length,
  offset:start,
  limit:take,
  capabilities:ranked.slice(start,start+take).map(x=>({...safeRecipe(x.row),match_score:x.score})),
  truth:'Capability presence means the contract has been absorbed into Magnanimous routing knowledge; it does not imply a connected account or proven native execution.'
 };
}

export function resolveUniversalCapabilities(goal='',limit=20){
 const terms=words(goal),take=Math.min(50,Math.max(1,Number(limit)||20));
 const ranked=buildIndex().rows
  .map(row=>({row,score:scoreRecipe(row,terms)}))
  .filter(x=>x.score>0)
  .sort((a,b)=>b.score-a.score||String(a.row?.capability||'').localeCompare(String(b.row?.capability||'')))
  .slice(0,take);
 return{
  goal:clip(goal,1200),
  matches:ranked.map(x=>({...safeRecipe(x.row),match_score:x.score})),
  routing_rule:'Prefer proven Magnanimous native execution, then owner-controlled local execution, then an actually connected and authorized replaceable adapter.'
 };
}

async function dbRows(env,sql,params=[]){
 if(!env?.DB)return[];
 try{
  const stmt=env.DB.prepare(sql);
  const {results=[]}=params.length?await stmt.bind(...params).all():await stmt.all();
  return results||[];
 }catch{return[]}
}

function connectionKey(source,provider,external){return `${source}:${provider}:${external||'default'}`}

export async function getUniversalConnectionCatalog(env,tenantId=''){
 const tenant=clip(tenantId,180);
 if(!tenant)return[];
 const [general,social]=await Promise.all([
  dbRows(env,'SELECT provider,external_account_id,display_name,token_expires_at,updated_at FROM integrations WHERE tenant_id=? ORDER BY provider,updated_at DESC',[tenant]),
  dbRows(env,'SELECT provider,external_id,display_name,expires_at,updated_at FROM social_connections WHERE tenant_id=? ORDER BY provider,updated_at DESC',[tenant])
 ]);
 const map=new Map();
 for(const row of general){
  const provider=clip(row.provider,100),external=clip(row.external_account_id,220);
  map.set(connectionKey('integrations',provider,external),{
   provider,external_account_id:external,display_name:clip(row.display_name,240)||'Connected account',
   connected:true,authorized:true,connection_source:'integrations',token_expires_at:row.token_expires_at||null,
   action_surface:'assistant-integrations',publishing_surface:null
  });
 }
 for(const row of social){
  const provider=clip(row.provider,100),external=clip(row.external_id,220);
  map.set(connectionKey('social-connections',provider,external),{
   provider,external_account_id:external,display_name:clip(row.display_name,240)||'Connected social account',
   connected:true,authorized:true,connection_source:'social_connections',token_expires_at:row.expires_at||null,
   action_surface:'social-connect',
   publishing_surface:['linkedin','tiktok','youtube'].includes(provider)?`/api/social-connect/${provider}/publish`:null
  });
 }
 return[...map.values()].sort((a,b)=>a.provider.localeCompare(b.provider)||a.display_name.localeCompare(b.display_name));
}

export async function getMagnanimousUniversalAppFabricSummary(env,tenantId=''){
 const index=getUniversalCapabilityIndexSummary();
 const connections=await getUniversalConnectionCatalog(env,tenantId);
 const providers=[...new Set(connections.map(x=>x.provider))];
 return{
  identity:MAGNANIMOUS_UNIVERSAL_APP_FABRIC_POLICY.identity,
  brain:'Magnanimous AI',
  status:'ready',
  absorbed_capability_specs:index.absorbed_capability_specs,
  connector_skill_sources:index.connector_skill_sources,
  native_target_count:Object.keys(index.native_target_counts||{}).length,
  connected_account_count:connections.length,
  connected_provider_count:providers.length,
  connected_providers:providers,
  connections,
  connection_sources:{
   integrations:connections.filter(x=>x.connection_source==='integrations').length,
   social_connections:connections.filter(x=>x.connection_source==='social_connections').length
  },
  linkedin:{
   first_party_social_publishing_contract:true,
   connected:connections.some(x=>x.provider==='linkedin'),
   route:'/api/social-connect/linkedin/publish',
   authorization_inferred_from_plugin_visibility:false
  },
  rules:{
   native_first:true,
   free_first:true,
   plugin_visibility_is_authorization:false,
   external_actions_require_real_connected_rail:true,
   no_false_success_claims:true,
   proprietary_copying:false
  }
 };
}
