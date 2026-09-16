# Magnanimous Telecom regulated-network path

Magnanimous Telecom keeps the public identity, AI command layer, customer data model, routing logic and provider abstraction. Outside carriers, MVNOs, numbering sources, emergency-service providers and cloud hosts are replaceable dependencies until Magnanimous obtains direct authority for a function.

This document is an operational readiness map, not a legal determination.

## First wholesale bridge: Telnyx

The first adapter is designed around Telnyx because its current platform can cover multiple gaps behind one replaceable integration:

- local/toll-free/global phone-number search and ordering;
- SIP/PSTN trunking;
- number porting;
- emergency/E911 provisioning;
- STIR/SHAKEN-related caller identity features;
- physical SIM ordering;
- eSIM purchasing/provisioning;
- mobile voice/SMS capabilities on supported SIM/eSIM products.

Magnanimous stores only provider references and runtime secret-binding names. `TELNYX_API_KEY` stays in encrypted runtime secret storage.

Supported owner API foundations:

- `POST /api/telecom/network/telnyx/number-search` — read-only number availability search.
- `POST /api/telecom/network/telnyx/number-order` — paid, locked behind `TELECOM_PURCHASE_ACTIONS_ENABLED=true` plus `confirm_purchase=true`.
- `POST /api/telecom/network/telnyx/sim-order-preview` — previews a physical SIM order.
- `POST /api/telecom/network/telnyx/esim-purchase` — paid, double-confirmed purchase path.
- `POST /api/telecom/network/telnyx/emergency-address` — regulated action, locked behind `TELECOM_REGULATED_ACTIONS_ENABLED=true` plus `confirm_regulated_action=true`.

Provider documentation used for the adapter contract:

- https://developers.telnyx.com/docs/numbers/phone-numbers/number-search/
- https://developers.telnyx.com/api-reference/phone-number-orders/create-a-number-order
- https://developers.telnyx.com/api-reference/sim-card-orders/preview-sim-card-orders
- https://developers.telnyx.com/api-reference/sim-cards/purchase-esims
- https://developers.telnyx.com/docs/voice/sip-trunking/emergency-calling-dynamic-e911

## Mobile/MVNO alternative: Gigs

Gigs is retained as a second mobile-provider adapter path for consumer wireless plans, pSIM/eSIM inventory and subscription orchestration. The first Magnanimous integration is read-only SIM visibility (`GET /api/telecom/network/gigs/sims`) until a Gigs account/project and commercial terms are in place.

Provider documentation:

- https://developers.gigs.com/
- https://developers.gigs.com/api/latest/core/sims

## United States readiness path

The owner dashboard tracks these independently:

1. FCC Registration Number (FRN).
2. FCC Form 499 registration/reporting when applicable.
3. Robocall Mitigation Database filing for a covered voice service provider/intermediate provider. FCC 2026 guidance expressly includes VoIP resellers and MVNOs that meet the voice-service definition.
4. 911/E911 capability, registered/dispatchable location handling and customer notices before interconnected VoIP is treated as an emergency-capable primary phone replacement.
5. Direct access to NANP numbers if Magnanimous later chooses to obtain numbers directly rather than through an upstream holder.
6. State-specific authority/tax/consumer-protection review for the jurisdictions actually served.

Until those items are verified, Magnanimous may use an authorized wholesale carrier for numbering/PSTN/E911 while retaining its own brand, servers and customer-facing service.

## Philippines readiness path

The owner dashboard separately tracks:

1. NTC VoIP/VAS provider or reseller registration before offering compensated public VoIP service.
2. Facilities/network lease with an authorized network provider when required.
3. Interconnection agreement with authorized access/facilities providers when required.
4. VNO/MVNO host-network agreement for mobile service rather than pretending Magnanimous owns spectrum it has not been assigned.
5. SIM Registration Act operational compliance for subscriber SIM/eSIM service.
6. Congressional franchise + NTC CPCN for the later facilities-based public-telecommunications stage.

The lighter VoIP/VAS/reseller stage is deliberately separate from the facilities-based carrier stage. Magnanimous must never mark the franchise/CPCN gate as approved merely because the software and wholesale integrations work.

Official references:

- NTC MC 05-08-2005 — Voice over Internet Protocol.
- NTC MO 3-11-2005 — Guidelines for Registration of VoIP Service Providers and Resellers.
- NTC Region VII telecommunications FAQ — CPCN/franchise requirements and foreign-ownership limit.
- Republic Act No. 7925 — public telecommunications entity/franchise framework.
- NTC MC 03-06-2019 — Mobile Number Portability, including hosted VNO handling.

## Provider-search result

The ChatGPT plugin directory was searched for core telecom providers/capabilities including Telnyx, Twilio, Bandwidth, Plivo, Sinch, Vonage, DIDWW, 1GLOBAL, Gigs and Soracom. No direct installed/available provider plugin matching those core provisioning systems was returned. Therefore Magnanimous uses direct, documented provider adapters rather than depending on a ChatGPT plugin.

## Identity rule

Customer-facing surfaces say **Magnanimous Telecom** and **Magnanimous AI**. Provider names are only visible in owner/admin operational screens where knowing the underlying contract is necessary.
