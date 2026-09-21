import fs from 'node:fs';
import assert from 'node:assert/strict';
import { MAGNANIMOUS_CLOUDFLARE_FAMILIES } from '../../worker/src/magnanimous-cloudflare-capability-registry.js';
import { RAILWAY_TOOL_CONTRACTS, RAILWAY_PLATFORM_CAPABILITIES, RAILWAY_TECHNIQUES } from '../../worker/src/magnanimous-railway-capability-registry.js';
import {
  MAGNANIMOUS_PROVIDER_INDEPENDENCE_POLICY,
  getCloudflareNativeCompatibilityManifest,
  getRailwayNativeCompatibilityManifest,
  getNativeInfrastructureCompatibilitySummary
} from '../../worker/src/magnanimous-native-infrastructure-compatibility.js';

const cloudflareExpected=MAGNANIMOUS_CLOUDFLARE_FAMILIES.reduce((n,f)=>n+f.capabilities.length,0);
const cloudflare=getCloudflareNativeCompatibilityManifest();
const railway=getRailwayNativeCompatibilityManifest();
const summary=getNativeInfrastructureCompatibilitySummary();

assert.equal(cloudflare.length,cloudflareExpected,'Every researched Cloudflare capability must have a Magnanimous compatibility contract.');
assert.equal(railway.length,RAILWAY_TOOL_CONTRACTS.length+RAILWAY_PLATFORM_CAPABILITIES.length,'Every Railway tool/platform capability must have a Magnanimous compatibility contract.');
assert.equal(summary.provider_required_for_software_control_plane,false);
assert.equal(summary.paid_cloud_required,false);
assert.equal(summary.plugin_required,false);
assert.equal(summary.proprietary_provider_code_required,false);
assert.equal(summary.railway_techniques,RAILWAY_TECHNIQUES.length);
assert.equal(MAGNANIMOUS_PROVIDER_INDEPENDENCE_POLICY.identity,'Magnanimous AI');

for(const row of [...cloudflare,...railway]){
  assert.equal(row.provider_plugin_required,false,row.id+' must not require a provider plugin.');
  assert.equal(row.provider_purchase_required,false,row.id+' must not require a provider purchase for its Magnanimous software contract.');
  assert.equal(row.proprietary_implementation_copied,false,row.id+' must not copy proprietary provider implementation.');
  assert.ok(row.native_target,row.id+' must have a native Magnanimous target.');
  assert.ok(row.independence_status,row.id+' must declare an independence status.');
  assert.ok(row.external_boundary!==undefined,row.id+' must state its external physical boundary.');
}

const control=fs.readFileSync('magnanimous-runtime/src/cloud-control.mjs','utf8');
for(const kind of [
  'environment','preview-environment','service','deployment','build','template','feature-flag','secret','domain','certificate',
  'tcp-proxy','egress-policy','cache-policy','rate-limit-policy','queue','workflow','schedule','database-gateway','ai-gateway',
  'access-policy','browser-session','sandbox-job'
]){
  assert.ok(control.includes(`'${kind}'`)||control.includes(`${kind}:`),`Native cloud resource kind missing: ${kind}`);
}
for(const cap of [
  'workspaces-environments','preview-environments','services-deployments-builds','feature-flags','templates',
  'configuration-secrets','domains-certificates-tcp','egress-private-network-policy','queues-workflows-schedules',
  'database-gateway','ai-gateway','access-security-policy'
]){
  assert.ok(control.includes(`id: '${cap}'`),`Native cloud capability missing: ${cap}`);
}

const infra=fs.readFileSync('worker/src/magnanimous-infrastructure-core.js','utf8');
assert.ok(infra.includes('getNativeInfrastructureCompatibilitySummary'));
assert.ok(infra.includes('/api/magnanimous/infrastructure/compatibility'));

const workerPackage=JSON.parse(fs.readFileSync('worker/package.json','utf8'));
assert.equal(workerPackage.type,'module','Worker package must be explicit ESM for standalone Node execution.');

console.log(`Magnanimous Native Infrastructure Independence Lock PASS: Cloudflare=${cloudflare.length}, Railway=${railway.length}, techniques=${RAILWAY_TECHNIQUES.length}`);
