import assert from 'node:assert/strict';
import {
  MAGNANIMOUS_PLUGIN_BASE_FEE_USD,
  MAGNANIMOUS_PLUGIN_PRICING_POLICY,
  MAGNANIMOUS_PLUGIN_BENCHMARKS,
  quoteMagnanimousPluginCost
} from '../../worker/src/magnanimous-unified-plugin-pricing.js';

assert.equal(MAGNANIMOUS_PLUGIN_BASE_FEE_USD,0);
assert.equal(MAGNANIMOUS_PLUGIN_PRICING_POLICY.markup_percent,20);
assert.equal(MAGNANIMOUS_PLUGIN_PRICING_POLICY.subscription_required_for_plugin,false);
assert.equal(MAGNANIMOUS_PLUGIN_PRICING_POLICY.prepaid_required_for_paid_origin_cost,true);
assert.equal(MAGNANIMOUS_PLUGIN_PRICING_POLICY.silent_owner_funding,false);

assert.equal(quoteMagnanimousPluginCost(0).customer_charge_usd,0);
assert.equal(quoteMagnanimousPluginCost(1).customer_charge_usd,1.2);
assert.equal(quoteMagnanimousPluginCost(10).customer_charge_usd,12);
assert.equal(quoteMagnanimousPluginCost(10).magnanimous_markup_usd,2);

assert.equal(MAGNANIMOUS_PLUGIN_BENCHMARKS.tinyfish.search_usd_per_request,0);
assert.equal(MAGNANIMOUS_PLUGIN_BENCHMARKS.tinyfish.fetch_usd_per_url,0);
assert.equal(MAGNANIMOUS_PLUGIN_BENCHMARKS.tinyfish.agent_usd_per_step,0.016);
assert.equal(MAGNANIMOUS_PLUGIN_BENCHMARKS.tinyfish.browser_usd_per_minute,0.002);
assert.equal(MAGNANIMOUS_PLUGIN_BENCHMARKS.railway.memory_usd_per_gb_minute,0.000231);
assert.equal(MAGNANIMOUS_PLUGIN_BENCHMARKS.railway.cpu_usd_per_vcpu_minute,0.000463);
assert.equal(MAGNANIMOUS_PLUGIN_BENCHMARKS.railway.egress_usd_per_gb,0.05);
assert.equal(MAGNANIMOUS_PLUGIN_BENCHMARKS.cloudflare.workers_paid_minimum_usd_per_month,5);
assert.equal(MAGNANIMOUS_PLUGIN_BENCHMARKS.cloudflare.workers_overage_usd_per_million_requests,0.30);

console.log('Magnanimous plugin billing lock PASS',JSON.stringify({
 base_fee_usd:MAGNANIMOUS_PLUGIN_BASE_FEE_USD,
 markup_percent:MAGNANIMOUS_PLUGIN_PRICING_POLICY.markup_percent,
 subscription_required:MAGNANIMOUS_PLUGIN_PRICING_POLICY.subscription_required_for_plugin,
 customer_charge_on_10_usd_origin:quoteMagnanimousPluginCost(10).customer_charge_usd
}));
