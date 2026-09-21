# Magnanimous Universal B2B Trade & Travel Fabric — 2026-09-21

## Objective

Expand the existing Magnanimous B2B network from a curated supplier/travel catalog into a durable, provider-neutral B2B operating fabric.

Magnanimous AI remains the owner of:
- identity;
- memory;
- planning;
- policy;
- workflow orchestration;
- provider/tool selection;
- canonical data normalization;
- verification;
- audit evidence;
- reusable learning.

External businesses, marketplaces, procurement networks, carriers, airlines, GDSs, bedbanks, banks, payment providers, accrediting bodies and logistics companies remain replaceable authorized rails.

## Why a universal fabric is necessary

There is no finite vendor list that can represent "every B2B connection." Businesses connect through many standards and transport mechanisms. A durable B2B platform therefore needs protocol-level interoperability in addition to named vendor adapters.

Magnanimous now models:
- REST / OpenAPI;
- GraphQL;
- SOAP / XML;
- signed webhooks;
- MCP;
- OAuth 2.0 / OIDC;
- API key / HMAC;
- cXML;
- ANSI ASC X12;
- UN/EDIFACT;
- Peppol BIS / UBL through accredited service providers;
- AS2 / AS4 style secure messaging;
- SFTP;
- CSV / XLSX;
- JSON / XML batch feeds;
- email/document intake;
- PunchOut / Open Buy;
- event/queue integration.

This allows a new supplier, buyer, airline, carrier or partner to be connected to Magnanimous canonical objects without changing the public Magnanimous identity or business logic.

## Verified procurement and electronic trade patterns

### SAP Business Network
SAP Business Network supports buyer/supplier collaboration and procurement document exchange. SAP documents bidirectional cXML and EDI flows, including conversion between cXML and ANSI X12 or UN/EDIFACT for purchase orders, acknowledgements, confirmations and invoices.

Official references:
- https://www.sap.com/products/spend-management/ariba-network.html
- https://help.sap.com/docs/business-network-for-trading-partners/introduction-to-business-network/how-suppliers-connect-to-sap-business-network

### Coupa
Coupa exposes supplier APIs and supplier-portal integrations. Its Open Buy API is explicitly organized around authentication, search, item detail and checkout, making it a useful provider-neutral pattern for real-time B2B catalog integration.

Official references:
- https://compass.coupa.com/en-us/products/product-documentation/integration-technical-documentation/coupa-supplier-portal-rest-api
- https://compass.coupa.com/en-us/products/product-documentation/supplier-resources/for-suppliers/integration-resources/open-buy-api-reference

### Peppol
Peppol standardizes eOrders, eInvoices and other procurement documents and uses a four-corner interoperability model. Organizations connect through a Peppol-accredited Service Provider; Magnanimous therefore treats Peppol as an open interoperability standard plus an external service-provider boundary, not as a proprietary platform dependency.

Official references:
- https://peppol.org/about/
- https://peppol.org/learn-more/peppol-interoperability-framework/

### UN/EDIFACT / UN/CEFACT
UN/EDIFACT defines internationally agreed EDI rules for administration, commerce and transport. UN/CEFACT also maintains trade data models and UN/LOCODE resources useful for cross-border business and logistics normalization.

Official references:
- https://unece.org/trade/uncefact/unedifact-introduction-and-rules
- https://unece.org/trade/uncefact/mainstandards

### GS1
GS1 provides identifiers and supply-chain standards including GTIN, GLN, EDI, GDSN and EPCIS. Magnanimous uses these concepts as canonical identifiers/traceability inputs where licensed or authorized.

Official reference:
- https://www.gs1.org/standards/gln-data-model-solution-standard/current-standard

## Verified wholesale/supplier opportunity networks

### Faire
Faire is a B2B wholesale marketplace connecting brands and retailers. Shopify documents a Faire integration that can synchronize products, inventory and orders between Faire and Shopify.

References:
- https://www.faire.com/how-faire-works
- https://help.shopify.com/en/manual/online-sales-channels/marketplaces/faire

### Thomasnet
Thomasnet provides industrial supplier discovery, filtering, shortlists, RFI/RFQ workflows and manufacturer/distributor research across a large North American supplier network.

References:
- https://www.thomasnet.com/
- https://sourcing.thomasnet.com/

### Global Sources
Global Sources remains a sourcing/wholesale marketplace and trade-show ecosystem for supplier/manufacturer discovery. Magnanimous treats marketplace actions as external-account actions and does not imply an API connection unless one is actually contracted.

Reference:
- https://www.globalsources.com/

## Verified shipping and logistics API opportunities

### UPS
UPS exposes APIs for rating, shipping, returns, tracking, time in transit, address validation, landed cost and paperless/international shipping. UPS uses OAuth 2.0 Client ID/Secret for current integrations.

References:
- https://developer.ups.com/
- https://developer.ups.com/get-started

### FedEx
FedEx APIs use OAuth 2.0 and project API Key/Secret credentials. The platform supports credential slots for authorized FedEx integrations only.

Reference:
- https://developer.fedex.com/api/en-jm/catalog/authorization/v1/docs.html

### DHL
DHL maintains a central developer portal for shipping, tracking and other logistics APIs. Authentication/onboarding varies by API product, so Magnanimous keeps DHL credentials optional and provider-specific.

Reference:
- https://developer.dhl.com/

### Maersk
Maersk provides developer APIs including commercial ocean schedules and uses Consumer Keys; some products also use OAuth 2.0 client credentials and require customer/partner approval.

References:
- https://developer.maersk.com/
- https://developer.maersk.com/support/faqs

## Airline retailing and wholesale travel

### IATA NDC
IATA NDC is an open, XML-based Offer/Order data exchange standard for airline distribution. IATA states it is open for third parties, intermediaries, IT providers and non-IATA members to implement.

Reference:
- https://www.iata.org/en/programs/airline-distribution/retailing/ndc/

### IATA ONE Order
ONE Order defines a single airline retail Order intended to streamline reservation, fulfilment, delivery and accounting and reduce reliance on separate PNR/e-ticket/EMD artifacts.

Reference:
- https://www.iata.org/en/programs/airline-distribution/retailing/one-order/

### Modern Offers & Orders
IATA's current airline-retailing direction combines NDC, ONE Order and related standards toward Offers & Orders, including dynamic offer creation, fulfilment and order-based settlement.

Reference:
- https://www.iata.org/en/programs/airline-distribution/retailing/

### TIDS is identification, not ticketing authority
IATA TIDS is a free travel seller identification program (outside the USA program structure) used by suppliers to identify non-accredited travel intermediaries. It can support supplier recognition and commissions but does not create BSP ticketing authority.

References:
- https://www.iata.org/tids/
- https://www.iata.org/en/services/travel-agency-program/tids/faq/

### IATA accreditation and BSP
IATA accreditation can provide airline recognition and access to the BSP settlement framework. IATA states BSP access requires IATA accreditation. Magnanimous therefore gates BSP/ticketing actions behind verified external accreditation/authority.

References:
- https://www.iata.org/en/services/travel-agency-program/accreditation-travel
- https://www.iata.org/en/services/finance/bsp/
- https://portal.iata.org/faq/articles/en_US/FAQ/Which-Travel-Agents-have-access-to-BSP-for-NDC-services

### ARC in the United States
ARC provides U.S. agency participation/accreditation and real-time status/ticketing-authority validation through ARC Check. In January 2026 ARC launched an orders-based reporting and settlement system alongside its ticket-based systems.

References:
- https://www2.arccorp.com/arccheck/
- https://www2.arccorp.com/about-us/newsroom/2026-news-releases/arc-launches-orders-based-reporting-and-settlement-system-to-advance-airline-retailing/

## Additional verified travel distribution networks

### Travelgate
Travelgate provides buyer/seller APIs for hotel distribution. Its Hotel-X buyer API provides real-time supplier search, quote, booking and reservation management.

References:
- https://docs.travelgate.com/
- https://travelgate.com/apis

### RateHawk
RateHawk provides a B2B accommodation API with real-time availability and accommodation content; its onboarding publicly describes registration, API key issuance and certification.

Reference:
- https://www.ratehawk.com/journey/api/

### TBO
TBO markets B2B APIs to agents and enterprises with real-time accommodation inventory, availability, pricing and booking.

Reference:
- https://www.tbo.com/tbo-api

## New opportunity families

Magnanimous now explicitly models at least these B2B opportunity types:
- wholesale distribution;
- private label/OEM/ODM;
- contract manufacturing;
- dropshipping;
- wholesale marketplace brand selling;
- wholesale marketplace buying;
- enterprise procurement supplier;
- RFP/RFI/tender;
- industrial/MRO sourcing;
- foodservice/hospitality supply;
- corporate merchandise/gifting;
- reseller/dealer/channel programs;
- affiliate/referral partnerships;
- franchise/licensing;
- embedded API/OEM/white-label technology;
- managed services/BPO;
- import/export;
- logistics/3PL;
- trade finance;
- corporate travel/TMC;
- retail/leisure travel agency;
- sub-agent/consolidator/host agency;
- hotel/bedbank distribution;
- destination management;
- MICE/group travel;
- cruise/rail/ground distribution;
- travel-tech reseller;
- travel support BPO;
- supplier data/PIM services;
- procure-to-pay services.

## Reusable B2B skills

The Magnanimous B2B skill catalog now covers sourcing, supplier qualification, RFQ/RFI authoring, quote comparison, negotiation, samples/pilots, private label, MOQ analysis, wholesale pricing, unit economics, payment terms, commissions/rebates, trade-finance readiness, company accounts, catalog/PIM, bulk ordering, RMA, marketplaces, reseller/channel programs, prospecting, ABM, tenders, proposals/CPQ, contracts, procure-to-pay, three-way match, supplier onboarding/scorecards, PunchOut/Open Buy, cXML, X12, EDIFACT, Peppol, API/webhook/file integrations, GS1, inventory/replenishment, forecasting, warehouse/3PL, parcel shipping, freight, ocean schedules, landed cost, trade documents and shipment exceptions.

Travel skills include agency operating models, supplier selection, accreditation readiness, NDC, ONE Order, fare analysis, ancillaries, ticketing authority, exchanges, refunds/voids, disruptions, BSP/ARC reconciliation, ADM/ACM, hotel/bedbank routing, hotel contracting, DMC, tours, MICE/groups, corporate policy, traveler profiles, duty of care, mid/back-office reconciliation, markup/commission, support queues and white-label travel.

## Credential readiness added

The encrypted owner credential vault now has optional slots for:
- Coupa OAuth;
- Peppol service-provider access;
- UPS OAuth;
- FedEx OAuth/project credentials;
- DHL API access;
- Maersk Consumer Key/Secret;
- Travelgate;
- RateHawk;
- non-secret IATA TIDS/IATA/ARC identifiers after actual external approval.

Presence of an identifier or credential is never treated as proof of live authority.

## Specialist agents

Agent Mesh now includes:
- Wholesale — B2B Wholesale Strategist;
- TravelPro — B2B Travel Distribution;
- Procura — Procurement & Supplier Network;
- Freight — B2B Logistics Strategist;
- TradeDesk — Global Trade & EDI;
- AirRetail — Airline Retailing Specialist;
- TravelOps — Travel Agency Operations.

## Consequential boundaries

Magnanimous may research, normalize, compare, plan, draft and prepare evidence automatically within existing permission rules.

The following require explicit real-world authority and appropriate confirmation:
- supplier PO submission;
- account mutation;
- payment/credit/finance transactions;
- shipment creation/labels/pickups where charges may occur;
- airline/hotel/tour/car booking;
- ticket issuance/void;
- exchange/reissue;
- cancellation/refund;
- BSP/ARC settlement;
- external partner/tender submission;
- traveler-sensitive data actions.

## Verification target

The B2B CI lock now requires:
- 90+ B2B capability contracts;
- 45+ named/standard connection templates;
- 18+ protocol adapters;
- 8+ standards;
- 30+ opportunity families;
- 75+ reusable B2B skills;
- execution-surface realization for every capability;
- preserved high-risk confirmation gates;
- expanded credential-vault coverage;
- B2B UI routes and specialist-agent wiring.
