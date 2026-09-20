// Railway is a replaceable infrastructure provider beneath Magnanimous AI.
// This registry captures observable/public tool contracts and operating techniques only.
// It does not copy Railway proprietary implementation, private prompts, credentials, or internal code.

export const RAILWAY_RESEARCH=Object.freeze({
  verified_at:'2026-09-20',
  provider:'Railway',
  docs:[
    'https://docs.railway.com/projects',
    'https://docs.railway.com/build-deploy',
    'https://docs.railway.com/deployments',
    'https://docs.railway.com/deployments/monorepo',
    'https://docs.railway.com/networking/private-networking',
    'https://docs.railway.com/networking/tcp-proxy',
    'https://docs.railway.com/feature-flags',
    'https://docs.railway.com/guides/preview-deployments-with-pr-environments',
    'https://docs.railway.com/guides/isolate-staging-production',
    'https://docs.railway.com/ai/railway-agent'
  ],
  resource_model:['workspace','project','environment','service','bucket','deployment'],
  boundary:'Railway account, live infrastructure, billing, provider network and provider-managed execution remain external and replaceable.'
});

export const RAILWAY_TOOL_CONTRACTS=Object.freeze([
  ['whoami','identity-context','Read authenticated operator/workspace context.'],
  ['list_workspaces','workspace-catalog','List available infrastructure workspaces.'],
  ['list_projects','project-catalog','List projects in authorized workspaces.'],
  ['create_project','project-provision','Create a project in an authorized workspace.'],
  ['create_deployment','repo-deploy','Create a service from a repository and trigger deployment.'],
  ['create_service','service-provision','Create an empty or image-backed service.'],
  ['update_service','service-config','Change build, start, health, restart, root, cron and watch-path configuration.'],
  ['list_services','service-catalog','List project services and environments.'],
  ['get_service_config','service-inspection','Inspect source, build, deploy, networking and volume configuration.'],
  ['get_service_metrics','service-observability','Read CPU, memory, disk and network metrics.'],
  ['list_variables','configuration-read','List environment/service variable names and authorized values when available.'],
  ['set_variables','configuration-write','Set service or shared environment variables with redeploy controls.'],
  ['list_domains','domain-read','List generated and custom domains.'],
  ['generate_domain','domain-provision','Generate or attach a domain and return required DNS records.'],
  ['search_docs','docs-search','Search provider documentation.'],
  ['fetch_docs','docs-read','Fetch a documentation page for operational guidance.'],
  ['list_feature_flags','feature-flag-catalog','List project/workspace feature flags.'],
  ['get_feature_flag','feature-flag-read','Read one project/workspace feature flag.'],
  ['set_feature_flag','feature-flag-write','Create or update a project-scoped feature flag.'],
  ['delete_feature_flag','feature-flag-delete','Delete a project-scoped feature flag.'],
  ['list_deployments','deployment-history','List deployment history and terminal states.'],
  ['get_status','environment-status','Read environment-wide service deployment status.'],
  ['get_logs','logs-observability','Read bounded build, runtime and HTTP logs.'],
  ['redeploy','deployment-retry','Trigger a service redeployment.'],
  ['accept_deploy','staged-change-commit','Commit staged Railway environment changes and deploy them.'],
  ['railway_agent','infrastructure-agent','Use provider-side infrastructure reasoning for complex authorized operations.']
].map(([tool,capability,purpose])=>Object.freeze({tool,capability,purpose})));

export const RAILWAY_TECHNIQUES=Object.freeze([
  {id:'resource-hierarchy',purpose:'Model infrastructure as workspace → project → environment → service/bucket → deployment.'},
  {id:'explicit-resource-scoping',purpose:'Resolve and pass project, environment and service IDs explicitly instead of relying on ambient context.'},
  {id:'environment-isolation',purpose:'Keep production, staging and preview configuration, networking, buckets and deployments isolated.'},
  {id:'preview-environments',purpose:'Create disposable PR-style environments from a controlled base environment and deprovision them after use.'},
  {id:'terminal-deploy-verification',purpose:'Never call a deployment successful until a terminal SUCCESS state is observed.'},
  {id:'mutation-readback',purpose:'After configuration or deployment mutations, perform a read-back verification.'},
  {id:'healthcheck-gated-release',purpose:'Use explicit health endpoints and timeouts to gate rollout readiness.'},
  {id:'logs-metrics-triage',purpose:'Combine deployment state, build/runtime/HTTP logs and resource metrics before changing configuration.'},
  {id:'restart-policy',purpose:'Use explicit restart policy and retry limits for crash recovery.'},
  {id:'monorepo-root-and-watch-paths',purpose:'Scope builds to service roots and watched paths so unrelated changes do not redeploy everything.'},
  {id:'provider-neutral-docker-build',purpose:'Prefer portable Dockerfile/build contracts that can run on Railway or another standard host.'},
  {id:'private-service-networking',purpose:'Use internal DNS/private networking for service-to-service traffic when available.'},
  {id:'public-domain-separation',purpose:'Expose only intended public services and keep internal services off public domains.'},
  {id:'dns-verification',purpose:'Treat custom-domain attachment and external DNS verification as separate steps.'},
  {id:'variable-scope-separation',purpose:'Separate shared environment variables from service-specific configuration and keep secrets out of logs.'},
  {id:'feature-flag-rollout',purpose:'Use typed feature flags for progressive rollout, rollback and controlled capability exposure.'},
  {id:'deploy-config-as-code',purpose:'Represent build/start/health/root/watch configuration in reproducible code or declarative config where practical.'},
  {id:'cli-mcp-api-routing',purpose:'Choose local CLI for local-repo/SSH workflows, remote API/MCP for account-scoped operations, and API fallback only for uncovered operations.'},
  {id:'bounded-observability',purpose:'Query bounded logs and metrics windows to diagnose issues without uncontrolled data collection.'},
  {id:'safe-redeploy',purpose:'Redeploy only after validating target project/environment/service and preserving current working configuration.'},
  {id:'cost-aware-ephemeral-infra',purpose:'Prefer temporary preview/sandbox resources for validation and remove them when no longer needed.'},
  {id:'external-approval-boundary',purpose:'Keep billing, destructive deletion, provider authorization and user-only approval gates outside automatic Magnanimous action.'}
]);

const NATIVE_TARGET_BY_CAPABILITY=Object.freeze({
  'identity-context':'magnanimous-cloud-identity',
  'workspace-catalog':'magnanimous-cloud-control',
  'project-catalog':'magnanimous-cloud-control',
  'project-provision':'magnanimous-cloud-control',
  'repo-deploy':'magnanimous-deployment-operator',
  'service-provision':'magnanimous-cloud-control',
  'service-config':'magnanimous-service-controller',
  'service-catalog':'magnanimous-cloud-control',
  'service-inspection':'magnanimous-service-controller',
  'service-observability':'magnanimous-observability',
  'configuration-read':'magnanimous-config-vault',
  'configuration-write':'magnanimous-config-vault',
  'domain-read':'magnanimous-dns-control',
  'domain-provision':'magnanimous-dns-control',
  'docs-search':'magnanimous-knowledge-research',
  'docs-read':'magnanimous-knowledge-research',
  'feature-flag-catalog':'magnanimous-progressive-delivery',
  'feature-flag-read':'magnanimous-progressive-delivery',
  'feature-flag-write':'magnanimous-progressive-delivery',
  'feature-flag-delete':'magnanimous-progressive-delivery',
  'deployment-history':'magnanimous-deployment-operator',
  'environment-status':'magnanimous-deployment-operator',
  'logs-observability':'magnanimous-observability',
  'deployment-retry':'magnanimous-deployment-operator',
  'staged-change-commit':'magnanimous-deployment-operator',
  'infrastructure-agent':'magnanimous-cloud-orchestrator'
});

function initiativeFor(tool){
  if(/^(whoami|list_|get_|search_|fetch_)/.test(tool))return{suggestive:true,auto_initiate:true,requires_confirmation:false,action_class:'read-inspect-verify'};
  if(tool==='delete_feature_flag')return{suggestive:true,auto_initiate:false,requires_confirmation:true,action_class:'destructive'};
  if(tool==='accept_deploy')return{suggestive:true,auto_initiate:false,requires_confirmation:true,action_class:'deployment-commit'};
  return{suggestive:true,auto_initiate:false,requires_confirmation:true,action_class:'configuration-or-deployment-write'};
}

export function getRailwayCapabilityManifest(){
  return RAILWAY_TOOL_CONTRACTS.map(row=>({
    id:'railway:'+row.tool,
    connector_id:'railway',
    connector_name:'Railway',
    category:'deployment',
    capability:row.capability,
    tool_contract:row.tool,
    native_target:NATIVE_TARGET_BY_CAPABILITY[row.capability]||'magnanimous-cloud-control',
    priority:'observed',
    source_kind:'public-provider-tool-contract',
    boundary:'external-repository-or-deployment-target-when-live',
    absorption_status:'brain-spec-absorbed',
    implementation_status:'specified-not-assumed-native',
    magnanimous_owned:['intent-understanding','planning','policy','memory','tool-selection','result-normalization','verification','failure-recovery','outcome-learning'],
    external_only:['authorized Railway account','Railway-hosted infrastructure','provider billing/network/execution'],
    initiative:initiativeFor(row.tool),
    search_text:row.purpose,
    techniques:RAILWAY_TECHNIQUES.map(x=>x.id),
    acceptance_tests:[
      'Magnanimous can express the operation without Railway-specific public identity.',
      'The provider account is treated as a replaceable execution adapter.',
      'Read operations may be initiated when authorized; writes keep existing confirmation and permission gates.',
      'Deployment success requires terminal-state verification.',
      'No proprietary Railway implementation is copied.'
    ],
    research:{...RAILWAY_RESEARCH,public_purpose:row.purpose,tool:row.tool,proprietary_implementation_copied:false}
  }));
}

export function getRailwayTechniqueManifest(){
  return RAILWAY_TECHNIQUES.map(row=>({
    id:'railway-technique:'+row.id,
    connector_id:'railway-techniques',
    connector_name:'Magnanimous Cloud / Railway research',
    category:'magnanimous-skill',
    capability:'technique-'+row.id,
    native_target:'magnanimous-cloud-orchestrator',
    priority:'first-party',
    source_kind:'public-operational-technique-synthesis',
    boundary:'none-or-replaceable-external-rail',
    absorption_status:'brain-spec-absorbed',
    implementation_status:'specified-not-assumed-native',
    magnanimous_owned:['technique-synthesis','planning','policy','verification','failure-recovery','outcome-learning'],
    external_only:['authorized provider execution when the real infrastructure action requires it'],
    initiative:{suggestive:true,auto_initiate:true,requires_confirmation:false,action_class:'planning-and-verification-technique'},
    search_text:row.purpose,
    techniques:[row.id],
    acceptance_tests:[
      'Technique is provider-neutral and independently implementable.',
      'No proprietary source code or private provider logic is copied.',
      'External writes remain behind real authorization/confirmation gates.'
    ],
    research:{...RAILWAY_RESEARCH,public_purpose:row.purpose,technique:row.id,proprietary_implementation_copied:false}
  }));
}

export function getRailwayAbsorptionSummary(){
  return{
    identity:'Magnanimous AI',
    provider_role:'replaceable infrastructure adapter',
    tool_contracts:RAILWAY_TOOL_CONTRACTS.length,
    techniques:RAILWAY_TECHNIQUES.length,
    resource_model:[...RAILWAY_RESEARCH.resource_model],
    proprietary_implementation_copied:false,
    status:'brain-spec-absorbed'
  };
}
