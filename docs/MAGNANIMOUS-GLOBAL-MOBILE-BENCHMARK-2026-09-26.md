# Magnanimous Global Mobile Architecture Benchmark — 2026-09-26

## Purpose

This benchmark studies the public architecture pattern demonstrated by Popcorn and other software-first global mobile services without copying proprietary code, private contracts, credentials, subscriber data, or hidden carrier configuration.

Magnanimous Telecom remains the public provider identity. Magnanimous AI remains the orchestration, policy, charging and decision layer. Any MNO, MVNO enabler, roaming hub, SM-DP+, carrier, transit network or cloud component remains replaceable private infrastructure.

## Public evidence reviewed

- Popcorn public pricing and global-service pages: fixed-price eSIM-led service, broad international availability, second/backup eSIM behavior and app-dialer fallback.
- Popcorn public terms: licensed-carrier/reseller representation and fair-use boundaries.
- FCC Form 499 public filer record for Popcorn Labs, Inc.
- Illinois Commerce Commission public authority record identifying Popcorn as a reseller of telecommunications services.
- ATIS IMSI/HNI public assignments showing Popcorn Labs network identifiers.
- ATIS HNI assignment guidelines: an MVNO HNI applicant needs the applicable authorization and an executed contract with a public network operator.
- ITU Operational Bulletin public identifier allocation record.

The exact primary U.S. wholesale host MNO is not treated as verified because Popcorn's own public material reviewed in this pass did not name it. Community reports are not sufficient to make it a platform fact.

## Why the model can be global without owning towers

The economic/technical pattern is:

1. own the customer relationship, software control plane, charging, support and policy;
2. provision SIM/eSIM credentials only through an authorized network/provisioning relationship;
3. buy wholesale radio access and roaming rather than building RAN in every country;
4. use a home-network identity or partner-issued subscriber identity, depending the agreement;
5. maintain coverage/rate information across partner networks;
6. steer eligible traffic by coverage, quality, latency and cost;
7. use a primary profile plus backup eSIM/profile and app/VoIP fallback;
8. use regional data breakout where the wholesale agreement supports it to reduce roaming hairpin latency;
9. bound “unlimited” economics with fair-use policy, abuse/fraud controls and wholesale-cost visibility.

## What Magnanimous already had before this benchmark

- physical SIM and consumer eSIM metadata/provisioning lifecycle;
- provider-neutral mobile adapters;
- regulated-network provider registry and regulatory case tracking;
- retail plans, customer lines and usage cycles;
- OSS/BSS service orders, usage normalization, assurance, fraud and network-function inventory;
- charging reserve/commit/release;
- fair-use, roaming, international and fraud policy gates;
- devices, APN profiles and SIM-registration state;
- internal rate decks/rules and invoicing;
- mobile-core and IMS lab path, deliberately not represented as public network authority.

## Added by this benchmark

### Home-network identity readiness
`telecom_mobile_home_identities` tracks MCC/MNC/HNI assignment state and evidence. An “assigned” or “verified” state cannot be stored without authority and evidence references. This is metadata only and never manufactures a real network identifier.

### Wholesale agreement registry
`telecom_mobile_wholesale_agreements` models host-MNO, roaming-hub, direct-roaming, SM-DP+ and eSIM-platform relationships. Executed/verified status requires evidence.

### Global roaming coverage matrix
`telecom_mobile_roaming_coverage` records country/network eligibility, supported services/access technology, regional breakout, measured/configured quality, latency and exact origin unit costs.

### Primary/backup access policy
`telecom_mobile_access_policies` keeps primary and backup SIM/eSIM roles, routing mode, manual network-selection policy, cost/latency/quality caps, breakout preferences and fallback order.

### Global mobile route planner
Magnanimous can preview an eligible mobile route by country and service using balanced, least-cost, quality or priority policy. The planner rejects routes outside configured cost/latency/quality limits.

It does not attach a device to a radio network by itself. Live execution still requires the authorized mobile adapter and external network agreement.

### Pricing lock
A customer unit price is generated only when an exact origin cost has an evidence reference and a fresh verification timestamp. The generated retail amount is exactly:

`ceil(origin_cost_micros × 1.20)`

If origin pricing is absent or stale, the route is non-billable. No hidden metered fallback is authorized.

## Truth gates

`TELECOM_GLOBAL_MOBILE_LIVE` defaults conceptually to false. Even if source code, HNI metadata or coverage records exist, the runtime reports global mobile as live only when:

- the explicit live gate is true;
- a wholesale agreement is executed/verified with evidence;
- active roaming coverage exists.

Regulatory authority, HNI assignment, roaming access, emergency-service obligations, numbering rights and spectrum rights remain external grants/contracts and must never be inferred from code.

## Consumer identity/privacy

Customer-facing experiences continue to say Magnanimous Telecom / Magnanimous AI. Upstream network/provider names, agreement references, secret bindings and origin prices are owner/private control-plane data and are not a consumer branding surface.
