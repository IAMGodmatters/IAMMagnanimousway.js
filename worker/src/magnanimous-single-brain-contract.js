import {MAGNANIMOUS_UNIVERSAL_CAPABILITY_DOMAINS,MAGNANIMOUS_UNIVERSAL_EXECUTION_MODEL} from './magnanimous-universal-capabilities.js';
import {getConnectorAbsorptionSummary} from './magnanimous-connector-absorption.js';
import {getVideoExpressCapabilityManifest,getVideoExpressAbsorptionSummary} from './magnanimous-videoexpress-capability-registry.js';
import {getArtlistCapabilityManifest,getArtlistAbsorptionSummary} from './magnanimous-artlist-capability-registry.js';
import {getMagnanimousVideoDirectorSummary} from './magnanimous-video-director.js';

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
 search_owner:'Magnanimous AI',
 link_rendering_owner:'Magnanimous AI',
 skills_owner:'Magnanimous AI',
 routines_owner:'Magnanimous AI',
 public_provider_selection:false,
 public_model_selection:false,
 public_execution_metadata:false,
 provider_names_owner_only:true,
 specialist_rule:'Specialists are departments of Magnanimous AI, not separate AI products or independent brains.',
 infrastructure_rule:'Models, MCP servers, plugins, SaaS systems, carriers, browsers, hosts and cloud providers are replaceable execution rails beneath Magnanimous AI.',
 native_growth_rule:'Every reusable capability should be normalized into a Magnanimous-owned contract, recipe, skill or native runtime when practical.',
 truth_rule:'Magnanimous may unify identity and orchestration without falsely claiming ownership of third-party infrastructure, accounts, model weights or proprietary implementations.',
 shared_core_rule:'Standalone, main chat and specialist departments inherit the same Magnanimous core memory, live-research, source-link, routing, verification and learning contracts; each surface may add purpose-specific tools without becoming a separate brain.',
 creative_control_plane_rule:'Creative sessions, project memory, prompt compilation, model capability matching, budget policy, rights/provenance policy and verification belong to Magnanimous AI; image, video, voice, music, avatar, stock and editor providers remain replaceable rails.',
 memory_architecture:Object.freeze({working:'bounded current-task and recent-turn context',episodic:'conversation, workflow and outcome history scoped to tenant/user',semantic:'retrievable workspace knowledge, research evidence and durable facts',procedural:'proven skills, recipes and reusable workflows',consolidation:'promote high-value stable knowledge; summarize/deduplicate noisy history; preserve provenance',virtual_memory_os:'Use OS virtual memory/swap only as a resilience cushion for transient memory pressure, never as a substitute for correctly sized RAM or durable AI memory.'})
});

function capabilityCount(){
 return MAGNANIMOUS_UNIVERSAL_CAPABILITY_DOMAINS.reduce((n,row)=>n+(row.capabilities||[]).length,0);
}

export function getMagnanimousSingleBrainSummary(){
 const absorbed=getConnectorAbsorptionSummary();
 const videoCapabilities=getVideoExpressCapabilityManifest();
 const videoBenchmark=getVideoExpressAbsorptionSummary();
 const artlistCapabilities=getArtlistCapabilityManifest();
 const artlistBenchmark=getArtlistAbsorptionSummary();
 const videoDirector=getMagnanimousVideoDirectorSummary();
 return{
  ...MAGNANIMOUS_SINGLE_BRAIN_CONTRACT,
  role:MAGNANIMOUS_UNIVERSAL_EXECUTION_MODEL.role,
  universal_capability_domains:MAGNANIMOUS_UNIVERSAL_CAPABILITY_DOMAINS.length,
  universal_capability_contracts:capabilityCount(),
  absorbed_capability_contracts:Number(absorbed.full_brain_capability_contracts||0)+videoCapabilities.length+artlistCapabilities.length,
  direct_platform_connectors:Number(absorbed.direct_platform_connectors||0),
  visible_plugin_tool_contracts:Number(absorbed.visible_plugin_tool_contracts||0),
  installed_plugin_skills:Number(absorbed.installed_plugin_skills||0),
  magnanimous_builder_tools:Number(absorbed.magnanimous_builder_tools||0),
  magnanimous_engineering_skills:Number(absorbed.magnanimous_engineering_skills||0),
  video_director_capability_contracts:videoCapabilities.length,
  video_director_capabilities:videoCapabilities.map(x=>x.capability),
  creative_control_plane_capability_contracts:artlistCapabilities.length,
  creative_control_plane_capabilities:artlistCapabilities.map(x=>x.capability),
  videoexpress_public_benchmark:videoBenchmark,
  artlist_public_benchmark:artlistBenchmark,
  video_director:videoDirector,
  native_targets:[...new Set([...(Array.isArray(absorbed.native_targets)?absorbed.native_targets:[]),...videoCapabilities.map(x=>x.native_target),...artlistCapabilities.map(x=>x.native_target)])].sort(),
  connector_coverage:absorbed.direct_connector_coverage||{},
  absorption_status:absorbed.status||'unknown',
  execution_policy:{
   native_first:true,
   free_first:true,
   automatic_private_routing:true,
   external_execution_replaceable:true,
   approval_gates_preserved:true,
   tenant_isolation_preserved:true,
   likeness_media_consent_gated:true,
   funded_specialized_media_compute_only:true,
   shared_core_capabilities_across_surfaces:true,
   live_multisource_research:true,
   clickable_source_links:true,
   memory_consolidation:true,
   creative_session_memory:true,
   capability_based_model_matching:true,
   generation_budget_preflight:true,
   media_provenance_tracking:true,
   licensed_assets_excluded_from_training:true
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
