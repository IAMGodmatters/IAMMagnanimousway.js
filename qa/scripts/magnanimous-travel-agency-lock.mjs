import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 DEFAULT_TRAVEL_PRICING_POLICY,MAGNANIMOUS_TRAVEL_AGENCY_POLICY,TRAVEL_SUPPLIER_CATALOG,TRAVEL_AGENCY_SKILLS,
 normalizeTravelOffer,priceOffer,rankTravelDeals,getTravelAgencySummary
} from '../../worker/src/magnanimous-travel-agency-core.js';

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
for(const token of ['SUPPLIER_ONBOARDING_STAGES','MAGNANIMOUS_TRAVEL_APPLICATION_PROFILE','TRAVEL_SUPPLIER_ONBOARDING',"'duffel',priority:1","'ratehawk',priority:1","'webbeds',priority:1","'stuba',priority:1"])
 assert.ok(onboarding.includes(token),'Supplier onboarding missing '+token);
for(const stage of ['contacted','application_submitted','sandbox_active','certification','approved','production_testing','live'])
 assert.ok(onboarding.includes(stage),'Onboarding lifecycle missing '+stage);
assert.ok(onboarding.includes("No IATA/ARC ticketing authority is assumed."));
assert.ok(onboarding.includes("godmattersinc@iammagnanimousway.com"));

const onboardingMigration=fs.readFileSync('worker/migrations/0083_travel_supplier_onboarding.sql','utf8');
for(const table of ['travel_supplier_onboarding','travel_supplier_onboarding_events'])
 assert.ok(onboardingMigration.includes('CREATE TABLE IF NOT EXISTS '+table),'Missing '+table);

for(const route of ["'/api/travel-agency/application-profile'","'/api/travel-agency/supplier-onboarding'","supplier-onboarding\\/([^/]+)"])
 assert.ok(runtime.includes(route),'Runtime missing onboarding route '+route);
assert.ok(page.includes('SUPPLIER ACQUISITION CONTROL'));
assert.ok(page.includes('Contact → sandbox → certification → production'));
assert.ok(page.includes('No supplier becomes LIVE until production access is actually verified.'));

const summary=getTravelAgencySummary();
assert.ok(summary.suppliers>=20&&summary.skills>=40);
console.log('Magnanimous Travel Agency Portal lock PASS',summary);
