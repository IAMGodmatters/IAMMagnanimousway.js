import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 DEFAULT_TRAVEL_PRICING_POLICY,MAGNANIMOUS_TRAVEL_AGENCY_POLICY,TRAVEL_SUPPLIER_CATALOG,TRAVEL_AGENCY_SKILLS,
 normalizeTravelOffer,priceOffer,rankTravelDeals,getTravelAgencySummary
} from '../../worker/src/magnanimous-travel-agency-core.js';
import {
 isLiteApiSandboxKey,validateLiteApiSandboxSearch,searchLiteApiSandboxHotels,
 validateLiteApiSandboxPrebook,validateLiteApiSandboxBook,prebookLiteApiSandboxHotel,bookLiteApiSandboxHotel
} from '../../worker/src/magnanimous-travel-liteapi-sandbox.js';

assert.ok(TRAVEL_SUPPLIER_CATALOG.length>=20,'Travel supplier mesh must cover at least 20 strategic sources/benchmarks.');
assert.ok(TRAVEL_AGENCY_SKILLS.length>=40,'Travel agency brain must retain at least 40 dedicated skills.');
for(const id of ['duffel','pkfare','mystifly','amadeus','sabre','travelport','travelgate','hbx-hotelbeds','ratehawk','tbo','webbeds','stuba','expedia-rapid','viator','getyourguide','skyscanner','juniper'])
 assert.ok(TRAVEL_SUPPLIER_CATALOG.some(x=>x.id===id),'Missing supplier '+id);
assert.equal(MAGNANIMOUS_TRAVEL_AGENCY_POLICY.identity_owner,'Magnanimous AI');
assert.equal(MAGNANIMOUS_TRAVEL_AGENCY_POLICY.supplier_credentials_private,true);
assert.equal(MAGNANIMOUS_TRAVEL_AGENCY_POLICY.raw_supplier_net_private,true);
assert.equal(MAGNANIMOUS_TRAVEL_AGENCY_POLICY.cheapest_claim_requires_live_comparison,true);
assert.equal(MAGNANIMOUS_TRAVEL_AGENCY_POLICY.booking_authority_not_assumed,true);
assert.equal(MAGNANIMOUS_TRAVEL_AGENCY_POLICY.external_provider_code_copied,false);
assert.equal(DEFAULT_TRAVEL_PRICING_POLICY.owner_margin_bps,150);

const one=rankTravelDeals([{id:'a',supplier:'duffel',product:'air',currency:'USD',total_minor:10000,bookable:true,source_timestamp:new Date().toISOString()}],DEFAULT_TRAVEL_PRICING_POLICY,500)[0];
assert.equal(one.lowest_verified,false);
assert.match(one.proof_label,/wider-market cheapest not claimed/);
assert.equal(one.best.pricing.magnanimous_wholesale_minor,10150);
assert.equal(one.best.pricing.final_sell_minor,10658);

const two=rankTravelDeals([
 {id:'a',supplier:'duffel',product:'air',currency:'USD',total_minor:10000,bookable:true,source_timestamp:new Date().toISOString()},
 {id:'b',supplier:'pkfare',product:'air',currency:'USD',total_minor:9800,bookable:true,source_timestamp:new Date().toISOString()}
],DEFAULT_TRAVEL_PRICING_POLICY,0)[0];
assert.equal(two.lowest_verified,true);
assert.equal(two.best.supplier,'pkfare');
assert.equal(two.compared_bookable_sources,2);

const normalized=normalizeTravelOffer({supplier:'x',currency:'USD',total_minor:10000,tax_minor:500,mandatory_fee_minor:200,settlement_cost_minor:100});
assert.equal(normalized.true_cost_minor,10800);
const priced=priceOffer(normalized,{...DEFAULT_TRAVEL_PRICING_POLICY,owner_margin_bps:100},1000);
assert.equal(priced.pricing.owner_margin_minor,108);
assert.equal(priced.pricing.magnanimous_wholesale_minor,10908);
assert.equal(priced.pricing.reseller_margin_minor,1091);

const runtime=fs.readFileSync('worker/src/magnanimous-travel-agency-runtime.js','utf8');
for(const token of [
 'DUFFEL_ACCESS_TOKEN','https://api.duffel.com/air/offer_requests','supplier_timeout=12000',
 "'/api/travel-source/v1/catalog'","'/api/travel-source/v1/search/flights'",
 "'/api/travel-agency/search/flights'","'/api/travel-agency/pricing'","'/api/travel-agency/resellers'",
 'X-Magnanimous-Travel-Key','key_hash','raw supplier net'
])assert.ok(runtime.includes(token),'Runtime missing '+token);
assert.ok(!runtime.includes('INSERT INTO travel_source_api_keys')||runtime.includes('key_hash'),'Raw reseller API keys must not be persisted.');

const migration=fs.readFileSync('worker/migrations/0082_travel_agency_distribution.sql','utf8');
for(const table of ['travel_agency_pricing_policy','travel_reseller_accounts','travel_source_api_keys','travel_quote_evidence'])
 assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS '+table),'Missing '+table);
assert.ok(migration.includes('key_hash TEXT NOT NULL UNIQUE'));

const page=fs.readFileSync('frontend/app/travel-agency/page.tsx','utf8');
assert.ok(page.includes('MAGNANIMOUS TRAVEL AGENCY'));
assert.ok(page.includes('Find the best verified deal. Sell it twice.'));
assert.ok(page.includes('Issue API key'));
const global=fs.readFileSync('frontend/app/global-tools.tsx','utf8');assert.ok(global.includes('href="/travel-agency"'));
const agents=fs.readFileSync('worker/src/agent-mesh-runtime.js','utf8');assert.ok(agents.includes("'traveldeal','TravelDeal'"));
const progress=fs.readFileSync('worker/src/progress-entrypoint.js','utf8');assert.ok(progress.includes('handleMagnanimousTravelAgency'));

const onboarding=fs.readFileSync('worker/src/magnanimous-travel-supplier-onboarding.js','utf8');
for(const token of ['SUPPLIER_ONBOARDING_STAGES','MAGNANIMOUS_TRAVEL_APPLICATION_PROFILE','TRAVEL_SUPPLIER_ONBOARDING',"'duffel',priority:1","'ratehawk',priority:1","'webbeds',priority:1","'stuba',priority:1","'liteapi',priority:1"])
 assert.ok(onboarding.includes(token),'Supplier onboarding missing '+token);
for(const stage of ['contacted','application_submitted','sandbox_active','certification','approved','production_testing','live'])
 assert.ok(onboarding.includes(stage),'Onboarding lifecycle missing '+stage);
assert.ok(onboarding.includes("No IATA/ARC ticketing authority is assumed."));
assert.ok(onboarding.includes("godmattersinc@iammagnanimousway.com"));

const onboardingMigration=fs.readFileSync('worker/migrations/0083_travel_supplier_onboarding.sql','utf8');
for(const table of ['travel_supplier_onboarding','travel_supplier_onboarding_events'])
 assert.ok(onboardingMigration.includes('CREATE TABLE IF NOT EXISTS '+table),'Missing '+table);

for(const route of [
 "'/api/travel-agency/application-profile'","'/api/travel-agency/supplier-onboarding'","supplier-onboarding\\/([^/]+)",
 "'/api/travel-agency/sandbox/liteapi/status'","'/api/travel-agency/sandbox/liteapi/search'",
 "'/api/travel-agency/sandbox/liteapi/prebook'","'/api/travel-agency/sandbox/liteapi/book'"
]) assert.ok(runtime.includes(route),'Runtime missing onboarding route '+route);
assert.ok(page.includes('SUPPLIER ACQUISITION CONTROL'));
assert.ok(page.includes('Contact → sandbox → certification → production'));
assert.ok(page.includes('No supplier becomes LIVE until production access is actually verified.'));

assert.equal(isLiteApiSandboxKey('sand_example'),true);
assert.equal(isLiteApiSandboxKey('sandbox_example'),true);
assert.equal(isLiteApiSandboxKey('prod_example'),false);
const liteSearch={checkin:'2027-02-28',checkout:'2027-03-01',currency:'USD',guestNationality:'US',occupancies:[{adults:2}],cityName:'Cebu',countryCode:'PH',hotelIds:[],limit:1.5};
assert.doesNotThrow(()=>validateLiteApiSandboxSearch(liteSearch));
assert.throws(()=>validateLiteApiSandboxSearch({...liteSearch,checkin:'2027-02-30'}));
let litePayload=null;
const lite204=await searchLiteApiSandboxHotels(liteSearch,{sandboxKey:'sandbox_example',fetchImpl:async(_url,options)=>{litePayload=JSON.parse(options.body);return{ok:true,status:204,headers:{get:()=>null},body:null}}});
assert.equal(litePayload.limit,1);
assert.equal(litePayload.cityName,'Cebu');
assert.ok(!Object.hasOwn(litePayload,'hotelIds'));
assert.deepEqual(lite204.results,[]);
const lite429=await searchLiteApiSandboxHotels(liteSearch,{sandboxKey:'sand_example',fetchImpl:async()=>({ok:false,status:429,headers:{get:()=>null},body:null})});
assert.equal(lite429.status,429);

const litePrebookInput={offerId:'offer_sandbox_123'};
assert.doesNotThrow(()=>validateLiteApiSandboxPrebook(litePrebookInput));
assert.throws(()=>validateLiteApiSandboxPrebook({offerId:'offer_sandbox_123',usePaymentSdk:true}));
const liteBookInput={
 prebookId:'prebook_sandbox_123',
 clientReference:'MAG-SBX-LOCK-001',
 holder:{firstName:'Jessie',lastName:'Hardin',email:'sandbox@example.com'},
 guests:[{occupancyNumber:1,firstName:'Jessie',lastName:'Hardin',email:'sandbox@example.com'}]
};
assert.doesNotThrow(()=>validateLiteApiSandboxBook(liteBookInput));
assert.throws(()=>validateLiteApiSandboxBook({...liteBookInput,payment:{method:'WALLET'}}));

const jsonResponse=(payload,status=200)=>{
 const bytes=new TextEncoder().encode(JSON.stringify(payload));
 return {ok:status>=200&&status<300,status,headers:{get:name=>String(name||'').toLowerCase()==='content-length'?String(bytes.byteLength):null},body:null,arrayBuffer:async()=>bytes.buffer};
};
let prebookUrl='',prebookPayload=null;
const prebookResult=await prebookLiteApiSandboxHotel(litePrebookInput,{sandboxKey:'sand_example',fetchImpl:async(url,options)=>{prebookUrl=url;prebookPayload=JSON.parse(options.body);return jsonResponse({data:{prebookId:'prebook_sandbox_123'}});}});
assert.equal(prebookUrl,'https://book.liteapi.travel/v3.0/rates/prebook');
assert.deepEqual(prebookPayload,{offerId:'offer_sandbox_123',usePaymentSdk:false});
assert.ok(!Object.hasOwn(prebookPayload,'includeCreditBalance'));
assert.equal(prebookResult.booking_simulation_enabled,true);
assert.equal(prebookResult.production_enabled,false);
assert.equal(prebookResult.booking_enabled,false);
assert.equal(prebookResult.payment_enabled,false);
assert.equal(prebookResult.real_charge_allowed,false);

let bookUrl='',bookPayload=null;
const bookResult=await bookLiteApiSandboxHotel(liteBookInput,{sandboxKey:'sandbox_example',fetchImpl:async(url,options)=>{bookUrl=url;bookPayload=JSON.parse(options.body);return jsonResponse({data:{bookingId:'booking_sandbox_123',status:'CONFIRMED'}});}});
assert.equal(bookUrl,'https://book.liteapi.travel/v3.0/rates/book');
assert.equal(bookPayload.payment.method,'ACC_CREDIT_CARD');
assert.equal(bookPayload.clientReference,'MAG-SBX-LOCK-001');
assert.equal(bookPayload.customTags.MAGNANIMOUS_MODE,'SANDBOX');
assert.equal(bookResult.simulated_booking,true);
assert.equal(bookResult.production_enabled,false);
assert.equal(bookResult.booking_enabled,false);
assert.equal(bookResult.payment_enabled,false);
assert.equal(bookResult.real_charge_allowed,false);
assert.ok(!JSON.stringify(bookPayload).match(/cardNumber|cvv|expiry|wallet/i),'Sandbox adapter must not transmit card or wallet fields.');

const missingKey=await bookLiteApiSandboxHotel(liteBookInput,{sandboxKey:'prod_example',fetchImpl:async()=>{throw new Error('should not call upstream')}});
assert.equal(missingKey.configured,false);
assert.equal(missingKey.status,503);
const bookFailure=await bookLiteApiSandboxHotel(liteBookInput,{sandboxKey:'sand_example',fetchImpl:async()=>jsonResponse({error:'conflict'},409)});
assert.equal(bookFailure.status,409);

const liteAdapter=fs.readFileSync('worker/src/magnanimous-travel-liteapi-sandbox.js','utf8');
assert.ok(liteAdapter.includes('getReader'));
assert.ok(liteAdapter.includes('reader.cancel'));
assert.ok(liteAdapter.includes("payment:{method:'ACC_CREDIT_CARD'}"));
assert.ok(liteAdapter.includes('usePaymentSdk:false'));
assert.ok(liteAdapter.includes('real_charge_allowed:false'));
assert.ok(!liteAdapter.includes('PRODUCTION_API_KEY'));
const platformCredentials=fs.readFileSync('worker/src/platform-credentials.js','utf8');
const providerRuntime=fs.readFileSync('worker/src/provider-runtime-env.js','utf8');
assert.ok(platformCredentials.includes('LITEAPI_SANDBOX_KEY'),'LiteAPI sandbox key must be allowed in platform credentials.');
assert.ok(providerRuntime.includes('LITEAPI_SANDBOX_KEY'),'LiteAPI sandbox key must be allowed in provider runtime.');

const summary=getTravelAgencySummary();
assert.ok(summary.suppliers>=20&&summary.skills>=40);
console.log('Magnanimous Travel Agency Portal lock PASS',summary);
