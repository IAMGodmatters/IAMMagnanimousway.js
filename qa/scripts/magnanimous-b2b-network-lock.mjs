import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getB2BCapabilityManifest, getB2BConnectionCatalog, getB2BSummary, MAGNANIMOUS_B2B_POLICY } from '../../worker/src/magnanimous-b2b-capability-registry.js';
import { getCapabilityAbsorptionManifest } from '../../worker/src/magnanimous-connector-absorption.js';
import { classifyCapabilityRealization } from '../../worker/src/magnanimous-capability-realization.js';
import { B2B_NORMALIZED_OBJECTS, B2B_WORKFLOWS } from '../../worker/src/magnanimous-b2b-runtime.js';

const caps=getB2BCapabilityManifest();
const connections=getB2BConnectionCatalog();
const summary=getB2BSummary();
const full=getCapabilityAbsorptionManifest();

assert.ok(caps.length>=50,'B2B registry must cover broad wholesale and travel operations.');
assert.ok(summary.commerce_contracts>=20,'B2B commerce must cover wholesale/sourcing/procurement operations.');
assert.ok(summary.travel_contracts>=20,'B2B travel must cover search, booking and servicing operations.');
assert.ok(connections.length>=20,'B2B connection catalog must cover commerce, ERP and travel partners.');

for(const id of [
 'company-account-management','b2b-catalogs-pricing','rfq-quote-cpq','purchase-orders','net-terms-credit',
 'supplier-discovery','rfq-sourcing','private-label-oem','dropshipping','kitting-bundling','inventory-sync',
 'edi-documents','erp-procurement','freight-logistics','customs-landed-cost','partner-reseller-network','b2b-prospecting',
 'travel-agency-accounts','travel-search-normalization','air-offer-search','air-offer-price','air-order-book','air-ticketing',
 'air-ancillaries','air-change-reshop','air-cancel-refund','hotel-search-book','hotel-modify-cancel','cars-transfers',
 'tours-activities','travel-packages','travel-markup-commission','travel-credit-ledger','corporate-travel-policy',
 'corporate-travel-expense','traveler-profiles','group-travel','travel-white-label','travel-support-queue'
])assert.ok(caps.some(x=>x.capability===id),'Missing B2B capability '+id);

for(const id of ['shopify-b2b','alibaba-sourcing','amadeus','sabre','travelport','duffel','zentrumhub','hbx-hotelbeds','expedia-rapid','viator','getyourguide','brex-travel','netsuite'])
 assert.ok(connections.some(x=>x.id===id),'Missing B2B connection '+id);

for(const row of caps){
 assert.ok(row.native_target,'Every B2B capability must map to a Magnanimous target.');
 assert.ok(row.boundary!==undefined,'Every B2B capability must have an explicit boundary.');
 assert.ok(Array.isArray(row.magnanimous_owned)&&row.magnanimous_owned.includes('workflow-orchestration'),'Magnanimous must own B2B orchestration.');
 assert.equal(row.authorization_state,'not-assumed');
 assert.equal(row.research?.proprietary_implementation_copied,false);
 const realized=classifyCapabilityRealization(row);
 assert.ok(['native-ready','hybrid-ready'].includes(realized.status),row.capability+' must resolve to a proven Magnanimous execution surface.');
 if(row.risk==='high')assert.equal(row.initiative.requires_confirmation,true,row.capability+' must remain confirmation gated.');
}

const fullIds=new Set(full.map(x=>x.id));
for(const row of caps)assert.ok(fullIds.has(row.id),'Full brain must contain '+row.id);

assert.equal(MAGNANIMOUS_B2B_POLICY.brain_owner,'Magnanimous AI');
assert.equal(MAGNANIMOUS_B2B_POLICY.memory_owner,'Magnanimous AI');
assert.equal(MAGNANIMOUS_B2B_POLICY.workflow_owner,'Magnanimous AI');
assert.equal(MAGNANIMOUS_B2B_POLICY.regulated_travel_authority_not_assumed,true);
assert.equal(MAGNANIMOUS_B2B_POLICY.merchant_of_record_not_assumed,true);
assert.equal(MAGNANIMOUS_B2B_POLICY.iata_arc_accreditation_not_assumed,true);

for(const key of ['company','supplier','product','quote','purchase_order','travel_offer','travel_order','settlement'])
 assert.ok(Array.isArray(B2B_NORMALIZED_OBJECTS[key])&&B2B_NORMALIZED_OBJECTS[key].length>3,'Missing normalized B2B object '+key);
assert.ok(B2B_WORKFLOWS.wholesale.length>=10);
assert.ok(B2B_WORKFLOWS.travel.length>=10);

const runtime=fs.readFileSync('worker/src/magnanimous-b2b-runtime.js','utf8');
assert.ok(runtime.includes("'/api/b2b/catalog'"));
assert.ok(runtime.includes("live_connection_verified:false"));
assert.ok(runtime.includes('ticket issue'));
assert.ok(runtime.includes('Verify price, availability')||runtime.includes('reprice/recheck live availability'));
assert.ok(runtime.includes('Magnanimous owns the plan, memory, policy, normalization and verification'));

const creds=fs.readFileSync('worker/src/platform-credentials.js','utf8');
for(const key of ['AMADEUS_CLIENT_ID','SABRE_CLIENT_ID','TRAVELPORT_CLIENT_ID','DUFFEL_ACCESS_TOKEN','HBX_API_KEY','EXPEDIA_RAPID_API_KEY','VIATOR_API_KEY','GETYOURGUIDE_API_TOKEN','ZENTRUMHUB_API_KEY','NETSUITE_ACCOUNT_ID'])
 assert.ok(creds.includes(key),'Platform credential vault must support '+key);

const entry=fs.readFileSync('worker/src/progress-entrypoint.js','utf8');
assert.ok(entry.includes('handleMagnanimousB2B'));
const page=fs.readFileSync('frontend/app/b2b/page.tsx','utf8');
assert.ok(page.includes('Wholesale + Travel Distribution'));
assert.ok(page.includes('CONNECTION FABRIC'));
const agents=fs.readFileSync('worker/src/agent-mesh-runtime.js','utf8');
assert.ok(agents.includes("'wholesale','Wholesale','B2B Wholesale Strategist'"));
assert.ok(agents.includes("'travelpro','TravelPro','B2B Travel Distribution'"));

console.log('Magnanimous B2B wholesale + travel lock PASS',summary);
