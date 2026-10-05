import assert from 'node:assert/strict';
import { UNFENCED_PUBLIC_RESEARCH, getUnfencedCapabilityManifest, getUnfencedAbsorptionSummary } from '../../worker/src/magnanimous-unfenced-capability-registry.js';
import { NATIVE_WEB_CAPABILITIES, MAGNANIMOUS_WEB_PARITY } from '../../worker/src/magnanimous-native-web-runtime.js';
import { classifyCapabilityRealization } from '../../worker/src/magnanimous-capability-realization.js';

const rows=getUnfencedCapabilityManifest();
const summary=getUnfencedAbsorptionSummary();

assert.ok(rows.length>=24,'Unfenced public benchmark must cover the observed fetch, live-browser, auth, permission, receipt and egress surface.');
for(const capability of [
  'unfenced-public-url-fetch','unfenced-clean-readable-content','unfenced-javascript-rendered-fetch',
  'unfenced-pdf-as-readable-source','unfenced-tiered-fetch-routing','unfenced-multi-format-fetch-output',
  'unfenced-mcp-read-and-act','unfenced-http-sdk-access','unfenced-api-key-and-oauth-auth',
  'unfenced-live-page-open','unfenced-page-observation','unfenced-referenced-element-actions',
  'unfenced-form-and-click-workflows','unfenced-signed-in-session-reuse','unfenced-secret-isolated-credential-use',
  'unfenced-site-permission-allowlist','unfenced-action-confirmation-gates','unfenced-delegated-authority-policy',
  'unfenced-session-vault-sealing','unfenced-browser-session-audit','unfenced-signed-hash-chained-receipts',
  'unfenced-failure-normalization','unfenced-real-browser-execution','unfenced-real-ip-egress','unfenced-residential-egress-option'
])assert.ok(rows.some(x=>x.capability===capability),'Missing Unfenced benchmark capability: '+capability);

assert.ok(UNFENCED_PUBLIC_RESEARCH.sources.length>=8,'Unfenced benchmark must retain the official public source ledger.');
assert.ok(UNFENCED_PUBLIC_RESEARCH.sources.every(x=>/^https:\/\/unfenced\.ai\//.test(x)||x==='https://unfenced.ai/'),'Unfenced research ledger must use official unfenced.ai sources.');
assert.match(UNFENCED_PUBLIC_RESEARCH.boundary,/does not copy Unfenced source code/i);

for(const row of rows){
  assert.ok(row.native_target,'Every Unfenced benchmark capability needs a Magnanimous native target.');
  assert.equal(row.authorization_state,'not-assumed');
  assert.equal(row.research?.proprietary_implementation_copied,false);
  assert.ok(Array.isArray(row.research?.sources)&&row.research.sources.length>=8,'Each Unfenced capability must preserve official source provenance.');
  const realized=classifyCapabilityRealization(row);
  assert.ok(['native-ready','hybrid-ready'].includes(realized.status),row.capability+' must resolve to an existing Magnanimous execution surface.');
}

for(const key of ['search','fetch','fetch_batch','research','read_flow','action_flow','profiles','profile_setup','browser_sessions','session_read','session_action','webhooks','goal_agent','monitoring']){
  assert.ok(NATIVE_WEB_CAPABILITIES[key],'Magnanimous Native Web missing required overlap surface: '+key);
}
assert.equal(MAGNANIMOUS_WEB_PARITY.tinyfish_runtime_dependency,false);
assert.equal(MAGNANIMOUS_WEB_PARITY.surfaces.browser.persistent_sessions,true);
assert.equal(MAGNANIMOUS_WEB_PARITY.surfaces.browser.confirmed_action_commands,true);
assert.equal(MAGNANIMOUS_WEB_PARITY.surfaces.credentials.remote_secret_values,false,'Do not silently weaken the current remote-secret boundary while absorbing the benchmark.');
assert.equal(MAGNANIMOUS_WEB_PARITY.surfaces.proxy.owned_geo_proxy_fleet,false,'Do not claim a residential/geo proxy fleet that Magnanimous does not own.');

assert.equal(summary.unfenced_runtime_required,false);
assert.equal(summary.provider_required_for_identity,false);
assert.equal(summary.provider_required_for_memory,false);
assert.equal(summary.provider_required_for_planning,false);
assert.equal(summary.provider_required_for_orchestration,false);
assert.equal(summary.provider_required_for_verification,false);
assert.equal(summary.public_docs_private_preview,true);
assert.ok(summary.explicit_truth_gaps.some(x=>/residential proxy fleet/i.test(x)));
assert.ok(summary.explicit_truth_gaps.some(x=>/secret filling/i.test(x)));
assert.ok(summary.explicit_truth_gaps.some(x=>/Hash-chained signed receipts/i.test(x)));

console.log('Magnanimous Unfenced capability lock PASS:',{
  capabilities:rows.length,
  official_sources:UNFENCED_PUBLIC_RESEARCH.sources.length,
  native_targets:summary.native_targets,
  native_web_overlap:Object.keys(NATIVE_WEB_CAPABILITIES).length
});
