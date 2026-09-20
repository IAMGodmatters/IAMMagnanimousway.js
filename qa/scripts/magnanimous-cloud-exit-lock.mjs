import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const read=(p)=>fs.readFileSync(p,'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const codeFiles=[
  'magnanimous-runtime/package.json',
  'magnanimous-runtime/src/d1-compat.mjs',
  'magnanimous-runtime/src/migrations.mjs',
  'magnanimous-runtime/src/ai-binding.mjs',
  'magnanimous-runtime/src/object-store.mjs',
  'magnanimous-runtime/src/kv-cache.mjs',
  'magnanimous-runtime/src/durable-work.mjs',
  'magnanimous-runtime/src/event-hub.mjs',
  'magnanimous-runtime/src/rate-limit.mjs',
  'magnanimous-runtime/src/vector-store.mjs',
  'magnanimous-runtime/src/analytics-engine.mjs',
  'magnanimous-runtime/src/secret-vault.mjs',
  'magnanimous-runtime/src/pipeline.mjs',
  'magnanimous-runtime/src/service-bindings.mjs',
  'magnanimous-runtime/src/metrics.mjs',
  'magnanimous-runtime/src/image-generation-binding.mjs',
  'magnanimous-runtime/src/cloud-control.mjs',
  'magnanimous-runtime/src/migration-stage.mjs',
  'magnanimous-runtime/src/runtime-secret-store.mjs',
  'magnanimous-runtime/src/bootstrap.mjs',
  'magnanimous-runtime/services/sandbox-service.mjs',
  'magnanimous-runtime/services/browser-service.mjs',
  'magnanimous-runtime/services/browser-egress-service.mjs',
  'magnanimous-runtime/services/media-service.mjs',
  'magnanimous-runtime/src/server.mjs',
  'magnanimous-runtime/Dockerfile',
  'magnanimous-runtime/Dockerfile.sandbox',
  'magnanimous-runtime/Dockerfile.browser',
  'magnanimous-runtime/Dockerfile.browser-egress',
  'magnanimous-runtime/Dockerfile.media',
  'magnanimous-runtime/docker-compose.yml',
  'magnanimous-runtime/Caddyfile'
];

for(const file of codeFiles){
  const text=read(file);
  must(!/@cloudflare\//i.test(text),file+' must not depend on a Cloudflare package.');
  must(!/\bwrangler\b/i.test(text),file+' must not depend on Wrangler.');
  must(!/mcp\.cloudflare\.com/i.test(text),file+' must not depend on Cloudflare MCP.');
}

const sql=read('magnanimous-runtime/src/d1-compat.mjs');
for(const contract of ['prepare(sql)','bind(...params)','async run()','async first(column)','async all()','async raw()','async batch(statements)','async exec(sql)']){
  must(sql.includes(contract),'Magnanimous SQL compatibility contract missing: '+contract);
}

const server=read('magnanimous-runtime/src/server.mjs');
must(server.includes("MAGNANIMOUS_RUNTIME: 'standalone-node'"),'Standalone runtime identity missing.');
must(server.includes('/__magnanimous_runtime/health'),'Standalone runtime health endpoint missing.');
must(server.includes('app.fetch(request, env, work.ctx)'),'Existing Magnanimous request chain must run unchanged.');
must(server.includes('app.scheduled'),'Standalone scheduler compatibility is missing.');
must(server.includes('MAGNANIMOUS_OBJECT_STORE'),'Standalone runtime object-store binding missing.');
must(server.includes('MAGNANIMOUS_KV'),'Standalone runtime KV/cache binding missing.');
must(server.includes('MAGNANIMOUS_QUEUE'),'Standalone runtime durable queue binding missing.');
must(server.includes('MAGNANIMOUS_WORKFLOWS'),'Standalone runtime workflow binding missing.');
must(server.includes('MAGNANIMOUS_EVENTS'),'Standalone runtime event coordination binding missing.');
must(server.includes('MAGNANIMOUS_RATE_LIMIT'),'Standalone application rate-limit response missing.');
must(server.includes('MAGNANIMOUS_VECTORIZE'),'Standalone vector binding missing.');
must(server.includes('MAGNANIMOUS_ANALYTICS'),'Standalone analytics binding missing.');
must(server.includes('MAGNANIMOUS_SECRETS'),'Standalone secrets binding missing.');
must(server.includes('MAGNANIMOUS_PIPELINE'),'Standalone pipeline binding missing.');
must(server.includes('MAGNANIMOUS_SANDBOX'),'Standalone sandbox binding missing.');
must(server.includes('MAGNANIMOUS_BROWSER'),'Standalone browser binding missing.');
must(server.includes('MAGNANIMOUS_IMAGES'),'Standalone image transformation binding missing.');
must(server.includes('MAGNANIMOUS_IMAGE_GENERATOR'),'Standalone image generation binding missing.');
must(server.includes('MAGNANIMOUS_CLOUD_CONTROL'),'Standalone Magnanimous Cloud binding missing.');
must(server.includes('CLOUD_CONTROL'),'Standalone Magnanimous Cloud compatibility binding missing.');
must(server.includes('/__magnanimous_runtime/cloud'),'Standalone Magnanimous Cloud internal health surface missing.');
must(server.includes('/__magnanimous_runtime/metrics'),'Standalone metrics surface missing.');
must(server.includes('/__magnanimous_runtime/services'),'Standalone internal service health surface missing.');
must(server.includes('/__magnanimous_runtime/capabilities'),'Standalone capability health surface missing.');
must(server.includes('/__magnanimous_runtime/migration/stage-d1'),'Standalone production-data staging route missing.');
must(server.includes('/__magnanimous_runtime/migration/stage-secrets'),'Standalone runtime-secret staging route missing.');
must(server.includes('/__magnanimous_runtime/migration/stage-credential-rewrap'),'Standalone credential-rewrap staging route missing.');
must(server.includes('MAGNANIMOUS_GITHUB_MIGRATION_ENABLED'),'Production-data staging must be disabled unless explicitly enabled.');
must(fs.existsSync('magnanimous-runtime/scripts/export-d1-logical.mjs'),'FTS-safe logical D1 exporter missing.');
const logicalExporter=read('magnanimous-runtime/scripts/export-d1-logical.mjs');
must(logicalExporter.includes('PRAGMA table_list'),'FTS-safe logical D1 exporter must enumerate logical tables.');
must(logicalExporter.includes('knowledge_fts'),'FTS-safe logical D1 exporter must rebuild the knowledge FTS index.');
must(logicalExporter.includes('PRAGMA foreign_key_check'),'Logical D1 snapshot must verify foreign keys.');
must(logicalExporter.includes('reconcileForeignKeys'),'Logical D1 snapshot must repair live-copy referential gaps before staging.');
must(logicalExporter.includes('/d1/database/'),'Logical D1 snapshot must support direct D1 API reads.');
must(!logicalExporter.includes("['wrangler','d1','export'"),'Cloud exit must not use blocked full D1 export while FTS5 exists.');

const infra=read('worker/src/magnanimous-infrastructure-core.js');
must(infra.includes("infrastructure_owner: 'Magnanimous AI'"),'Magnanimous must own infrastructure control.');
must(infra.includes("architecture: 'provider-neutral-first-party-control-plane'"),'Provider-neutral infrastructure architecture missing.');
must(infra.includes("production_cutover_complete: standalone"),'Cutover status must remain truthful.');
must(infra.includes("external_network_required: true"),'Public-network external boundary must remain explicit.');
must(infra.includes("digitalocean_required_for_cloud_control_plane: false"),'DigitalOcean must not be required for the native cloud control plane.');
must(infra.includes("magnanimous_cloud_control_plane_complete: true"),'Magnanimous Cloud control-plane completion flag missing.');
for(const proof of [
  'magnanimous-runtime/src/object-store.mjs',
  'magnanimous-runtime/src/kv-cache.mjs',
  'magnanimous-runtime/src/durable-work.mjs',
  'magnanimous-runtime/src/event-hub.mjs',
  'magnanimous-runtime/src/rate-limit.mjs',
  'magnanimous-runtime/src/vector-store.mjs',
  'magnanimous-runtime/src/analytics-engine.mjs',
  'magnanimous-runtime/src/secret-vault.mjs',
  'magnanimous-runtime/src/pipeline.mjs',
  'magnanimous-runtime/services/sandbox-service.mjs',
  'magnanimous-runtime/services/browser-service.mjs',
  'magnanimous-runtime/services/media-service.mjs',
  'magnanimous-runtime/src/metrics.mjs',
  'magnanimous-runtime/src/cloud-control.mjs',
  'worker/src/magnanimous-cloud-provider-core.js'
]) must(infra.includes(proof),'Infrastructure proof missing: '+proof);

const security=read('worker/src/security-entrypoint.js');
must(security.includes('handleMagnanimousInfrastructure'),'Infrastructure owner endpoint is not mounted.');
must(security.includes('handleMagnanimousCloudProvider'),'Magnanimous Cloud owner endpoint is not mounted.');
must(security.includes('handleCredentialVaultMigration'),'Signed production credential rewrap endpoint is not mounted.');
must(security.includes("'/api/magnanimous/infrastructure'")||infra.includes("'/api/magnanimous/infrastructure'"),'Infrastructure endpoint missing.');

execFileSync(process.execPath,['magnanimous-runtime/scripts/verify-runtime.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['magnanimous-runtime/scripts/verify-migration-stage.mjs'],{stdio:'inherit'});
for(const file of ['worker/src/github-actions-oidc.js','worker/src/credential-vault-migration.js','worker/src/platform-credentials.js']) execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['magnanimous-runtime/scripts/verify-runtime-secret-store.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['magnanimous-runtime/scripts/verify-cloud-control.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['qa/scripts/magnanimous-cloud-independence-readiness.mjs'],{stdio:'inherit'});

console.log('Magnanimous Cloud Exit Lock: standalone runtime, Magnanimous Cloud control plane, SQL, storage/cache, durable work, event coordination, rate limiting, vectors, analytics, encrypted secrets, pipelines, isolated sandbox, server browser rendering, media transforms, observability, cutover tooling and infrastructure ownership PASS');
