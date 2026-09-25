# Magnanimous Telecom — Global Mobile Retail Benchmark

Date: 2026-09-26
Scope: global consumer mobile economics, eSIM/roaming architecture, app voice/text fallback, number portability, multi-network resilience, fair-use controls, and provider-neutral implementation.

## Purpose

This document permanently records public product and infrastructure patterns researched from Fonus, Popcorn, Gigs, 1GLOBAL, Telna, and BICS so the work is not repeatedly rediscovered.

Absorb means implement the observable product mechanics through original Magnanimous code, contracts, policies, adapters, tests, and standards. It does not mean copying proprietary source code, private carrier agreements, hidden routing tables, credentials, private rate cards, branding, or regulatory authority.

Magnanimous AI remains the brain. Magnanimous Telecom remains the customer-facing telecom identity. Outside mobile networks, MVNO/MVNE platforms, eSIM issuers, numbering providers, and roaming hubs remain replaceable infrastructure.

## Public retail benchmark

### Fonus

Public pages reviewed:
- https://www.fonusmobile.com/
- https://www.fonusmobile.com/coverage/
- https://www.fonusmobile.com/legal-2/

Observed retail mechanics on 2026-09-26:
- three global monthly tiers at USD 19.99, 29.99, and 49.99;
- data coverage in 100+ countries;
- high-speed policy tiers: 5 GB, 20 GB, and a higher/unmetered retail tier subject to network/fair-use restrictions;
- physical SIM and eSIM;
- app-based VoIP calling and texting;
- multiple local numbers can coexist on one account/SIM, with outbound identity selected in the app;
- local-number inventory spans multiple countries and can require KYC depending on jurisdiction;
- Wi-Fi calling/texting, visual voicemail, and limited hotspot use;
- fair-use restrictions prohibit using the service as a replacement for sustained home internet;
- public legal disclosures explicitly warn that some 2FA systems may reject VoIP numbers and that international caller ID can vary by carrier/routing path;
- Fonus publishes a reseller application for B2C, B2B, or both, but its public site does not expose a Magnanimous-usable wholesale rate card, so any reseller economics still require a verified commercial quote.

Architecture lesson:
Use mobile data as one access rail and keep voice/text/number identity logically separate. This lets Magnanimous route communications through its own software layer while swapping mobile data and numbering suppliers independently.

### Popcorn

Public pages reviewed:
- https://popcorn.space/
- https://popcorn.space/global
- https://popcorn.space/pricing
- https://popcorn.space/rules
- https://popcorn.space/terms
- https://help.popcorn.space/

Observed retail mechanics on 2026-09-26:
- USD 69/month including taxes;
- marketed global service in 180+ countries;
- US-number portability and new-number issuance;
- eSIM-first onboarding;
- a second/backup eSIM and network fallback positioning;
- default phone dialer plus in-app calling fallback;
- optional AI call assistant for missed/declined/unknown calls;
- call forwarding used to route calls to app/assistant workflows;
- fair-use policy treats usage near 50 GB/month as abnormal and prohibits home-internet/call-center/resale use;
- support material describes a US-based eSIM that may route traffic through the US, which can add latency abroad;
- public terms describe Popcorn as a licensed US carrier with the United States as its primary service area and support for US expats/frequent travelers;
- public service is designed for individual users rather than resale or commercial call-center use, so Popcorn is retained as an architecture/product benchmark rather than treated as a wholesale upstream;
- Popcorn publicly claims bank-text support, but Magnanimous must still verify authentication/SMS capability for its own number type and upstream instead of inheriting that claim.

Architecture lesson:
Global reliability improves when one customer identity can use more than one access path. A primary eSIM, secondary/backup profile, manual or automated network selection, and an IP-app fallback can be coordinated by Magnanimous without exposing the upstream provider.

## Wholesale / direct-source patterns

### Gigs
Reference: https://developers.gigs.com/

The API exposes wireless subscriptions, plans, devices, SIM/eSIM resources, add-ons, consent, and coverage objects. Magnanimous already keeps Gigs behind a replaceable adapter rather than making it the platform identity.

### 1GLOBAL Connect
Reference: https://docs.connect-api.1global.com/

1GLOBAL describes its Connect API as telco-as-a-service that can order, activate, and manage subscriptions worldwide through one API. It is a useful direct-source candidate for global eSIM connectivity subject to commercial agreement, verified pricing, and jurisdiction/product availability.

### Telna
References:
- https://www.telna.com/
- https://www.telna.com/connect
- https://www.telna.com/esim

Public materials describe API-first connectivity management, full eSIM lifecycle controls, dynamic data/SMS/voice service activation, 800+ network agreements, 35+ MNO IMSIs, smart network selection, centralized management, and global eSIM access. Telna's eSIM page also describes one profile reaching 180+ countries and territories. This is a strong architecture pattern for cost/quality steering, but any production use still requires a commercial agreement and verified pricing.

### BICS
References:
- https://www.bics.com/iot/global-connectivity/
- https://www.bics.com/iot/iot-esim/

Public materials describe multi-IMSI, encrypted remote eSIM provisioning, automatic fallback, bootstrap/operational/local profiles, permanent-roaming compliance, cost/latency/regulation-aware steering, and 700+ operator profiles across 200+ countries/regions. Much of the public material targets IoT, so consumer eligibility must not be assumed. The useful pattern is multi-network/profile orchestration and local-profile compliance, not a claim that the IoT offer can be resold as consumer mobile service.

## Magnanimous-native design absorbed

### 1. Access plane and communications plane stay separate

The SIM/eSIM supplies mobile IP access. Magnanimous voice, messaging, voicemail, AI assistance, and contact-center logic remain in the Magnanimous communications plane wherever lawful and technically supported.

This allows:
- data supplier replacement without changing the app identity;
- number supplier replacement without changing the eSIM;
- multiple numbers on one subscriber account;
- browser/app calling fallback when circuit/IMS calling is unavailable;
- independent routing of voice, SMS, and data by quality/cost.

### 2. Global service is a country-capability matrix

Do not advertise a country merely because one roaming profile can technically attach there.

Each country must independently track:
- mobile data availability;
- supported radio generations;
- permanent-roaming restrictions;
- local profile availability;
- native SMS versus app messaging;
- native voice versus app/VoIP voice;
- inbound/outbound number availability;
- number portability;
- KYC/SIM registration requirements;
- emergency-calling status;
- taxes/surcharges;
- provider cost;
- observed latency/throughput/reliability.

### 3. Multi-network resilience

The target subscriber architecture supports:
- primary eSIM/SIM;
- optional secondary/backup eSIM;
- multiple eligible networks per country;
- health/quality/cost-aware steering;
- manual network selection when automatic selection is poor;
- local-profile substitution where permanent roaming is restricted;
- IP calling fallback where the mobile voice route fails.

No backup profile may be called live until its authorized adapter is connected and verified.

### 4. Fair-use economics instead of unfunded "unlimited"

Magnanimous can sell a simple unlimited-style experience only when the product contract is backed by funded wholesale capacity and clear fair-use policy.

Native policy supports:
- high-speed allowance bucket;
- post-threshold throttling/QoS rather than hidden bill shock where the upstream permits it;
- hard variable-cost ceilings;
- prepaid or reserved funding before expensive usage;
- hotspot limits distinct from handset use;
- abnormal-usage review;
- plan upgrade/add-on path;
- no silent paid fallback.

### 5. Verified-cost pricing

Retail price must be generated from a verified upstream/origin cost, taxes/fees policy, and the existing Magnanimous 20% uplift rule.

Competitor retail prices are benchmarks only. They are not wholesale cost inputs and must never be used as if Magnanimous can purchase connectivity at those prices.

### 6. Number identity is independent from the SIM

Magnanimous numbers can be:
- assigned or ported subject to provider/jurisdiction support;
- one-to-many on a subscriber account;
- selected as outbound identity when the underlying carrier route permits it;
- received through native carrier SMS/voice or Magnanimous app transport depending on capability.

2FA/bank-message compatibility must be reported per number/provider type. A VoIP number must never be advertised as guaranteed to receive all short-code or financial-institution traffic.

### 7. Optional AI calling remains a Magnanimous capability

Call screening, spam filtering, missed-call answering, summaries, transcripts, voicemail, and escalation are Magnanimous AI/contact-center capabilities.

They must remain optional, consent-aware, and independent of the eSIM vendor. Recording/transcription follows the existing supervision/recording consent and retention boundaries.

### 8. Latency-aware packet routing

A global roaming profile can hairpin data through a distant packet core. Magnanimous should record:
- serving network;
- country/region;
- round-trip latency;
- packet loss;
- throughput;
- APN/profile;
- roaming/home-routed status where available.

The routing brain should prefer local breakout or lower-latency profiles when contractually available and cost policy permits.

## Product blueprint

A future Magnanimous Global Mobile plan family should be generated from verified wholesale inputs, not copied retail pricing.

Starter-style:
- lower funded high-speed allowance;
- continued service only if the wholesale agreement supports a defined throttled state;
- app voice/text fallback;
- one primary number where supported.

Plus-style:
- larger high-speed allowance;
- backup eSIM/profile eligibility;
- broader number/roaming options;
- priority support.

Max-style:
- larger funded capacity;
- strongest multi-network resilience;
- additional number allowance;
- premium AI/call features where lawful.

Every tier remains subject to country capability, fair-use, fraud, KYC/SIM-registration, and funding gates.

## Non-negotiable truth boundaries

- No provider contract is implied by research.
- No retail benchmark is treated as Magnanimous wholesale cost.
- No country is called live without provider and regulatory verification.
- No emergency calling is implied by eSIM/data coverage.
- No 2FA delivery guarantee is made for VoIP numbers.
- No carrier/MVNO/MNO authority is created by software.
- No proprietary provider code, private routing logic, or hidden rate sheets are copied.
- Consumer-facing surfaces remain Magnanimous-branded.
