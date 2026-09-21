# Magnanimous Reservation Service Fabric — 2026-09-21

## Purpose

Magnanimous AI now models reservation distribution as a first-party orchestration layer rather than a single vendor integration.

The core rule is:

**supplier/content source != aggregator/GDS/NDC rail != booking processor != ticket/voucher issuer != customer-payment rail != supplier-settlement authority != post-booking servicing authority.**

Magnanimous owns the canonical reservation record, provider routing, policy, memory, audit evidence, verification and servicing history. External providers remain replaceable inventory/execution rails.

## Reservation lifecycle

The Magnanimous reservation lifecycle is:

1. discover inventory;
2. normalize provider-specific content;
3. rank and explain options;
4. revalidate price and availability;
5. hold inventory when supported;
6. verify approval, payment and provider authority;
7. create the reservation/order;
8. issue ticket/voucher/fulfillment document only when the rail grants authority;
9. retrieve and reconcile confirmation;
10. deliver itinerary/documents;
11. monitor provider changes;
12. perform post-booking servicing;
13. settle/reconcile finances;
14. learn from the result without absorbing provider secrets or proprietary implementation.

## Provider dependency graph

The reservation graph records both upstream and downstream roles.

### Air

**Amadeus**
- inventory/search;
- price/reprice;
- flight order creation and management;
- hotel APIs where enabled;
- agency/supplier rights still control transactional authority.

**Sabre**
- GDS air content;
- NDC content;
- offers/orders;
- ticketing workflows;
- hotel/car content;
- post-booking servicing.

**Travelport**
- GDS, NDC and low-cost-carrier content;
- flight search, booking and reservation management;
- hotel/car content;
- agency PCC/account authority remains external.

**Duffel**
- airline offer aggregation;
- order creation;
- managed air content;
- ancillaries;
- changes/cancellations;
- payment/balance options depending account setup.

**Hahnair**
- B2B airline distribution;
- validating-carrier/ticketing role through HR-169 where eligible;
- partner-airline content distributed through agency/GDS channels;
- agency/commercial eligibility remains external.

**Verteil**
- NDC airline aggregation;
- shopping;
- booking/ticketing workflows;
- ancillaries;
- post-booking servicing;
- commercial and agency rights remain external.

**Travelfusion**
- direct-connect airline aggregation;
- low-cost and scheduled airline content;
- NDC/direct APIs;
- booking and supported servicing.

**Direct airline NDC/API**
- first-party airline inventory and Offer/Order workflow;
- requires a direct commercial/API agreement with each airline.

**Host agency / consolidator**
- ticketing-authority rail for a sub-agent where contracted;
- private/net fares;
- commission/fulfillment;
- servicing and settlement governed by the host/consolidator agreement.

**IATA BSP**
- airline/agency reporting, remittance and settlement;
- requires the applicable IATA accreditation and BSP participation.

**ARC**
- U.S. agency accreditation/status/ticketing-authority validation and settlement;
- requires ARC participation/accreditation.

### Accommodation

**Expedia Rapid**
- lodging content/shopping;
- booking;
- payment-token/payment models depending product;
- post-booking servicing;
- partner approval required.

**HBX / Hotelbeds**
- hotel bedbank content;
- availability/booking;
- activities;
- transfers;
- supplier/client commercial terms remain external.

**Travelgate Hotel-X**
- buyer/seller hotel connectivity layer;
- supplier search;
- quote;
- booking;
- reservation management;
- buyer credentials and seller access codes/contracts required.

**RateHawk**
- direct accommodation inventory plus aggregated supplier content;
- real-time search/rates;
- booking;
- partner credit/card/commercial terms.

**TBO**
- accommodation aggregation;
- booking;
- credit/card/VCC options subject to partner setup.

**ZentrumHub**
- hotel supplier aggregation;
- B2B/B2C booking engine/portal technology;
- underlying supplier and commercial authority remains external.

### Tours / activities

**Viator Partner API**
- activity content;
- availability/pricing;
- holds;
- booking;
- cancellation/amendment depending partner access level.

**GetYourGuide Partner API**
- activity content;
- availability and booking where partner approval grants the required access.

### Corporate / payments

**Stripe**
- customer payment authorization/capture/refund rail;
- does not become travel inventory or ticketing authority.

**Brex Travel & Expense**
- corporate policy/card/expense context through an authorized corporate account.

**Navan**
- corporate travel/policy/expense context through an authorized account.

## Provider graph behavior

Each provider node records:
- product families;
- connection roles;
- lifecycle stages;
- publicly documented upstream content/supplier categories;
- downstream buyer/seller roles;
- settlement route;
- authority required;
- official documentation references.

Where a provider publicly describes a supplier network, the graph records that high-level relationship.

Where a provider's commercial partner list is private, Magnanimous records only the role/boundary and **does not invent individual partners**.

## First-party reservation objects

Magnanimous now owns normalized objects for:
- reservation request;
- reservation option;
- reservation hold;
- reservation record;
- traveler-profile reference;
- reservation payment;
- fulfillment document;
- reservation service event;
- reservation notification;
- reservation settlement.

Provider-specific PNRs, orders, itinerary IDs, ticket numbers, voucher IDs and other locators are stored as references to the Magnanimous reservation record rather than becoming the primary system identity.

## Reservation skills

The new skill library covers:
- inventory routing;
- multi-source search;
- content normalization;
- duplicate suppression;
- airport/city/property/room/rate/activity/ground mapping;
- supplier ranking;
- corporate/agency policy ranking;
- price breakdown;
- currency normalization;
- markup/service fees;
- commission estimates;
- fare/rate-rule interpretation;
- cancellation-policy normalization;
- repricing;
- availability recheck;
- expiry monitoring;
- holds;
- traveler/guest validation;
- provider booking questions;
- reservation preflight;
- idempotency/duplicate booking protection;
- booking creation and retrieval;
- multi-content itineraries;
- on-request inventory;
- provider locator capture;
- ticketing-authority verification;
- ticket/EMD/voucher fulfillment;
- itinerary delivery;
- provider event ingestion;
- schedule-change detection;
- provider queues;
- changes/amendments;
- air re-shop/exchange/reissue;
- hotel changes;
- activity amendments;
- ancillary additions;
- cancellation quotes;
- cancellation;
- refund;
- void;
- disruption/re-accommodation;
- no-show handling;
- customer payment orchestration;
- supplier payment/VCC routing;
- payment-tokenization boundaries;
- payment-failure recovery;
- refund reconciliation;
- commission reconciliation;
- BSP reconciliation;
- ARC reconciliation;
- supplier-statement reconciliation;
- ADM/ACM;
- chargeback evidence;
- reservation audit;
- authority matrices;
- provider fallback;
- circuit breakers;
- rate-limit handling;
- ambiguous-result reconciliation;
- reservation observability;
- supplier health scoring.

## Safety and reliability invariants

Magnanimous must:
- reprice/recheck before booking;
- preserve offer/rate expiry;
- require explicit authority before booking/ticket/refund/settlement;
- use idempotency/duplicate-booking protection;
- reconcile provider state after a timeout/ambiguous result before retry;
- keep existing bookings on the original provider for servicing;
- preserve provider references and financial deltas;
- distinguish expected commission from settled commission;
- never treat an API key as proof of ticketing/accreditation/merchant status;
- never store raw payment-card details merely to simplify a reservation workflow;
- never fabricate private supplier/airline/hotel partner relationships.

## New APIs

Authenticated B2B routes now expose:
- `GET /api/b2b/reservations`
- `GET /api/b2b/reservations/providers`
- `GET /api/b2b/reservations/skills`
- `GET /api/b2b/reservations/workflow`
- `POST /api/b2b/reservations/preflight`

The preflight route is intentionally non-transactional. It identifies missing credentials/authority and the required verification sequence. It does not fake a live booking connection.

## Credential readiness

The encrypted credential vault/runtime now supports optional fields for:
- Amadeus;
- Sabre;
- Travelport;
- Duffel;
- Expedia Rapid;
- HBX/Hotelbeds;
- Travelgate;
- RateHawk;
- ZentrumHub;
- Viator;
- GetYourGuide;
- Verteil;
- Travelfusion;
- TBO;
- Hahnair partner reference;
- Stripe;
- existing corporate travel/agency identifiers.

Credential presence still does not equal live authority.

## Specialist agent

Agent Mesh now includes:

**ReserveOps — Reservation Service Orchestrator**

ReserveOps specializes in provider-aware search, repricing, holds, booking, ticket/voucher fulfillment, servicing, refunds, settlement, duplicate-booking prevention and reservation reconciliation.

## Regression protection

`qa/scripts/magnanimous-reservation-service-lock.mjs` validates:
- reservation provider graph coverage;
- reservation skill breadth;
- lifecycle completeness;
- native/hybrid realization of every reservation capability;
- ownership of the canonical reservation record;
- reprice/reavailability requirements;
- idempotency and duplicate-booking protection;
- authority boundaries;
- normalized reservation objects;
- credential-vault readiness;
- API routes;
- UI presence;
- ReserveOps specialist;
- inclusion of reservation contracts in the B2B and full-brain manifests.

The Native-First CI workflow runs this lock on every relevant branch and pull request.
