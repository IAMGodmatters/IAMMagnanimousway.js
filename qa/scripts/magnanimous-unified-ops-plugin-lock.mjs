import assert from 'node:assert/strict';
import {
  MAGNANIMOUS_UNIFIED_OPS_POLICY,
  getMagnanimousUnifiedOpsCatalog,
  resolveMagnanimousBenchmark
} from '../../worker/src/magnanimous-unified-ops.js';

assert.equal(MAGNANIMOUS_UNIFIED_OPS_POLICY.identity,'Magnanimous AI');
assert.equal(MAGNANIMOUS_UNIFIED_OPS_POLICY.plugin_identity,'Magnanimous AI');
assert.equal(MAGNANIMOUS_UNIFIED_OPS_POLICY.provider_required_for_control_plane,false);
assert.equal(MAGNANIMOUS_UNIFIED_OPS_POLICY.provider_plugin_required,false);
assert.equal(MAGNANIMOUS_UNIFIED_OPS_POLICY.provider_purchase_required_for_control_plane,false);
assert.equal(MAGNANIMOUS_UNIFIED_OPS_POLICY.proprietary_copying,false);
assert.deepEqual(MAGNANIMOUS_UNIFIED_OPS_POLICY.benchmark_providers,['TinyFish','Railway','Cloudflare']);
assert.deepEqual(MAGNANIMOUS_UNIFIED_OPS_POLICY.areas,['web-browser','cloud-deployment','edge-runtime']);

const catalog=getMagnanimousUnifiedOpsCatalog();
assert.equal(catalog.status,'native-control-plane-and-chatgpt-plugin-contract-ready');
assert.ok(catalog.benchmark_contracts.railway>=20,'Railway public tool/platform contract coverage regressed.');
assert.ok(catalog.benchmark_contracts.cloudflare>=80,'Cloudflare public capability coverage regressed.');
assert.ok(Array.isArray(catalog.techniques.railway)&&catalog.techniques.railway.length>=10,'Railway techniques missing.');
assert.ok(Array.isArray(catalog.techniques.cloudflare)&&catalog.techniques.cloudflare.length>=10,'Cloudflare techniques missing.');
assert.equal(catalog.compatibility.provider_required_for_software_control_plane,false);
assert.equal(catalog.compatibility.paid_cloud_required,false);
assert.equal(catalog.compatibility.plugin_required,false);

const railwayCases=[
 ['create_deployment','magnanimous-service-release-and-deployment-state'],
 ['list_deployments','magnanimous-service-release-and-deployment-state'],
 ['get_logs','magnanimous-observability-contract'],
 ['get_service_metrics','magnanimous-observability-contract'],
 ['set_feature_flag','magnanimous-progressive-delivery'],
 ['generate_domain','magnanimous-dns-and-ingress-contract']
];
for(const [capability,nativeTargetHint] of railwayCases){
 const row=resolveMagnanimousBenchmark({provider:'railway',capability});
 assert.equal(row.found,true,'Railway mapping missing: '+capability);
 assert.equal(row.provider_plugin_required,false);
 assert.equal(row.provider_purchase_required,false);
 assert.equal(row.proprietary_implementation_copied,false);
 assert.ok(row.native_target.includes(nativeTargetHint)||row.native_target.startsWith('magnanimous-'),'Unexpected Railway target for '+capability+': '+row.native_target);
}

const cloudflareCases=[
 ['workers','worker'],
 ['d1','database'],
 ['r2','object-bucket'],
 ['queues','queue'],
 ['rate-limiting','rate-limit-policy'],
 ['dns','dns-zone'],
 ['browser-run','browser-session']
];
for(const [capability,kind] of cloudflareCases){
 const row=resolveMagnanimousBenchmark({provider:'cloudflare',capability});
 assert.equal(row.found,true,'Cloudflare mapping missing: '+capability);
 assert.equal(row.native_resource_kind,kind,'Cloudflare resource-kind mapping changed: '+capability);
 assert.equal(row.provider_plugin_required,false);
 assert.equal(row.provider_purchase_required,false);
 assert.equal(row.proprietary_implementation_copied,false);
}

assert.throws(()=>resolveMagnanimousBenchmark({provider:'unsupported',capability:'workers'}),/provider must be railway or cloudflare/i);
assert.throws(()=>resolveMagnanimousBenchmark({provider:'railway'}),/capability or tool is required/i);

console.log('Magnanimous unified operations plugin lock PASS',JSON.stringify({
 railway_contracts:catalog.benchmark_contracts.railway,
 cloudflare_contracts:catalog.benchmark_contracts.cloudflare,
 railway_techniques:catalog.techniques.railway.length,
 cloudflare_techniques:catalog.techniques.cloudflare.length,
 provider_plugin_required:catalog.provider_plugin_required,
 provider_purchase_required_for_control_plane:catalog.provider_purchase_required_for_control_plane
}));
