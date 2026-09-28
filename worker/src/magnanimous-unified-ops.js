import {
  MAGNANIMOUS_CLOUDFLARE_FAMILIES,
  CLOUDFLARE_ARCHITECTURE_TECHNIQUES
} from './magnanimous-cloudflare-capability-registry.js';
import {
  RAILWAY_TOOL_CONTRACTS,
  RAILWAY_PLATFORM_CAPABILITIES,
  RAILWAY_TECHNIQUES
} from './magnanimous-railway-capability-registry.js';
import {
  getCloudflareNativeCompatibilityManifest,
  getRailwayNativeCompatibilityManifest,
  getNativeInfrastructureCompatibilitySummary
} from './magnanimous-native-infrastructure-compatibility.js';

export const MAGNANIMOUS_UNIFIED_OPS_POLICY=Object.freeze({
  identity:'Magnanimous AI',
  plugin_identity:'Magnanimous AI',
  control_plane:'Magnanimous Cloud',
  architecture:'one-first-party-operations-plugin',
  areas:['web-browser','cloud-deployment','edge-runtime'],
  benchmark_providers:['TinyFish','Railway','Cloudflare'],
  provider_required_for_control_plane:false,
  provider_plugin_required:false,
  provider_purchase_required_for_control_plane:false,
  proprietary_copying:false,
  clean_room_rule:'Learn only from public/observable capability contracts, open standards and first-party behavior. Never copy provider source code, private prompts, credentials, model weights, private APIs or trade-secret implementation.',
  capacity_rule:'Software can own orchestration and control-plane behavior, but physical CPU/RAM/disk, public IP space, Internet transit, registrar authority and carrier-scale DDoS capacity still require owner-operated or replaceable external infrastructure.',
  provider_role:'optional-replaceable-capacity-or-migration-adapter'
});

const RAILWAY_KIND_HINTS=Object.freeze({
  'workspace':'workspace',
  'project':'project',
  'environment':'environment',
  'preview-environment':'preview-environment',
  'service':'service',
  'deployment':'deployment',
  'build':'build',
  'template':'template',
  'feature-flag':'feature-flag',
  'variables-secrets':'secret',
  'domain':'domain',
  'persistent-volume':'block-volume',
  'private-network':'private-network',
  'object-storage':'object-bucket'
});

const CLOUDFLARE_KIND_HINTS=Object.freeze({
  'workers':'worker',
  'static-assets':'app',
  'pages':'app',
  'containers':'container-service',
  'dynamic-workers':'worker',
  'durable-objects':'database',
  'workflows':'workflow',
  'queues':'queue',
  'cron-triggers':'schedule',
  'service-bindings':'service',
  'workers-builds':'build',
  'sandbox':'sandbox-job',
  'browser-run':'browser-session',
  'browser-rendering':'browser-session',
  'd1':'database',
  'kv':'cache-policy',
  'r2':'object-bucket',
  'hyperdrive':'database-gateway',
  'vectorize':'database',
  'analytics-engine':'database',
  'pipelines':'workflow',
  'durable-object-sql':'database',
  'workers-ai':'ai-gateway',
  'ai-gateway':'ai-gateway',
  'ai-search':'database',
  'agents-sdk':'service',
  'agent-skills':'template',
  'mcp-client':'service',
  'mcp-server':'service',
  'rate-limiting':'rate-limit-policy',
  'rulesets':'firewall',
  'firewall-rules':'firewall',
  'ssl-tls':'certificate',
  'dns':'dns-zone',
  'dnssec':'dns-zone',
  'cache':'cache-policy',
  'cache-rules':'cache-policy',
  'load-balancing':'load-balancer',
  'zone-management':'dns-zone',
  'access':'access-policy',
  'gateway':'egress-policy',
  'tunnel':'private-network',
  'images':'image',
  'image-resizing':'image',
  'workers-observability':'alert',
  'logs':'alert',
  'tracing':'alert',
  'metrics':'alert',
  'secrets-store':'secret',
  'secrets':'secret'
});

const clean=value=>String(value||'').trim().toLowerCase();

function railwayRows(){
  return RAILWAY_TOOL_CONTRACTS.map(row=>({
    source:'railway',
    benchmark_type:'tool',
    benchmark_id:row.tool,
    benchmark_name:row.tool,
    capability:row.capability,
    purpose:row.purpose,
    native_resource_kind:RAILWAY_KIND_HINTS[row.capability]||null
  })).concat(RAILWAY_PLATFORM_CAPABILITIES.map(row=>({
    source:'railway',
    benchmark_type:'platform-capability',
    benchmark_id:row.capability,
    benchmark_name:row.capability,
    capability:row.capability,
    purpose:row.purpose,
    native_resource_kind:RAILWAY_KIND_HINTS[row.capability]||null
  })));
}

function cloudflareRows(){
  return MAGNANIMOUS_CLOUDFLARE_FAMILIES.flatMap(family=>family.capabilities.map(row=>({
    source:'cloudflare',
    benchmark_type:'platform-capability',
    benchmark_family:family.id,
    benchmark_id:row.id,
    benchmark_name:row.name,
    capability:row.id,
    purpose:row.name,
    benchmark_mode:row.mode,
    native_resource_kind:CLOUDFLARE_KIND_HINTS[row.id]||null
  })));
}

function matchCompatibility(provider,id){
  const rows=provider==='railway'?getRailwayNativeCompatibilityManifest():getCloudflareNativeCompatibilityManifest();
  const key=clean(id);
  return rows.find(row=>
    clean(row.benchmark_capability)===key||
    clean(row.benchmark_name)===key||
    clean(row.id).endsWith(':'+key)
  )||null;
}

export function resolveMagnanimousBenchmark(input={}){
  const provider=clean(input.provider);
  const capability=clean(input.capability||input.tool||input.id);
  if(!['railway','cloudflare'].includes(provider))throw new Error('provider must be railway or cloudflare.');
  if(!capability)throw new Error('capability or tool is required.');
  const rows=provider==='railway'?railwayRows():cloudflareRows();
  const row=rows.find(item=>
    clean(item.benchmark_id)===capability||
    clean(item.benchmark_name)===capability||
    clean(item.capability)===capability
  );
  if(!row)return{
    found:false,
    provider,
    requested:capability,
    note:'No exact public benchmark contract is registered. Use the unified catalog to choose a supported capability.'
  };
  const compatibility=matchCompatibility(provider,row.capability)||matchCompatibility(provider,row.benchmark_id);
  return{
    found:true,
    ...row,
    native_target:compatibility?.native_target||'magnanimous-provider-neutral-control-plane',
    independence_status:compatibility?.independence_status||'normalized-native-contract',
    external_boundary:compatibility?.external_boundary||'none-or-replaceable-capacity',
    provider_plugin_required:false,
    provider_purchase_required:false,
    proprietary_implementation_copied:false,
    recommended_path:row.native_resource_kind
      ? 'Create/read the corresponding Magnanimous Cloud resource and stage any consequential action through Magnanimous policy.'
      : 'Use the registered Magnanimous native target; attach real host/network capacity only when the capability physically requires it.'
  };
}

export function getMagnanimousUnifiedOpsCatalog(){
  const compatibility=getNativeInfrastructureCompatibilitySummary();
  const cloudflare=cloudflareRows();
  const railway=railwayRows();
  return{
    ...MAGNANIMOUS_UNIFIED_OPS_POLICY,
    status:'native-control-plane-and-chatgpt-plugin-contract-ready',
    compatibility,
    benchmark_contracts:{
      railway:railway.length,
      cloudflare:cloudflare.length
    },
    techniques:{
      railway:RAILWAY_TECHNIQUES,
      cloudflare:CLOUDFLARE_ARCHITECTURE_TECHNIQUES
    },
    native_resource_hints:{
      railway:RAILWAY_KIND_HINTS,
      cloudflare:CLOUDFLARE_KIND_HINTS
    },
    operating_model:[
      'Magnanimous Native Web replaces supported TinyFish browser/search/research workflows.',
      'Magnanimous Cloud owns Railway-style project/environment/service/deployment desired state and deployment techniques.',
      'Magnanimous standalone runtime owns Cloudflare-style software contracts including SQL, object storage, cache, queues/workflows, schedules, AI policy, rate limiting, service bindings, observability, browser and sandbox paths.',
      'The ChatGPT connector exposes these through one Magnanimous OAuth/MCP identity.',
      'Provider adapters remain optional fallback/migration/capacity rails and are never required public identity.'
    ],
    truthful_boundaries:[
      'A control-plane record is not proof that physical compute or public network capacity exists.',
      'Secrets remain in Magnanimous secret storage or local runtime context and are never returned through the plugin.',
      'Consequential infrastructure mutations must be staged and separately approved/executed.',
      'No provider purchase is initiated by the native control plane.'
    ]
  };
}
