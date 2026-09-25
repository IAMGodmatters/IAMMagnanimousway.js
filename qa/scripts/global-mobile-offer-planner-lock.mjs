import assert from 'node:assert/strict';
import { planGlobalMobileOffers } from '../../worker/src/magnanimous-telecom-network-runtime.js';

function verified(overrides={}){
 return {
  adapter_key:'primary',
  network_group:'network-a',
  origin_reference:'contract:rate-card-1',
  origin_cost_verified:true,
  commercial_authorized:true,
  country_verified:true,
  data_supported:true,
  origin_monthly_cost:10,
  included_high_speed_gb:5,
  origin_variable_cost_per_gb:1,
  funded_variable_cost_cap:20,
  mandatory_taxes_and_fees:0,
  observed_latency_ms:80,
  quality_score:0.9,
  backup_eligible:true,
  ...overrides
 };
}

{
 const result=planGlobalMobileOffers({country_code:'US',expected_high_speed_gb:10,offers:[verified()]});
 assert.equal(result.selected.adapter_key,'primary');
 assert.equal(result.selected.variable_cost_exposure,5);
 assert.equal(result.selected.landed_origin_cost,15);
 assert.equal(result.selected.retail_monthly_total,18);
 assert.equal(result.pricing_rule.retail_markup_percent,20);
 assert.equal(result.purchase_performed,false);
}

{
 const result=planGlobalMobileOffers({
  country_code:'PH',
  expected_high_speed_gb:10,
  offers:[
   verified({adapter_key:'unverified',origin_cost_verified:false,origin_monthly_cost:1}),
   verified({adapter_key:'unfunded',network_group:'network-b',funded_variable_cost_cap:1}),
   verified({adapter_key:'primary',network_group:'network-a',origin_monthly_cost:10}),
   verified({adapter_key:'backup',network_group:'network-b',origin_monthly_cost:12,backup_eligible:true})
  ]
 });
 assert.equal(result.selected.adapter_key,'primary');
 assert.equal(result.backup.adapter_key,'backup');
 assert.ok(result.rejected_offers.some(x=>x.adapter_key==='unverified'&&x.reasons.includes('origin_cost_not_verified')));
 assert.ok(result.rejected_offers.some(x=>x.adapter_key==='unfunded'&&x.reasons.includes('variable_cost_not_fully_funded')));
}

{
 const result=planGlobalMobileOffers({
  country_code:'US',
  expected_high_speed_gb:1,
  offers:[verified({commercial_authorized:false})]
 });
 assert.equal(result.selected,null);
 assert.ok(result.rejected_offers[0].reasons.includes('commercial_authorization_not_verified'));
}

{
 const result=planGlobalMobileOffers({
  country_code:'US',
  expected_high_speed_gb:1,
  offers:[verified({origin_reference:'typed-without-evidence-scheme'})]
 });
 assert.equal(result.selected,null);
 assert.ok(result.rejected_offers[0].reasons.includes('origin_cost_not_verified'));
}

{
 const result=planGlobalMobileOffers({country_code:'USA',expected_high_speed_gb:1,offers:[verified()]});
 assert.equal(result.error,'country_code must be ISO 3166-1 alpha-2.');
}

console.log('Global mobile offer planner lock passed.');
