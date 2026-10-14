import assert from 'node:assert/strict';
import fs from 'node:fs';

const page=fs.readFileSync('frontend/app/travel-agency/page.tsx','utf8');
const runtime=fs.readFileSync('worker/src/magnanimous-travel-agency-runtime.js','utf8');
const adapter=fs.readFileSync('worker/src/magnanimous-travel-liteapi-sandbox.js','utf8');

for(const token of [
 'NO-CHARGE HOTEL SANDBOX LAB',
 'Search → prebook → simulated book, with the production door locked',
 'NO REAL CHARGE','NO REAL RESERVATION','NO PAYMENT SDK','OWNER ONLY','PRODUCTION DISABLED',
 '/api/travel-agency/sandbox/liteapi/status',
 '/api/travel-agency/sandbox/liteapi/search',
 '/api/travel-agency/sandbox/liteapi/prebook',
 '/api/travel-agency/sandbox/liteapi/book',
 'https://docs.liteapi.travel/docs/getting-a-sandbox-key'
]) assert.ok(page.includes(token),'Travel sandbox UI missing '+token);

assert.ok(page.includes("body:JSON.stringify({prebookId:sandboxPrebookId,holder,guests:[{occupancyNumber:1,...holder}]})"),'UI must not send payment details to sandbox book route.');
assert.ok(!page.includes('cardNumber'),'UI must never collect a card number.');
assert.ok(!page.includes('cvv:'),'UI must never collect CVV.');
assert.ok(!page.includes('billingInfo'),'UI must never collect LiteAPI billing details.');
assert.ok(!page.includes('transactionId'),'No payment transaction ID belongs in the no-charge sandbox lab.');

for(const route of [
 "'/api/travel-agency/sandbox/liteapi/status'",
 "'/api/travel-agency/sandbox/liteapi/search'",
 "'/api/travel-agency/sandbox/liteapi/prebook'",
 "'/api/travel-agency/sandbox/liteapi/book'"
]) assert.ok(runtime.includes(route),'Runtime missing '+route);
assert.ok((runtime.match(/Owner access required\./g)||[]).length>=4,'Sandbox routes must retain owner-only gates.');

assert.ok(adapter.includes("payment:{method:'ACC_CREDIT_CARD'}"),'Backend must inject only LiteAPI sandbox simulation method.');
assert.ok(adapter.includes('usePaymentSdk:false'),'Payment SDK must remain disabled.');
assert.ok(adapter.includes('real_charge_allowed:false'),'Real charge must remain impossible in sandbox adapter.');
assert.ok(adapter.includes("startsWith('sand_')")&&adapter.includes("startsWith('sandbox_')"),'Only sandbox key prefixes may be accepted.');
assert.ok(!adapter.includes("startsWith('prod_')"),'Production key prefix must never be accepted by sandbox adapter.');
assert.ok(adapter.includes('did not confirm a prebook ID'),'Prebook success must require supplier confirmation.');
assert.ok(adapter.includes('did not confirm a booking ID'),'Booking simulation success must require supplier confirmation.');
assert.ok(adapter.includes('[400,409,410,429]'),'Supplier 410 and other meaningful statuses must remain preserved.');

console.log('Magnanimous no-charge travel sandbox UI lock PASS');
