import {MAGNANIMOUS_UNIVERSAL_CAPABILITY_DOMAINS,MAGNANIMOUS_UNIVERSAL_EXECUTION_MODEL} from './magnanimous-universal-capabilities.js';
import {getConnectorAbsorptionSummary} from './magnanimous-connector-absorption.js';

export const MAGNANIMOUS_SINGLE_BRAIN_CONTRACT=Object.freeze({
 identity:'Magnanimous AI',
 platform:'I AM MAGNANIMOUS WAY™',
 public_ai_identity:'Magnanimous AI',
 public_specialist_identity:'Magnanimous AI specialist departments',
 orchestration_owner:'Magnanimous AI',
 memory_owner:'Magnanimous AI',
 reasoning_owner:'Magnanimous AI',
 policy_owner:'Magnanimous AI',
 verification_owner:'Magnanimous AI',
 learning_owner:'Magnanimous AI',
 skills_owner:'Magnanimous AI',
 routines_owner:'Magnanimous AI',
 public_provider_selection:false,
 public_model_selection:false,
 public_execution_metadata:false,
 provider_names_owner_only:true,
 specialist_rule:'Specialists are departments of Magnanimous AI, not separate AI products or independent brains.',
 infrastructure_rule:'Models, MCP servers, plugins, SaaS systems, carriers, browsers, hosts and cloud providers are replaceable execution rails beneath Magnanimous AI.',
 native_growth_rule:'Every reusable capability should be normalized into a Magnanimous-owned contract, recipe, skill or native runtime when practical.',
 truth_rule:'Magnanimous may unify identity and orchestration without falsely claiming ownership of third-party infrastructure, accounts, model weights or proprietary implementations.'
});

function capabilityCount(){
 return MAGNANIMOUS_UNIVERSAL_CAPABILITY_DOMAINS.reduce((n,row)=>n+(row.capabilities||[]).length,0);
}

export function getMagnanimousSingleBrainSummary(){
 const absorbed=getConnectorAbsorptionSummary();
 return{
  ...MAGNANIMOUS_SINGLE_BRAIN_CONTRACT,
  role:MAGNANIMOUS_UNIVERSAL_EXECUTION_MODEL.role,
  universal_capability_domains:MAGNANIMOUS_UNIVERSAL_CAPABILITY_DOMAINS.length,
  universal_capability_contracts:capabilityCount(),
  absorbed_capability_contracts:Number(absorbed.full_brain_capability_contracts||0),
  direct_platform_connectors:Number(absorbed.direct_platform_connectors||0),
  visible_plugin_tool_contracts:Number(absorbed.visible_plugin_tool_contracts||0),
  installed_plugin_skills:Number(absorbed.installed_plugin_skills||0),
  magnanimous_builder_tools:Number(absorbed.magnanimous_builder_tools||0),
  magnanimous_engineering_skills:Number(absorbed.magnanimous_engineering_skills||0),
  native_targets:Array.isArray(absorbed.native_targets)?absorbed.native_targets:[],
  connector_coverage:absorbed.direct_connector_coverage||{},
  absorption_status:absorbed.status||'unknown',
  execution_policy:{
   native_first:true,
   free_first:true,
   automatic_private_routing:true,
   external_execution_replaceable:true,
   approval_gates_preserved:true,
   tenant_isolation_preserved:true
  }
 };
}

export function magnanimousPublicRoutingSummary(providerRows=[]){
 const rows=Array.isArray(providerRows)?providerRows:[];
 const ready=rows.some(row=>Boolean(row?.configured&&row?.enabled!==false));
 return{
  identity:'Magnanimous AI',
  ready,
  routing_mode:'private-automatic',
  free_first:true,
  native_first:true,
  automatic_failover:true,
  execution_details_private:true,
  specialist_departments:true,
  provider_count_private:true,
  provider_details_private:true,
  message:ready
   ?'Magnanimous AI is ready and will privately select the best authorized execution path.'
   :'Magnanimous AI needs at least one ready execution path before this workspace can answer.'
 };
}
