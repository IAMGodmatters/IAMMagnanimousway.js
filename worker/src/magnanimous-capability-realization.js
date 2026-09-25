const clip=(v,n=5000)=>String(v??'').trim().slice(0,n);
const norm=v=>clip(v,160).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

export const MAGNANIMOUS_EXECUTION_SURFACES=Object.freeze({
 'agent-mesh':{mode:'native',route:'/api/agents/chat',module:'worker/src/agent-mesh-runtime.js',proof:'Native Agent Mesh chat/runtime exists and is production-smoke-tested.'},
 'api-contract-intelligence':{mode:'native',route:'/api/magnanimous/api-contract',module:'worker/src/magnanimous-api-contract-intelligence.js',proof:'Magnanimous owns API contract extraction, documentation coverage, version comparison, breaking-change classification and explicit-evidence impact mapping without an outside plugin.'},
 'business-operating-system':{mode:'native',route:'/api/operations/suite',module:'worker/src/magnanimous-workspace-suite.js',proof:'Magnanimous Workspace Suite owns tenant work objects, docs, sheets, slides, forms, chat, automations and search.'},
 'crm-growth-engine':{mode:'native',route:'/api/operations/crm/studio',module:'worker/src/native-work-crm-runtime.js',proof:'Native CRM runtime owns records, pipelines, scoring, sequences, accounts, deals and CRM intelligence.'},
 'data-platform':{mode:'native',route:'/api/data-studio/workbooks',module:'worker/src/data-studio-runtime.js',proof:'Data Studio owns workbook storage, transforms and summaries in Magnanimous D1.'},
 'evidence-auditor':{mode:'native',route:'/api/evidence-notebook',module:'worker/src/operations-entrypoint.js',proof:'Evidence Notebook is a native Magnanimous workspace with persisted evidence records.'},
 'knowledge-workspace':{mode:'native',route:'/api/knowledge/search',module:'worker/src/knowledge-runtime.js',proof:'Knowledge runtime owns ingestion, local search, FTS indexing and reusable workspace context.'},
 'memory-ingestion':{mode:'native',route:'/api/knowledge/ingest',module:'worker/src/knowledge-runtime.js',proof:'Knowledge ingestion stores normalized sources and chunks under Magnanimous control.'},
 'operations-hub':{mode:'native',route:'/api/work-engine',module:'worker/src/operations-entrypoint.js',proof:'Work Engine owns plans, steps, progress and recovery state.'},
 'professional-intelligence':{mode:'native',route:'/api/professional/generate',module:'worker/src/professional-workspace-runtime.js',proof:'Professional Workspace owns grounded business, research, daily-assistant and lead-intelligence workflows.'},
 'research-orchestrator':{mode:'native',route:'/api/research/queries',module:'worker/src/magnanimous-research-runtime.js',proof:'Magnanimous Research owns query, paper, enrichment and synthesis state; external sources remain adapters.'},
 'workspace-files':{mode:'native',route:'/api/operations/suite/objects',module:'worker/src/magnanimous-workspace-suite.js',proof:'Workspace Suite owns tenant files, docs, sheets, slides, notes and task objects.'},

 'magnanimous-cloud-identity':{mode:'native',route:'/api/magnanimous/cloud/catalog',module:'worker/src/magnanimous-cloud-provider-core.js',proof:'Magnanimous Cloud owns provider-neutral account/project context normalization and does not require provider identity as public product identity.'},
 'magnanimous-cloud-control':{mode:'native',route:'/api/magnanimous/cloud/resources',module:'worker/src/magnanimous-cloud-provider-core.js',proof:'Magnanimous Cloud owns provider-neutral project/resource desired state, action staging, inventory and verification.'},
 'magnanimous-service-controller':{mode:'native',route:'/api/magnanimous/cloud/resources',module:'worker/src/magnanimous-cloud-provider-core.js',proof:'Magnanimous Cloud resource/action contracts own service desired state and staged lifecycle operations; hosted capacity remains replaceable.'},
 'magnanimous-observability':{mode:'native',route:'/__magnanimous_runtime/metrics',module:'magnanimous-runtime/src/metrics.mjs',proof:'Standalone Magnanimous runtime exposes first-party metrics and health/service verification; provider-specific telemetry is normalized when used.'},
 'magnanimous-health-verification':{mode:'native',route:'/api/magnanimous/infrastructure',module:'worker/src/magnanimous-infrastructure-core.js',proof:'Magnanimous owner infrastructure API exposes provider-independent runtime/control-plane state while standalone /health, /services and /metrics endpoints supply the underlying runtime evidence.'},
 'magnanimous-config-vault':{mode:'native',route:'/api/magnanimous/tools',module:'worker/src/magnanimous-tool-gateway.js',proof:'Magnanimous owns encrypted credential/config normalization and audited tool dispatch while provider secrets remain isolated.'},
 'magnanimous-dns-control':{mode:'native',route:'/api/magnanimous/cloud/resources',module:'worker/src/magnanimous-cloud-provider-core.js',proof:'Magnanimous Cloud owns DNS/ingress desired-state contracts and guarded cutover policy; public DNS authority remains external until delegated.'},
 'magnanimous-progressive-delivery':{mode:'native',route:'/api/magnanimous/cloud/resources',module:'worker/src/magnanimous-cloud-provider-core.js',proof:'Magnanimous Cloud owns staged resource/action policy and can represent rollout controls while provider feature-flag rails remain replaceable.'},
 'magnanimous-knowledge-research':{mode:'native',route:'/api/research/queries',module:'worker/src/magnanimous-research-runtime.js',proof:'Magnanimous Research owns research planning, evidence and synthesis; provider documentation is an external source adapter.'},
 'magnanimous-cloud-orchestrator':{mode:'native',route:'/api/magnanimous/cloud/resources',module:'worker/src/magnanimous-cloud-provider-core.js',proof:'Magnanimous AI owns cloud planning, policy, staged actions and verification; infrastructure providers remain subordinate execution rails.'},
 'magnanimous-scheduler':{mode:'native',route:'/api/magnanimous/infrastructure/compatibility',module:'worker/src/magnanimous-infrastructure-core.js',proof:'Magnanimous Cloud owns schedule desired state through the secured owner control API; standalone execution is provided by magnanimous-runtime/src/server.mjs scheduler/system-cron compatibility.'},
 'magnanimous-object-storage':{mode:'native',route:'/api/magnanimous/infrastructure/compatibility',module:'worker/src/magnanimous-infrastructure-core.js',proof:'Magnanimous Cloud owns object-bucket desired state through the secured owner control API; first-party persistence is implemented by magnanimous-runtime/src/object-store.mjs.'},
 'magnanimous-backup-restore':{mode:'native',route:'/api/magnanimous/infrastructure/compatibility',module:'worker/src/magnanimous-infrastructure-core.js',proof:'Magnanimous Cloud owns backup-policy desired state through the secured owner control API; standalone backup and restore execution is implemented by Magnanimous runtime scripts.'},
 'magnanimous-private-network':{mode:'hybrid',route:'/api/magnanimous/cloud/resources',module:'magnanimous-runtime/src/cloud-control.mjs',proof:'Magnanimous owns private-network desired state and service isolation policy; the host must supply real network interfaces/overlay capacity.'},
 'magnanimous-network-gateway':{mode:'hybrid',route:'/api/magnanimous/cloud/resources',module:'magnanimous-runtime/src/cloud-control.mjs',proof:'Magnanimous owns ingress/egress/TCP/routing desired state; public IP allocation and upstream network transit remain physical external capacity unless owner-operated.'},
 'magnanimous-template-catalog':{mode:'native',route:'/api/magnanimous/infrastructure/compatibility',module:'worker/src/magnanimous-infrastructure-core.js',proof:'Magnanimous Cloud can represent reusable provider-neutral multi-resource templates and desired state.'},

 'communications-hub':{mode:'hybrid',route:'/api/inbox/overview',module:'worker/src/unified-inbox-runtime.js',proof:'Magnanimous owns unified inbox state while provider delivery/account access remains external.'},
 'deployment-operator':{mode:'hybrid',route:'/api/magnanimous/dev-agent/workflows',module:'worker/src/magnanimous-dev-agent.js',proof:'Magnanimous owns deployment planning/verification; repository host and deployment target remain external.'},
 'magnanimous-deployment-operator':{mode:'hybrid',route:'/api/magnanimous/dev-agent/workflows',module:'worker/src/magnanimous-dev-agent.js',proof:'Magnanimous owns deployment planning, staged execution, verification and recovery; Railway or another repository/hosting target remains a replaceable external rail.'},
 'engineering-operator':{mode:'hybrid',route:'/api/magnanimous/dev-agent/plan',module:'worker/src/magnanimous-dev-agent.js',proof:'Magnanimous owns engineering plans and staged workflows; repository writes remain approval-gated.'},
 'media-library':{mode:'hybrid',route:'/api/media-library/search',module:'worker/src/media-library-runtime.js',proof:'Magnanimous owns normalization, storage and license workflow while live public catalogs remain external data.'},
 'model-router':{mode:'hybrid',route:'/api/chat',module:'worker/src/provider-entrypoint.js',proof:'Magnanimous owns routing/policy; model compute remains a replaceable execution layer.'},
 'scheduling-engine':{mode:'hybrid',route:'/api/agency/bookings',module:'worker/src/agency-growth-runtime.js',proof:'Magnanimous owns booking/workflow state; third-party calendar/account synchronization remains external when requested.'},
 'social-operations':{mode:'hybrid',route:'/api/social-connect/providers',module:'worker/src/social-publishing-runtime.js',proof:'Magnanimous owns planning and credential isolation; social publishing requires provider authorization.'},
 'voice-agent-runtime':{mode:'hybrid',route:'/api/voice-agent/config',module:'worker/src/voice-agent-runtime.js',proof:'Magnanimous owns voice-agent logic and browser voice; PSTN/carrier calling remains an external rail.'},
 'billing-engine':{mode:'hybrid',route:'/api/billing/checkout',module:'worker/src/progress-entrypoint-base.js',proof:'Magnanimous owns billing policy and account state; payment settlement remains an external rail.'},
 'commerce-engine':{mode:'hybrid',route:'/connections',module:'worker/src/integrations.js',proof:'Magnanimous owns commerce orchestration while live storefront/order mutations require authorized commerce accounts.'},
 'commerce-research':{mode:'hybrid',route:'/api/research/queries',module:'worker/src/magnanimous-research-runtime.js',proof:'Magnanimous can own analysis and evidence state; fresh commerce catalogs remain external data.'},
 'b2b-travel-distribution':{mode:'hybrid',route:'/api/b2b/catalog',module:'worker/src/magnanimous-b2b-runtime.js',proof:'Magnanimous owns agency/sub-agent accounts, provider-neutral travel offer/order normalization, markup policy, servicing workflows and verification; live GDS/NDC/airline/hotel/activity inventory, ticketing authority and supplier settlement remain replaceable authorized external rails.'},

 'animation-studio':{mode:'hybrid',route:'/api/video-agents/render-engine',module:'worker/src/magnanimous-render-engine.js',proof:'Magnanimous Render Engine owns animation orchestration, fallback policy, session routing and verification; specialized render compute remains replaceable.'},
 'avatar-studio':{mode:'hybrid',route:'/api/video-agents',module:'worker/src/video-agents-runtime.js',proof:'Magnanimous Video Agents own avatar/conversation workflow state and renderer routing; specialized avatar rendering remains replaceable.'},
 'bible-study-engine':{mode:'hybrid',route:'/api/chat',module:'worker/src/provider-entrypoint.js',proof:'Magnanimous exposes a first-class Bible Study mode and owns routing, memory, policy and verification; model compute remains replaceable.'},
 'business-analytics':{mode:'native',route:'/api/data-studio/workbooks',module:'worker/src/data-studio-runtime.js',proof:'Magnanimous Data Studio owns workbook storage, transforms, analysis state and summaries in D1.'},
 'cinema-engine':{mode:'hybrid',route:'/api/video-agents/render-engine',module:'worker/src/magnanimous-render-engine.js',proof:'Magnanimous owns cinema planning, render orchestration and fallback policy; specialized render compute remains replaceable.'},
 'creative-studio':{mode:'hybrid',route:'/api/visual/scene',module:'worker/src/visual-runtime.js',proof:'Magnanimous owns creative direction, visual workflow, provider selection and verification; generation compute remains replaceable.'},
 'creator-growth-engine':{mode:'hybrid',route:'/api/business-ai',module:'worker/src/magnanimous-business-ai-suite.js',proof:'Magnanimous Business AI owns creator-growth planning, campaign workflows and durable jobs; live platform metrics/publishing rails remain external where required.'},
 'design-studio':{mode:'hybrid',route:'/api/business-ai',module:'worker/src/magnanimous-business-ai-suite.js',proof:'Magnanimous Business AI owns design briefs, brand direction, creative jobs and verification; specialized canvases/renderers remain optional adapters.'},
 'design-system-intelligence':{mode:'hybrid',route:'/api/business-ai',module:'worker/src/magnanimous-business-ai-suite.js',proof:'Magnanimous owns design-system requirements, reusable brand rules and structured implementation jobs; live third-party design files remain external when used.'},
 'explainer-studio':{mode:'hybrid',route:'/api/video-agents/render-engine',module:'worker/src/magnanimous-render-engine.js',proof:'Magnanimous owns explainer planning, storyboard/render orchestration and fallback policy; specialized rendering remains replaceable.'},
 'finance-research':{mode:'hybrid',route:'/api/finance-people/compliance/brief',module:'worker/src/finance-people-v2.js',proof:'Magnanimous Finance & People owns finance records, compliance briefs and workspace context; fresh regulatory/market data remains external when required.'},
 'growth-analytics':{mode:'hybrid',route:'/api/business-ai',module:'worker/src/magnanimous-business-ai-suite.js',proof:'Magnanimous Business AI owns growth analysis, campaign planning and persisted jobs; live ad/social analytics remain external where required.'},
 'legal-research-engine':{mode:'hybrid',route:'/api/research/queries',module:'worker/src/magnanimous-research-runtime.js',proof:'Magnanimous owns research planning, evidence organization and synthesis; current legal authorities remain external source data when freshness is required.'},
 'marketing-automation':{mode:'native',route:'/api/agency/automations',module:'worker/src/agency-automation-runtime.js',proof:'Magnanimous Agency Automations own trigger, condition, action and Work Engine orchestration; external delivery rails remain separately authorized.'},
 'people-graph':{mode:'native',route:'/api/operations/crm/studio',module:'worker/src/native-work-crm-runtime.js',proof:'Native CRM owns contacts, accounts, relationships, activities, scoring and pipeline state under Magnanimous control.'},
 'product-design-agent':{mode:'hybrid',route:'/api/business-ai',module:'worker/src/magnanimous-business-ai-suite.js',proof:'Magnanimous owns product/design requirements, research synthesis, implementation jobs and verification; external design canvases remain optional.'},
 'sales-intelligence':{mode:'native',route:'/api/operations/crm/studio',module:'worker/src/native-work-crm-runtime.js',proof:'Native CRM owns lead/account/deal intelligence, scoring, relationship history and pipeline analysis.'},
 'scientific-research':{mode:'hybrid',route:'/api/research/queries',module:'worker/src/magnanimous-research-runtime.js',proof:'Magnanimous Research owns query, evidence, paper and synthesis state; fresh scholarly sources remain external data adapters.'},
 'security-auditor':{mode:'hybrid',route:'/api/magnanimous/dev-agent/plan',module:'worker/src/magnanimous-dev-agent.js',proof:'Magnanimous Dev Agent owns security-review planning, trust-boundary analysis and verification workflows; live repository actions remain approval-gated.'},
 'seo-intelligence':{mode:'hybrid',route:'/api/business-ai',module:'worker/src/magnanimous-business-ai-suite.js',proof:'Magnanimous owns SEO/AEO planning, evidence-based recommendations and durable jobs; current ranking/search-console data remains external when requested.'},
 'tool-deployment':{mode:'hybrid',route:'/api/magnanimous/dev-agent/workflows',module:'worker/src/magnanimous-dev-agent.js',proof:'Magnanimous owns build/deployment planning, staged actions and verification; external repository/hosting targets remain approval-gated.'},
 'universal-tool-gateway':{mode:'hybrid',route:'/api/magnanimous/tools',module:'worker/src/magnanimous-tool-gateway.js',proof:'Magnanimous Tool Gateway owns MCP discovery, normalized tool contracts, encrypted credentials, auditing and dispatch; connected MCP servers remain replaceable external execution rails.'},
 'voice-engine':{mode:'hybrid',route:'/api/voice-agent/config',module:'worker/src/voice-agent-runtime.js',proof:'Magnanimous owns voice-agent configuration, logic and browser voice workflows; PSTN/specialized voice infrastructure remains replaceable.'}
});

const externalBoundary=boundary=>/external|account|rail|deployment|compute|repository|provider|network/.test(String(boundary||'').toLowerCase());

export function classifyCapabilityRealization(row={}){
 const nativeTarget=norm(row.native_target||'');
 const surface=MAGNANIMOUS_EXECUTION_SURFACES[nativeTarget]||null;
 const boundary=String(row.boundary||'none');
 const hasExternalBoundary=externalBoundary(boundary);
 if(surface){
  if(surface.mode==='native'&&!hasExternalBoundary){
   return{mode:'native',status:'native-ready',native_target:nativeTarget,route:surface.route,evidence_module:surface.module,requires_external:false,proof:surface.proof};
  }
  return{mode:'hybrid',status:'hybrid-ready',native_target:nativeTarget,route:surface.route,evidence_module:surface.module,requires_external:true,proof:surface.proof+' External boundary retained: '+boundary+'.'};
 }
 if(hasExternalBoundary){
  return{mode:'bridge',status:'bridge-required',native_target:nativeTarget,route:'',evidence_module:'',requires_external:true,proof:'No complete Magnanimous execution surface is proven for this target yet; external boundary retained: '+boundary+'.'};
 }
 return{mode:'specified',status:'specified-only',native_target:nativeTarget,route:'',evidence_module:'',requires_external:false,proof:'Provider-neutral capability specification exists, but no independent runtime execution surface is yet proven.'};
}

export async function getCapabilityRealizationSummary(env){
 if(!env?.DB)return{total:0,'native-ready':0,'hybrid-ready':0,'bridge-required':0,'specified-only':0};
 try{
  const {results=[]}=await env.DB.prepare('SELECT status,COUNT(*) count FROM magnanimous_capability_realizations GROUP BY status').all();
  const out={total:0,'native-ready':0,'hybrid-ready':0,'bridge-required':0,'specified-only':0};
  for(const row of results){const n=Number(row.count||0);out.total+=n;if(Object.prototype.hasOwnProperty.call(out,row.status))out[row.status]=n}
  return out;
 }catch{return{total:0,'native-ready':0,'hybrid-ready':0,'bridge-required':0,'specified-only':0}}
}

export async function listCapabilityRealizations(env,{goal='',limit=40,status='',offset=0}={}){
 if(!env?.DB)return[];
 const safeLimit=Math.max(1,Math.min(200,Number(limit)||40)),safeOffset=Math.max(0,Number(offset)||0);
 const where=[],bind=[];
 if(status){where.push('status=?');bind.push(String(status))}
 const whereSql=where.length?'WHERE '+where.join(' AND '):'';
 const sql='SELECT connector_id,capability_id,tool_name,native_target,mode,status,native_route,evidence_module,boundary,requires_external,proof_json,updated_at FROM magnanimous_capability_realizations '+whereSql+" ORDER BY CASE status WHEN 'native-ready' THEN 0 WHEN 'hybrid-ready' THEN 1 WHEN 'bridge-required' THEN 2 ELSE 3 END,connector_id,capability_id LIMIT "+safeLimit+' OFFSET '+safeOffset;
 const {results=[]}=await env.DB.prepare(sql).bind(...bind).all();
 const terms=String(goal||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);
 return results.map(row=>{
  const hay=(String(row.connector_id)+' '+String(row.capability_id)+' '+String(row.native_target)+' '+String(row.mode)+' '+String(row.status)).toLowerCase();
  return{...row,requires_external:Boolean(row.requires_external),proof:(()=>{try{return JSON.parse(row.proof_json||'{}')}catch{return{}}})(),match:terms.reduce((n,t)=>n+(hay.includes(t)?1:0),0)};
 }).sort((a,b)=>b.match-a.match);
}

export async function getCapabilityRealizationContext(env,goal=''){
 const rows=await listCapabilityRealizations(env,{goal,limit:20});
 if(!rows.length)return{context:'',routes:[]};
 const selected=rows.filter(x=>x.match>0).slice(0,10);
 const use=selected.length?selected:rows.slice(0,6);
 const lines=['\n\nMAGNANIMOUS CAPABILITY REALIZATION ROUTER:'];
 for(const row of use){
  const route=row.native_route?' via '+row.native_route:'';
  lines.push('- '+row.capability_id+': '+row.status+'/'+row.mode+route+'. '+(row.requires_external?'External authorization/data/rail still required where applicable.':'Magnanimous-owned execution surface is available.'));
 }
 lines.push('Use native-ready routes first. Hybrid-ready routes may use Magnanimous-owned workflow logic but must keep the real external authorization/data/network/payment/repository boundary. Bridge-required and specified-only capabilities must never be claimed as native or completed without real implementation/tool evidence.');
 return{context:lines.join('\n'),routes:use};
}
