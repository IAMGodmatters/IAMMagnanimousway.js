# Magnanimous Carrier Roadmap

## Objective

Build **Magnanimous Carrier** into a real communications provider while preserving a clean separation between:

1. **Software/provider control plane** — Magnanimous owns customers, identity, routing policy, call records, billing logic, number assignment, fraud controls, support, and white-label/reseller operations.
2. **Upstream transport stage** — licensed carriers/SIP providers are replaceable PSTN execution adapters while Magnanimous builds regulatory and network capability.
3. **Interconnected VoIP provider stage** — Magnanimous becomes the service provider of record where lawfully registered, while still using wholesale interconnects.
4. **Direct-numbering stage** — Magnanimous obtains authority to acquire numbering resources directly where permitted.
5. **Direct-interconnect carrier stage** — Magnanimous operates its own switching/SBC/media/network infrastructure and signs interconnection/termination/origination agreements rather than depending on retail CPaaS providers.

Magnanimous must never claim a regulated authorization, numbering right, carrier code, emergency-service capability, or interconnect that has not actually been granted and activated.

## Software architecture already implemented

`worker/src/magnanimous-carrier-core.js` provides the carrier control plane:

- carrier operating stage and jurisdiction profile
- regulatory/compliance readiness state
- emergency-service and caller-ID-authentication readiness state
- interconnect inventory and priority
- telephone-number inventory and tenant assignment
- longest-prefix / priority route planning
- call-detail records (CDRs)
- wholesale cost and customer-charge fields
- audit records
- portability metadata
- upstream-neutral design

`worker/src/phone-carrier-runtime.js` remains the live compatibility layer for current phone operations. Existing BYOC, Plivo, Twilio, Telnyx, Inkbox, SIP, Asterisk/FreeSWITCH, and future transports should remain replaceable adapters rather than owners of Magnanimous customers or memory.

## U.S. progression

### Stage A — provider / reseller

Use wholesale SIP/VoIP carriers for PSTN origination, termination, numbers, porting, and emergency-service transport while Magnanimous owns the product, customer experience, routing, CDRs, pricing, support, and fraud policy.

### Stage B — interconnected VoIP provider

Before representing Magnanimous as an interconnected VoIP provider, complete the registrations and ongoing obligations that apply to the actual service model. Current federal obligations can include FCC/USAC registration and Form 499 reporting, TRS/NANP/LNP/USF obligations as applicable, emergency calling, CPNI, robocall mitigation, STIR/SHAKEN, traceback cooperation, and other federal/state requirements.

### Stage C — direct access to NANP numbers

Apply for FCC authorization for direct access to numbers. Maintain facilities readiness, state notices where applicable, numbering records/reporting, 911 compliance, contribution obligations, ownership/control disclosures, and the required robocall/public-safety certifications. Direct numbering authority is external regulatory authority; it cannot be created by application code.

### Stage D — carrier / direct interconnect

For a facilities-based or CLEC-style model, obtain the state/federal authority applicable to the service footprint and establish the carrier identifiers, switching/SBC infrastructure, routing, interconnection, LNP, emergency calling, lawful-process, fraud/abuse response, billing settlement, and operational support required by counterparties and regulators.

## Philippines progression

The Philippine NTC publishes a Certificate of Registration path for **VOIP Provider / VOIP Reseller** and VAS services. A provider should complete the applicable NTC registration, corporate/ownership requirements, network/facilities agreements, equipment/system documentation, service rates, and renewals before representing itself as authorized in the Philippines.

A full public telecommunications entity / facilities-based carrier path is materially different from a VOIP/VAS registration and may require a franchise, CPCN/Provisional Authority and other NTC/public-telecommunications requirements. Treat those as external legal authorizations, not software settings.

## Carrier infrastructure target

Magnanimous should progressively own or control:

- redundant SIP edge / SBC layer
- SIP registrar/proxy and routing engine
- RTP/media relays where needed
- geo-redundant DNS and failover
- customer/reseller tenancy
- number inventory and assignment
- LNP/porting workflow
- least-cost and quality-aware routing
- CDR mediation, rating and invoicing
- balance/credit controls
- fraud velocity and destination controls
- STIR/SHAKEN signing/verification integration for U.S. traffic when authorized
- robocall mitigation / traceback workflow
- E911/NG911 provisioning and dispatchable-location workflow
- CNAM / caller-name workflow where supported
- messaging registration/consent/compliance workflows
- lawful-process and CPNI/privacy controls
- NOC monitoring, alarms, QoS and interconnect health
- customer support and dispute/audit records

## Product rule

The public brand is **Magnanimous Carrier**. Upstream carrier names are implementation details unless disclosure is legally, contractually, or operationally required.

## Promotion rule

Do not advance the stored `operating_stage` merely because infrastructure exists. Advance it only when the corresponding external registrations, agreements, numbering authority, emergency-service arrangements, and production network capabilities are actually in force.
