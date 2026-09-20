import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const read=(p)=>fs.readFileSync(p,'utf8');
const exists=(p)=>fs.existsSync(p);
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const required=[
 'magnanimous-runtime/src/server.mjs',
 'magnanimous-runtime/src/d1-compat.mjs',
 'magnanimous-runtime/src/object-store.mjs',
 'magnanimous-runtime/src/kv-cache.mjs',
 'magnanimous-runtime/src/durable-work.mjs',
 'magnanimous-runtime/src/event-hub.mjs',
 'magnanimous-runtime/src/vector-store.mjs',
 'magnanimous-runtime/src/analytics-engine.mjs',
 'magnanimous-runtime/src/secret-vault.mjs',
 'magnanimous-runtime/src/pipeline.mjs',
 'magnanimous-runtime/src/service-bindings.mjs',
 'magnanimous-runtime/src/metrics.mjs',
 'magnanimous-runtime/src/image-generation-binding.mjs',
 'magnanimous-runtime/src/cloud-control.mjs',
 'magnanimous-runtime/src/migration-stage.mjs',
 'magnanimous-runtime/src/d1-snapshot-reconcile.mjs',
 'magnanimous-runtime/src/runtime-secret-store.mjs',
 'magnanimous-runtime/src/bootstrap.mjs',
 'magnanimous-runtime/services/sandbox-service.mjs',
 'magnanimous-runtime/services/browser-service.mjs',
 'magnanimous-runtime/services/browser-egress-service.mjs',
 'magnanimous-runtime/services/media-service.mjs',
 'magnanimous-runtime/Dockerfile.sandbox',
 'magnanimous-runtime/Dockerfile.browser',
 'magnanimous-runtime/Dockerfile.browser-egress',
 'magnanimous-runtime/Dockerfile.media',
 'magnanimous-runtime/Caddyfile',
 'magnanimous-runtime/dns/Corefile',
 'magnanimous-runtime/scripts/backup-runtime.mjs',
 'magnanimous-runtime/scripts/restore-runtime.mjs',
 'magnanimous-runtime/scripts/import-d1-export.mjs',
 'magnanimous-runtime/scripts/verify-data-parity.mjs',
 'magnanimous-runtime/scripts/prepare-dns-zone.mjs',
 'magnanimous-runtime/scripts/verify-cloud-control.mjs',
 'magnanimous-runtime/scripts/verify-migration-stage.mjs',
 'magnanimous-runtime/scripts/verify-d1-referential-closure.mjs',
 'magnanimous-runtime/scripts/verify-runtime-secret-store.mjs',
 'magnanimous-runtime/docker-compose.release.yml',
 'magnanimous-runtime/scripts/standalone-host-preflight.sh',
 'magnanimous-runtime/scripts/install-release-bundle.sh',
 '.github/workflows/magnanimous-standalone-release.yml',
 '.github/workflows/magnanimous-cloud-exit-lock.yml',
 '.github/workflows/magnanimous-production-data-stage.yml',
 '.github/workflows/magnanimous-runtime-secrets-stage.yml',
 'worker/src/magnanimous-cloud-provider-core.js',
 'worker/src/github-actions-oidc.js',
 'worker/src/credential-vault-migration.js'
];
for(const file of required)must(exists(file),'Missing cloud-independence component: '+file);

const runtimeFiles=required.filter(p=>p.endsWith('.mjs')||p.includes('Dockerfile')||p.endsWith('Caddyfile')||p.endsWith('Corefile'));
for(const file of runtimeFiles){
 const text=read(file);
 must(!/@cloudflare\//i.test(text),file+' must not import a Cloudflare package.');
 must(!/\bwrangler\b/i.test(text),file+' must not require Wrangler.');
 must(!/mcp\.cloudflare\.com/i.test(text),file+' must not require Cloudflare MCP.');
}

const server=read('magnanimous-runtime/src/server.mjs');
for(const contract of [
 'MAGNANIMOUS_OBJECT_STORE','MAGNANIMOUS_KV','MAGNANIMOUS_QUEUE','MAGNANIMOUS_WORKFLOWS',
 'MAGNANIMOUS_EVENTS','MAGNANIMOUS_VECTORIZE','MAGNANIMOUS_ANALYTICS','MAGNANIMOUS_SECRETS',
 'MAGNANIMOUS_PIPELINE','MAGNANIMOUS_SANDBOX','MAGNANIMOUS_BROWSER','MAGNANIMOUS_IMAGES','MAGNANIMOUS_IMAGE_GENERATOR',
 'MAGNANIMOUS_CLOUD_CONTROL','CLOUD_CONTROL','/__magnanimous_runtime/cloud',
 '/__magnanimous_runtime/metrics','/__magnanimous_runtime/services','/__magnanimous_runtime/migration/stage-d1','/__magnanimous_runtime/migration/stage-secrets','/__magnanimous_runtime/migration/stage-credential-rewrap'
])must(server.includes(contract),'Standalone server contract missing: '+contract);

const compose=read('magnanimous-runtime/docker-compose.yml');
const releaseCompose=read('magnanimous-runtime/docker-compose.release.yml');
const serviceBlock=(yaml,name,next)=>{
 const start='\n  '+name+':\n',end='\n  '+next+':\n';
 const from=yaml.indexOf(start),to=yaml.indexOf(end,from+start.length);
 must(from>=0&&to>from,'Compose service block missing: '+name);
 return yaml.slice(from,to);
};
const browserCompose=serviceBlock(compose,'browser','browser-egress');
const egressCompose=serviceBlock(compose,'browser-egress','media');
const releaseBrowserCompose=serviceBlock(releaseCompose,'browser','browser-egress');
const releaseEgressCompose=serviceBlock(releaseCompose,'browser-egress','media');
for(const contract of ['sandbox:','browser:','browser-egress:','media:','authoritative-dns:','internal_services:','no-new-privileges:true','cap_drop:'])
 must(compose.includes(contract),'Hardened compose topology missing: '+contract);
must(compose.includes('internal: true'),'Internal service network must remain non-routable.');
must(compose.includes('condition: service_healthy'),'Browser startup must wait for healthy egress.');
for(const [label,browserService,egressService] of [
 ['Development',browserCompose,egressCompose],
 ['Release',releaseBrowserCompose,releaseEgressCompose]
]){
 must(browserService.includes('networks:\n      - internal_services'),label+' browser must use the non-routable internal service network.');
 must(!browserService.includes('\n      - default'),label+' browser must not have direct access to the routable default network.');
 must(egressService.includes('networks:\n      - default\n      - internal_services')||egressService.includes('networks:\n      - internal_services\n      - default'),label+' browser egress must bridge internal browser traffic to the routable network.');
}
for(const image of ['iammagnanimous/runtime:','iammagnanimous/sandbox:','iammagnanimous/browser:','iammagnanimous/browser-egress:','iammagnanimous/media:'])
 must(releaseCompose.includes(image),'Offline release topology missing image contract: '+image);
must(releaseCompose.includes('MAGNANIMOUS_RUNTIME: "standalone-node"'),'Release topology must explicitly activate standalone runtime mode.');
must(releaseCompose.includes('magnanimous_backups:/app/backups'),'Release topology must persist standalone backups.');
const dnsPrepare=read('magnanimous-runtime/scripts/prepare-dns-zone.mjs');
must(dnsPrepare.includes('MAGNANIMOUS_DNS_OUTPUT'),'DNS zone generator must support an installed-host output path.');
const releaseWorkflow=read('.github/workflows/magnanimous-standalone-release.yml');
must(releaseWorkflow.includes('docker save'),'Standalone release must export offline-loadable images.');
must(releaseWorkflow.includes('docker load'),'Standalone release must prove its own image bundle reloads.');
must(releaseWorkflow.includes('Offline Magnanimous release bundle + cloud control smoke PASS'),'Standalone release bundle + cloud control smoke proof missing.');
must(releaseWorkflow.includes('Release Magnanimous Cloud control plane PASS'),'Standalone release must exercise Magnanimous Cloud control plane.');
must(releaseWorkflow.includes('Release browser direct-public-egress isolation PASS'),'Standalone release must prove the browser has no direct public egress.');
must(releaseWorkflow.includes("mode:'screenshot'"),'Standalone release must exercise the real Chromium snapshot renderer.');
const cloudExitWorkflow=read('.github/workflows/magnanimous-cloud-exit-lock.yml');
must(cloudExitWorkflow.includes('Browser direct-public-egress isolation PASS'),'Cloud Exit Lock must prove the browser has no direct public egress.');
must(cloudExitWorkflow.includes("mode:'screenshot'"),'Cloud Exit Lock must exercise the real Chromium snapshot renderer.');
const hostPreflight=read('magnanimous-runtime/scripts/standalone-host-preflight.sh');
must(hostPreflight.includes('Magnanimous standalone host preflight PASS'),'Standalone host preflight proof missing.');
const installer=read('magnanimous-runtime/scripts/install-release-bundle.sh');
must(installer.includes('sha256sum -c SHA256SUMS'),'Standalone installer must verify bundle checksums.');
must(installer.includes('docker load -i'),'Standalone installer must load the offline image bundle.');
must(installer.includes('upsert_env_key')&&installer.includes('MAGNANIMOUS_RELEASE_TAG'),'Standalone installer must persist the exact proven release tag.');
must(hostPreflight.includes('read_env MAGNANIMOUS_RELEASE_TAG'),'Standalone host preflight must honor the persisted release tag.');
const hostDeployWorkflow=read('.github/workflows/magnanimous-standalone-host-deploy.yml');
must(hostDeployWorkflow.includes('gh run download'),'Standalone host deploy must consume a proven release artifact.');
must(hostDeployWorkflow.includes('StrictHostKeyChecking=yes'),'Standalone host deploy must require strict SSH host verification.');
must(hostDeployWorkflow.includes('MAGNANIMOUS_STANDALONE_SSH_KNOWN_HOSTS'),'Standalone host deploy must use pinned SSH known-host data.');
must(hostDeployWorkflow.includes('DNS was NOT changed'),'Standalone host deploy must preserve the DNS cutover boundary.');

const cloudControl=read('magnanimous-runtime/src/cloud-control.mjs');
for(const contract of ['MagnanimousCloudControl','compute-instance','kubernetes-cluster','object-bucket','private-network','load-balancer','magnanimous_cloud_resources','staged-awaiting-capacity-executor','staged-requires-explicit-approval'])
 must(cloudControl.includes(contract),'Magnanimous Cloud control-plane contract missing: '+contract);
must(cloudControl.includes("external_provider_required_for_control_plane: false"),'Magnanimous Cloud must not require DigitalOcean or another provider for its software control plane.');
const cloudApi=read('worker/src/magnanimous-cloud-provider-core.js');
must(cloudApi.includes('MAGNANIMOUS_CLOUD_ABSORPTION_MAP'),'Magnanimous Cloud absorption registry missing.');
must(cloudApi.includes('proprietary_copying: false'),'Cloud absorption must forbid proprietary copying.');
must(cloudApi.includes('/api/magnanimous/cloud/resources'),'Magnanimous Cloud resource API missing.');
const visibleToolBlock=cloudApi.slice(cloudApi.indexOf('DIGITALOCEAN_VISIBLE_TOOL_CONTRACTS'),cloudApi.indexOf('function nativeContractForObservedTool'));
const observedToolContracts=[...visibleToolBlock.matchAll(/'([a-z0-9_]+)'/g)].map(match=>match[1]);
must(observedToolContracts.length===54,'Expected all 54 visible DigitalOcean tool contracts to be absorbed; found '+observedToolContracts.length+'.');
for(const tool of ['droplet_create','droplet_delete','image_create','key_create','region_list','size_list','snapshot_droplet','billing_history_list'])
 must(observedToolContracts.includes(tool),'Visible DigitalOcean tool absorption missing: '+tool);

must(exists('magnanimous-runtime/scripts/export-d1-logical.mjs'),'Missing FTS-safe logical D1 snapshot exporter.');
const migrationStage=read('magnanimous-runtime/src/migration-stage.mjs');
for(const contract of [
 'https://token.actions.githubusercontent.com',
 'crypto.verify',
 "claims.repository || ''",
 "claims.ref || ''",
 "claims.workflow_ref",
 'stageD1SqlExport',
 'stageD1SqliteSnapshot',
 'stageCredentialVaultRewrap',
 'SQLite integrity_check',
 'inside the configured migration root'
]) must(migrationStage.includes(contract),'Migration staging security contract missing: '+contract);
const migrationWorkflow=read('.github/workflows/magnanimous-production-data-stage.yml');
must(migrationWorkflow.includes('id-token: write'),'Production data staging must use GitHub OIDC.');
must(migrationWorkflow.includes('export-d1-logical.mjs'),'Production data staging must use the FTS-safe logical snapshot exporter.');
must(migrationWorkflow.includes('application/vnd.sqlite3'),'Production data staging must send a verified SQLite snapshot.');
must(!migrationWorkflow.includes('wrangler d1 export'),'Production data staging must not use full D1 export while FTS5 virtual tables exist.');
must(migrationWorkflow.includes('/__magnanimous_runtime/migration/stage-d1'),'Production data staging must target the standalone-only staging endpoint.');
must(migrationWorkflow.includes('table_counts'),'Production data staging must verify per-table row-count parity.');
must(!migrationWorkflow.includes('upload-artifact'),'Production D1 data must not be uploaded as a workflow artifact.');
const logicalExporter=read('magnanimous-runtime/scripts/export-d1-logical.mjs');
for(const contract of [
 'wrangler','d1','execute',
 'PRAGMA table_list',
 'quote(',
 'knowledge_fts',
 'PRAGMA foreign_key_check',
 'sqlite_sha256'
]) must(logicalExporter.includes(contract),'Logical D1 exporter contract missing: '+contract);
must(!logicalExporter.includes("['wrangler','d1','export'"),'Logical D1 exporter must not call blocked full D1 export.');
must(logicalExporter.includes("import { reconcileForeignKeys } from '../src/d1-snapshot-reconcile.mjs'"),'Logical D1 exporter must use the tested referential-closure engine.');
must(logicalExporter.indexOf('reconcileForeignKeys(db,remoteQuery)')<logicalExporter.indexOf("if(virtual.includes('knowledge_fts'))"),'Foreign-key closure must run before FTS rebuild.');
must(logicalExporter.indexOf('reconcileForeignKeys(db,remoteQuery)')<logicalExporter.indexOf('const objects=remoteQuery('),'Foreign-key closure must run before production triggers/views/indexes are recreated.');
const snapshotReconcile=read('magnanimous-runtime/src/d1-snapshot-reconcile.mjs');
for(const contract of ['PRAGMA foreign_key_check','PRAGMA foreign_key_list','INSERT OR IGNORE','Production currently contains a foreign-key violation','pruned','repaired'])
 must(snapshotReconcile.includes(contract),'D1 referential-closure contract missing: '+contract);

const runtimeSecretStore=read('magnanimous-runtime/src/runtime-secret-store.mjs');
for(const contract of ['MAGNANIMOUS_RUNTIME_SECRET_KEYS','INTEGRATION_CREDENTIALS_KEY','stageRuntimeSecrets','loadRuntimeSecrets','0o600'])
 must(runtimeSecretStore.includes(contract),'Runtime secret continuity contract missing: '+contract);
const bootstrap=read('magnanimous-runtime/src/bootstrap.mjs');
must(bootstrap.includes('loadRuntimeSecrets'),'Standalone bootstrap must load persistent runtime secrets before server startup.');
must(bootstrap.indexOf('loadRuntimeSecrets')<bootstrap.indexOf("import('./server.mjs')"),'Persistent runtime secrets must load before the standalone server module.');
const runtimeSecretsWorkflow=read('.github/workflows/magnanimous-runtime-secrets-stage.yml');
must(runtimeSecretsWorkflow.includes('id-token: write'),'Runtime secret staging must use GitHub OIDC.');
must(runtimeSecretsWorkflow.includes('openssl rand -hex 32'),'Runtime secret staging must generate a fresh standalone vault key.');
must(runtimeSecretsWorkflow.includes('magnanimous-credential-rewrap'),'Runtime secret staging must request a dedicated OIDC audience for production vault rewrap.');
must(runtimeSecretsWorkflow.includes('/api/internal/migration/rewrap-platform-credentials'),'Runtime secret staging must call the signed production rewrap endpoint.');
must(runtimeSecretsWorkflow.includes('/__magnanimous_runtime/migration/stage-secrets'),'Runtime secret staging must stage the fresh standalone key.');
must(runtimeSecretsWorkflow.includes('/__magnanimous_runtime/migration/stage-credential-rewrap'),'Runtime secret staging must apply only rewrapped ciphertext to the staged database.');
must(!runtimeSecretsWorkflow.includes('secrets.INTEGRATION_CREDENTIALS_KEY'),'Runtime secret staging must not require the old production vault key outside production.');
must(!runtimeSecretsWorkflow.includes('upload-artifact'),'Runtime secrets must never be uploaded as workflow artifacts.');
const workerOidc=read('worker/src/github-actions-oidc.js');
for(const contract of ['token.actions.githubusercontent.com','RSASSA-PKCS1-v1_5','claims.repository','claims.ref','workflow_ref'])
 must(workerOidc.includes(contract),'Worker GitHub OIDC contract missing: '+contract);
const credentialMigration=read('worker/src/credential-vault-migration.js');
must(credentialMigration.includes('magnanimous-credential-rewrap'),'Production credential rewrap must require the dedicated OIDC audience.');
must(credentialMigration.includes('rewrapPlatformCredentialsForMigration'),'Production credential rewrap must remain inside the platform vault implementation.');
const platformCredentials=read('worker/src/platform-credentials.js');
must(platformCredentials.includes('rewrapPlatformCredentialsForMigration'),'Platform credential migration rewrap implementation missing.');
must(platformCredentials.includes('const plain=await decrypt'),'Production vault migration must decrypt only inside the production runtime.');
must(platformCredentials.includes('const encrypted=await encrypt'),'Production vault migration must re-encrypt before returning rows.');
must(!credentialMigration.includes('plain'),'Migration handler must never return a plaintext credential field.');

const sandbox=read('magnanimous-runtime/services/sandbox-service.mjs');
must(sandbox.includes("shell:false"),'Sandbox process execution must not use shell interpolation.');
must(sandbox.includes('MAGNANIMOUS_INTERNAL_SERVICE_TOKEN'),'Sandbox token boundary missing.');
const browser=read('magnanimous-runtime/services/browser-service.mjs');
must(browser.includes('Private or local browser targets are blocked.'),'Browser SSRF boundary missing.');
must(browser.includes('MAGNANIMOUS_INTERNAL_SERVICE_TOKEN'),'Browser token boundary missing.');
must(browser.includes('MAGNANIMOUS_BROWSER_PROXY'),'Browser must support controlled egress snapshot fetching.');
must(browser.includes('fetchSnapshot'),'Browser must fetch public content through Magnanimous egress before rendering.');
must(browser.includes("network_mode:'safe-egress-snapshot'"),'Browser health must report safe-egress snapshot mode.');
must(browser.includes("target='file://'"),'Chromium must render validated local snapshots rather than requiring direct internet.');
must(browser.includes('force-webrtc-ip-handling-policy=disable_non_proxied_udp'),'Browser non-proxied WebRTC UDP must be disabled.');
must(browser.includes('disable-quic'),'Browser QUIC bypass must be disabled.');
must(browser.includes('disable-background-networking'),'Chromium background networking must be disabled.');
must(browser.includes('AsyncDns'),'Chromium direct asynchronous DNS must be disabled where supported.');
must(browser.includes('Content-Security-Policy'),'Local Chromium snapshots must carry a deny-by-default CSP.');
must(browser.includes("default-src \\'none\\'"),'Local Chromium snapshots must default-deny network/resource loads.');
must(browser.includes("connect-src \\'none\\'"),'Local Chromium snapshots must block fetch/XHR/WebSocket connections.');
must(browser.includes(`http-equiv=["']?refresh`),'Snapshot sanitization must remove meta-refresh navigation.');
must(browser.includes('ensureProxyReady'),'Browser must wait for Magnanimous egress readiness.');
const egress=read('magnanimous-runtime/services/browser-egress-service.mjs');
must(egress.includes('Private browser destination blocked.'),'Browser egress private-network block missing.');
must(egress.includes('rows.some(r=>blockedIp(r.address))'),'Browser egress must reject DNS answers containing private/local addresses.');
must(egress.includes("requestUrl.pathname==='/fetch'"),'Browser egress snapshot fetch endpoint missing.');
must(egress.includes('redirects>5'),'Browser egress redirect loop bound missing.');
must(egress.includes('fetchPublic(next,{redirects:redirects+1'),'Browser egress must revalidate every redirect hop.');
must(egress.includes('MAGNANIMOUS_INTERNAL_SERVICE_TOKEN'),'Browser egress snapshot endpoint must require an internal token.');
must(egress.includes("server.on('connect'"),'Browser HTTPS CONNECT proxy support missing.');
must(egress.includes("requestUrl.pathname==='/health'"),'Browser egress readiness endpoint missing.');
const media=read('magnanimous-runtime/services/media-service.mjs');
must(media.includes("shell:false"),'Media transform must not use shell interpolation.');
must(media.includes('MAGNANIMOUS_INTERNAL_SERVICE_TOKEN'),'Media token boundary missing.');

const infra=read('worker/src/magnanimous-infrastructure-core.js');
must(infra.includes("software_cloud_independence_complete: true"),'Owner infrastructure must report software cloud independence complete.');
must(infra.includes("production_cutover_complete: standalone"),'Production cutover must remain runtime-truthful.');
must(infra.includes('external_network_required: true'),'Real external network boundaries must remain explicit.');
must(infra.includes('magnanimous-runtime/services/sandbox-service.mjs'),'Sandbox proof missing from infrastructure registry.');
must(infra.includes('magnanimous-runtime/services/browser-service.mjs'),'Browser proof missing from infrastructure registry.');
must(infra.includes('magnanimous-runtime/services/media-service.mjs'),'Media proof missing from infrastructure registry.');
must(infra.includes("digitalocean_required_for_cloud_control_plane: false"),'DigitalOcean must remain optional to the Magnanimous Cloud control plane.');
must(infra.includes("magnanimous_cloud_control_plane_complete: true"),'Magnanimous Cloud control-plane completion flag missing.');
must(infra.includes('magnanimous-runtime/src/cloud-control.mjs'),'Magnanimous Cloud runtime proof missing from infrastructure registry.');

for(const file of required.filter(p=>p.endsWith('.mjs'))){
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
execFileSync(process.execPath,['magnanimous-runtime/scripts/verify-runtime.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['magnanimous-runtime/scripts/verify-cloud-control.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['magnanimous-runtime/scripts/verify-migration-stage.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['magnanimous-runtime/scripts/verify-d1-referential-closure.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['magnanimous-runtime/scripts/verify-runtime-secret-store.mjs'],{stdio:'inherit'});
for(const file of ['worker/src/magnanimous-cloud-provider-core.js','worker/src/magnanimous-infrastructure-core.js','worker/src/security-entrypoint.js']){
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}

console.log('Magnanimous Cloud Independence Readiness: software replacement stack COMPLETE; production data/DNS/hosting cutover remains separately gated by real infrastructure.');
