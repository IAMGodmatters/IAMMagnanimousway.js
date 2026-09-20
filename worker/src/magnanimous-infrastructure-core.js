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
    status: 'adapter-next',
    active_legacy_binding_required: false
  },
  {
    id: 'key-value-cache',
    name: 'Key/Value & Cache',
    owned_contract: 'Magnanimous cache contract',
    current_target: 'sqlite-or-memory',
    future_targets: ['redis-compatible'],
    status: 'adapter-next',
    active_legacy_binding_required: false
  },
  {
    id: 'queues-workflows',
    name: 'Queues & Durable Workflows',
    owned_contract: 'Magnanimous durable work queue',
    current_target: 'sql-backed-job-ledger',
    future_targets: ['redis-compatible-streams', 'postgresql-skip-locked'],
    status: 'native-work-engine-present-expand-next',
    active_legacy_binding_required: false
  },
  {
    id: 'realtime-coordination',
    name: 'Realtime Coordination',
    owned_contract: 'Magnanimous realtime session coordinator',
    current_target: 'standard-websocket-plus-sql',
    status: 'adapter-next',
    active_legacy_binding_required: false
  },
  {
    id: 'search-vector',
    name: 'Search & Vector Retrieval',
    owned_contract: 'Magnanimous knowledge retrieval',
    current_target: 'sqlite-fts5',
    future_targets: ['pgvector', 'qdrant', 'sqlite-vector-extension'],
    status: 'fts-implemented-vector-optional'
  },
  {
    id: 'dns-tls',
    name: 'DNS & TLS',
    owned_contract: 'Magnanimous DNS/TLS control contract',
    current_target: 'registrar-dns-plus-caddy',
    status: 'cutover-requires-public-dns-change',
    external_network_required: true
  },
  {
    id: 'edge-security',
    name: 'Application & Edge Security',
    owned_contract: 'Magnanimous security policy',
    current_target: 'application-security-plus-reverse-proxy',
    future_targets: ['multi-origin-ddos-upstream'],
    status: 'application-controls-present-network-capacity-external',
    external_network_required: true
  },
  {
    id: 'observability',
    name: 'Observability',
    owned_contract: 'Magnanimous logs metrics traces',
    current_target: 'structured-stdout-and-audit-ledgers',
    future_targets: ['opentelemetry'],
    status: 'partial-expand-next'
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
    active_runtime: standalone ? 'magnanimous-standalone-node' : 'legacy-edge-adapter',
    cutover_phase: standalone ? 'standalone-active' : 'parallel-validation',
    production_cutover_complete: standalone,
    external_host_dependency_active: !standalone,
    data_cutover_required: !standalone,
    dns_cutover_required: !standalone,
    rollback_required_until_cutover_verified: !standalone,
    families: MAGNANIMOUS_INFRASTRUCTURE_FAMILIES,
    rules: [
      'Magnanimous AI owns identity, memory, planning, policy, routing, verification and learning.',
      'Infrastructure providers are replaceable execution rails and never public product identity.',
      'Do not remove a proven production rail until the Magnanimous replacement passes parity and rollback tests.',
      'Do not claim global-network capacity, telecom authority, payment settlement or public DNS control without a real external network or regulated rail.'
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
