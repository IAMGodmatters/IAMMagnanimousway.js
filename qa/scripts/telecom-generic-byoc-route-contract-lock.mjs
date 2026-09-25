import assert from 'node:assert/strict';
import fs from 'node:fs';
import { probeGenericByocRouteContract } from '../../worker/src/lead-phone.js';

const leadPhone=fs.readFileSync('worker/src/lead-phone.js','utf8');
const carrierCore=fs.readFileSync('worker/src/magnanimous-carrier-core.js','utf8');
const providerEnv=fs.readFileSync('worker/src/provider-runtime-env.js','utf8');
const platformCredentials=fs.readFileSync('worker/src/platform-credentials.js','utf8');
const telecomNetwork=fs.readFileSync('worker/src/magnanimous-telecom-network-runtime.js','utf8');
const telecomNetworkUi=fs.readFileSync('frontend/app/telecom/network/page.tsx','utf8');

const originalFetch=globalThis.fetch;
try {
  {
    let calls=0;
    globalThis.fetch=async (url,init={})=>{
      calls+=1;
      assert.equal(String(url),'https://bridge.example.test/capabilities');
      assert.equal(init.method,'GET');
      assert.equal(init.redirect,'error');
      assert.equal(init.headers.authorization,'Bearer bridge-token');
      return new Response(JSON.stringify({
        contract:'magnanimous.carrier-route.v1',
        selected_route_execution:true,
        route_key:true
      }),{status:200,headers:{'content-type':'application/json'}});
    };
    const result=await probeGenericByocRouteContract({
      VOIP_PROVIDER_URL:'https://bridge.example.test/calls',
      VOIP_PROVIDER_ROUTE_CONTRACT_URL:'https://bridge.example.test/capabilities',
      VOIP_PROVIDER_TOKEN:'bridge-token'
    });
    assert.equal(calls,1);
    assert.deepEqual(result,{ok:true,state:'ready',contract:'magnanimous.carrier-route.v1'});
  }

  {
    let calls=0;
    globalThis.fetch=async ()=>{
      calls+=1;
      throw new Error('cross-origin contract probe must not run');
    };
    const result=await probeGenericByocRouteContract({
      VOIP_PROVIDER_URL:'https://bridge.example.test/calls',
      VOIP_PROVIDER_ROUTE_CONTRACT_URL:'https://different.example.test/capabilities',
      VOIP_PROVIDER_TOKEN:'bridge-token'
    });
    assert.equal(calls,0);
    assert.equal(result.ok,false);
    assert.equal(result.state,'not-configured-or-untrusted-origin');
  }

  {
    globalThis.fetch=async ()=>new Response(JSON.stringify({
      contract:'other.contract.v1',
      selected_route_execution:true,
      route_key:true
    }),{status:200,headers:{'content-type':'application/json'}});
    const result=await probeGenericByocRouteContract({
      VOIP_PROVIDER_URL:'https://bridge.example.test/calls',
      VOIP_PROVIDER_ROUTE_CONTRACT_URL:'https://bridge.example.test/capabilities',
      VOIP_PROVIDER_TOKEN:'bridge-token'
    });
    assert.equal(result.ok,false);
    assert.equal(result.state,'unsupported');
  }
} finally {
  globalThis.fetch=originalFetch;
}

for(const text of [
  "GENERIC_BYOC_ROUTE_CONTRACT = 'magnanimous.carrier-route.v1'",
  "provider.origin !== contract.origin",
  "redirect: 'error'",
  "SELECTED_BYOC_ROUTE_CONTRACT_UNAVAILABLE",
  "SELECTED_BYOC_ROUTE_NOT_CONFIRMED",
  "SELECTED_ROUTE_EXECUTION_AMBIGUOUS",
  "planned_route_id: routeAttribution?.route_id || null",
  "route_id: selectedRouteApplied ? (routeAttribution?.route_id || null) : null",
  "String(provider?.route_key || '') === String(selectedRoute.route_key)",
  "routeAttribution = selected ?",
]) assert.ok(leadPhone.includes(text),`lead-phone BYOC contract guard missing: ${text}`);

for(const text of [
  "policy.bridge_route_key",
  "bridge_route_key:bridgeRouteKey",
  "bridge_route_key must be an opaque bridge route identifier.",
  "bridge_route_key is only supported for byoc-bridge interconnects.",
  "Choose either asterisk_endpoint or bridge_route_key for one route, not both.",
  "generic-byoc-contract",
]) assert.ok(carrierCore.includes(text),`carrier route BYOC opt-in guard missing: ${text}`);

assert.ok(
  leadPhone.includes("selectedRoute = {\n        contract: GENERIC_BYOC_ROUTE_CONTRACT,\n        selected_route_required: true,\n        route_key: String(selected.bridge_route_key).trim()\n      };"),
  'generic BYOC provider payload must contain only the contract and opaque route key'
);
assert.ok(
  !leadPhone.includes("route_key: String(selected.bridge_route_key).trim(),\n        route_id:"),
  'generic BYOC provider payload must not expose internal route IDs'
);
assert.ok(
  leadPhone.includes("selectedRouteApplied = Boolean(selectedRoute) && provider?.selected_route_applied === true"),
  'route IDs may only be reported as applied after bridge confirmation'
);
assert.ok(
  carrierCore.includes("if(executionEndpoint&&bridgeRouteKey)return json"),
  'ambiguous route execution contracts must fail at route creation'
);
assert.ok(providerEnv.includes("'VOIP_PROVIDER_ROUTE_CONTRACT_URL'"),'protected runtime env must allow the BYOC contract URL');
assert.ok(platformCredentials.includes("VOIP_PROVIDER_ROUTE_CONTRACT_URL"),'owner credential schema must expose the BYOC contract URL');
assert.ok(telecomNetwork.includes("generic_byoc_contract:true"),'network truth must report contract-capable BYOC');
assert.ok(telecomNetwork.includes("generic_byoc_legacy_fallback:true"),'network truth must keep the legacy fallback visible until retired');
assert.ok(telecomNetworkUi.includes('Contract-capable generic BYOC'),'owner Telecom UI must expose BYOC contract migration state');
assert.ok(telecomNetworkUi.includes('Legacy generic/no-route fallback'),'owner Telecom UI must expose the remaining fallback state');

console.log('Magnanimous generic BYOC selected-route contract lock passed.');
