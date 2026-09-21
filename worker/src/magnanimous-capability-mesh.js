import { currentUser } from './integrations.js';
import { requirePlatformOwner } from './platform-owner-guard.js';
import { magnanimousCloudflareSummary, MAGNANIMOUS_CLOUDFLARE_FAMILIES } from './magnanimous-cloudflare-capability-registry.js';
import { handleMagnanimousCloudflare } from './magnanimous-cloudflare-runtime.js';
import { MAGNANIMOUS_WEB_PARITY, handleMagnanimousNativeWeb } from './magnanimous-native-web-runtime.js';
import { MAGNANIMOUS_DEV_SKILLS, magnanimousDevAgentSummary, handleMagnanimousDevAgent } from './magnanimous-dev-agent.js';
import { RAILWAY_VISIBLE_TOOL_CONTRACTS, RAILWAY_ARCHITECTURE_TECHNIQUES, handleMagnanimousCloudProvider } from './magnanimous-cloud-provider-core.js';
import { findReadyLocalBridgeDevice, hasAnyReadyLocalBridgeCapability } from './magnanimous-local-bridge-runtime.js';
import { MAGNANIMOUS_NATIVE_MEDIA_FAMILIES, MAGNANIMOUS_NATIVE_MEDIA_CAPABILITIES, MAGNANIMOUS_HEYGEN_PARITY_MAP, HEYGEN_VISIBLE_BENCHMARK_TOOLS, getMagnanimousNativeMediaSummary, handleMagnanimousNativeMedia } from './magnanimous-native-media-studio.js';
import { MAGNANIMOUS_NATIVE_TERMINAL_CAPABILITIES, getMagnanimousNativeTerminalSummary, handleMagnanimousNativeTerminal } from './magnanimous-native-terminal.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clip=(v,n=4000)=>String(v??'').trim().slice(0,n);
const truthy=v=>['1','true','yes','on'].includes(String(v||'').trim().toLowerCase());

export const MAGNANIMOUS_CAPABILITY_MESH_POLICY=Object.freeze({
 identity:'Magnanimous Capability Mesh',
 brain:'Magnanimous AI',
 orchestration_owner:'Magnanimous AI',
 memory_owner:'Magnanimous AI',
 verification_owner:'Magnanimous AI',
 provider_identity_public:false,
 architecture:'native-first-provider-neutral-capability-router',
 routing_order:['Magnanimous native runtime','owner-controlled local execution','authorized account adapter','replaceable infrastructure rail'],
 consequential_rule:'Mutations are delegated only to existing staged/confirmation-gated handlers; the mesh never bypasses approval gates.',
 truth_rule:'A documented capability contract is not reported live until runtime evidence or configured authorization makes its execution surface ready.'
});

export const MAGNANIMOUS_CAPABILITY_MESH_ROUTES=Object.freeze({
 'web.search':{surface:'native-web',mode:'read',native:true},
 'web.fetch':{surface:'native-web',mode:'read',native:true},
 'web.fetch_batch':{surface:'native-web',mode:'read',native:true},
 'web.research':{surface:'native-web',mode:'read',native:true},
 'web.goal':{surface:'native-web',mode:'plan-or-confirmed-action',native:true},
 'github.read':{surface:'github-dev-agent',mode:'read',native_contract:true},
 'github.search':{surface:'github-dev-agent',mode:'read',native_contract:true},
 'github.workflows':{surface:'github-dev-agent',mode:'read',native_contract:true},
 'github.stage_action':{surface:'github-dev-agent',mode:'staged-write',confirmation:true},
 'cloud.summary':{surface:'magnanimous-cloud',mode:'read',native:true},
 'cloud.catalog':{surface:'magnanimous-cloud',mode:'read',native:true},
 'cloud.projects.list':{surface:'magnanimous-cloud',mode:'read',native:true},
 'cloud.resources.list':{surface:'magnanimous-cloud',mode:'read',native:true},
 'cloud.resource.stage_action':{surface:'magnanimous-cloud',mode:'staged-write',confirmation:true},
 'cloudflare.summary':{surface:'cloudflare-adapter',mode:'read',provider_optional:true},
 'cloudflare.read':{surface:'cloudflare-adapter',mode:'read',provider_optional:true},
 'cloudflare.token_verify':{surface:'cloudflare-adapter',mode:'read',provider_optional:true},
 'cloudflare.account':{surface:'cloudflare-adapter',mode:'read',provider_optional:true},
 'cloudflare.zones':{surface:'cloudflare-adapter',mode:'read',provider_optional:true},
 'cloudflare.stage_action':{surface:'cloudflare-adapter',mode:'staged-write',confirmation:true,provider_optional:true},
 'railway.status':{surface:'railway-compatible-deployment-rail',mode:'read',provider_optional:true},
 'railway.catalog':{surface:'railway-compatible-deployment-rail',mode:'read',provider_optional:true},
 'railway.deploy_exact':{surface:'github-exact-deploy-workflow',mode:'staged-write',confirmation:true,provider_optional:true},
 'media.summary':{surface:'native-media-studio',mode:'read',native:true},
 'media.catalog':{surface:'native-media-studio',mode:'read',native:true},
 'media.parity':{surface:'native-media-studio',mode:'read',native:true},
 'media.operation_spec':{surface:'native-media-studio',mode:'read',native:true},
 'media.operation_execute':{surface:'native-media-studio',mode:'owner-controlled-worker',native:true},
 'media.plan':{surface:'native-media-studio',mode:'plan',native:true},
 'media.render_avatar':{surface:'native-media-studio',mode:'native-or-self-hosted-render',native:true},
 'media.glossary_apply':{surface:'native-media-studio',mode:'read-transform',native:true},
 'media.template_render':{surface:'native-media-studio',mode:'read-transform',native:true},
 'terminal.summary':{surface:'native-terminal',mode:'read',native:true},
 'terminal.catalog':{surface:'native-terminal',mode:'read',native:true},
 'terminal.classify':{surface:'native-terminal',mode:'read',native:true},
 'terminal.preview':{surface:'native-terminal',mode:'read',native:true},
 'terminal.interactive_plan':{surface:'native-terminal',mode:'owner-device-plan',native:true},
 'terminal.profiles':{surface:'native-terminal',mode:'local-read',native:true},
 'terminal.read':{surface:'native-terminal',mode:'local-read',native:true},
 'terminal.stage':{surface:'native-terminal',mode:'staged-write',confirmation:true,native:true},
 'terminal.interpret':{surface:'native-terminal',mode:'read-transform',native:true},
 'mesh.self_check':{surface:'capability-mesh',mode:'read',native:true}
});

async function ensureSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_capability_mesh_checks(
  id TEXT PRIMARY KEY,status TEXT NOT NULL,ready_count INTEGER NOT NULL DEFAULT 0,total_count INTEGER NOT NULL DEFAULT 0,
  result_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_capability_mesh_checks_created ON magnanimous_capability_mesh_checks(created_at DESC)').run();
}

function railwayReadiness(env,github){
 const token=Boolean(String(env?.MAGNANIMOUS_RAILWAY_DEPLOY_TOKEN||'').trim());
 const enabled=truthy(env?.MAGNANIMOUS_RAILWAY_DEPLOY_ENABLED);
 const project=Boolean(String(env?.MAGNANIMOUS_RAILWAY_PROJECT_ID||'').trim());
 const environment=Boolean(String(env?.MAGNANIMOUS_RAILWAY_ENVIRONMENT_ID||'').trim());
 const service=Boolean(String(env?.MAGNANIMOUS_RAILWAY_SERVICE_ID||'').trim());
 const direct=enabled&&token&&project&&environment&&service;
 return{
  native_contract_count:RAILWAY_VISIBLE_TOOL_CONTRACTS.length,
  architecture_technique_count:RAILWAY_ARCHITECTURE_TECHNIQUES.length,
  provider_required_for_magnanimous_identity:false,
  current_role:'replaceable hosting/deployment capacity rail',
  direct_project_adapter_configured:direct,
  exact_commit_workflow_available:true,
  exact_commit_workflow_control_ready:Boolean(github?.repository_token_configured),
  oauth_chat_connector_not_runtime_dependency:true,
  project_token_configured:token,
  deployment_enabled:enabled,
  project_id_configured:project,
  environment_id_configured:environment,
  service_id_configured:service,
  note:direct
   ?'Direct exact-commit Railway fallback is configured beneath Magnanimous.'
   :'The provider-neutral software path is ready; direct autonomous Railway API promotion still requires the production-scoped project token or another verified deployment rail.'
 };
}

async function nativeWebReadiness(env,tenantId){
 const checker=tenantId
  ? async action=>Boolean(await findReadyLocalBridgeDevice(env,tenantId,action))
  : action=>hasAnyReadyLocalBridgeCapability(env,action);
 const actions=['browser_search','browser_fetch','browser_research','browser_read_flow','browser_action_flow','browser_session_start'];
 const pairs=await Promise.all(actions.map(async action=>[action,Boolean(await checker(action).catch(()=>false))]));
 const capabilities=Object.fromEntries(pairs);
 return{
  tinyfish_runtime_dependency:false,
  parity:MAGNANIMOUS_WEB_PARITY,
  local_bridge:capabilities,
  core_read_ready:Boolean(capabilities.browser_fetch&&capabilities.browser_search),
  research_ready:Boolean(capabilities.browser_research),
  interactive_ready:Boolean(capabilities.browser_action_flow),
  persistent_session_ready:Boolean(capabilities.browser_session_start)
 };
}

function cloudReadiness(env){
 const binding=env?.MAGNANIMOUS_CLOUD_CONTROL;
 const active=Boolean(binding&&typeof binding.summary==='function');
 return{
  native_control_plane_code:true,
  native_binding_active:active,
  cloudflare_required_for_software_runtime:false,
  railway_required_for_control_plane:false,
  physical_capacity_still_required_for_real_compute:true
 };
}

function readinessRows({cloudflare,web,github,railway,cloud,media,terminal}){
 return[
  {id:'native-media-orchestration',ready:true,required:false,mode:'native',detail:'Magnanimous owns media planning, templates, brand rules, provider-neutral capability contracts and verification.'},
  {id:'native-avatar-experience',ready:Boolean(media?.execution?.browser_live_avatar||media?.execution?.self_hosted_avatar_renderer_configured),required:false,mode:media?.execution?.self_hosted_avatar_renderer_configured?'self-hosted-renderer':'browser-native',detail:media?.execution?.self_hosted_avatar_renderer_configured?'Owner-controlled avatar renderer is configured.':'Free browser live-avatar mode is available; heavy rendering remains optional owner-controlled compute.'},
  {id:'native-media-worker',ready:Boolean(media?.execution?.magnanimous_media_worker_configured),required:false,mode:'owner-controlled-compute',detail:media?.execution?.magnanimous_media_worker_configured?'Magnanimous Media Worker is configured for provider-independent heavy media operations.':'Control-plane parity is installed; configure the optional owner-controlled Magnanimous Media Worker for heavy generation, dubbing, lip-sync, clipping and batch execution.'},
  {id:'native-terminal-orchestration',ready:true,required:false,mode:'native',detail:'Command classification, redaction, rollback planning and confirmation policy are native Magnanimous capabilities.'},
  {id:'native-ssh-execution',ready:Boolean(terminal?.local_ssh_ready),required:false,mode:'owner-local',detail:terminal?.local_ssh_ready?'A paired owner-controlled Local Bridge advertises native SSH execution.':'Native SSH code is installed; execution becomes live when an OpenSSH-capable paired Local Bridge is online.'},
  {id:'magnanimous-cloud',ready:Boolean(cloud.native_binding_active),required:false,mode:'native',detail:cloud.native_binding_active?'Native cloud control binding active.':'Native cloud control code is present; this execution rail does not expose the binding.'},
  {id:'native-web-search',ready:Boolean(web.core_read_ready),required:true,mode:'native-local',detail:web.core_read_ready?'Local Chromium search/fetch ready.':'Activate or update a paired Local Bridge to make native web execution live.'},
  {id:'native-web-research',ready:Boolean(web.research_ready),required:false,mode:'native-local',detail:web.research_ready?'Native source-backed research ready.':'Research contract is installed but its Local Bridge executor is not currently heartbeat-ready.'},
  {id:'github-repository-adapter',ready:Boolean(github.repository_token_configured),required:false,mode:'authorized-adapter',detail:github.repository_token_configured?'GitHub repository writes/workflow dispatch are configured.':'Public reads remain available; private/write/workflow actions need the server-side GitHub platform token.'},
  {id:'cloudflare-provider-adapter',ready:Boolean(cloudflare.readiness?.configured),required:false,mode:'optional-adapter',detail:cloudflare.readiness?.configured?'Cloudflare provider reads are authorized; writes remain separately confirmed and policy locked.':'Cloudflare remains optional; native Magnanimous software does not require this provider token.'},
  {id:'railway-direct-adapter',ready:Boolean(railway.direct_project_adapter_configured),required:false,mode:'optional-capacity-adapter',detail:railway.note},
  {id:'railway-exact-deploy-workflow',ready:Boolean(railway.exact_commit_workflow_control_ready),required:false,mode:'github-orchestrated-deploy',detail:railway.exact_commit_workflow_control_ready?'Magnanimous can stage the exact-deploy workflow through its GitHub adapter.':'The workflow exists, but runtime dispatch needs the GitHub repository adapter.'}
 ];
}

export async function getMagnanimousCapabilityMeshSummary(env,providerEnv=env,tenantId=''){
 const [web,terminal]=await Promise.all([nativeWebReadiness(env,tenantId),getMagnanimousNativeTerminalSummary(env,tenantId)]);
 const media=getMagnanimousNativeMediaSummary(env);
 const github=magnanimousDevAgentSummary(env);
 const cloudflare=magnanimousCloudflareSummary(providerEnv||env);
 const railway=railwayReadiness(env,github);
 const cloud=cloudReadiness(env);
 const readiness=readinessRows({cloudflare,web,github,railway,cloud,media,terminal});
 const readyCount=readiness.filter(x=>x.ready).length,totalCount=readiness.length;
 const requiredBlocked=readiness.filter(x=>x.required&&!x.ready);
 const status=requiredBlocked.length?'operable-with-native-executor-activation-needed':'operable-native-first';
 const suggestions=[];
 if(!web.core_read_ready)suggestions.push({id:'activate-local-bridge',risk:'local-owner-action',action:'Re-run the Magnanimous Local Bridge activation/update so Chromium advertises the newest native web capabilities.'});
 if(!github.repository_token_configured)suggestions.push({id:'configure-github-adapter',risk:'credential-owner-action',action:'Configure the server-side GitHub platform token if private repository writes or workflow dispatch are required from the live platform.'});
 if(!railway.direct_project_adapter_configured)suggestions.push({id:'railway-direct-fallback',risk:'credential-owner-action',action:'Keep Railway optional. Add a production-scoped Railway project token only if autonomous direct provider fallback is desired; do not make it Magnanimous identity.'});
 if(!cloud.native_binding_active)suggestions.push({id:'standalone-cloud-control',risk:'deployment',action:'Prefer the standalone Magnanimous runtime for the native cloud-control binding while keeping the current production rail available for rollback.'});
 if(!terminal.local_ssh_ready)suggestions.push({id:'activate-native-ssh',risk:'local-owner-action',action:'Update or re-pair Magnanimous Local Bridge on an owner machine with OpenSSH installed to enable credential-local SSH execution without Hey Terminal.'});
 if(!media.execution?.self_hosted_avatar_renderer_configured)suggestions.push({id:'optional-native-media-renderer',risk:'deployment',action:'Keep free browser avatar mode active; attach owner-controlled media/GPU workers only when photorealistic rendering, lip-sync, dubbing or batch generation is needed.'});
 return{
  ...MAGNANIMOUS_CAPABILITY_MESH_POLICY,
  status,
  ready_count:readyCount,
  total_readiness_checks:totalCount,
  readiness,
  surfaces:{
   native_web:web,
   native_media:media,
   native_terminal:terminal,
   github,
   cloudflare:{
    configured:Boolean(cloudflare.readiness?.configured),
    account_id_configured:Boolean(cloudflare.readiness?.account_id_configured),
    zone_id_configured:Boolean(cloudflare.readiness?.zone_id_configured),
    family_count:cloudflare.family_count,
    capability_count:cloudflare.capability_count,
    provider_required:false
   },
   railway,
   magnanimous_cloud:cloud
  },
  route_count:Object.keys(MAGNANIMOUS_CAPABILITY_MESH_ROUTES).length,
  routes:MAGNANIMOUS_CAPABILITY_MESH_ROUTES,
  suggested_actions:suggestions,
  provider_boundaries:[
   'Cloudflare and Railway may provide real network/hosting capacity, but neither owns Magnanimous identity, memory, policy or orchestration.',
   'GitHub remains an authorized repository/account system when live repository writes or workflow execution are required.',
   'TinyFish is not required for the supported native web path; proprietary anti-bot/proxy infrastructure is not falsely claimed as native.',
   'HeyGen is not required for Magnanimous media orchestration; proprietary HeyGen code, prompts, weights and private internals are not copied.',
   'Hey Terminal is not required for native SSH planning/execution; credentials remain on the owner-controlled Local Bridge machine.',
   'Real hardware, public IP space, Internet transit, registrar authority and other physical/regulated rails must exist somewhere.'
  ]
 };
}

async function saveCheck(env,summary){
 if(!env?.DB)return null;
 await ensureSchema(env);
 const id='mesh_'+crypto.randomUUID(),ts=now();
 await env.DB.prepare('INSERT INTO magnanimous_capability_mesh_checks(id,status,ready_count,total_count,result_json,created_at) VALUES(?,?,?,?,?,?)')
  .bind(id,summary.status,Number(summary.ready_count||0),Number(summary.total_readiness_checks||0),JSON.stringify(summary).slice(0,500000),ts).run();
 return{id,status:summary.status,ready_count:Number(summary.ready_count||0),total_count:Number(summary.total_readiness_checks||0),created_at:ts};
}

async function recentChecks(env){
 if(!env?.DB)return[];
 await ensureSchema(env);
 const {results=[]}=await env.DB.prepare('SELECT id,status,ready_count,total_count,created_at FROM magnanimous_capability_mesh_checks ORDER BY created_at DESC LIMIT 20').all();
 return results;
}

function delegatedRequest(request,path,method='GET',body){
 const url=new URL(path,request.url),headers=new Headers(request.headers);
 headers.delete('content-length');
 const init={method,headers};
 if(body!==undefined){headers.set('content-type','application/json');init.body=JSON.stringify(body);}
 return new Request(url,init);
}

async function wrap(response,capability,surface){
 if(!response)return json({detail:'Capability handler did not return a response.',capability,surface},500);
 const type=String(response.headers.get('content-type')||'').toLowerCase();
 if(!type.includes('application/json'))return response;
 const data=await response.clone().json().catch(()=>({}));
 return json({mesh:{capability,surface,operator:'Magnanimous AI'},...data},response.status);
}

function railwayStatusPayload(env){
 const github=magnanimousDevAgentSummary(env);
 return{
  ...railwayReadiness(env,github),
  observed_tool_contracts:RAILWAY_VISIBLE_TOOL_CONTRACTS,
  architecture_techniques:RAILWAY_ARCHITECTURE_TECHNIQUES,
  proprietary_backend_copied:false
 };
}

async function routeCapability(request,env,providerEnv,body){
 const capability=clip(body.capability,100),input=body.input&&typeof body.input==='object'?body.input:{};
 const def=MAGNANIMOUS_CAPABILITY_MESH_ROUTES[capability];
 if(!def)return json({detail:'Unsupported capability mesh route.',capability,available:Object.keys(MAGNANIMOUS_CAPABILITY_MESH_ROUTES)},400);

 if(capability==='mesh.self_check'){
  const user=await currentUser(request,env).catch(()=>null);
  const summary=await getMagnanimousCapabilityMeshSummary(env,providerEnv,user?.tenant_id||'');
  const check=await saveCheck(env,summary);
  return json({mesh:{capability,surface:def.surface,operator:'Magnanimous AI'},check,summary});
 }

 const nativeKinds={
  'web.search':'search','web.fetch':'fetch','web.fetch_batch':'fetch_batch','web.research':'research'
 };
 if(nativeKinds[capability]){
  const kind=nativeKinds[capability];
  const path=kind==='research'?'/api/magnanimous/native-web/research':'/api/magnanimous/native-web/runs';
  const payload=kind==='research'?input:{...input,kind};
  return wrap(await handleMagnanimousNativeWeb(delegatedRequest(request,path,'POST',payload),env),capability,def.surface);
 }
 if(capability==='web.goal'){
  return wrap(await handleMagnanimousNativeWeb(delegatedRequest(request,'/api/magnanimous/native-web/goals','POST',input),env),capability,def.surface);
 }

 const githubPaths={
  'github.read':'/api/magnanimous/dev-agent/read',
  'github.search':'/api/magnanimous/dev-agent/search',
  'github.workflows':'/api/magnanimous/dev-agent/workflows',
  'github.stage_action':'/api/magnanimous/dev-agent/actions'
 };
 if(githubPaths[capability]){
  return wrap(await handleMagnanimousDevAgent(delegatedRequest(request,githubPaths[capability],'POST',input),env),capability,def.surface);
 }

 if(capability==='cloud.summary')return wrap(await handleMagnanimousCloudProvider(delegatedRequest(request,'/api/magnanimous/cloud','GET'),env),capability,def.surface);
 if(capability==='cloud.catalog')return wrap(await handleMagnanimousCloudProvider(delegatedRequest(request,'/api/magnanimous/cloud/catalog','GET'),env),capability,def.surface);
 if(capability==='cloud.projects.list')return wrap(await handleMagnanimousCloudProvider(delegatedRequest(request,'/api/magnanimous/cloud/projects','GET'),env),capability,def.surface);
 if(capability==='cloud.resources.list'){
  const query=new URLSearchParams();
  if(input.project_id)query.set('project_id',clip(input.project_id,200));
  if(input.kind)query.set('kind',clip(input.kind,120));
  const suffix=query.toString()?'?'+query.toString():'';
  return wrap(await handleMagnanimousCloudProvider(delegatedRequest(request,'/api/magnanimous/cloud/resources'+suffix,'GET'),env),capability,def.surface);
 }
 if(capability==='cloud.resource.stage_action'){
  const id=clip(input.resource_id,200);
  if(!id)return json({detail:'resource_id is required.'},400);
  return wrap(await handleMagnanimousCloudProvider(delegatedRequest(request,'/api/magnanimous/cloud/resources/'+encodeURIComponent(id)+'/actions','POST',{action:input.action,payload:input.payload||{}}),env),capability,def.surface);
 }

 if(capability==='cloudflare.summary')return json({mesh:{capability,surface:def.surface,operator:'Magnanimous AI'},...magnanimousCloudflareSummary(providerEnv)});
 if(capability==='cloudflare.read')return wrap(await handleMagnanimousCloudflare(delegatedRequest(request,'/api/cloudflare/read','POST',{path:input.path}),providerEnv),capability,def.surface);
 if(capability==='cloudflare.token_verify')return wrap(await handleMagnanimousCloudflare(delegatedRequest(request,'/api/cloudflare/token-verify','GET'),providerEnv),capability,def.surface);
 if(capability==='cloudflare.account')return wrap(await handleMagnanimousCloudflare(delegatedRequest(request,'/api/cloudflare/account','GET'),providerEnv),capability,def.surface);
 if(capability==='cloudflare.zones')return wrap(await handleMagnanimousCloudflare(delegatedRequest(request,'/api/cloudflare/zones','GET'),providerEnv),capability,def.surface);
 if(capability==='cloudflare.stage_action'){
  return wrap(await handleMagnanimousCloudflare(delegatedRequest(request,'/api/cloudflare/actions','POST',{method:input.method,path:input.path,body:input.body||{}}),providerEnv),capability,def.surface);
 }

 if(capability==='railway.status')return json({mesh:{capability,surface:def.surface,operator:'Magnanimous AI'},...railwayStatusPayload(env)});
 if(capability==='railway.catalog')return json({mesh:{capability,surface:def.surface,operator:'Magnanimous AI'},contracts:RAILWAY_VISIBLE_TOOL_CONTRACTS,techniques:RAILWAY_ARCHITECTURE_TECHNIQUES,proprietary_backend_copied:false});
 if(capability==='media.summary')return wrap(await handleMagnanimousNativeMedia(delegatedRequest(request,'/api/magnanimous/native-media','GET'),env),capability,def.surface);
 if(capability==='media.catalog')return wrap(await handleMagnanimousNativeMedia(delegatedRequest(request,'/api/magnanimous/native-media/catalog','GET'),env),capability,def.surface);
 if(capability==='media.parity')return wrap(await handleMagnanimousNativeMedia(delegatedRequest(request,'/api/magnanimous/native-media/parity','GET'),env),capability,def.surface);
 if(capability==='media.operation_spec')return wrap(await handleMagnanimousNativeMedia(delegatedRequest(request,'/api/magnanimous/native-media/operation/spec','POST',input),env),capability,def.surface);
 if(capability==='media.operation_execute')return wrap(await handleMagnanimousNativeMedia(delegatedRequest(request,'/api/magnanimous/native-media/operation/execute','POST',input),env),capability,def.surface);
 if(capability==='media.plan')return wrap(await handleMagnanimousNativeMedia(delegatedRequest(request,'/api/magnanimous/native-media/plan','POST',input),env),capability,def.surface);
 if(capability==='media.render_avatar')return wrap(await handleMagnanimousNativeMedia(delegatedRequest(request,'/api/magnanimous/native-media/render-avatar','POST',input),env),capability,def.surface);
 if(capability==='media.glossary_apply')return wrap(await handleMagnanimousNativeMedia(delegatedRequest(request,'/api/magnanimous/native-media/glossary/apply','POST',input),env),capability,def.surface);
 if(capability==='media.template_render')return wrap(await handleMagnanimousNativeMedia(delegatedRequest(request,'/api/magnanimous/native-media/template/render','POST',input),env),capability,def.surface);

 if(capability==='terminal.summary')return wrap(await handleMagnanimousNativeTerminal(delegatedRequest(request,'/api/magnanimous/native-terminal','GET'),env),capability,def.surface);
 if(capability==='terminal.catalog')return wrap(await handleMagnanimousNativeTerminal(delegatedRequest(request,'/api/magnanimous/native-terminal/catalog','GET'),env),capability,def.surface);
 if(capability==='terminal.classify')return wrap(await handleMagnanimousNativeTerminal(delegatedRequest(request,'/api/magnanimous/native-terminal/classify','POST',input),env),capability,def.surface);
 if(capability==='terminal.preview')return wrap(await handleMagnanimousNativeTerminal(delegatedRequest(request,'/api/magnanimous/native-terminal/preview','POST',input),env),capability,def.surface);
 if(capability==='terminal.interactive_plan')return wrap(await handleMagnanimousNativeTerminal(delegatedRequest(request,'/api/magnanimous/native-terminal/interactive-plan','POST',input),env),capability,def.surface);
 if(capability==='terminal.profiles')return wrap(await handleMagnanimousNativeTerminal(delegatedRequest(request,'/api/magnanimous/native-terminal/profiles','POST',input),env),capability,def.surface);
 if(capability==='terminal.read')return wrap(await handleMagnanimousNativeTerminal(delegatedRequest(request,'/api/magnanimous/native-terminal/read','POST',input),env),capability,def.surface);
 if(capability==='terminal.stage')return wrap(await handleMagnanimousNativeTerminal(delegatedRequest(request,'/api/magnanimous/native-terminal/stage','POST',input),env),capability,def.surface);
 if(capability==='terminal.interpret')return wrap(await handleMagnanimousNativeTerminal(delegatedRequest(request,'/api/magnanimous/native-terminal/interpret','POST',input),env),capability,def.surface);

 if(capability==='railway.deploy_exact'){
  const commit=clip(input.commit_sha,64);
  if(commit&&!/^[0-9a-f]{40}$/i.test(commit))return json({detail:'commit_sha must be a full 40-character Git commit SHA when provided.'},400);
  const repo=clip(input.repo,300)||'IAMGodmatters/IAMMagnanimousway.js';
  const payload={
   repo,
   action:'dispatch_workflow',
   payload:{
    workflow_id:'magnanimous-railway-deploy.yml',
    ref:'main',
    inputs:commit?{commit_sha:commit}:{}
   }
  };
  const response=await handleMagnanimousDevAgent(delegatedRequest(request,'/api/magnanimous/dev-agent/actions','POST',payload),env);
  return wrap(response,capability,def.surface);
 }

 return json({detail:'Capability route is registered but not executable on this runtime.',capability},501);
}

export async function handleMagnanimousCapabilityMesh(request,env,{providerEnv=env}={}){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/capability-mesh'))return null;
 const denied=await requirePlatformOwner(request,env);if(denied)return denied;
 const user=await currentUser(request,env);if(!user)return json({detail:'Platform owner sign-in required.'},401);
 await ensureSchema(env);

 if(request.method==='GET'&&path==='/api/magnanimous/capability-mesh'){
  const summary=await getMagnanimousCapabilityMeshSummary(env,providerEnv,user.tenant_id);
  return json({...summary,recent_checks:await recentChecks(env)});
 }
 if(request.method==='GET'&&path==='/api/magnanimous/capability-mesh/catalog'){
  return json({
   ...MAGNANIMOUS_CAPABILITY_MESH_POLICY,
   routes:MAGNANIMOUS_CAPABILITY_MESH_ROUTES,
   cloudflare_families:MAGNANIMOUS_CLOUDFLARE_FAMILIES.map(f=>({id:f.id,name:f.name,capability_count:f.capabilities.length})),
   native_web_surfaces:MAGNANIMOUS_WEB_PARITY.surfaces,
   github_skills:MAGNANIMOUS_DEV_SKILLS.map(x=>({id:x.id,name:x.name,risk:x.risk})),
   railway_contracts:RAILWAY_VISIBLE_TOOL_CONTRACTS,
   railway_techniques:RAILWAY_ARCHITECTURE_TECHNIQUES,
   native_media_families:MAGNANIMOUS_NATIVE_MEDIA_FAMILIES,
   native_media_capabilities:MAGNANIMOUS_NATIVE_MEDIA_CAPABILITIES,
   heygen_benchmark_tools:HEYGEN_VISIBLE_BENCHMARK_TOOLS,
   heygen_native_parity_map:MAGNANIMOUS_HEYGEN_PARITY_MAP,
   native_terminal_capabilities:MAGNANIMOUS_NATIVE_TERMINAL_CAPABILITIES
  });
 }
 if(request.method==='POST'&&path==='/api/magnanimous/capability-mesh/self-check'){
  const summary=await getMagnanimousCapabilityMeshSummary(env,providerEnv,user.tenant_id);
  const check=await saveCheck(env,summary);
  return json({ok:true,check,summary},201);
 }
 if(request.method==='POST'&&path==='/api/magnanimous/capability-mesh/route'){
  const body=await request.json().catch(()=>({}));
  return routeCapability(request,env,providerEnv,body);
 }
 return json({detail:'Magnanimous Capability Mesh route not found.'},404);
}

export async function scheduledMagnanimousCapabilityMesh(env){
 try{
  const summary=await getMagnanimousCapabilityMeshSummary(env,env,'');
  const check=await saveCheck(env,summary);
  return{ok:true,check,status:summary.status,ready_count:summary.ready_count,total:summary.total_readiness_checks};
 }catch(error){
  console.error('Magnanimous Capability Mesh scheduled self-check failed',error);
  return{ok:false,error:clip(error?.message||error,800)};
 }
}
