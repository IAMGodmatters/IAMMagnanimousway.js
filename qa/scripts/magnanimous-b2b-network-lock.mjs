import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getB2BCapabilityManifest, getB2BConnectionCatalog, getB2BSummary, MAGNANIMOUS_B2B_POLICY } from '../../worker/src/magnanimous-b2b-capability-registry.js';
import { getCapabilityAbsorptionManifest } from '../../worker/src/magnanimous-connector-absorption.js';
import { classifyCapabilityRealization } from '../../worker/src/magnanimous-capability-realization.js';
import { B2B_NORMALIZED_OBJECTS, B2B_WORKFLOWS } from '../../worker/src/magnanimous-b2b-runtime.js';
import { getB2BProtocolCatalog, getB2BStandardsCatalog, getB2BOpportunityCatalog, getB2BSkillCatalog } from '../../worker/src/magnanimous-b2b-universal-fabric.js';
import { MAGNANIMOUS_RESERVATION_POLICY, RESERVATION_NORMALIZED_OBJECTS, getReservationCapabilityManifest, getReservationProviderGraph, getReservationSkillCatalog, getReservationLifecycle, getReservationSummary } from '../../worker/src/magnanimous-reservation-service-fabric.js';

const caps=getB2BCapabilityManifest();
const connections=getB2BConnectionCatalog();
const summary=getB2BSummary();
const full=getCapabilityAbsorptionManifest();
const protocols=getB2BProtocolCatalog();
const standards=getB2BStandardsCatalog();
const opportunities=getB2BOpportunityCatalog();
const skills=getB2BSkillCatalog();
const reservationCaps=getReservationCapabilityManifest();
const reservationProviders=getReservationProviderGraph();
const reservationSkills=getReservationSkillCatalog();
const reservationLifecycle=getReservationLifecycle();
const reservationSummary=getReservationSummary();

assert.ok(caps.length>=120,'B2B registry must cover broad wholesale, procurement, logistics, travel and reservation operations.');
assert.ok(summary.commerce_contracts>=20,'B2B commerce must cover wholesale/sourcing/procurement operations.');
assert.ok(summary.travel_contracts>=20,'B2B travel must cover search, booking and servicing operations.');
assert.ok(connections.length>=45,'B2B connection catalog must cover commerce, procurement, logistics and travel partners.');
assert.ok(protocols.length>=18,'Universal B2B protocol fabric must cover API, EDI, Peppol, files and event transports.');
assert.ok(standards.length>=8,'B2B standards catalog must cover airline, procurement and trade standards.');
assert.ok(opportunities.length>=30,'B2B opportunity catalog must span broad business models.');
assert.ok(skills.length>=75,'Reusable B2B skill library must cover sourcing, sales, procurement, logistics and travel.');
assert.ok(reservationCaps.length>=30,'Reservation service must expose a broad provider-neutral capability surface.');
assert.ok(reservationProviders.length>=20,'Reservation provider graph must cover air, hotel, activities, payments and settlement rails.');
assert.ok(reservationSkills.length>=70,'Reservation skill library must cover search, pricing, booking, fulfillment, servicing, payment, settlement and reliability.');
assert.ok(reservationLifecycle.length>=14,'Reservation lifecycle must cover discover through settlement and learning.');
assert.ok(Object.keys(RESERVATION_NORMALIZED_OBJECTS).length>=10,'Reservation service must define normalized reservation records.');
assert.equal(reservationSummary.status,'magnanimous-reservation-service-defined');

for(const id of [
 'company-account-management','b2b-catalogs-pricing','rfq-quote-cpq','purchase-orders','net-terms-credit',
 'supplier-discovery','rfq-sourcing','private-label-oem','dropshipping','kitting-bundling','inventory-sync',
 'edi-documents','erp-procurement','freight-logistics','customs-landed-cost','partner-reseller-network','b2b-prospecting',
 'travel-agency-accounts','travel-search-normalization','air-offer-search','air-offer-price','air-order-book','air-ticketing',
 'air-ancillaries','air-change-reshop','air-cancel-refund','hotel-search-book','hotel-modify-cancel','cars-transfers',
 'tours-activities','travel-packages','travel-markup-commission','travel-credit-ledger','corporate-travel-policy',
 'corporate-travel-expense','traveler-profiles','group-travel','travel-white-label','travel-support-queue',
 'universal-b2b-connector','marketplace-channel-operations','business-marketplace-procurement','edi-x12-mapping','edifact-mapping','cxml-procurement','peppol-eprocurement','gs1-master-data','supplier-punchout','three-way-match','supplier-scorecards','demand-forecasting','trade-document-pack','b2b-opportunity-discovery','tender-response','warehouse-3pl','parcel-carrier-routing','ocean-freight-routing','travel-accreditation-readiness','ndc-offer-order','one-order-lifecycle','airline-direct-connect','agency-identity-tids','bsp-settlement','arc-accreditation-settlement','air-consolidator-host','travelgate-hotel-network','mice-events','cruise-rail-ferry-bus','adm-acm-management','travel-mid-back-office',
 'reservation-provider-router','multi-source-reservation-search','reservation-price-revalidation','reservation-availability-revalidation','reservation-hold','reservation-preflight','reservation-idempotency','reservation-create','reservation-retrieve','reservation-multicontent','reservation-ticketing','reservation-voucher','reservation-event-ingest','reservation-schedule-change','reservation-change-quote','reservation-air-exchange','reservation-hotel-modify','reservation-activity-amend','reservation-ancillary-add','reservation-cancel-quote','reservation-cancel','reservation-refund','reservation-void','reservation-payment','reservation-supplier-payment','reservation-settlement','reservation-bsp-arc','reservation-audit','reservation-authority-matrix','reservation-provider-health','reservation-reconciliation'
])assert.ok(caps.some(x=>x.capability===id),'Missing B2B capability '+id);

for(const id of ['shopify-b2b','alibaba-sourcing','amazon-business','amazon-sp-api','walmart-marketplace','ebay-sell','amadeus','sabre','travelport','duffel','zentrumhub','hbx-hotelbeds','expedia-rapid','viator','getyourguide','brex-travel','netsuite','sap-business-network','coupa','peppol-service-provider','gs1','un-cefact','faire','thomasnet','ups','fedex','dhl','maersk','iata-ndc','iata-one-order','iata-tids','iata-bsp','arc','airline-direct-ndc','travelgate','ratehawk','tbo','hahnair','verteil','travelfusion'])
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
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.brain_owner,'Magnanimous AI');
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.reservation_record_owner,'Magnanimous AI');
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.booking_authority_not_assumed,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.ticketing_authority_not_assumed,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.settlement_authority_not_assumed,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.duplicate_booking_prevention,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.proprietary_provider_code_copied,false);

for(const key of ['company','supplier','product','quote','purchase_order','travel_offer','travel_order','settlement','trading_document','shipment','procurement_event','agency_identity','travel_settlement','reservation_request','reservation_option','reservation_hold','reservation_record','traveler_profile_ref','reservation_payment','fulfillment_document','reservation_service_event','reservation_notification','reservation_settlement'])
 assert.ok(Array.isArray(B2B_NORMALIZED_OBJECTS[key])&&B2B_NORMALIZED_OBJECTS[key].length>3,'Missing normalized B2B object '+key);
assert.ok(B2B_WORKFLOWS.wholesale.length>=10);
assert.ok(B2B_WORKFLOWS.travel.length>=10);
assert.ok(B2B_WORKFLOWS.procurement.length>=8);
assert.ok(B2B_WORKFLOWS.logistics.length>=6);
assert.ok(B2B_WORKFLOWS.travel_accreditation.length>=6);
assert.ok(B2B_WORKFLOWS.reservation.length>=14);

const runtime=fs.readFileSync('worker/src/magnanimous-b2b-runtime.js','utf8');
assert.ok(runtime.includes("'/api/b2b/catalog'"));
assert.ok(runtime.includes("live_connection_verified:false"));
assert.ok(runtime.includes("'/api/b2b/protocols'"));
assert.ok(runtime.includes("'/api/b2b/standards'"));
assert.ok(runtime.includes("'/api/b2b/opportunities'"));
assert.ok(runtime.includes("'/api/b2b/skills'"));
assert.ok(runtime.includes("'/api/b2b/reservations'"));
assert.ok(runtime.includes("'/api/b2b/reservations/providers'"));
assert.ok(runtime.includes("'/api/b2b/reservations/skills'"));
assert.ok(runtime.includes("'/api/b2b/reservations/preflight'"));
assert.ok(runtime.includes('live provider handshake/authority verification'));
assert.ok(runtime.includes('idempotency key and duplicate-booking guard'));
assert.ok(runtime.includes('issue ticket/voucher only when the connected rail grants authority'));
assert.ok(runtime.includes('Verify price, availability')||runtime.includes('reprice/recheck live availability'));
assert.ok(runtime.includes('Magnanimous owns the plan, memory, policy, normalization and verification'));

const creds=fs.readFileSync('worker/src/platform-credentials.js','utf8');
for(const key of ['AMAZON_SPAPI_CLIENT_ID','AMAZON_SPAPI_CLIENT_SECRET','AMAZON_SPAPI_REFRESH_TOKEN','WALMART_CLIENT_ID','WALMART_CLIENT_SECRET','EBAY_CLIENT_ID','EBAY_CLIENT_SECRET','EBAY_REFRESH_TOKEN','AMADEUS_CLIENT_ID','SABRE_CLIENT_ID','TRAVELPORT_CLIENT_ID','DUFFEL_ACCESS_TOKEN','HBX_API_KEY','EXPEDIA_RAPID_API_KEY','VIATOR_API_KEY','GETYOURGUIDE_API_TOKEN','ZENTRUMHUB_API_KEY','NETSUITE_ACCOUNT_ID','COUPA_CLIENT_ID','PEPPOL_ACCESS_POINT_TOKEN','UPS_CLIENT_ID','FEDEX_CLIENT_ID','DHL_API_KEY','MAERSK_CONSUMER_KEY','TRAVELGATE_ACCESS_TOKEN','RATEHAWK_API_KEY','IATA_TIDS_CODE','IATA_NUMERIC_CODE','ARC_NUMBER','VERTEIL_API_TOKEN','TRAVELFUSION_API_TOKEN','HAHNAIR_PARTNER_REFERENCE','TBO_API_KEY'])
 assert.ok(creds.includes(key),'Platform credential vault must support '+key);

const entry=fs.readFileSync('worker/src/progress-entrypoint.js','utf8');
assert.ok(entry.includes('handleMagnanimousB2B'));
const page=fs.readFileSync('frontend/app/b2b/page.tsx','utf8');
assert.ok(page.includes('Wholesale + Travel Distribution'));
assert.ok(page.includes('CONNECTION FABRIC'));
assert.ok(page.includes('OPEN STANDARDS'));
assert.ok(page.includes('REUSABLE B2B SKILL LIBRARY'));
assert.ok(page.includes('MAGNANIMOUS RESERVATION SERVICE'));
assert.ok(page.includes('RESERVATION SKILL LIBRARY'));
const reservationPage=fs.readFileSync('frontend/app/reservations/page.tsx','utf8');
assert.ok(reservationPage.includes('MAGNANIMOUS RESERVATION SERVICE'));
assert.ok(reservationPage.includes('TRANSACTION PREFLIGHT'));
assert.ok(reservationPage.includes('PROVIDER CONNECTION GRAPH'));
const agents=fs.readFileSync('worker/src/agent-mesh-runtime.js','utf8');
assert.ok(agents.includes("'wholesale','Wholesale','B2B Wholesale Strategist'"));
assert.ok(agents.includes("'travelpro','TravelPro','B2B Travel Distribution'"));
assert.ok(agents.includes("'procura','Procura','Procurement & Supplier Network'"));
assert.ok(agents.includes("'freight','Freight','B2B Logistics Strategist'"));
assert.ok(agents.includes("'tradedesk','TradeDesk','Global Trade & EDI'"));
assert.ok(agents.includes("'airretail','AirRetail','Airline Retailing Specialist'"));
assert.ok(agents.includes("'travelops','TravelOps','Travel Agency Operations'"));
assert.ok(agents.includes("'reserve','Reserve','Reservation Orchestrator'"));
assert.ok(agents.includes("'serviceops','ServiceOps','Post-Booking Servicing'"));
assert.ok(agents.includes("{id:'reservations',name:'Reservation Service',href:'/reservations'"));

console.log('Magnanimous B2B wholesale + travel lock PASS',summary);
