import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  MAGNANIMOUS_RESERVATION_POLICY,
  RESERVATION_NORMALIZED_OBJECTS,
  RESERVATION_CONNECTION_READINESS,
  getReservationProviderGraph,
  getReservationSkillCatalog,
  getReservationLifecycle,
  getReservationCapabilityManifest,
  getReservationSummary
} from '../../worker/src/magnanimous-reservation-service-fabric.js';
import { getB2BCapabilityManifest, getB2BSummary } from '../../worker/src/magnanimous-b2b-capability-registry.js';
import { getCapabilityAbsorptionManifest } from '../../worker/src/magnanimous-connector-absorption.js';
import { classifyCapabilityRealization } from '../../worker/src/magnanimous-capability-realization.js';

const providers=getReservationProviderGraph();
const skills=getReservationSkillCatalog();
const lifecycle=getReservationLifecycle();
const caps=getReservationCapabilityManifest();
const summary=getReservationSummary();
const b2b=getB2BCapabilityManifest();
const full=getCapabilityAbsorptionManifest();

assert.ok(providers.length>=20,'Reservation provider graph must cover major air, hotel, activities, payment and settlement rails.');
assert.ok(skills.length>=70,'Reservation skill library must cover search, pricing, booking, fulfillment, servicing, payments and reconciliation.');
assert.ok(lifecycle.length>=14,'Reservation lifecycle must span discovery through settlement and learning.');
assert.ok(caps.length>=30,'Reservation capability contracts must cover the full reservation lifecycle.');
assert.equal(summary.providers,providers.length);
assert.equal(summary.skills,skills.length);
assert.equal(summary.capabilities,caps.length);
assert.ok(summary.provider_tool_contracts>=150,'Reservation provider graph must expose broad public tool contracts.');

for(const id of [
 'amadeus','sabre','travelport','duffel','hahnair','verteil','travelfusion','expedia-rapid',
 'hbx-hotelbeds','travelgate','ratehawk','tbo','zentrumhub','viator','getyourguide',
 'airline-direct-ndc','host-consolidator','iata-bsp','arc','stripe'
])assert.ok(providers.some(x=>x.id===id),'Missing reservation provider graph node '+id);

for(const p of providers){
 assert.ok(Array.isArray(p.connection_role)&&p.connection_role.length,'Provider role missing: '+p.id);
 assert.ok(Array.isArray(p.products)&&p.products.length,'Provider products missing: '+p.id);
 assert.ok(Array.isArray(p.lifecycle)&&p.lifecycle.length,'Provider lifecycle missing: '+p.id);
 assert.ok(Array.isArray(p.upstream)&&p.upstream.length,'Provider upstream graph missing: '+p.id);
 assert.ok(Array.isArray(p.downstream)&&p.downstream.length,'Provider downstream graph missing: '+p.id);
 assert.ok(Array.isArray(p.tools)&&p.tools.length,'Provider tool contracts missing: '+p.id);
 assert.ok(typeof p.authority==='string'&&p.authority.length>5,'Provider authority boundary missing: '+p.id);
}

for(const id of [
 'inventory-routing','multi-source-search','content-normalization','content-deduplication',
 'air-offer-normalization','property-mapping','price-breakdown','reprice-before-book',
 'availability-recheck','hold-create','reservation-preflight','idempotency-guard',
 'create-reservation','retrieve-reservation','ticketing-authority-check','air-ticket-issue',
 'voucher-generation','provider-notification-ingest','schedule-change-detection',
 'change-quote','air-exchange-reissue','hotel-hard-change','activity-amendment',
 'cancel-quote','cancel-reservation','refund-request','void-window',
 'customer-payment-orchestration','supplier-payment-routing','commission-reconciliation',
 'bsp-settlement-reconciliation','arc-settlement-reconciliation','reservation-audit-trail',
 'authority-matrix','provider-fallback','circuit-breaker','booking-reconciliation-retry'
])assert.ok(skills.some(x=>x.id===id),'Missing reservation skill '+id);

for(const id of [
 'reservation-provider-router','multi-source-reservation-search','reservation-content-normalization',
 'reservation-option-ranking','reservation-price-revalidation','reservation-availability-revalidation',
 'reservation-hold','reservation-preflight','reservation-idempotency','reservation-create',
 'reservation-retrieve','reservation-multicontent','reservation-ticketing','reservation-voucher',
 'reservation-notifications','reservation-event-ingest','reservation-schedule-change',
 'reservation-change-quote','reservation-air-exchange','reservation-hotel-modify',
 'reservation-activity-amend','reservation-ancillary-add','reservation-cancel-quote',
 'reservation-cancel','reservation-refund','reservation-void','reservation-payment',
 'reservation-supplier-payment','reservation-settlement','reservation-bsp-arc',
 'reservation-audit','reservation-authority-matrix','reservation-provider-health',
 'reservation-reconciliation'
])assert.ok(caps.some(x=>x.capability===id),'Missing reservation capability '+id);

for(const row of caps){
 assert.ok(row.native_target,'Every reservation capability must map to a Magnanimous native target.');
 assert.ok(row.boundary!==undefined,'Every reservation capability must state an external/native boundary.');
 assert.ok(Array.isArray(row.magnanimous_owned)&&row.magnanimous_owned.includes('reservation-record'),'Magnanimous must own reservation record state.');
 assert.equal(row.authorization_state,'not-assumed');
 assert.equal(row.research?.proprietary_implementation_copied,false);
 const realized=classifyCapabilityRealization(row);
 assert.ok(['native-ready','hybrid-ready'].includes(realized.status),row.capability+' must resolve to a proven Magnanimous execution surface.');
 if(row.risk==='high')assert.equal(row.initiative.requires_confirmation,true,row.capability+' must remain confirmation gated.');
}

assert.equal(MAGNANIMOUS_RESERVATION_POLICY.brain_owner,'Magnanimous AI');
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.reservation_record_owner,'Magnanimous AI');
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.workflow_owner,'Magnanimous AI');
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.provider_identity_owner,false);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.booking_authority_not_assumed,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.ticketing_authority_not_assumed,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.merchant_of_record_not_assumed,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.settlement_authority_not_assumed,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.live_price_must_be_revalidated,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.live_availability_must_be_revalidated,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.idempotent_booking_required,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.duplicate_booking_prevention,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.private_partner_lists_not_invented,true);
assert.equal(MAGNANIMOUS_RESERVATION_POLICY.proprietary_provider_code_copied,false);

for(const key of [
 'reservation_request','reservation_option','reservation_hold','reservation_record','traveler_profile_ref',
 'reservation_payment','fulfillment_document','reservation_service_event','reservation_notification','reservation_settlement'
])assert.ok(Array.isArray(RESERVATION_NORMALIZED_OBJECTS[key])&&RESERVATION_NORMALIZED_OBJECTS[key].length>=5,'Missing reservation object '+key);

for(const id of ['verteil','travelfusion','tbo','hahnair'])assert.ok(RESERVATION_CONNECTION_READINESS[id],'Missing reservation readiness map for '+id);

const b2bIds=new Set(b2b.map(x=>x.id));
const fullIds=new Set(full.map(x=>x.id));
for(const row of caps){
 assert.ok(b2bIds.has(row.id),'B2B brain must include reservation capability '+row.id);
 assert.ok(fullIds.has(row.id),'Full brain must include reservation capability '+row.id);
}
assert.ok(getB2BSummary().reservation_capability_contracts>=caps.length);

const runtime=fs.readFileSync('worker/src/magnanimous-b2b-runtime.js','utf8');
for(const route of [
 "'/api/b2b/reservations'","'/api/b2b/reservations/providers'","'/api/b2b/reservations/skills'",
 "'/api/b2b/reservations/workflow'","'/api/b2b/reservations/preflight'"
])assert.ok(runtime.includes(route),'Missing reservation API route '+route);
assert.ok(runtime.includes('live provider handshake/authority verification'));
assert.ok(runtime.includes('generate an idempotency key and duplicate-booking guard'));
assert.ok(runtime.includes('retrieve/reconcile provider state before retrying any ambiguous response'));

const creds=fs.readFileSync('worker/src/platform-credentials.js','utf8');
for(const key of ['VERTEIL_API_TOKEN','TRAVELFUSION_API_TOKEN','TBO_API_KEY','HAHNAIR_PARTNER_REFERENCE'])
 assert.ok(creds.includes(key),'Credential vault must support '+key);

const env=fs.readFileSync('worker/src/provider-runtime-env.js','utf8');
for(const key of ['VERTEIL_API_TOKEN','TRAVELFUSION_API_TOKEN','TBO_API_KEY','HAHNAIR_PARTNER_REFERENCE'])
 assert.ok(env.includes(key),'Runtime env must expose '+key);

const reservationPage=fs.readFileSync('frontend/app/reservations/page.tsx','utf8');
assert.ok(reservationPage.includes('MAGNANIMOUS RESERVATION SERVICE'));
assert.ok(reservationPage.includes('TRANSACTION PREFLIGHT'));
assert.ok(reservationPage.includes('PROVIDER CONNECTION GRAPH'));
assert.ok(reservationPage.includes('PROVIDER TOOL CONTRACTS'));
assert.ok(reservationPage.includes('Credentials do not equal authority'));

const page=fs.readFileSync('frontend/app/b2b/page.tsx','utf8');
assert.ok(page.includes('MAGNANIMOUS RESERVATION SERVICE'));
assert.ok(page.includes('Provider dependency graph'));
assert.ok(page.includes('RESERVATION SKILL LIBRARY'));

const agents=fs.readFileSync('worker/src/agent-mesh-runtime.js','utf8');
assert.ok(agents.includes("'reserveops','ReserveOps','Reservation Service Orchestrator'"));
assert.ok(agents.includes("'reserve','Reserve','Reservation Orchestrator'"));
assert.ok(agents.includes("'serviceops','ServiceOps','Post-Booking Servicing'"));
assert.ok(agents.includes("{id:'reservations',name:'Reservation Service',href:'/reservations'"));

console.log('Magnanimous reservation service lock PASS',summary);
