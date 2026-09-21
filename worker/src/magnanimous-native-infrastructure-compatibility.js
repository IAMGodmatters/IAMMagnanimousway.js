import { MAGNANIMOUS_CLOUDFLARE_FAMILIES, CLOUDFLARE_ARCHITECTURE_TECHNIQUES } from './magnanimous-cloudflare-capability-registry.js';
import { RAILWAY_TOOL_CONTRACTS, RAILWAY_PLATFORM_CAPABILITIES, RAILWAY_TECHNIQUES } from './magnanimous-railway-capability-registry.js';

export const MAGNANIMOUS_PROVIDER_INDEPENDENCE_POLICY=Object.freeze({
  identity:'Magnanimous AI',
  control_plane_owner:'Magnanimous AI',
  provider_required_for_software_control_plane:false,
  paid_cloud_required:false,
  plugin_required:false,
  proprietary_provider_code_required:false,
  free_first:true,
  self_host_first:true,
  providers_are_replaceable_capacity_adapters:true,
  physical_capacity_is_not_software:true,
  truthful_boundary:'CPU/RAM/disks, public IP allocation, Internet transit, registrar authority, carrier-scale DDoS absorption, regulated telecom and payment settlement still require real external infrastructure or owner-operated equivalents.'
});

const SOFTWARE_NATIVE=new Map(Object.entries({
  workers:['magnanimous-standalone-node',['magnanimous-runtime/src/server.mjs']],
  'static-assets':['magnanimous-static-assets',['magnanimous-runtime/src/server.mjs']],
  pages:['magnanimous-static-assets',['magnanimous-runtime/src/server.mjs']],
  'durable-objects':['magnanimous-event-coordination',['magnanimous-runtime/src/event-hub.mjs','magnanimous-runtime/src/d1-compat.mjs']],
  workflows:['magnanimous-durable-work',['magnanimous-runtime/src/durable-work.mjs']],
  queues:['magnanimous-durable-work',['magnanimous-runtime/src/durable-work.mjs']],
  'cron-triggers':['magnanimous-scheduler',['magnanimous-runtime/src/server.mjs']],
  'service-bindings':['magnanimous-service-bindings',['magnanimous-runtime/src/service-bindings.mjs']],
  d1:['magnanimous-sql',['magnanimous-runtime/src/d1-compat.mjs']],
  kv:['magnanimous-kv-cache',['magnanimous-runtime/src/kv-cache.mjs']],
  r2:['magnanimous-object-store',['magnanimous-runtime/src/object-store.mjs']],
  vectorize:['magnanimous-vector-store',['magnanimous-runtime/src/vector-store.mjs']],
  'analytics-engine':['magnanimous-analytics',['magnanimous-runtime/src/analytics-engine.mjs']],
  pipelines:['magnanimous-pipeline',['magnanimous-runtime/src/pipeline.mjs']],
  'durable-object-sql':['magnanimous-sql',['magnanimous-runtime/src/d1-compat.mjs']],
  'workers-ai':['magnanimous-ai-binding',['magnanimous-runtime/src/ai-binding.mjs']],
  'ai-gateway':['magnanimous-ai-policy-gateway',['magnanimous-runtime/src/ai-binding.mjs','worker/src/provider-runtime-env.js']],
  'ai-search':['magnanimous-search-vector',['magnanimous-runtime/src/vector-store.mjs']],
  'agents-sdk':['magnanimous-agent-runtime',['worker/src/entrypoint.js']],
  'agent-skills':['magnanimous-skill-manifest',['worker/src/magnanimous-connector-absorption.js']],
  'mcp-client':['magnanimous-universal-ai-connector',['worker/src/magnanimous-universal-ai-connector.js']],
  'mcp-server':['magnanimous-universal-ai-connector',['worker/src/magnanimous-universal-ai-connector.js']],
  'code-mode':['magnanimous-tool-discovery-routing',['worker/src/magnanimous-connector-absorption.js']],
  think:['magnanimous-reasoning-orchestrator',['worker/src/magnanimous-connector-absorption.js']],
  'ai-chat':['magnanimous-ai-chat',['worker/src/entrypoint.js']],
  'rate-limiting':['magnanimous-rate-limit',['magnanimous-runtime/src/rate-limit.mjs']],
  rulesets:['magnanimous-policy-engine',['worker/src/security-hardening.js']],
  'firewall-rules':['magnanimous-policy-engine',['worker/src/security-hardening.js']],
  'ssl-tls':['magnanimous-tls',['magnanimous-runtime/Caddyfile']],
  dns:['magnanimous-dns',['magnanimous-runtime/dns/Corefile','magnanimous-runtime/scripts/prepare-dns-zone.mjs']],
  cache:['magnanimous-cache',['magnanimous-runtime/src/kv-cache.mjs','magnanimous-runtime/Caddyfile']],
  'cache-rules':['magnanimous-cache-policy',['magnanimous-runtime/src/kv-cache.mjs','magnanimous-runtime/Caddyfile']],
  images:['magnanimous-media-transform',['magnanimous-runtime/services/media-service.mjs']],
  'image-resizing':['magnanimous-media-transform',['magnanimous-runtime/services/media-service.mjs']],
  'workers-observability':['magnanimous-observability',['magnanimous-runtime/src/metrics.mjs','magnanimous-runtime/src/analytics-engine.mjs']],
  logs:['magnanimous-observability',['magnanimous-runtime/src/metrics.mjs']],
  tracing:['magnanimous-observability',['worker/src/request-observability.js']],
  metrics:['magnanimous-observability',['magnanimous-runtime/src/metrics.mjs']],
  'web-performance':['magnanimous-performance-policy',['frontend/app/api-budget-guard.tsx']],
  compression:['magnanimous-reverse-proxy',['magnanimous-runtime/Caddyfile']],
  'local-dev':['magnanimous-standalone-runtime',['magnanimous-runtime/docker-compose.yml']],
  bindings:['magnanimous-service-bindings',['magnanimous-runtime/src/service-bindings.mjs']],
  'secrets-store':['magnanimous-secret-vault',['magnanimous-runtime/src/secret-vault.mjs']],
  secrets:['magnanimous-secret-vault',['magnanimous-runtime/src/secret-vault.mjs']],
  wrangler:['magnanimous-deployment-operator',['magnanimous-runtime/scripts/install-release-bundle.sh']],
  'rest-api':['magnanimous-control-api',['worker/src/security-entrypoint.js']],
  openapi:['magnanimous-openapi-contract',['worker/src/magnanimous-universal-ai-connector.js']]
}));

const SELF_HOST_CAPACITY=new Set([
  'containers','dynamic-workers','workers-builds','workers-for-platforms','workers-vpc','sandbox','browser-run','browser-rendering',
  'smart-placement','hyperdrive','waf','bot-management','api-shield','page-shield','turnstile','dnssec','tiered-cache','waiting-room',
  'access','gateway','tunnel','one-client','mesh','browser-isolation','casb','dlp','email-security','device-posture','identity','dex',
  'images','stream','realtime','video-delivery','webrtc','email-routing','email-workers','email-sending','email-agent-channel',
  'tail-workers','logpush','log-explorer','graphql-analytics','web-analytics','zaraz','zaraz-consent','managed-components',
  'http3','early-hints','origin-optimization','terraform','graphql-api','mcp-code-mode','skills-plugin','shell','voice','browser-agents'
]);

const EXTERNAL_NETWORK_AUTHORITY=new Set([
  'ddos','argo-smart-routing','load-balancing','spectrum','registrar','zone-management','cloudflare-wan','magic-transit',
  'network-firewall','network-interconnect','gre-ipsec','network-flow','network-analytics','packet-capture','bgp-routing'
]);

function cloudflareTarget(capability){
  const native=SOFTWARE_NATIVE.get(capability.id);
  if(native)return{
    native_target:native[0],
    independence_status:'software-native',
    external_boundary:'none for the software contract; host capacity may still be needed',
    proof:native[1]
  };
  if(EXTERNAL_NETWORK_AUTHORITY.has(capability.id))return{
    native_target:'magnanimous-network-control-contract',
    independence_status:'control-plane-native-external-network-capacity',
    external_boundary:'real public network capacity, routing authority, registrar authority or upstream transit is physically external unless owner-operated',
    proof:['magnanimous-runtime/src/cloud-control.mjs','worker/src/magnanimous-infrastructure-core.js']
  };
  if(SELF_HOST_CAPACITY.has(capability.id))return{
    native_target:'magnanimous-self-hosted-capability',
    independence_status:'native-contract-self-host-capacity',
    external_boundary:'requires owner hardware or a replaceable host/network execution rail',
    proof:['magnanimous-runtime/src/cloud-control.mjs','worker/src/magnanimous-infrastructure-core.js']
  };
  return{
    native_target:'magnanimous-provider-neutral-control-plane',
    independence_status:'normalized-native-contract',
    external_boundary:'no provider identity dependency; concrete execution attaches only when physically required',
    proof:['magnanimous-runtime/src/cloud-control.mjs','worker/src/magnanimous-infrastructure-core.js']
  };
}

export function getCloudflareNativeCompatibilityManifest(){
  return MAGNANIMOUS_CLOUDFLARE_FAMILIES.flatMap(family=>family.capabilities.map(capability=>({
    id:'cloudflare-compat:'+capability.id,
    benchmark_provider:'Cloudflare',
    benchmark_family:family.id,
    benchmark_capability:capability.id,
    benchmark_name:capability.name,
    benchmark_mode:capability.mode,
    ...cloudflareTarget(capability),
    provider_plugin_required:false,
    provider_purchase_required:false,
    proprietary_implementation_copied:false
  })));
}

function railwayBoundary(row){
  if(row.boundary)return row.boundary;
  if(/metrics|logs|docs|catalog|read|status|identity/.test(row.capability))return'software-native';
  if(/domain|network|deployment|service|project|config|feature-flag/.test(row.capability))return'host-or-network-capacity';
  return'software-native';
}

export function getRailwayNativeCompatibilityManifest(){
  const toolRows=RAILWAY_TOOL_CONTRACTS.map(row=>({
    id:'railway-tool-compat:'+row.tool,
    benchmark_provider:'Railway',
    benchmark_family:'tool-contract',
    benchmark_capability:row.capability,
    benchmark_name:row.tool,
    native_target:'magnanimous-'+row.capability,
    independence_status:railwayBoundary(row)==='software-native'?'software-native':'native-control-contract-host-capacity',
    external_boundary:railwayBoundary(row),
    provider_plugin_required:false,
    provider_purchase_required:false,
    proprietary_implementation_copied:false
  }));
  const platformRows=RAILWAY_PLATFORM_CAPABILITIES.map(row=>({
    id:'railway-platform-compat:'+row.capability,
    benchmark_provider:'Railway',
    benchmark_family:'platform-capability',
    benchmark_capability:row.capability,
    benchmark_name:row.purpose,
    native_target:row.native_target,
    independence_status:row.boundary==='software-native'?'software-native':'native-control-contract-external-capacity',
    external_boundary:row.boundary,
    provider_plugin_required:false,
    provider_purchase_required:false,
    proprietary_implementation_copied:false
  }));
  return [...toolRows,...platformRows];
}

export function getNativeInfrastructureCompatibilitySummary(){
  const cloudflare=getCloudflareNativeCompatibilityManifest();
  const railway=getRailwayNativeCompatibilityManifest();
  const rows=[...cloudflare,...railway];
  const native=rows.filter(row=>row.independence_status==='software-native'||row.independence_status==='normalized-native-contract').length;
  return{
    ...MAGNANIMOUS_PROVIDER_INDEPENDENCE_POLICY,
    verified_at:'2026-09-21',
    benchmark_sources:{
      cloudflare:'current public Developer Platform/storage/Workers/agent documentation',
      railway:'current public services/build/networking/templates/agent-skills documentation'
    },
    cloudflare_capabilities:cloudflare.length,
    railway_capabilities:railway.length,
    railway_techniques:RAILWAY_TECHNIQUES.length,
    cloudflare_techniques:CLOUDFLARE_ARCHITECTURE_TECHNIQUES.length,
    native_or_normalized_software_contracts:native,
    total_benchmark_contracts:rows.length,
    status:'provider-independent-control-plane-active',
    rule:'Capability parity means Magnanimous owns the contract, orchestration, policy and native/self-hosted path. It does not pretend software can manufacture public Internet infrastructure, licensed spectrum, registrar authority or unlimited physical compute.'
  };
}

export function getNativeInfrastructureCompatibilityManifest(){
  return [...getCloudflareNativeCompatibilityManifest(),...getRailwayNativeCompatibilityManifest()];
}
