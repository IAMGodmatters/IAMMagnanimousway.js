import { currentUser } from './integrations.js';
import { requirePlatformOwner } from './platform-owner-guard.js';
import { getIntegrationCatalog } from './magnanimous-integration-catalog.js';
import { upsertApprovedTeachingTool } from './magnanimous-tool-foundry.js';
import { getPersistentConnectorAbsorptionManifest, getConnectorAbsorptionCatalog, getConnectorAbsorptionSummary } from './magnanimous-connector-absorption.js';
import { OGENIC_SKILL_SNAPSHOT, OGENIC_CAPABILITY_GROUPS, GOD_MODE_TOOL_FAMILIES, NETWALK_NATIVE_CONTRACT } from './magnanimous-ogenic-god-toolkit.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clip=(value,n=5000)=>String(value??'').trim().slice(0,n);

const CORE_NATIVE_CAPABILITIES=[
 {id:'magnanimous-brain',name:'Magnanimous Brain',family:'core',status:'native',capabilities:['identity','reasoning-policy','orchestration','routing','decision-contracts'],boundary:'none'},
 {id:'magnanimous-memory',name:'Magnanimous Memory',family:'core',status:'native',capabilities:['continuity','workspace-memory','learning-signals','reusable-lessons'],boundary:'none'},
 {id:'tool-foundry',name:'Tool Foundry',family:'learning',status:'native',capabilities:['skill-learning','recipe-reuse','capability-gap-detection','native-tool-specification'],boundary:'none'},
 {id:'god-coding',name:'God Coding',family:'engineering',status:'native',capabilities:['self-development-planning','code-architecture','architecture-decomposition','solid-design','dependency-injection','composition-root-design','bug-analysis','security-review','regression-planning','release-verification'],boundary:'repository-write-or-runner-only'},
 {id:'developer-agent',name:'Magnanimous Dev Agent',family:'engineering',status:'native',capabilities:['repository-planning','source-inspection','code-search','staged-changes','ci-verification','pr-workflow'],boundary:'repository-write-or-runner-only'},
 {id:'capability-assimilation',name:'Capability Assimilation',family:'learning',status:'native',capabilities:['benchmark-decomposition','native-equivalent-design','workflow-internalization','dependency-reduction'],boundary:'none'},
 {id:'verification-core',name:'Verification Core',family:'quality',status:'native',capabilities:['evidence-first-validation','claim-checking','release-gates','regression-locks'],boundary:'none'}
];

const ALWAYS_EXTERNAL_CATEGORIES=new Set(['payments','finance-data','local']);
const ACCOUNT_BOUNDARY_CATEGORIES=new Set(['productivity','sales','crm','marketing','commerce','operations']);

async function ensureSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_native_capability_matrix (
  id TEXT PRIMARY KEY,name TEXT NOT NULL,family TEXT NOT NULL DEFAULT 'general',status TEXT NOT NULL DEFAULT 'planned',
  boundary TEXT NOT NULL DEFAULT 'none',capabilities_json TEXT NOT NULL DEFAULT '[]',benchmarks_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_self_development_runs (
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,goal TEXT NOT NULL,mode TEXT NOT NULL DEFAULT 'god-coding',
  plan_json TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'planned',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_connector_capability_absorption (
  connector_id TEXT NOT NULL,capability_id TEXT NOT NULL,connector_name TEXT NOT NULL,category TEXT NOT NULL DEFAULT 'general',
  native_target TEXT NOT NULL DEFAULT '',boundary TEXT NOT NULL DEFAULT 'none',source_kind TEXT NOT NULL DEFAULT 'benchmark-contract',
  status TEXT NOT NULL DEFAULT 'brain-spec-absorbed',research_json TEXT NOT NULL DEFAULT '{}',spec_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(connector_id,capability_id)
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_connector_absorption_target ON magnanimous_connector_capability_absorption(native_target,status,updated_at DESC)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_magnanimous_self_dev_tenant_created ON magnanimous_self_development_runs(tenant_id,created_at DESC)').run();
}

function targetBoundary(item){
 if(ALWAYS_EXTERNAL_CATEGORIES.has(item.category))return'external-world-data-or-rail';
 if(ACCOUNT_BOUNDARY_CATEGORIES.has(item.category))return'external-account-action-only';
 if(item.category==='ai-provider')return'compute-engine-only';
 if(item.category==='deployment')return'deployment-target-only';
 return'none-or-optional-compute';
}

function aggregateTargets(){
 const map=new Map();
 for(const item of getIntegrationCatalog()){
  const id=clip(item.native_target||`native-${item.category||'general'}`,120);
  if(!id)continue;
  const row=map.get(id)||{id,name:id.split('-').map(x=>x?x[0].toUpperCase()+x.slice(1):x).join(' '),family:item.category||'general',status:'planned',boundary:targetBoundary(item),capabilities:new Set(),benchmarks:[]};
  for(const capability of item.capabilities||[])row.capabilities.add(String(capability));
  row.benchmarks.push({id:item.id,name:item.name,category:item.category,priority:item.priority});
  if(row.boundary==='none-or-optional-compute'&&targetBoundary(item)!=='none-or-optional-compute')row.boundary=targetBoundary(item);
  map.set(id,row);
 }
 return[...map.values()].map(x=>({...x,capabilities:[...x.capabilities],benchmarks:x.benchmarks.slice(0,40)}));
}

async function upsertCapability(env,row){
 const ts=now();
 await env.DB.prepare(`INSERT INTO magnanimous_native_capability_matrix(id,name,family,status,boundary,capabilities_json,benchmarks_json,notes,created_at,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,family=excluded.family,boundary=excluded.boundary,
 capabilities_json=excluded.capabilities_json,benchmarks_json=excluded.benchmarks_json,updated_at=excluded.updated_at,
 status=CASE WHEN magnanimous_native_capability_matrix.status='native' THEN 'native' ELSE magnanimous_native_capability_matrix.status END`).bind(
  row.id,row.name,row.family,row.status||'planned',row.boundary||'none',JSON.stringify(row.capabilities||[]).slice(0,30000),JSON.stringify(row.benchmarks||[]).slice(0,30000),clip(row.notes,4000),ts,ts
 ).run();
}

async function seedMatrix(env){
 if(!env?.DB)return;
 await ensureSchema(env);
 for(const row of CORE_NATIVE_CAPABILITIES)await upsertCapability(env,{...row,benchmarks:[],notes:'Magnanimous-owned core capability.'});
 for(const row of aggregateTargets())await upsertCapability(env,{...row,notes:'Native-equivalent target derived from public capability classes. No proprietary provider source code is copied.'});
 await seedConnectorAbsorption(env);
}

async function seedConnectorAbsorption(env){
 if(!env?.DB)return;
 await ensureSchema(env);
 const ts=now(),catalog=new Map(getConnectorAbsorptionCatalog().map(x=>[x.id,x])),statements=[];
 for(const row of getPersistentConnectorAbsorptionManifest()){
  const research=catalog.get(row.connector_id)?.research||{};
  const spec={magnanimous_owned:row.magnanimous_owned,external_only:row.external_only,acceptance_tests:row.acceptance_tests,recipe:row.recipe,implementation_status:row.implementation_status};
  statements.push(env.DB.prepare(`INSERT INTO magnanimous_connector_capability_absorption(connector_id,capability_id,connector_name,category,native_target,boundary,source_kind,status,research_json,spec_json,created_at,updated_at)
   VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(connector_id,capability_id) DO UPDATE SET connector_name=excluded.connector_name,category=excluded.category,native_target=excluded.native_target,boundary=excluded.boundary,source_kind=excluded.source_kind,research_json=excluded.research_json,spec_json=excluded.spec_json,updated_at=excluded.updated_at`).bind(
    row.connector_id,row.capability,row.connector_name,row.category,String(row.native_target||''),row.boundary,row.source_kind,'brain-spec-absorbed',JSON.stringify(research).slice(0,10000),JSON.stringify(spec).slice(0,30000),ts,ts
   ));
 }
 for(let i=0;i<statements.length;i+=50)await env.DB.batch(statements.slice(i,i+50));
}

async function materializeConnectorCapabilityRecipes(env,{connector='',capability='',limit=60,pendingOnly=false}={}){
 await seedConnectorAbsorption(env);
 const where=[],bind=[];if(connector){where.push('connector_id=?');bind.push(connector)}if(capability){where.push('capability_id=?');bind.push(capability)}if(pendingOnly)where.push("status!='tool-foundry-specified'");
 const safeLimit=Math.max(1,Math.min(100,Number(limit)||60));
 const {results=[]}=await env.DB.prepare(`SELECT connector_id,capability_id,connector_name,category,native_target,boundary,source_kind,status,spec_json FROM magnanimous_connector_capability_absorption ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY connector_id,capability_id LIMIT ${safeLimit}`).bind(...bind).all();
 const materialized=[];
 for(const row of results){
  const spec=(()=>{try{return JSON.parse(row.spec_json||'{}')}catch{return{}}})();
  await upsertApprovedTeachingTool(env,{
   agentId:'magnanimous-native-first',
   name:`absorb-${row.connector_id}-${row.capability_id}`,
   family:`native-${row.category}`,
   risk:['payments','telephony'].includes(row.category)?'high':['sales','crm','marketing','commerce','operations','email','calendar','social','messaging','work','deployment','engineering'].includes(row.category)?'medium':'low',
   requiresConnection:String(row.boundary||'').includes('external')||String(row.boundary||'').includes('account')||String(row.boundary||'').includes('rail'),
   purpose:`Magnanimous-owned workflow specification for ${row.capability_id}, benchmarked against ${row.connector_name}. Magnanimous owns reasoning, memory, workflow and verification; any unavoidable outside account/data/network/compute boundary remains a replaceable adapter.`,
   requiredCapabilities:[row.capability_id],
   steps:Array.isArray(spec.recipe)?spec.recipe:[]
  });
  await env.DB.prepare("UPDATE magnanimous_connector_capability_absorption SET status='tool-foundry-specified',updated_at=? WHERE connector_id=? AND capability_id=?").bind(now(),row.connector_id,row.capability_id).run();
  materialized.push({connector_id:row.connector_id,capability:row.capability_id,native_target:row.native_target,boundary:row.boundary,status:'tool-foundry-specified'});
 }
 const remainingRow=pendingOnly?await env.DB.prepare("SELECT COUNT(*) count FROM magnanimous_connector_capability_absorption WHERE status!='tool-foundry-specified'").first():null;
 return{items:materialized,remaining:Number(remainingRow?.count||0)};
}

async function seedNativeRecipes(env){
 if(!env?.DB)return;
 await upsertApprovedTeachingTool(env,{
  agentId:'magnanimous-native-first',name:'god-coding-self-development',family:'software-engineering',risk:'medium',requiresConnection:false,
  purpose:'Use God Coding as Magnanimous AI own self-development discipline: inspect current architecture, decompose large responsibilities, apply SOLID boundaries, prefer composition and dependency injection, define the smallest additive improvement, verify safety and regressions, and prepare repository changes without silently mutating production.',
  requiredCapabilities:['source-inspection','architecture-planning','architecture-decomposition','solid-design','dependency-injection','verification','regression-protection'],
  steps:['Define the self-development goal and observable acceptance criteria.','Inspect Magnanimous-owned source, memory, skills, routes and verification contracts before changing code.','Decompose large functions, route handlers and services into smaller single-purpose helpers when responsibilities are mixed.','Apply SOLID boundaries: keep one clear business responsibility per service and make domain/use-case code depend on ports or interfaces rather than concrete providers.','Favor composition and dependency injection through an explicit composition root instead of giant monolithic objects or hidden global wiring.','Prefer a Magnanimous-native implementation over a provider dependency whenever the capability can be owned locally.','Keep external bridges only for third-party account access, live outside data, network rails, specialized compute, repository hosting or deployment targets.','Prepare the smallest additive code change and preserve unrelated working behavior.','Run or dispatch real verification and review exact evidence before release.','Record the successful procedure back into Tool Foundry for future native reuse.']
 });
 await upsertApprovedTeachingTool(env,{
  agentId:'magnanimous-native-first',name:'ogenic-god-mode-orchestration',family:'orchestration',risk:'medium',requiresConnection:false,
  purpose:'Use Magnanimous GOD TOOLKIT mode to classify work as cloud, local or hybrid; discover the minimum available execution surfaces; initiate safe reads/plans/verifications; stage scoped writes; preserve approval gates for consequential actions; and verify outcomes before claiming completion.',
  requiredCapabilities:['cloud-local-hybrid-classification','tool-discovery','surface-selection','sequencing','read-before-write','verification','auto-network-direction'],
  steps:['Classify the request as CLOUD, LOCAL or HYBRID.','Discover the exact available Magnanimous/connected execution surfaces before promising action.','Select only the minimum capability groups required: Code Skill, Code System, Code Delivery, Code Website.','Auto-initiate safe reads, inspection, planning and non-mutating verification.','Run tests/lint/typecheck/build only when an execution surface is actually available.','Stage scoped code/config changes and preserve unrelated work.','Keep merge, production deploy, publishing, messaging/calling, payments, deletion, credentials and security-policy changes behind their existing approval gates.','Verify the result with direct evidence and stop after verification.']
 });
 for(const group of OGENIC_CAPABILITY_GROUPS)await upsertApprovedTeachingTool(env,{
  agentId:'magnanimous-native-first',name:`ogenic-${group.id}`,family:'ogenic-capability-group',risk:'low',requiresConnection:false,
  purpose:`Magnanimous-owned OGENIC ${group.name} workflow covering: ${group.capabilities.join(', ')}.`,
  requiredCapabilities:group.capabilities,
  steps:['Identify whether each requested operation is already native, cloud-connected, local-bridge-only, or unavailable.','Reuse existing Magnanimous state and tools before reaching outward.','Initiate the safe available step instead of stopping at advice.','Return CONNECTOR_REQUIRED, LOCAL_BRIDGE_REQUIRED, EXECUTION_SURFACE_REQUIRED or CONFIGURATION_REQUIRED when the necessary surface is genuinely absent.','Verify completed work and preserve outcome lessons.']
 });
 await upsertApprovedTeachingTool(env,{
  agentId:'magnanimous-native-first',name:'ogenic-netwalk-readonly-survey',family:'network-observability',risk:'medium',requiresConnection:true,
  purpose:'Magnanimous native contract for OGENIC Netwalk-style read-only network surveying: scoped authorization, local secret collection, topology discovery, health diagnosis, evidence-backed findings, deterministic mapping and full/public reporting without changing surveyed devices.',
  requiredCapabilities:['authorized-network-survey','read-only-diagnostics','topology-map','coverage-accounting','evidence-first-findings','secret-non-disclosure'],
  steps:['Confirm the exact site/device scope and authorization before any network access.','Collect credentials only through an approved local credential UI/secret manager; never in chat.','Run only read-only commands through an enforced allowlist and record evidence.','Do not sweep any address range without recorded owner authorization.','Keep unreachable, unidentified, skipped and out-of-scope devices in coverage accounting.','Keep configuration exports local and out of model/chat/report content.','Create evidence-backed findings with confidence, severity and concrete recommendations.','Render topology and reports deterministically from one structured record.','Produce public output only after sensitive operational details are excluded.','Report what was not covered and where sensitive local artifacts remain.']
 });
 await upsertApprovedTeachingTool(env,{
  agentId:'magnanimous-native-first',name:'capability-assimilation',family:'native-capability',risk:'low',requiresConnection:false,
  purpose:'Convert the useful behavior class of an external tool or plugin into a Magnanimous-owned specification and implementation target without copying proprietary code, credentials, hidden prompts, models or provider internals.',
  requiredCapabilities:['benchmark-decomposition','native-tool-specification','dependency-reduction'],
  steps:['Describe the observable capability and user outcome without relying on provider internals.','Split the capability into data, reasoning, workflow, UI, storage, compute and external-account boundaries.','Decompose the native implementation into focused responsibilities and define ports for any external boundary.','Compose small services through dependency injection so providers remain replaceable and business logic remains Magnanimous-owned.','Implement logic, memory, policy, workflow and reusable skills natively where practical.','Keep only irreducibly external account/data/network/compute actions behind replaceable bridges.','Verify the native path works when the benchmark provider is disconnected.','Track remaining external boundaries explicitly instead of pretending they are native.']
 });
}

function selfDevelopmentPlan(goal){
 return{
  mode:'god-coding-self-development',
  goal:clip(goal,4000),
  native_first:true,
  provider_identity_allowed:false,
  adapter_policy:'fallback-only for irreducibly external actions',
  engineering_architecture:{
   decompose:'Break large functions and mixed-responsibility modules into smaller single-purpose helpers.',
   solid:'Give each service one clear business responsibility and depend on abstractions at external boundaries.',
   composition:'Favor object composition and dependency injection through an explicit composition root over monolithic structures.'
  },
  phases:[
   {id:'understand',instruction:'Turn the goal into measurable acceptance criteria for Magnanimous itself.'},
   {id:'inspect',instruction:'Inspect Magnanimous-owned code, native recipes, memory, capability matrix, routes and regression contracts first.'},
   {id:'architecture',instruction:'Decompose mixed responsibilities, apply SOLID boundaries, define small ports/interfaces, and compose concrete adapters through dependency injection at a composition root.'},
   {id:'internalize',instruction:'Implement logic, planning, memory, reusable skills and orchestration inside Magnanimous rather than outsourcing them to a plugin.'},
   {id:'bridge-check',instruction:'Identify any truly external boundary such as third-party account data, payment/network rail, repository host, deployment target or specialized compute. Keep only that boundary replaceable.'},
   {id:'implement',instruction:'Use God Coding and Magnanimous Dev Agent to prepare the smallest additive implementation with focused helpers/services. Do not silently mutate production.'},
   {id:'verify',instruction:'Require syntax/type/build/regression/security evidence and exact-head CI where available.'},
   {id:'release',instruction:'Release only through existing approval and deployment gates, then verify production separately.'},
   {id:'learn',instruction:'Store the successful pattern in Tool Foundry so future work needs fewer outside capabilities.'}
  ],
  safety:{self_modification:'plan and stage automatically; consequential repository writes remain approval-gated',production:'no silent self-deployment',proprietary_code:'never copied',credentials:'never absorbed from provider connectors'}
 };
}

async function owner(request,env){
 const denied=await requirePlatformOwner(request,env);if(denied)return{denied};
 const user=await currentUser(request,env);if(!user)return{denied:json({detail:'Platform owner sign-in required.'},401)};
 return{user};
}

async function overview(env){
 await seedMatrix(env);await seedNativeRecipes(env);
 const {results=[]}=env?.DB?await env.DB.prepare('SELECT id,name,family,status,boundary,capabilities_json,benchmarks_json,notes,updated_at FROM magnanimous_native_capability_matrix ORDER BY CASE status WHEN \'native\' THEN 0 WHEN \'specified\' THEN 1 ELSE 2 END,name').all():{results:[]};
 const capabilities=results.map(x=>({...x,capabilities:JSON.parse(x.capabilities_json||'[]'),benchmarks:JSON.parse(x.benchmarks_json||'[]')}));
 return{
  identity:'Magnanimous AI',architecture:'native-first',brain_owner:'Magnanimous',god_coding_internal:true,self_development_enabled:true,
  external_plugins_required_for_core_brain:false,external_adapters_required_for_core_brain:false,
  external_bridges_policy:'Only use replaceable bridges for third-party accounts, live outside data, payment/network rails, repository/deployment targets or specialized compute that Magnanimous does not yet host itself.',
  proprietary_clone_policy:'Recreate observable capability classes and workflows with original Magnanimous code; never copy proprietary source, hidden prompts, credentials, weights or private provider internals.',
  engineering_architecture_policy:'Decompose large responsibilities, apply SOLID boundaries, and compose small services through dependency injection so external adapters remain replaceable.',
  capability_count:capabilities.length,native_count:capabilities.filter(x=>x.status==='native').length,specified_count:capabilities.filter(x=>x.status==='specified').length,
  connector_absorption:getConnectorAbsorptionSummary(),
  ogenic_god_toolkit:{absorbed:true,skill_count:OGENIC_SKILL_SNAPSHOT.skills.length,capability_group_count:OGENIC_CAPABILITY_GROUPS.length,tool_family_count:GOD_MODE_TOOL_FAMILIES.length,netwalk_mode:NETWALK_NATIVE_CONTRACT.mode,initiative:'suggest-and-initiate-safe-actions'},
  capabilities
 };
}

async function assimilate(request,env){
 const body=await request.json().catch(()=>({}));
 await seedMatrix(env);await seedNativeRecipes(env);
 const connector=clip(body.connector,120),capability=clip(body.capability,160);
 if(connector||capability||body.mode==='connector-capabilities'){
  const bulk=body.mode==='connector-capabilities',materialized=await materializeConnectorCapabilityRecipes(env,{connector,capability,limit:body.limit,pendingOnly:bulk});
  if(!bulk&&!materialized.items.length)return json({detail:'Connector capability not found.'},404);
  return json({ok:true,native_first:true,mode:'one-by-one-connector-capability-absorption',materialized_count:materialized.items.length,remaining:materialized.remaining,capabilities:materialized.items,summary:getConnectorAbsorptionSummary(),note:'Each selected capability is now a reusable Magnanimous Tool Foundry specification. External account/data/network rails remain replaceable and are not falsely labeled native.'});
 }
 const requested=clip(body.target,120);
 const {results=[]}=await env.DB.prepare(`SELECT id,name,family,status,boundary,capabilities_json,benchmarks_json FROM magnanimous_native_capability_matrix ${requested?'WHERE id=?':''} ORDER BY name`).bind(...(requested?[requested]:[])).all();
 if(requested&&!results.length)return json({detail:'Native capability target not found.'},404);
 const specified=[];
 for(const row of results){
  if(row.status==='native'){specified.push({id:row.id,status:'native'});continue;}
  const capabilities=JSON.parse(row.capabilities_json||'[]');
  await upsertApprovedTeachingTool(env,{
   agentId:'magnanimous-native-first',name:`native-${row.id}`,family:`native-${row.family}`,risk:'low',requiresConnection:false,
   purpose:`Build and reuse a Magnanimous-owned ${row.name} capability covering: ${capabilities.join(', ')}. External benchmarks define observable outcomes only; Magnanimous owns the implementation.`,
   requiredCapabilities:capabilities.slice(0,20),
   steps:['Define provider-independent inputs, outputs and acceptance tests.','Decompose responsibilities into focused domain/use-case services and small helpers before adding infrastructure.','Define ports/interfaces for external boundaries and inject concrete adapters through a composition root.','Reuse Magnanimous memory, orchestration, storage, UI and existing native services before adding dependencies.','Implement the reusable workflow as Magnanimous-owned code or deterministic recipe.','Isolate third-party account, live-data, network or specialized-compute boundaries behind optional replaceable bridges only when unavoidable.','Add regression verification proving the native path remains usable without the benchmark provider.']
  });
  await env.DB.prepare("UPDATE magnanimous_native_capability_matrix SET status='specified',notes=?,updated_at=? WHERE id=? AND status!='native'").bind('Magnanimous-native implementation recipe specified in Tool Foundry.',now(),row.id).run();
  specified.push({id:row.id,status:'specified',boundary:row.boundary});
 }
 return json({ok:true,native_first:true,specified_count:specified.length,targets:specified,note:'Capability classes were internalized as original Magnanimous specifications. No proprietary provider code or credentials were copied.'});
}

async function selfDevelop(request,env,user){
 const body=await request.json().catch(()=>({})),goal=clip(body.goal,4000);
 if(!goal)return json({detail:'Self-development goal is required.'},400);
 await seedMatrix(env);await seedNativeRecipes(env);
 const id=crypto.randomUUID(),ts=now(),plan=selfDevelopmentPlan(goal);
 await env.DB.prepare('INSERT INTO magnanimous_self_development_runs(id,tenant_id,user_id,goal,mode,plan_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,String(user.tenant_id),String(user.id),goal,'god-coding',JSON.stringify(plan).slice(0,50000),'planned',ts,ts).run();
 return json({ok:true,id,status:'planned',plan,next:{inspect:'/api/magnanimous/dev-agent/read',engineering_plan:'/api/magnanimous/dev-agent/plan',stage_changes:'/api/magnanimous/dev-agent/actions'},note:'God Coding is available to Magnanimous for its own development. Planning and learning are native; repository mutations remain separately approval-gated.'},201);
}

export async function handleMagnanimousNativeFirst(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/native-first'))return null;
 if(!env?.DB)return json({detail:'Magnanimous native-first runtime requires D1.'},503);
 const auth=await owner(request,env);if(auth.denied)return auth.denied;
 await ensureSchema(env);
 if(request.method==='GET'&&path==='/api/magnanimous/native-first')return json(await overview(env));
 if(request.method==='GET'&&path==='/api/magnanimous/native-first/connectors'){
  await seedConnectorAbsorption(env);
  const connector=clip(url.searchParams.get('connector'),120),capability=clip(url.searchParams.get('capability'),160),where=[],bind=[];
  if(connector){where.push('connector_id=?');bind.push(connector)}if(capability){where.push('capability_id=?');bind.push(capability)}
  const {results=[]}=await env.DB.prepare(`SELECT connector_id,capability_id,connector_name,category,native_target,boundary,source_kind,status,research_json,spec_json,updated_at FROM magnanimous_connector_capability_absorption ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY connector_id,capability_id LIMIT 500`).bind(...bind).all();
  return json({identity:'Magnanimous AI',summary:getConnectorAbsorptionSummary(),capabilities:results.map(x=>({...x,research:JSON.parse(x.research_json||'{}'),spec:JSON.parse(x.spec_json||'{}'),research_json:undefined,spec_json:undefined})),policy:getConnectorAbsorptionSummary().absorption_policy});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-first/assimilate')return assimilate(request,env);
 if(request.method==='POST'&&path==='/api/magnanimous/native-first/self-develop')return selfDevelop(request,env,auth.user);
 if(request.method==='GET'&&path==='/api/magnanimous/native-first/self-develop'){
  const {results=[]}=await env.DB.prepare('SELECT id,goal,mode,status,plan_json,created_at,updated_at FROM magnanimous_self_development_runs WHERE tenant_id=? AND user_id=? ORDER BY created_at DESC LIMIT 50').bind(String(auth.user.tenant_id),String(auth.user.id)).all();
  return json({runs:results.map(x=>({...x,plan:JSON.parse(x.plan_json||'{}')}))});
 }
 return json({detail:'Magnanimous native-first route not found.'},404);
}

export const MAGNANIMOUS_NATIVE_CORE=CORE_NATIVE_CAPABILITIES;
export const buildMagnanimousSelfDevelopmentPlan=selfDevelopmentPlan;
