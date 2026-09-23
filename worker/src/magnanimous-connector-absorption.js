import { INTEGRATIONS } from './integrations.js';
import { getIntegrationCatalog } from './magnanimous-integration-catalog.js';
import { CHATGPT_PLUGIN_CONTRACT_SNAPSHOT, getChatGPTPluginContractSummary } from './magnanimous-chatgpt-plugin-capability-snapshot.js';
import { INSTALLED_PLUGIN_SKILL_SNAPSHOT, getInstalledPluginSkillSummary } from './magnanimous-installed-plugin-skill-snapshot.js';
import { LIVE_PLUGIN_TOOL_RESEARCH_SNAPSHOT, getLivePluginToolResearchSummary } from './magnanimous-live-plugin-tool-research-snapshot.js';
import { LIVE_PLUGIN_SKILL_RESEARCH_SNAPSHOT, getLivePluginSkillResearchSummary } from './magnanimous-live-plugin-skill-research-snapshot.js';
import { MAGNANIMOUS_BUILDER_TOOL_CONTRACTS, getMagnanimousBuilderNativeTarget, getMagnanimousBuilderToolPolicy, getMagnanimousBuilderSummary } from './magnanimous-builder-capability-catalog.js';
import { MAGNANIMOUS_ENGINEERING_GUIDE_TOPICS, getMagnanimousTechniqueProfile, getMagnanimousTechniqueSummary, getMagnanimousGuideNativeTarget, getMagnanimousGuidePolicy } from './magnanimous-engineering-technique-catalog.js';
import { getRailwayCapabilityManifest, getRailwayPlatformCapabilityManifest, getRailwayTechniqueManifest, getRailwayAbsorptionSummary } from './magnanimous-railway-capability-registry.js';
import { getGrokCapabilityManifest, getGrokAbsorptionSummary } from './magnanimous-grok-capability-registry.js';
import { getImprovementGovernanceManifest, getImprovementGovernanceSummary } from './magnanimous-improvement-governance.js';
import { getB2BCapabilityManifest, getB2BSummary } from './magnanimous-b2b-capability-registry.js';

// Research ledger for the account connectors that I AM Magnanimous Way can authorize directly.
// These sources describe public API contracts only. They are not copied implementations.
export const DIRECT_CONNECTOR_RESEARCH=Object.freeze({
 google:{docs:['https://developers.google.com/workspace/gmail/api/guides','https://developers.google.com/workspace/gmail/api/guides/sending'],verified_at:'2026-09-19',notes:'Gmail read/send connector. Keep Google account authorization and mailbox data external.'},
 facebook:{docs:['https://developers.facebook.com/docs/pages-api/'],verified_at:'2026-09-19',notes:'Facebook Pages account/data/publishing rail. Magnanimous owns planning, content workflow, verification and learning.'},
 instagram:{docs:['https://developers.facebook.com/docs/instagram-platform/'],verified_at:'2026-09-19',notes:'Instagram professional-account media/profile/comment rail. Account authorization remains external.'},
 whatsapp:{docs:['https://developers.facebook.com/docs/whatsapp/cloud-api/'],verified_at:'2026-09-19',notes:'WhatsApp Business messaging rail. Templates, business account state and message delivery remain provider-side.'},
 shopify:{docs:['https://shopify.dev/docs/api/admin-graphql/latest'],verified_at:'2026-09-19',notes:'Shopify store data/action rail. Product, order and customer workflows are normalized behind Magnanimous contracts.'},
 shopee:{docs:['https://open.shopee.com/'],verified_at:'2026-09-19',notes:'Shopee seller account rail. Native Magnanimous commerce logic must not impersonate Shopee or bypass seller authorization.'},
 x:{docs:['https://docs.x.com/x-api'],verified_at:'2026-09-19',notes:'X public/account API rail for profile/post operations. Current API usage may be metered, so free-first and budget gates remain authoritative.'},
 snapchat:{docs:['https://developers.snap.com/api/marketing-api/'],verified_at:'2026-09-19',notes:'Snapchat Business marketing-account rail. Campaign mutation remains permission and budget controlled.'},
 outlook:{docs:['https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview','https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0'],verified_at:'2026-09-19',notes:'Microsoft Graph mailbox rail. Magnanimous owns message planning, normalization, memory and verification.'},
 slack:{docs:['https://docs.slack.dev/apis/web-api/'],verified_at:'2026-09-19',notes:'Slack workspace read/write rail. Workspace membership, channels and message delivery remain external.'},
 discord:{docs:['https://docs.discord.com/developers/intro'],verified_at:'2026-09-19',notes:'Discord guild/message rail. Guild membership and Discord delivery remain external.'},
 telegram:{docs:['https://core.telegram.org/bots/api'],verified_at:'2026-09-19',notes:'Telegram Bot API rail. Telegram documents a self-hostable local Bot API server, but Telegram network delivery and bot authorization remain external.'},
 'google-calendar':{docs:['https://developers.google.com/workspace/calendar/api/guides/overview','https://developers.google.com/workspace/calendar/api/auth'],verified_at:'2026-09-19',notes:'Google Calendar event/availability rail. Calendar account authorization remains external.'}
});

export const ABSORPTION_POLICY=Object.freeze({
 identity_owner:'Magnanimous AI',
 memory_owner:'Magnanimous AI',
 reasoning_owner:'Magnanimous AI',
 orchestration_owner:'Magnanimous AI',
 learning_owner:'Magnanimous AI',
 verification_owner:'Magnanimous AI',
 proprietary_copying:false,
 allowed_learning:'Observable capability classes, public API contracts, open standards, licensed/open-source components, user-authorized workflows and measured outcomes.',
 forbidden_learning:'Proprietary source code, hidden prompts, private model weights, stolen credentials, restricted datasets, provider secrets or private internals.',
 truth_rule:'A learned capability specification is not the same as a proven native implementation. Native status requires runtime evidence and regression verification.',
 external_rule:'Keep third-party accounts, live provider data, payment/network rails and specialized proprietary compute behind replaceable adapters.'
});

const DIRECT_IDS=new Set(INTEGRATIONS.map(x=>x.id));
const DIRECT_BY_ID=new Map(INTEGRATIONS.map(x=>[x.id,x]));
const LIVE_TOOL_BY_NAMESPACE=new Map();
for(const row of LIVE_PLUGIN_TOOL_RESEARCH_SNAPSHOT){
 const list=LIVE_TOOL_BY_NAMESPACE.get(row.namespace)||[];list.push(row);LIVE_TOOL_BY_NAMESPACE.set(row.namespace,list);
}
const LIVE_SKILL_BY_KEY=new Map(LIVE_PLUGIN_SKILL_RESEARCH_SNAPSHOT.map(x=>[`${x.plugin_namespace}/${x.skill_name}`,x]));
function toolContractMatch(a,b){
 const x=String(a||'').replace(/^_+/,'').toLowerCase(),y=String(b||'').replace(/^_+/,'').toLowerCase();
 return x===y||x.endsWith(`_${y}`)||y.endsWith(`_${x}`)||x.endsWith(y)||y.endsWith(x);
}
function liveToolResearch(namespace,tool){
 const rows=LIVE_TOOL_BY_NAMESPACE.get(namespace)||[];
 return rows.find(x=>toolContractMatch(x.tool,tool))||null;
}

function words(value){return String(value||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2)}
function boundaryFor(item){
 if(DIRECT_IDS.has(item.id))return'authorized-external-account-rail';
 if(['payments','finance-data','local'].includes(item.category))return'external-world-data-or-rail';
 if(['productivity','sales','crm','marketing','commerce','operations','email','calendar','social','messaging','work'].includes(item.category))return'external-account-action-when-live';
 if(item.category==='ai-provider')return'replaceable-compute-engine';
 if(item.category==='deployment'||item.category==='engineering')return'external-repository-or-deployment-target-when-live';
 if(['research','analytics','security'].includes(item.category))return'live-data-adapter-when-current-data-required';
 if(['media','design'].includes(item.category))return'optional-specialized-compute';
 return'none-or-optional-adapter';
}
function ownedParts(){
 return['intent-understanding','input-normalization','planning','policy','memory','workflow','tool-selection','result-normalization','verification','failure-recovery','outcome-learning'];
}
function externalParts(boundary){
 if(boundary==='authorized-external-account-rail'||boundary==='external-account-action-when-live')return['account-authorization','live-account-data','provider-side-write-or-delivery'];
 if(boundary==='external-world-data-or-rail')return['regulated-or-live-external-rail'];
 if(boundary==='replaceable-compute-engine')return['model-compute'];
 if(boundary==='external-repository-or-deployment-target-when-live')return['repository-or-hosting-account'];
 if(boundary==='live-data-adapter-when-current-data-required')return['fresh-external-data'];
 if(boundary==='optional-specialized-compute')return['specialized-generation-compute-when-needed'];
 return[];
}
function initiativePolicy(name='',purpose='',boundary=''){
 const hay=(String(name||'')+' '+String(purpose||'')).toLowerCase();
 const destructive=/\b(delete|remove|revoke|uninstall|drop|purge|terminate|unpublish|cancel|disable|trash)\b/.test(hay);
 const financial=/\b(pay|payment|charge|refund|payout|transfer|purchase|checkout|invoice|billing|bank|withdraw)\b/.test(hay);
 const communications=/\b(send|reply|forward|message|sms|call|dial|publish|post|comment|email|invite)\b/.test(hay);
 const credentials=/\b(secret|credential|permission|oauth|token|key|provision|connect|resource|domain|deploy|merge|commit|write|edit|update|create|upload|execute|run code|sql|query mutation)\b/.test(hay);
 const safeRead=/^(get|list|read|search|find|fetch|inspect|check|status|preview|screenshot|query|lookup|describe|discover|typecheck|test|logs?)(\b|[_-])/.test(String(name||'').toLowerCase())&&!destructive&&!financial&&!communications&&!credentials;
 let action_class='write-or-external-action',requires_confirmation=false,auto_initiate=false;
 if(safeRead){action_class='read-inspect-verify';auto_initiate=true}
 else if(destructive){action_class='destructive';requires_confirmation=true}
 else if(financial){action_class='financial';requires_confirmation=true}
 else if(communications){action_class='communications-or-publish';requires_confirmation=true}
 else if(credentials){action_class='configuration-or-write';requires_confirmation=true}
 if(/external|account|rail|repository|deployment|provider|network|compute/.test(String(boundary||'').toLowerCase())&&action_class!=='read-inspect-verify')requires_confirmation=true;
 return{suggestive:true,auto_initiate,requires_confirmation,action_class};
}

function capabilityRecipe(item,capability,boundary){
 const initiative=initiativePolicy(capability,`${item.name} ${item.category}`,boundary);
 return{
  id:`${item.id}:${capability}`,
  connector_id:item.id,
  connector_name:item.name,
  category:item.category,
  capability,
  native_target:item.native_target||null,
  priority:item.priority,
  source_kind:DIRECT_IDS.has(item.id)?'live-platform-connector-contract':'plugin-or-provider-benchmark-contract',
  direct_connector:DIRECT_IDS.has(item.id),
  boundary,
  absorption_status:'brain-spec-absorbed',
  implementation_status:'specified-not-assumed-native',
  magnanimous_owned:ownedParts(),
  external_only:externalParts(boundary),
  acceptance_tests:[
   'Provider-independent input and output contract exists.',
   'Magnanimous planning, policy, memory, normalization and verification do not depend on provider branding.',
   'External authorization or live rails remain isolated behind a replaceable adapter when required.',
   'No external action is claimed without a real authorized result.',
   'Native status is granted only after runtime and regression evidence.'
  ],
  initiative,
  recipe:[
   `Understand the user outcome for ${capability} without depending on ${item.name} internals.`,
   'Retrieve Magnanimous memory, approved knowledge and existing native recipes first.',
   'Plan the workflow using Magnanimous-owned reasoning, policy and data contracts.',
   `Prefer the Magnanimous native target ${item.native_target||'for this capability'} when runtime evidence says it is ready.`,
   'If a live account, fresh provider data, network rail or specialized compute is still required, call only the authorized replaceable adapter.',
   'Normalize the result into a stable Magnanimous-owned shape and verify the requested outcome.',
   'Record success, failure, latency, cost and reusable lessons so the native path can improve.'
  ]
 };
}

export function getConnectorAbsorptionCatalog(){
 return getIntegrationCatalog().map(item=>{
  const direct=DIRECT_BY_ID.get(item.id)||null,boundary=boundaryFor(item),research=DIRECT_CONNECTOR_RESEARCH[item.id]||{docs:[],verified_at:'',notes:'Capability benchmark captured from the current connector/plugin contract; provider-specific implementation remains replaceable.'};
  const capabilities=[...new Set([...(item.capabilities||[]),...(direct?.capabilities||[])])];
  return{
   ...item,
   capabilities,
   direct_connector:Boolean(direct),
   direct_contract:direct?{auth:direct.auth,scopes:[...(direct.scopes||[])],capabilities:[...(direct.capabilities||[])],secret_names:[...(direct.env||[])]}:null,
   research,
   absorption:{status:'brain-spec-absorbed',boundary,implementation_status:'specified-not-assumed-native',magnanimous_owned:ownedParts(),external_only:externalParts(boundary)}
  };
 });
}

export function getPersistentConnectorAbsorptionManifest(){
 return getConnectorAbsorptionCatalog().flatMap(item=>(item.capabilities||[]).map(cap=>capabilityRecipe(item,cap,item.absorption.boundary)));
}
function pluginNativeTarget(plugin){
 const tools=plugin.tools||[];
 const hay=(plugin.namespace+' '+tools.join(' ')).toLowerCase();
 if(/mail|gmail|outlook|slack|discord|telegram|call|sms|whatsapp|voice|phone|record|transcri/.test(hay))return'communications-hub';
 if(/calendar|booking|schedule/.test(hay))return'scheduling-engine';
 if(/github|git|deploy|vercel|netlify|railway|digitalocean|aiven|appdeploy|shipstatic|val.town|replit|basicdeploy|manufact/.test(hay))return'deployment-operator';
 if(/postgres|database|sql|neon|airtable|data/.test(hay))return'data-platform';
 if(/figma|canva|adobe|pixel|color|whiteboard|design/.test(hay))return'design-studio';
 if(/video|image|audio|music|animation|avatar|magnific|heygen|krikey|morphix|youcam/.test(hay))return'creative-studio';
 if(/crm|apollo|close|hubspot|zoho|prospect|sales|lead/.test(hay))return'crm-growth-engine';
 if(/shop|commerce|product|dropship|zendrop|shopee|storeinspect/.test(hay))return'commerce-engine';
 if(/ads|marketing|metricool|windsor|vidiq|linkedin|campaign|seo/.test(hay))return'growth-analytics';
 if(/pdf|document|notion|drive|files|scribe|transcript/.test(hay))return'workspace-files';
 if(/research|search|tavily|scispace|token.terminal|product.hunt/.test(hay))return'research-orchestrator';
 if(/agent|automation|workflow/.test(hay))return'agent-mesh';
 return'universal-tool-gateway';
}
function pluginCapabilityRecipe(plugin,tool){
 const capability=String(tool||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'tool-action',native_target=pluginNativeTarget(plugin),research=liveToolResearch(plugin.namespace,tool),genericInitiative=initiativePolicy(tool,research?.purpose||plugin.name,'external-plugin-account-or-provider-rail-when-required');
 return{
  id:`${plugin.id}:${capability}`,connector_id:plugin.id,connector_name:plugin.name,category:'plugin-contract',capability,native_target,priority:'observed',
  source_kind:plugin.source_kind,direct_connector:false,boundary:'external-plugin-account-or-provider-rail-when-required',
  absorption_status:'brain-spec-absorbed',implementation_status:'specified-not-assumed-native',
  magnanimous_owned:ownedParts(),external_only:['plugin/account authorization when required','live provider data or delivery when required'],
  acceptance_tests:['Provider-independent input/output contract can be described.','Magnanimous owns planning, memory, policy, normalization and verification.','Account authorization is never inferred from tool visibility.','Native status requires independent runtime evidence.'],
  recipe:[`Understand the observable outcome of ${tool} without copying provider internals.`,'Map inputs/outputs into a stable Magnanimous tool contract.','Reuse native Magnanimous services first.','Use the plugin/provider only when authorized or when live provider data/compute is genuinely required.','Verify the result and record reusable outcome lessons.'],
  plugin_namespace:plugin.namespace,authorization_state:plugin.authorization_state,
  search_text:research?.purpose||tool,
  visibility_state:research?'live-visible':'historical-observed',
  initiative:genericInitiative,
  research:{captured_at:research?'2026-09-20':'historical',source_kind:research?'live-observable-plugin-tool-catalog':plugin.source_kind,public_purpose:research?.purpose||'',authorization_state:'not-assumed',proprietary_implementation_copied:false}
 };
}
function liveOnlyPluginRecipes(){
 const out=[];
 for(const row of LIVE_PLUGIN_TOOL_RESEARCH_SNAPSHOT){
  const historical=CHATGPT_PLUGIN_CONTRACT_SNAPSHOT.find(x=>x.namespace===row.namespace);
  if(historical&&(historical.tools||[]).some(tool=>toolContractMatch(row.tool,tool)))continue;
  const slug=String(row.namespace||'plugin').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'plugin';
  out.push(pluginCapabilityRecipe({id:`chatgpt-plugin:${slug}`,namespace:row.namespace,name:String(row.namespace).replaceAll('_',' '),source_kind:'live-observable-plugin-tool-catalog',authorization_state:'not-assumed',tools:[row.tool]},row.tool));
 }
 return out;
}
export function getChatGPTPluginCapabilityManifest(){
 const historical=CHATGPT_PLUGIN_CONTRACT_SNAPSHOT.flatMap(plugin=>(plugin.tools||[]).map(tool=>pluginCapabilityRecipe(plugin,tool)));
 return [...historical,...liveOnlyPluginRecipes()];
}
function installedSkillRecipe(tuple){
 const [plugin,skill,description]=tuple,live=LIVE_SKILL_BY_KEY.get(`${plugin}/${skill}`)||null,native_target=pluginNativeTarget({namespace:plugin,tools:[skill,live?.purpose||description]}),initiative=initiativePolicy(skill,live?.purpose||description,'external-plugin-account-or-provider-rail-when-required');
 const slug=String(skill||'skill').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'skill';
 return{
  id:`plugin-skill:${plugin}:${slug}`,connector_id:`plugin-skill:${plugin}`,connector_name:`${plugin} skill pack`,category:'plugin-skill',
  capability:`skill-${slug}`,native_target,priority:'observed',source_kind:'installed-plugin-skill-contract',direct_connector:false,
  boundary:'external-plugin-account-or-provider-rail-when-required',absorption_status:'brain-spec-absorbed',implementation_status:'specified-not-assumed-native',
  magnanimous_owned:['skill-selection',...ownedParts()],external_only:['plugin/account authorization when required','provider-specific execution when required'],
  acceptance_tests:['Skill purpose can be expressed provider-neutrally.','Only the observable skill name/purpose is learned; private skill implementation is not copied.','Magnanimous owns routing, memory, policy and verification.','Native status requires independent implementation evidence.'],
  recipe:[`Apply the observable procedure goal of ${skill} through Magnanimous-owned planning and verification.`,'Use the concise skill purpose as routing guidance, not as authority to copy private implementation.','Prefer native Magnanimous workflows and open standards.','Use any external account/provider only when separately authorized and actually required.','Verify the result and learn reusable low-risk steps.'],
  plugin_namespace:plugin,skill_name:skill,search_text:live?.purpose||description,authorization_state:'not-assumed',initiative,
  visibility_state:live?'live-visible':'historical-observed',
  research:{captured_at:live?'2026-09-20':'historical',source_kind:live?'live-observable-installed-skill-catalog':'observable-installed-skill-contract',public_purpose:live?.purpose||description,authorization_state:'not-assumed',private_skill_implementation_copied:false}
 };
}
export function getInstalledPluginSkillManifest(){
 return INSTALLED_PLUGIN_SKILL_SNAPSHOT.map(installedSkillRecipe);
}
function magnanimousBuilderCapabilityRecipe(row){
 const tool=String(row?.tool||'tool-action'),capability=tool.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'tool-action',policy=getMagnanimousBuilderToolPolicy(tool);
 return{
  id:`magnanimous-builder:${capability}`,connector_id:'magnanimous-builder',connector_name:'Magnanimous Builder',category:'magnanimous-first-party',
  capability:`builder-${capability}`,native_target:getMagnanimousBuilderNativeTarget(tool),priority:'first-party',source_kind:'magnanimous-first-party-builder-contract',direct_connector:false,
  boundary:'none-or-replaceable-external-rail',absorption_status:'brain-spec-absorbed',implementation_status:'specified-not-assumed-native',
  magnanimous_owned:['contract-definition',...ownedParts()],external_only:['authorized external execution rail only when the real-world action requires one'],
  acceptance_tests:['The operation contract is owned by Magnanimous AI.','Magnanimous planning, memory, policy, routing and verification remain provider-independent.','No provider visibility or account authorization is inferred.','Native-ready status still requires runtime evidence.'],
  recipe:[`Apply the Magnanimous Builder operation ${tool}.`,'Use Magnanimous-owned project, workspace, data, verification and policy surfaces first.','Use an external execution rail only when the requested real-world action cannot be completed internally.','Verify the result and record reusable outcome lessons.'],
  search_text:String(row?.purpose||tool),authorization_state:'magnanimous-first-party',initiative:{suggestive:true,auto_initiate:policy.auto_initiate,requires_confirmation:policy.requires_confirmation,action_class:policy.action_class,family:policy.family},
  visibility_state:'first-party',
  research:{captured_at:'2026-09-20',source_kind:'magnanimous-first-party-builder-contract',public_purpose:String(row?.purpose||''),authorization_state:'magnanimous-first-party',proprietary_implementation_copied:false}
 };
}
export function getMagnanimousBuilderCapabilityManifest(){
 return MAGNANIMOUS_BUILDER_TOOL_CONTRACTS.map(magnanimousBuilderCapabilityRecipe);
}
function magnanimousEngineeringSkillRecipe(row){
 const skill=String(row?.id||'guide'),description=String(row?.purpose||''),slug=skill.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'guide',initiative=getMagnanimousGuidePolicy(skill),techniqueProfile=getMagnanimousTechniqueProfile(skill);
 return{
  id:`magnanimous-engineering-skill:${slug}`,connector_id:'magnanimous-engineering',connector_name:'Magnanimous Engineering',category:'magnanimous-skill',
  capability:`skill-magnanimous-${slug}`,native_target:getMagnanimousGuideNativeTarget(skill),priority:'first-party',source_kind:'magnanimous-first-party-engineering-guide',direct_connector:false,
  boundary:'none-or-replaceable-external-rail',absorption_status:'brain-spec-absorbed',implementation_status:'specified-not-assumed-native',
  magnanimous_owned:['skill-selection','technique-synthesis','contract-definition',...ownedParts()],external_only:['authorized external execution rail only when the actual operation requires one'],
  techniques:techniqueProfile.techniques,
  acceptance_tests:['Technique purpose is represented as a Magnanimous-owned provider-neutral workflow contract.','No external provider implementation is required to select or reason over the technique.','Any real external account or infrastructure action remains separately authorized.','Magnanimous owns planning, memory, policy, verification and outcome learning.'],
  recipe:[`Apply the Magnanimous engineering technique family ${skill}.`,'Use the first-party technique profile as implementation guidance.',...techniqueProfile.techniques.map(x=>`Apply reusable Magnanimous technique: ${x}.`),'Prefer existing Magnanimous native runtime surfaces when they can satisfy the outcome.','Use a replaceable external rail only when reality requires it.','Verify the result and record reusable low-risk lessons.'],
  skill_name:skill,search_text:description,authorization_state:'magnanimous-first-party',initiative,
  visibility_state:'first-party',
  research:{captured_at:'2026-09-20',source_kind:'magnanimous-first-party-engineering-guide',public_purpose:description,authorization_state:'magnanimous-first-party',private_skill_implementation_copied:false,technique_source_kind:techniqueProfile.source_kind,techniques:techniqueProfile.techniques}
 };
}
export function getMagnanimousEngineeringSkillManifest(){
 return MAGNANIMOUS_ENGINEERING_GUIDE_TOPICS.map(magnanimousEngineeringSkillRecipe);
}
export function getCapabilityAbsorptionManifest(){
 return [...getPersistentConnectorAbsorptionManifest(),...getChatGPTPluginCapabilityManifest(),...getInstalledPluginSkillManifest(),...getMagnanimousBuilderCapabilityManifest(),...getMagnanimousEngineeringSkillManifest(),...getRailwayCapabilityManifest(),...getRailwayPlatformCapabilityManifest(),...getRailwayTechniqueManifest(),...getGrokCapabilityManifest(),...getImprovementGovernanceManifest(),...getB2BCapabilityManifest()];
}

export function getConnectorAbsorptionSummary(){
 const catalog=getConnectorAbsorptionCatalog(),persistent=getPersistentConnectorAbsorptionManifest(),historicalPlugins=getChatGPTPluginContractSummary(),pluginManifest=getChatGPTPluginCapabilityManifest(),historicalSkills=getInstalledPluginSkillSummary(),skillManifest=getInstalledPluginSkillManifest(),builderManifest=getMagnanimousBuilderCapabilityManifest(),engineeringManifest=getMagnanimousEngineeringSkillManifest(),railwayManifest=getRailwayCapabilityManifest(),railwayPlatform=getRailwayPlatformCapabilityManifest(),railwayTechniques=getRailwayTechniqueManifest(),railway=getRailwayAbsorptionSummary(),grokManifest=getGrokCapabilityManifest(),grok=getGrokAbsorptionSummary(),governanceManifest=getImprovementGovernanceManifest(),governance=getImprovementGovernanceSummary(),b2bManifest=getB2BCapabilityManifest(),b2b=getB2BSummary(),liveToolRows=LIVE_PLUGIN_TOOL_RESEARCH_SNAPSHOT,liveSkills=getLivePluginSkillResearchSummary(),builder=getMagnanimousBuilderSummary(),engineering=getMagnanimousTechniqueSummary(),directCatalogued=new Set(catalog.filter(x=>x.direct_connector).map(x=>x.id));
 const missingDirect=INTEGRATIONS.filter(x=>!directCatalogued.has(x.id)).map(x=>x.id);
 const pluginNamespaces=new Set([...CHATGPT_PLUGIN_CONTRACT_SNAPSHOT.map(x=>x.namespace),...liveToolRows.map(x=>x.namespace)]);
 const liveTools={live_plugin_namespaces:new Set(liveToolRows.map(x=>x.namespace)).size,live_tool_contracts:liveToolRows.length};
 const skillNamespaces=new Set(INSTALLED_PLUGIN_SKILL_SNAPSHOT.map(x=>x[0]));
 const historicalToolNamespaces=[...new Set(CHATGPT_PLUGIN_CONTRACT_SNAPSHOT.map(x=>x.namespace))].filter(x=>!LIVE_TOOL_BY_NAMESPACE.has(x));
 const liveOnlyToolNamespaces=[...new Set(liveToolRows.map(x=>x.namespace))].filter(x=>!CHATGPT_PLUGIN_CONTRACT_SNAPSHOT.some(p=>p.namespace===x));
 const historicalSkillCount=INSTALLED_PLUGIN_SKILL_SNAPSHOT.filter(x=>!LIVE_SKILL_BY_KEY.has(`${x[0]}/${x[1]}`)).length;
 return{
  identity:'Magnanimous AI',
  connector_benchmarks:catalog.length,
  direct_platform_connectors:INTEGRATIONS.length,
  capability_specs:persistent.length,
  visible_plugin_namespaces:pluginNamespaces.size,
  visible_plugin_tool_contracts:pluginManifest.length,
  currently_visible_plugin_namespaces:liveTools.live_plugin_namespaces,
  currently_visible_plugin_tool_contracts:liveTools.live_tool_contracts,
  historical_plugin_namespaces:historicalToolNamespaces.length,
  live_only_plugin_namespaces:liveOnlyToolNamespaces.length,
  installed_plugin_skill_namespaces:skillNamespaces.size,
  installed_plugin_skills:skillManifest.length,
  magnanimous_builder_tools:builderManifest.length,
  magnanimous_engineering_skills:engineeringManifest.length,
  magnanimous_engineering_technique_profiles:engineering.guide_profiles,
  magnanimous_reusable_engineering_techniques:engineering.reusable_techniques,
  railway_tool_contracts:railwayManifest.length,
  railway_operational_techniques:railwayTechniques.length,
  railway,
  grok_capability_contracts:grokManifest.length,
  grok,
  improvement_governance_contracts:governanceManifest.length,
  improvement_governance:governance,
  b2b_capability_contracts:b2bManifest.length,
  b2b,
  currently_visible_plugin_skill_namespaces:liveSkills.live_skill_namespaces,
  currently_visible_plugin_skills:liveSkills.live_skill_contracts,
  historical_plugin_skills:historicalSkillCount,
  full_brain_capability_contracts:persistent.length+pluginManifest.length+skillManifest.length+builderManifest.length+engineeringManifest.length+railwayManifest.length+railwayTechniques.length+grokManifest.length+governanceManifest.length+b2bManifest.length,
  plugin_authorization_state:'not-assumed',
  first_party_builder_runtime:true,
  one_by_one_research:true,
  builder,
  research_sources:['official direct connector API documentation','live observable plugin tool catalog excluding retired providers','observable installed skill catalog','Magnanimous first-party builder contracts','Magnanimous first-party engineering technique catalog','Railway public documentation and observable tool contracts','Grok/xAI official public product and API capability documentation','user-authorized reusable engineering/governance patterns with domain-specific content excluded','official B2B commerce, wholesale, airline, GDS, hotel, activities and corporate-travel capability documentation','historical observable contracts retained for continuity'],
  native_targets:[...new Set([...catalog.map(x=>x.native_target).filter(Boolean),...CHATGPT_PLUGIN_CONTRACT_SNAPSHOT.map(pluginNativeTarget),...liveToolRows.map(x=>pluginNativeTarget({namespace:x.namespace,tools:[x.tool,x.purpose]})),...INSTALLED_PLUGIN_SKILL_SNAPSHOT.map(x=>pluginNativeTarget({namespace:x[0],tools:[x[1],x[2]]})),...MAGNANIMOUS_BUILDER_TOOL_CONTRACTS.map(x=>getMagnanimousBuilderNativeTarget(x.tool)),...MAGNANIMOUS_ENGINEERING_GUIDE_TOPICS.map(x=>getMagnanimousGuideNativeTarget(x.id)),...railwayManifest.map(x=>x.native_target),...railwayPlatform.map(x=>x.native_target),...railwayTechniques.map(x=>x.native_target),...grokManifest.map(x=>x.native_target),...governanceManifest.map(x=>x.native_target),...b2bManifest.map(x=>x.native_target)])].sort(),
  direct_connector_coverage:{covered:INTEGRATIONS.length-missingDirect.length,total:INTEGRATIONS.length,missing:missingDirect},
  absorption_policy:ABSORPTION_POLICY,
  status:missingDirect.length?'coverage-gap':'catalog-complete'
 };
}

export function getPluginIndependenceReadiness(){
 const rows=getCapabilityAbsorptionManifest();
 const byTarget=new Map();
 for(const row of rows){
  const target=row.native_target||'magnanimous-core';
  const bucket=byTarget.get(target)||{native_target:target,total:0,first_party:0,external_benchmarks:0,confirmation_gated:0};
  bucket.total++;
  if(row.category==='magnanimous-first-party'||row.category==='magnanimous-skill'||row.priority==='first-party')bucket.first_party++;
  else bucket.external_benchmarks++;
  if(row.initiative?.requires_confirmation)bucket.confirmation_gated++;
  byTarget.set(target,bucket);
 }
 const targets=[...byTarget.values()].map(x=>({...x,native_coverage_ratio:x.total?Number((x.first_party/x.total).toFixed(3)):0,provider_optional:x.external_benchmarks===0})).sort((a,b)=>a.native_coverage_ratio-b.native_coverage_ratio||b.external_benchmarks-a.external_benchmarks);
 return{
  identity:'Magnanimous AI',
  status:targets.every(x=>x.provider_optional)?'native-independent':'migration-in-progress',
  total_capability_contracts:rows.length,
  native_targets:targets.length,
  provider_optional_targets:targets.filter(x=>x.provider_optional).length,
  targets,
  next_native_targets:targets.filter(x=>!x.provider_optional).slice(0,12),
  retirement_rule:'A provider is optional only when the required user outcome has an independently implemented Magnanimous runtime, contract tests, security verification, production canary evidence and rollback proof. Contract inventory alone never qualifies.'
 };
}

export function getCapabilityResearchRecord(row){
 if(row?.connector_id==='railway'||row?.connector_id==='railway-techniques')return{...(row.research||{}),capability:row.capability,connector_id:row.connector_id,one_by_one_researched:true};
 if(row?.direct_connector){
  const direct=DIRECT_CONNECTOR_RESEARCH[row.connector_id]||{};
  return{...direct,source_kind:row.source_kind,capability:row.capability,connector_id:row.connector_id,one_by_one_researched:true};
 }
 if(row?.category==='plugin-contract')return{...(row.research||{}),capability:row.capability,connector_id:row.connector_id,plugin_namespace:row.plugin_namespace,one_by_one_researched:true};
 if(row?.category==='plugin-skill'||row?.category==='magnanimous-skill'||row?.category==='magnanimous-first-party')return{...(row.research||{}),capability:row.capability,connector_id:row.connector_id,plugin_namespace:row.plugin_namespace||'',skill_name:row.skill_name||'',one_by_one_researched:true};
 return{source_kind:row?.source_kind||'benchmark-contract',capability:row?.capability||'',connector_id:row?.connector_id||'',one_by_one_researched:true,notes:'Observable capability benchmark retained as a provider-neutral Magnanimous specification.'};
}

export function rankAbsorbedCapabilities(goal='',limit=12){
 const terms=words(goal),rows=getCapabilityAbsorptionManifest();
 return rows.map(row=>{
  const hay=words([row.connector_id,row.connector_name,row.category,row.capability,row.native_target,row.search_text||'',...(row.techniques||[])].join(' '));
  const score=terms.reduce((n,t)=>n+(hay.some(x=>x.includes(t)||t.includes(x))?1:0),0)+(row.direct_connector?0.2:0);
  return{...row,score};
 }).sort((a,b)=>b.score-a.score||String(a.connector_name).localeCompare(String(b.connector_name))).slice(0,Math.max(1,Math.min(30,Number(limit)||12)));
}

export function getConnectorAbsorptionPrompt(goal=''){
 const ranked=rankAbsorbedCapabilities(goal,10);
 if(!ranked.length)return'';
 const lines=['MAGNANIMOUS ABSORBED CONNECTOR / PLUGIN TOOL / PLUGIN SKILL SPECS:'];
 for(const x of ranked){
  const initiative=x.initiative||{};
  const action=initiative.auto_initiate?'safe-read/verification may be initiated when the required surface is available':initiative.requires_confirmation?'suggest/stage only until the existing confirmation/permission gate is satisfied':'suggest and route through the authorized execution surface';
  lines.push(`- ${x.capability} → native target ${x.native_target||'Magnanimous core'}; boundary=${x.boundary}; benchmark=${x.connector_name}; techniques=${(x.techniques||[]).slice(0,4).join('|')||'base-workflow'}; initiative=${action}.`);
 }
 lines.push('Treat these as Magnanimous-owned workflow/skill specifications, not proof that an external account is connected or that every capability is already fully native. ChatGPT-visible plugin and installed-skill contracts do not imply authorization inside I AM. Only observable skill purposes are learned; private skill implementation files are not copied. Keep provider-specific accounts and rails replaceable.');
 lines.push('INITIATIVE RULE: suggest useful next actions proactively. Auto-initiate only read-only inspection, research, status, test, preview, and verification operations that are actually available and authorized. Writes, code execution, database mutation, provisioning, publishing/deployment, messaging/calling, payments, credentials, permissions, deletion, and destructive actions must use their existing confirmation/permission gates and real tool results.');
 return lines.join('\n');
}
