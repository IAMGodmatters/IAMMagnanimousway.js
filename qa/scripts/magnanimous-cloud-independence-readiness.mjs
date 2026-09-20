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
 'magnanimous-runtime/scripts/prepare-dns-zone.mjs'
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
 '/__magnanimous_runtime/metrics','/__magnanimous_runtime/services'
])must(server.includes(contract),'Standalone server contract missing: '+contract);

const compose=read('magnanimous-runtime/docker-compose.yml');
for(const contract of ['sandbox:','browser:','browser-egress:','media:','authoritative-dns:','internal_services:','no-new-privileges:true','cap_drop:'])
 must(compose.includes(contract),'Hardened compose topology missing: '+contract);
must(compose.includes('internal: true'),'Sandbox/media network must be internal-only.');
must(compose.includes('condition: service_healthy'),'Browser startup must wait for healthy egress.');

const sandbox=read('magnanimous-runtime/services/sandbox-service.mjs');
must(sandbox.includes("shell:false"),'Sandbox process execution must not use shell interpolation.');
must(sandbox.includes('MAGNANIMOUS_INTERNAL_SERVICE_TOKEN'),'Sandbox token boundary missing.');
const browser=read('magnanimous-runtime/services/browser-service.mjs');
must(browser.includes('Private or local browser targets are blocked.'),'Browser SSRF boundary missing.');
must(browser.includes('MAGNANIMOUS_INTERNAL_SERVICE_TOKEN'),'Browser token boundary missing.');
must(browser.includes('MAGNANIMOUS_BROWSER_PROXY'),'Browser must support controlled egress proxying.');
must(browser.includes("--proxy-server='+resolvedProxy"),'Browser HTTP(S) must be forced through the resolved Magnanimous egress proxy.');
must(browser.includes('--proxy-bypass-list=<-loopback>'),'Browser loopback must not bypass the Magnanimous egress proxy.');
must(browser.includes('force-webrtc-ip-handling-policy=disable_non_proxied_udp'),'Browser non-proxied WebRTC UDP must be disabled.');
must(browser.includes('disable-quic'),'Browser QUIC bypass must be disabled.');
must(browser.includes('ensureProxyReady'),'Browser must wait for Magnanimous egress readiness.');
must(browser.includes('transientNavigationErrors'),'Browser must retry bounded transient startup network failures.');
const egress=read('magnanimous-runtime/services/browser-egress-service.mjs');
must(egress.includes('Private browser destination blocked.'),'Browser egress private-network block missing.');
must(egress.includes('rows.some(r=>blockedIp(r.address))'),'Browser egress must reject DNS answers containing private/local addresses.');
must(egress.includes("server.on('connect'"),'Browser HTTPS CONNECT proxy support missing.');
must(egress.includes("req.url==='/health'"),'Browser egress readiness endpoint missing.');
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

for(const file of required.filter(p=>p.endsWith('.mjs'))){
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
execFileSync(process.execPath,['magnanimous-runtime/scripts/verify-runtime.mjs'],{stdio:'inherit'});

console.log('Magnanimous Cloud Independence Readiness: software replacement stack COMPLETE; production data/DNS/hosting cutover remains separately gated by real infrastructure.');
