import assert from 'node:assert/strict';
import { evaluateGlobalMobileReadiness } from '../../worker/src/magnanimous-telecom-network-runtime.js';

const countryRows=[{
 country_code:'PH',
 state:'production_verified',
 production_verified:1,
 evidence_reference:'contract:country-mobile-data-proof'
}];
const offer={id:'offer-1',adapter_key:'primary',network_group:'network-a',country_code:'PH'};
const profile={id:'profile-1',adapter_key:'primary',network_group:'network-a',country_code:'PH'};
const connectivity={id:'event-1'};
const policy={id:'policy-1'};

{
 const result=evaluateGlobalMobileReadiness({live_flag_enabled:true});
 assert.equal(result.launch_ready,false);
 assert.equal(result.gates.live_flag_enabled,true);
 assert.equal(result.gates.verified_country_mobile_data,false);
}

{
 const result=evaluateGlobalMobileReadiness({
  live_flag_enabled:true,countryRows,offer,profile,connectivity,policy
 });
 assert.equal(result.launch_ready,true);
 assert.deepEqual(result.verified_countries,['PH']);
 assert.equal(result.evidence.offer_id,'offer-1');
 assert.equal(result.evidence.profile_id,'profile-1');
 assert.equal(result.evidence.connectivity_event_id,'event-1');
 assert.equal(result.evidence.policy_id,'policy-1');
 assert.equal(result.multi_network_resilience_verified,false);
}

{
 const result=evaluateGlobalMobileReadiness({
  live_flag_enabled:true,countryRows,offer,profile,connectivity,
  backupProfile:{id:'backup-1',adapter_key:'backup',network_group:'network-b',country_code:'PH'},
  backupConnectivity:{id:'backup-event-1'},policy
 });
 assert.equal(result.launch_ready,true);
 assert.equal(result.multi_network_resilience_verified,false);
}

{
 const result=evaluateGlobalMobileReadiness({
  live_flag_enabled:true,countryRows,offer,profile,connectivity,
  backupProfile:{id:'backup-1',adapter_key:'backup',network_group:'network-b',country_code:'PH'},
  backupConnectivity:{id:'backup-event-1'},
  failoverProof:{id:'failover-proof-1',independent_network_verified:1,observed_failover:1},
  policy
 });
 assert.equal(result.launch_ready,true);
 assert.equal(result.multi_network_resilience_verified,true);
 assert.equal(result.evidence.failover_proof_id,'failover-proof-1');
}

{
 const result=evaluateGlobalMobileReadiness({
  live_flag_enabled:true,countryRows,offer,
  profile:{...profile,adapter_key:'wrong-adapter'},connectivity,policy
 });
 assert.equal(result.launch_ready,false);
 assert.equal(result.gates.active_primary_access_profile,false);
}

{
 const result=evaluateGlobalMobileReadiness({
  live_flag_enabled:true,
  countryRows,
  offer:{...offer,country_code:'US'},
  profile,
  connectivity,
  policy
 });
 assert.equal(result.launch_ready,false);
 assert.equal(result.gates.active_verified_wholesale_offer,false);
}

{
 const result=evaluateGlobalMobileReadiness({
  live_flag_enabled:true,
  countryRows:[{country_code:'PH',state:'production_verified',production_verified:1,evidence_reference:''}],
  offer,profile,connectivity,policy
 });
 assert.equal(result.launch_ready,false);
 assert.equal(result.gates.verified_country_mobile_data,false);
}

{
 const result=evaluateGlobalMobileReadiness({
  live_flag_enabled:true,countryRows,offer,profile,connectivity,policy:null
 });
 assert.equal(result.launch_ready,false);
 assert.equal(result.gates.active_cost_fair_use_policy,false);
}

console.log('Global mobile durable proof gates verified.');
