import assert from 'node:assert/strict';
import {
  genericByocRouteContractReady,
  selectedRouteConfirmed,
  verifyGenericByocRoute
} from '../../worker/src/byoc-route-contract.js';

const baseEnv={
  VOIP_PROVIDER_ROUTE_CONTROL_ENABLED:'true',
  VOIP_PROVIDER_URL:'https://carrier.example/v1/calls',
  VOIP_PROVIDER_HEALTH_URL:'https://carrier.example/v1/health',
  VOIP_PROVIDER_TOKEN:'secret-token'
};

assert.equal(genericByocRouteContractReady(baseEnv),true,'same-origin HTTPS bridge can opt into route control');
assert.equal(genericByocRouteContractReady({...baseEnv,VOIP_PROVIDER_ROUTE_CONTROL_ENABLED:'false'}),false,'route control is disabled by default');
assert.equal(genericByocRouteContractReady({...baseEnv,VOIP_PROVIDER_HEALTH_URL:'https://other.example/health'}),false,'health endpoint must share the call endpoint origin');
assert.equal(genericByocRouteContractReady({...baseEnv,VOIP_PROVIDER_URL:'http://carrier.example/v1/calls'}),false,'call endpoint must be HTTPS');
assert.equal(genericByocRouteContractReady(baseEnv,{coreReady:true}),false,'protected Telecom Core uses its native selected-route contract instead');

const selected={
  route_id:12,
  interconnect_id:4,
  bridge_route_key:'primary-us-east',
  health:'up',
  quality_score:92,
  quality_source:'measured',
  estimated_rate:0.01
};
let seen;
const healthyFetch=async(url,options)=>{
  seen={url,options};
  return new Response(JSON.stringify({
    selected_route_contract:'magnanimous-selected-route-v1',
    routes:[{route_key:'primary-us-east',healthy:true,status:'ready'}]
  }),{status:200,headers:{'content-type':'application/json'}});
};
const route=await verifyGenericByocRoute(baseEnv,selected,{selection_mode:'balanced'},healthyFetch);
assert.equal(route.contract,'generic-byoc-v1');
assert.equal(route.bridge_route_key,'primary-us-east');
assert.equal(route.route_id,12);
assert.equal(seen.url,baseEnv.VOIP_PROVIDER_HEALTH_URL);
assert.equal(seen.options.redirect,'error');
assert.equal(seen.options.headers.authorization,'Bearer secret-token');
assert.equal(seen.options.headers['x-iam-route-contract'],'magnanimous-selected-route-v1');

await assert.rejects(
  verifyGenericByocRoute(baseEnv,selected,{},async()=>new Response(JSON.stringify({
    selected_route_contract:'wrong-contract',
    routes:[{route_key:'primary-us-east',healthy:true}]
  }),{status:200,headers:{'content-type':'application/json'}})),
  error=>error?.code==='CARRIER_ROUTE_UNAVAILABLE'
);

await assert.rejects(
  verifyGenericByocRoute(baseEnv,selected,{},async()=>new Response(JSON.stringify({
    selected_route_contract:'magnanimous-selected-route-v1',
    routes:[{route_key:'primary-us-east',healthy:false,status:'offline'}]
  }),{status:200,headers:{'content-type':'application/json'}})),
  error=>error?.code==='CARRIER_ROUTE_UNAVAILABLE'
);

const applied={
  selected_route_applied:true,
  route_id:12,
  interconnect_id:4,
  bridge_route_key:'primary-us-east'
};
assert.equal(selectedRouteConfirmed(applied,route),true,'exact provider confirmation proves selected route application');
assert.equal(selectedRouteConfirmed({...applied,route_id:13},route),false,'route id mismatch is not accepted');
assert.equal(selectedRouteConfirmed({...applied,interconnect_id:5},route),false,'interconnect mismatch is not accepted');
assert.equal(selectedRouteConfirmed({...applied,bridge_route_key:'other'},route),false,'bridge route key mismatch is not accepted');
assert.equal(selectedRouteConfirmed({...applied,selected_route_applied:false},route),false,'provider must explicitly confirm route application');

console.log('Generic BYOC selected-route executable contract passed.');
