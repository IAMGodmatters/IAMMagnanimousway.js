import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 isDuffelTestToken,
 validateDuffelTestSearch,
 validateDuffelTestHold,
 searchDuffelTestFlights,
 createDuffelTestHold
} from '../../worker/src/magnanimous-travel-duffel-sandbox.js';

const moduleSource=fs.readFileSync('worker/src/magnanimous-travel-duffel-sandbox.js','utf8');
const runtime=fs.readFileSync('worker/src/magnanimous-travel-agency-runtime.js','utf8');
const page=fs.readFileSync('frontend/app/travel-agency/duffel-test/page.tsx','utf8');

assert.equal(isDuffelTestToken('duffel_test_example'),true);
assert.equal(isDuffelTestToken('duffel_live_example'),false);
assert.equal(isDuffelTestToken('live_example'),false);

validateDuffelTestSearch({slices:[{origin:'MNL',destination:'SIN',departure_date:'2030-01-02'}],passengers:[{type:'adult'}],cabin_class:'economy'});
assert.throws(()=>validateDuffelTestSearch({slices:[{origin:'MN',destination:'SIN',departure_date:'2030-01-02'}],passengers:[{type:'adult'}]}),/airport codes/);
assert.throws(()=>validateDuffelTestHold({offerId:'off_test',passengers:[],payments:[{type:'balance'}]}),/Only offerId and passenger identity fields/);

let called=false;
const blocked=await searchDuffelTestFlights({slices:[{origin:'MNL',destination:'SIN',departure_date:'2030-01-02'}],passengers:[{type:'adult'}],cabin_class:'economy'},{testToken:'duffel_live_forbidden',fetchImpl:async()=>{called=true;throw new Error('must not fetch')}});
assert.equal(blocked.configured,false);
assert.equal(called,false,'Live token must be rejected before any network request.');

const searchFetch=async(url,init)=>{
 assert.match(String(url),/offer_requests/);
 assert.equal(init.method,'POST');
 assert.equal(init.headers.Authorization,'Bearer duffel_test_example');
 const body=JSON.parse(init.body);
 assert.deepEqual(body.data.slices,[{origin:'MNL',destination:'SIN',departure_date:'2030-01-02'}]);
 return new Response(JSON.stringify({data:{id:'orq_test',live_mode:false,passengers:[{id:'pas_test'}],offers:[
  {id:'off_hold',live_mode:false,total_amount:'123.45',total_currency:'USD',owner:{name:'Duffel Airways',iata_code:'ZZ'},expires_at:'2030-01-01T00:00:00Z',payment_requirements:{requires_instant_payment:false,payment_required_by:'2030-01-03T00:00:00Z'},slices:[]},
  {id:'off_instant',live_mode:false,total_amount:'99.00',total_currency:'USD',owner:{name:'Test Air'},payment_requirements:{requires_instant_payment:true},slices:[]},
  {id:'off_live_leak',live_mode:true,total_amount:'1.00',total_currency:'USD',payment_requirements:{requires_instant_payment:false},slices:[]}
 ]}}),{status:200,headers:{'content-type':'application/json'}});
};
const search=await searchDuffelTestFlights({slices:[{origin:'MNL',destination:'SIN',departure_date:'2030-01-02'}],passengers:[{type:'adult'}],cabin_class:'economy'},{testToken:'duffel_test_example',fetchImpl:searchFetch});
assert.equal(search.configured,true);
assert.deepEqual(search.passenger_ids,['pas_test']);
assert.equal(search.offers.length,2,'Live-mode offers must be filtered even if an upstream sandbox leaks one.');
assert.equal(search.offers.find(x=>x.offer_id==='off_hold')?.holdable,true);
assert.equal(search.offers.find(x=>x.offer_id==='off_instant')?.holdable,false);

const passenger={id:'pas_test',title:'mr',gender:'m',given_name:'Test',family_name:'Traveler',born_on:'1990-01-01',email:'test@example.com',phone_number:'+15555550123',type:'adult'};
let requests=[];
const eligibleHoldFetch=async(url,init={})=>{
 requests.push({url:String(url),init});
 if(String(url).includes('/air/offers/'))return new Response(JSON.stringify({data:{id:'off_hold',live_mode:false,expires_at:'2030-01-01T00:00:00Z',passengers:[{id:'pas_test'}],payment_requirements:{requires_instant_payment:false,payment_required_by:'2030-01-03T00:00:00Z'}}}),{status:200});
 const sent=JSON.parse(init.body);
 assert.equal(sent.data.type,'hold');
 assert.deepEqual(sent.data.selected_offers,['off_hold']);
 assert.ok(!Object.hasOwn(sent.data,'payments'),'No payment key may be sent when creating the test hold.');
 assert.ok(!Object.hasOwn(sent.data,'payment'),'No payment object may be sent when creating the test hold.');
 return new Response(JSON.stringify({data:{id:'ord_test',live_mode:false,booking_reference:'TEST01',payment_status:'awaiting_payment',payment_required_by:'2030-01-03T00:00:00Z'}}),{status:201});
};
const held=await createDuffelTestHold({offerId:'off_hold',passengers:[passenger]},{testToken:'duffel_test_example',fetchImpl:eligibleHoldFetch});
assert.equal(held.hold_order_confirmed,true);
assert.equal(held.order_id,'ord_test');
assert.equal(requests.length,2);

let instantCalls=0;
const instantBlocked=await createDuffelTestHold({offerId:'off_instant',passengers:[passenger]},{testToken:'duffel_test_example',fetchImpl:async(url)=>{instantCalls++;return new Response(JSON.stringify({data:{id:'off_instant',live_mode:false,passengers:[{id:'pas_test'}],payment_requirements:{requires_instant_payment:true}}}),{status:200})}});
assert.equal(instantBlocked.status,409);
assert.equal(instantCalls,1,'Instant-payment offer must be blocked before order creation.');

assert.ok(moduleSource.includes("startsWith('duffel_test_')"),'Test token prefix must be enforced in backend code.');
assert.ok(moduleSource.includes("type:'hold'"),'Only unpaid hold order creation belongs in the no-spend adapter.');
assert.ok(!moduleSource.includes("type:'instant'"),'Instant order creation must not exist in the no-spend adapter.');
assert.ok(moduleSource.includes('requires_instant_payment!==false'),'Offer eligibility must fail closed unless Duffel explicitly permits deferred payment.');
assert.ok(moduleSource.includes("if(offer.live_mode===true)"),'Live offer response must be rejected.');
assert.ok(moduleSource.includes("if(!orderId||order.live_mode===true)"),'Live/ambiguous order confirmation must not report success.');

for(const route of ['/api/travel-agency/sandbox/duffel/status','/api/travel-agency/sandbox/duffel/search','/api/travel-agency/sandbox/duffel/hold'])assert.ok(runtime.includes(route),'Missing owner Duffel test route '+route);
assert.ok((runtime.match(/Owner access required\./g)||[]).length>=7,'Travel sandbox endpoints must retain owner-only gates.');
assert.ok(runtime.includes('isDuffelTestToken(clean(runtimeEnv?.DUFFEL_ACCESS_TOKEN))'),'Status must activate only for a Duffel test token.');

for(const token of ['Duffel No-Spend Flight Test Lab','TEST TOKEN ONLY','NO LIVE BOOKING','NO CARD / BALANCE','NO PAYMENT INTENT','OWNER ONLY','/api/travel-agency/sandbox/duffel/status','/api/travel-agency/sandbox/duffel/search','/api/travel-agency/sandbox/duffel/hold','https://duffel.com/docs/api/overview/test-mode'])assert.ok(page.includes(token),'Duffel owner page missing '+token);
assert.ok(!page.includes('cardNumber'),'Owner page must not collect a card number.');
assert.ok(!page.includes('cvv'),'Owner page must not collect CVV.');
assert.ok(!page.includes('paymentIntent'),'Owner page must not collect a payment intent.');
assert.ok(page.includes("passengers:[{id:passengerId,title,gender,given_name:given.trim(),family_name:family.trim(),born_on:born,email:email.trim(),phone_number:phone.trim(),type:'adult'}]"),'Hold UI request must be identity-only.');

console.log('Magnanimous Duffel no-spend test lock PASS');
