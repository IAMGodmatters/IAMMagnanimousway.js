# Magnanimous B2B Wholesale & Travel Network — 2026-09-21

## Goal

Expand Magnanimous AI into a provider-neutral B2B operating brain for wholesale commerce, supplier sourcing, procurement, reseller networks, corporate travel, flights, hotels, tours, sub-agents and post-booking servicing.

Magnanimous owns identity, memory, policy, normalized workflows, verification, CRM state, learning and audit evidence. Outside marketplaces, GDSs, NDC aggregators, airlines, hotels, wholesalers, ERPs and payment rails remain replaceable authorized connections.

## Useful material absorbed from the owner-provided B2B notes

Retained:
- unified B2B portal/API architecture;
- travel supplier aggregation;
- B2B and B2B2C/sub-agent portal patterns;
- runtime markup/commission controls;
- corporate travel policy + expense integration;
- B2B dropshipping;
- private label / OEM / ODM sourcing;
- kitting and bundling;
- wholesale product/catalog distribution.

Not promoted as facts without stronger evidence:
- broad “up to 25% travel savings” claims;
- fixed “15 day” white-label launch promises;
- category CAGR or margin claims;
- claims that a hotel API aggregator also includes hundreds of airlines unless the provider itself confirms that scope.

## Current verified public references

### B2B commerce
Shopify documents company accounts, company locations, buyer permissions, catalogs, customer-specific pricing, volume pricing, quantity rules, payment terms, PO numbers, draft orders, reorders, returns, APIs and ERP integrations:
- https://help.shopify.com/en/manual/b2b
- https://help.shopify.com/en/manual/b2b/getting-started/features

### Travel portals and aggregation
ZentrumHub currently advertises one hotel API across 100+ suppliers and 900,000+ hotels, plus B2B/B2C portal and supplier-connect capability:
- https://www.zentrumhub.com/

Travelopro publicly describes B2B travel portals with third-party flight and hotel API integration, tours, packages, visa workflows, contracted inventory and agent-specific markup/reporting:
- https://www.travelopro.com/b2b-booking-platform.php

### Air distribution
Amadeus Self-Service documents the common booking flow:
Flight Offers Search -> Flight Offers Price -> Flight Create Orders -> Flight Order Management.
It also explicitly states that IATA/ARC accreditation is required for direct ticket issuance in the Enterprise framework; Self-Service users can work through a consolidator:
- https://developers.amadeus.com/
- https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/

Travelport Flights APIs provide REST/JSON search, booking and reservation-management workflows with OAuth:
- https://developer.travelport.com/docs/flights
- https://developer.travelport.com/docs/flights/general/flights-api-endpoints

Duffel documents flight offer search, order creation, changes, cancellations, ancillaries, payments and markup:
- https://duffel.com/docs
- https://duffel.com/docs/api/orders
- https://duffel.com/flights/book

Sabre public documentation supports offers/orders, NDC shopping, reshop and voluntary change workflows:
- https://developer.sabre.com/

### Hotels
HBX / Hotelbeds API Suite exposes hotel content, availability, booking and booking management, with activities/transfers/car rental across the API suite:
- https://developer.hotelbeds.com/
- https://developer.hotelbeds.com/documentation/hotels/

Expedia Rapid provides lodging API workflows including shopping, booking, authentication and payments:
- https://developers.expediagroup.com/rapid

### Tours and activities
Viator Partner API supports content, search, availability, pricing, booking, holds, cancellations and amendments depending on partner access level:
- https://docs.viator.com/partner-api/

GetYourGuide Partner API provides marketplace content and, depending on partner access, live availability and booking:
- https://api.getyourguide.com/

### Corporate travel
Brex publicly describes business travel booking, policy/budget enforcement, cards, receipts, reimbursement and expense reconciliation:
- https://www.brex.com/product/travel-expense-management
- https://www.brex.com/solutions/mid-size-companies

## Magnanimous normalized B2B objects

The B2B runtime defines provider-neutral objects for:
- company;
- supplier;
- product;
- quote;
- purchase order;
- travel offer;
- travel order;
- settlement.

These objects are intentionally independent of provider-specific schemas.

## Wholesale capability families

The full-brain manifest now includes:
- company accounts / buyer roles / locations;
- customer-specific catalogs and price lists;
- volume pricing and quantity rules;
- RFQ, quote and CPQ;
- purchase orders;
- net terms, deposits and credit controls;
- B2B invoicing and statements;
- quick order / bulk order / reorders;
- returns and RMA;
- supplier onboarding and KYB evidence;
- supplier/manufacturer/distributor discovery;
- sourcing RFQs and bid comparison;
- private label / OEM / ODM;
- dropshipping;
- kitting and bundling;
- inventory normalization;
- PIM/catalog normalization;
- EDI-style document normalization;
- ERP/procurement integration;
- freight / 3PL / tracking;
- customs / duties / landed cost research;
- reseller / dealer / distributor programs;
- B2B prospecting and enrichment;
- ABM and outbound;
- contracts and renewals;
- commissions and rebates.

## Travel capability families

The full-brain manifest now includes:
- travel agency, corporate and sub-agent accounts;
- supplier/content registry;
- unified supplier search normalization;
- GDS/NDC/aggregator flight search;
- flight repricing and fare-rule capture;
- booking/order creation;
- ticketing authority boundary;
- seats, bags and ancillaries;
- changes, re-shop and exchanges;
- cancellation/refund;
- disruption/schedule change servicing;
- hotel search/book;
- hotel modify/cancel;
- car and transfer booking;
- tours and activities;
- package assembly;
- markup, commission and service-fee policy;
- agency/sub-agent wallet and credit ledger;
- corporate travel policy;
- corporate travel + expense;
- traveler profiles and loyalty/preferences;
- group travel;
- traveler notifications;
- white-label B2B/B2C/sub-agent travel portal;
- travel reporting;
- post-booking support queues.

## Credential vault support

The owner credential vault now accepts optional connection material for:
- Amadeus;
- Sabre;
- Travelport;
- Duffel;
- HBX / Hotelbeds;
- Expedia Rapid;
- Viator;
- GetYourGuide;
- ZentrumHub;
- Travelopro;
- Brex;
- Navan;
- NetSuite.

Credentials are never assumed to exist. The B2B dashboard reports only credential presence and explicitly does **not** treat that as commercial approval, live connection verification, ticketing authority, merchant-of-record status or accreditation.

## Safety and authority boundaries

Magnanimous may research, compare and plan natively.

The following remain consequential and require a real authorized rail plus confirmation/policy approval:
- placing supplier purchase orders;
- charging or settling payments;
- booking travel;
- issuing or voiding tickets;
- changing/cancelling bookings;
- requesting refunds;
- using traveler identity/profile data;
- supplier bank/credit actions;
- external messages and partner-account mutations.

IATA, ARC, BSP, merchant-of-record and supplier-accreditation status are never inferred from code or credentials.

## User interface

New workspace:
- `/b2b`

It shows:
- B2B capability counts;
- travel capability counts;
- connection templates;
- credential readiness;
- provider families;
- wholesale workflow;
- travel workflow;
- an owner-authenticated B2B plan generator.

## Specialist agents

Agent Mesh adds:
- **Wholesale** — B2B Wholesale Strategist
- **TravelPro** — B2B Travel Distribution

## Verification

`qa/scripts/magnanimous-b2b-network-lock.mjs` verifies:
- broad wholesale and travel capability coverage;
- required supplier/travel connection templates;
- every B2B capability maps to an existing Magnanimous execution surface;
- high-risk actions remain confirmation-gated;
- B2B capabilities are included in the full brain;
- Magnanimous remains brain/memory/workflow owner;
- travel accreditation and merchant authority are not assumed;
- normalized B2B objects and wholesale/travel workflows exist;
- credential-vault fields exist without exposing secrets;
- runtime/API, UI and specialist agents are wired.

The native-first CI runs the B2B lock on every branch and pull request.
