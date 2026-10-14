import assert from 'node:assert/strict';
import fs from 'node:fs';

const adapter=fs.readFileSync('worker/src/magnanimous-travel-duffel-sandbox.js','utf8');
const runtime=fs.readFileSync('worker/src/magnanimous-travel-agency-runtime.js','utf8');
const page=fs.readFileSync('frontend/app/travel-agency/page.tsx','utf8');

for(const token of [
 "startsWith('duffel_test_')",
 "type:'hold'",
 'requires_instant_payment!==false',
 "Live Duffel offers are forbidden in the no-spend test lab.",
 "Duffel did not confirm a test-mode hold order.",
 'real_charge_allowed:false',
 'production_enabled:false',
 'live_booking_enabled:false',
 'payment_enabled:false',
 'MAX_BYTES=1_500_000'
]) assert.ok(adapter.includes(token),'Duffel no-spend adapter missing '+token);

assert.ok(!adapter.includes("type:'instant'"),'No-spend Duffel adapter must never create instant orders.');
assert.ok(!adapter.includes('payments:['),'No-spend Duffel adapter must never send a payments array.');
assert.ok(!adapter.includes('payment_intent'),'No-spend Duffel adapter must not create payment intents.');
assert.ok(!adapter.includes('balance_amount'),'No-spend Duffel adapter must not use Duffel balance payments.');
assert.ok(adapter.includes("const allowed=new Set(['offerId','passengers'])"),'Hold route must reject every top-level payment/production field.');
assert.ok(adapter.includes("if(!orderId||order.live_mode===true)"),'Test hold success must require a confirmed non-live Duffel order ID.');

for(const route of [
 "'/api/travel-agency/sandbox/duffel/status'",
 "'/api/travel-agency/sandbox/duffel/search'",
 "'/api/travel-agency/sandbox/duffel/hold'"
]) assert.ok(runtime.includes(route),'Runtime missing '+route);
assert.ok((runtime.match(/Owner access required\./g)||[]).length>=7,'LiteAPI plus Duffel sandbox routes must remain owner-only.');
assert.ok(runtime.includes("if(!token||isDuffelTestToken(token))return{supplier:'duffel',configured:false,offers:[]}"),'Live Duffel search must refuse developer test tokens.');
assert.ok(runtime.includes("row.id==='duffel'?{...row,configured:false,test_mode_configured:true,live_mode:false}:row"),'Test token must not be reported as live supplier readiness.');
assert.ok(runtime.includes("booking_boundary:'Search and pricing only. Booking/ticketing remains authority-gated through the Magnanimous reservation service.'"),'Normal flight booking authority gate must remain intact.');

for(const token of [
 'NO-SPEND FLIGHT TEST LAB','NO REAL BOOKING','NO PAYMENT SENT','TEST TOKEN ONLY','OWNER ONLY','LIVE TICKETING LOCKED',
 '/api/travel-agency/sandbox/duffel/status','/api/travel-agency/sandbox/duffel/search','/api/travel-agency/sandbox/duffel/hold',
 'https://duffel.com/docs/api/overview/test-mode',
 'Developer test tokens are excluded here. Only production-authorized live supply may appear as a live deal.'
]) assert.ok(page.includes(token),'Travel UI missing Duffel safety token '+token);

assert.ok(page.includes("sandboxPost('/api/travel-agency/sandbox/duffel/hold',{offerId:duffelOfferId,passengers:"),'Duffel test UI must send only offer/passenger data to hold endpoint.');
assert.ok(!page.includes('payment_intent'),'Travel UI must never create Duffel payment intents.');
assert.ok(!page.includes('balance_amount'),'Travel UI must never expose Duffel balance payment controls.');
assert.ok(!page.includes('payments:['),'Travel UI must never send Duffel payments in the no-spend lab.');

console.log('Magnanimous Duffel no-spend test-mode lock PASS');
