import { requirePlatformOwner } from './platform-owner-guard.js';

const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { 'cache-control': 'no-store' }
});

export const MAGNANIMOUS_INFRASTRUCTURE_FAMILIES = Object.freeze([
  {
    id: 'compute',
    name: 'Compute & HTTP Runtime',
    owned_contract: 'standard Web Request/Response application runtime',
    current_target: 'magnanimous-standalone-node',
    status: 'implemented',
    proof: ['magnanimous-runtime/src/server.mjs']
  },
  {
    id: 'relational-data',
    name: 'Relational Data',
    owned_contract: 'Magnanimous SQL binding',
    current_target: 'sqlite',
    future_targets: ['postgresql'],
    status: 'implemented-needs-production-data-cutover',
    proof: ['magnanimous-runtime/src/d1-compat.mjs', 'magnanimous-runtime/src/migrations.mjs']
  },
  {
    id: 'static-assets',
    name: 'Static Assets',
    owned_contract: 'Magnanimous static file delivery',
    current_target: 'local-filesystem',
    future_targets: ['s3-compatible-object-storage'],
    status: 'implemented',
    proof: ['magnanimous-runtime/src/server.mjs']
  },
  {
    id: 'scheduler',
    name: 'Scheduled Work',
    owned_contract: 'Magnanimous scheduled task runner',
    current_target: 'node-interval-or-system-cron',
    status: 'implemented',
    proof: ['magnanimous-runtime/src/server.mjs']
  },
  {
    id: 'ai-execution',
    name: 'AI Execution',
    owned_contract: 'Magnanimous AI binding',
    current_target: 'local-or-openai-compatible',
    future_targets: ['additional-replaceable-model-adapters'],
    status: 'implemented-text-path',
    proof: ['magnanimous-runtime/src/ai-binding.mjs']
  },
  {
    id: 'object-storage',
    name: 'Object Storage',
    owned_contract: 'Magnanimous object store',
    current_target: 'local-persistent-volume',
    future_targets: ['s3-compatible'],
    status: 'implemented-local-volume',
    proof: ['magnanimous-runtime/src/object-store.mjs', 'magnanimous-runtime/src/server.mjs'],
    active_legacy_binding_required: false
  },
  {
    id: 'key-value-cache',
    name: 'Key/Value & Cache',
    owned_contract: 'Magnanimous cache contract',
    current_target: 'sqlite-or-memory',
    future_targets: ['redis-compatible'],
    status: 'implemented-sqlite-ttl-cache',
    proof: ['magnanimous-runtime/src/kv-cache.mjs', 'magnanimous-runtime/src/server.mjs'],
    active_legacy_binding_required: false
  },
  {
    id: 'queues-workflows',
    name: 'Queues & Durable Workflows',
    owned_contract: 'Magnanimous durable work queue',
    current_target: 'sql-backed-job-ledger',
    future_targets: ['redis-compatible-streams', 'postgresql-skip-locked'],
    status: 'implemented-durable-sql-ledger',
    proof: ['magnanimous-runtime/src/durable-work.mjs', 'magnanimous-runtime/src/server.mjs'],
    active_legacy_binding_required: false
  },
  {
    id: 'realtime-coordination',
    name: 'Realtime Coordination',
    owned_contract: 'Magnanimous realtime session coordinator',
    current_target: 'persistent-event-log-plus-in-process-pubsub',
    future_targets: ['standard-websocket-multi-node-broker'],
    status: 'implemented-single-node-expand-for-multi-node',
    proof: ['magnanimous-runtime/src/event-hub.mjs', 'magnanimous-runtime/src/server.mjs'],
    active_legacy_binding_required: false
  },
  {
    id: 'search-vector',
    name: 'Search & Vector Retrieval',
    owned_contract: 'Magnanimous knowledge retrieval',
    current_target: 'sqlite-fts5-plus-magnanimous-vector-store',
    future_targets: ['pgvector', 'qdrant', 'sqlite-vector-extension'],
    status: 'implemented-local-vector-query',
    proof: ['magnanimous-runtime/src/vector-store.mjs']
  },
  {
    id: 'streaming-data',
    name: 'Streaming Data & Pipelines',
    owned_contract: 'Magnanimous durable ingestion pipeline',
    current_target: 'object-store-plus-durable-work-plus-analytics',
    future_targets: ['postgresql-partitioning', 'apache-iceberg-compatible-export'],
    status: 'implemented-local-durable-ingestion',
    proof: ['magnanimous-runtime/src/pipeline.mjs', 'magnanimous-runtime/src/analytics-engine.mjs']
  },
  {
    id: 'secrets',
    name: 'Secrets & Runtime Credentials',
    owned_contract: 'Magnanimous encrypted secret vault',
    current_target: 'aes-256-gcm-plus-runtime-master-key',
    future_targets: ['hardware-kms', 'os-keyring'],
    status: 'implemented-when-master-key-configured',
    proof: ['magnanimous-runtime/src/secret-vault.mjs']
  },
  {
    id: 'sandbox-execution',
    name: 'Sandboxed Code & File Execution',
    owned_contract: 'Magnanimous isolated execution contract',
    current_target: 'self-hosted-hardened-container-service',
    status: 'implemented-self-hosted',
    proof: ['magnanimous-runtime/services/sandbox-service.mjs', 'magnanimous-runtime/Dockerfile.sandbox', 'magnanimous-runtime/src/service-bindings.mjs']
  },
  {
    id: 'browser-execution',
    name: 'Browser Execution & Rendering',
    owned_contract: 'Magnanimous browser contract',
    current_target: 'server-side-chromium-renderer-plus-native-local-bridge-interactive-browser',
    status: 'implemented-self-hosted-and-native-local',
    proof: ['magnanimous-runtime/services/browser-service.mjs', 'magnanimous-runtime/Dockerfile.browser', 'worker/src/magnanimous-native-web-runtime.js']
  },
  {
    id: 'media-transform',
    name: 'Image & Media Transformation',
    owned_contract: 'Magnanimous media transformation contract',
    current_target: 'self-hosted-imagemagick-service',
    status: 'implemented-self-hosted',
    proof: ['magnanimous-runtime/services/media-service.mjs', 'magnanimous-runtime/Dockerfile.media', 'magnanimous-runtime/src/service-bindings.mjs']
  },
  {
    id: 'dns-tls',
    name: 'DNS & TLS',
    owned_contract: 'Magnanimous DNS/TLS control contract',
    current_target: 'self-hosted-coredns-plus-caddy-with-registrar-cutover',
    status: 'software-implemented-public-cutover-required',
    proof: ['magnanimous-runtime/dns/Corefile', 'magnanimous-runtime/scripts/prepare-dns-zone.mjs', 'magnanimous-runtime/Caddyfile'],
    external_network_required: true
  },
  {
    id: 'edge-security',
    name: 'Application & Edge Security',
    owned_contract: 'Magnanimous security policy',
    current_target: 'application-security-plus-reverse-proxy-plus-native-rate-limit',
    future_targets: ['multi-origin-ddos-upstream'],
    status: 'application-controls-and-node-rate-limit-implemented-network-capacity-external',
    proof: ['magnanimous-runtime/src/rate-limit.mjs', 'magnanimous-runtime/src/server.mjs', 'magnanimous-runtime/Caddyfile'],
    external_network_required: true
  },
  {
    id: 'observability',
    name: 'Observability',
    owned_contract: 'Magnanimous logs metrics traces',
    current_target: 'structured-json-logs-plus-magnanimous-analytics-plus-prometheus-metrics',
    future_targets: ['opentelemetry'],
    status: 'implemented-native-observability',
    proof: ['magnanimous-runtime/src/analytics-engine.mjs', 'magnanimous-runtime/src/metrics.mjs', 'magnanimous-runtime/Caddyfile']
  }
]);

export function magnanimousInfrastructureSummary(env = {}) {
  const runtime = String(env.MAGNANIMOUS_RUNTIME || '').trim();
  const standalone = runtime === 'standalone-node';

  return {
    identity: 'Magnanimous AI',
    infrastructure_owner: 'Magnanimous AI',
    public_provider_identity: false,
    architecture: 'provider-neutral-first-party-control-plane',
    standalone_runtime_available: true,
    software_cloud_independence_complete: true,
    cloudflare_required_for_software_runtime: false,
    cutover_tooling_complete: true,
    active_runtime: standalone ? 'magnanimous-standalone-node' : 'legacy-edge-adapter',
    cutover_phase: standalone ? 'standalone-active' : 'parallel-validation',
    production_cutover_complete: standalone,
    external_host_dependency_active: !standalone,
    data_cutover_required: !standalone,
    dns_cutover_required: !standalone,
    rollback_required_until_cutover_verified: !standalone,
    remaining_external_boundaries: standalone ? [] : [
      'Provision real standalone public compute/storage/network capacity.',
      'Export and import the current production database, then pass parity and mutation smoke tests.',
      'Configure real TLS/DNS host addresses and change registrar nameserver/glue records.',
      'Retain or purchase upstream anycast/DDoS/network capacity where global scale requires it.'
    ],
    families: MAGNANIMOUS_INFRASTRUCTURE_FAMILIES,
    rules: [
      'Magnanimous AI owns identity, memory, planning, policy, routing, verification and learning.',
      'Infrastructure providers are replaceable execution rails and never public product identity.',
      'Do not remove a proven production rail until the Magnanimous replacement passes parity and rollback tests.',
      'Do not claim global-network capacity, telecom authority, payment settlement or public DNS control without a real external network or regulated rail.',
      'Software independence can be complete before production traffic cutover; the legacy production rail remains rollback-only until data, DNS and live mutation parity pass.'
    ]
  };
}

export async function handleMagnanimousInfrastructure(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/magnanimous/infrastructure') return null;

  const denied = await requirePlatformOwner(request, env);
  if (denied) return denied;
  if (request.method !== 'GET') return json({ detail: 'Method not allowed.' }, 405);

  return json(magnanimousInfrastructureSummary(env));
}
