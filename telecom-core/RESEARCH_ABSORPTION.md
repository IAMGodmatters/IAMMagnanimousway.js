# Magnanimous Telecom — Industry Research Absorption

Magnanimous AI is the command brain. Magnanimous Telecom is the customer-facing telecom service provider. Outside carrier, OSS/BSS, SIP, charging, observability, eSIM and mobile-core technologies are implementation references or replaceable adapters; they do not become the public identity.

## Patterns absorbed

### OSS/BSS domain separation
Magnanimous separates product/catalog policy, subscriber/customer service, service orders, usage mediation, rating/charging, balances, assurance/trouble tickets, fraud, routing, roaming/settlement and infrastructure inventory. This follows telecom-industry API/domain separation patterns such as TM Forum Open APIs without claiming conformance until formal testing is done.

### Usage mediation before billing
Provider CDRs and usage events should first be normalized into one Magnanimous usage event model. Rating and charging are separate downstream operations. This allows multiple SIP/PSTN/MVNO/mobile providers to be swapped without rewriting billing.

### Real-time charging evolution
Magnanimous has native balance-account, balance-bucket, usage-event and rating-entry records. The current charging control plane adds idempotent reserve → commit/release sessions, balance reservations and an immutable transaction ledger. External OCS/rating systems such as CGRateS or SigScale may later be connected as replaceable execution engines. Magnanimous retains the product rules, customer relationship and canonical ledger.

### Internal rate decks and billing units
Wholesale/mobile providers may rate usage in provider-specific increments rather than raw byte/second totals. Magnanimous therefore keeps internal rate decks and rules with unit size, unit rate, connection charge, minimum charge, destination prefix/zone and effective dates. Charging quotes round to the configured billing unit before reservation. Upstream cost data can inform the deck but must not become customer-facing provider identity.

### Sensitive-use default deny
Roaming, international calling and premium-rate usage are sensitive capabilities. The Magnanimous charging gate defaults them off unless an active plan policy, line policy and relevant fraud controls explicitly permit them. This avoids accidentally turning a missing policy record into authorization.

### Fair use and policy control
Unlimited/fair-use offers are modeled as product policy, not as a promise of physically unlimited network capacity. A plan may allow service while applying documented thresholds, throttling/QoS controls or review states. Magnanimous AI can recommend policy changes, but consequential network execution remains behind operational gates.

### SIM-registration state without raw KYC documents
Jurisdictions can require registration before activation. Magnanimous tracks registration status, jurisdiction, timestamps and an opaque verification reference in the operational layer. Raw identity documents should remain in an appropriately authorized KYC/identity system rather than being duplicated into general charging tables. In the Philippines, software readiness does not make Magnanimous a Public Telecommunications Entity and does not replace obligations under Republic Act No. 11934 and NTC rules.

### Shared and no-expiry balances
Retail products need more than monthly recurring allowances. Magnanimous models fixed-validity, no-expiry, family/business/shared pools and add-on buckets separately from plan identity. Public Philippine offers demonstrate that no-expiry data, mixed voice/text/data buckets, short-validity packages and shareable balances are established retail patterns; Magnanimous may use the product mechanics without copying another carrier's brand, trademarks or pricing.

### Device, APN and access-policy inventory
Device compatibility, TAC, hashed device identifiers, eSIM/VoLTE/VoNR/Wi-Fi Calling/RCS readiness, APN profiles and per-line network policy are kept as operational inventory. Raw IMEI is not required by this control-plane record. APN/provider references remain owner/internal information.

### SIP edge and high availability
A future SIP-edge/SBC layer should sit in front of Asterisk/media nodes. Kamailio-style dispatcher patterns provide weighted, health-aware, latency-aware and least-cost distribution. Asterisk remains a replaceable media/call execution layer while Magnanimous owns AI, policy, routing and service logic.

### Voice application control
Asterisk ARI/WebSocket/Stasis patterns are retained for event-driven call-control applications. The ARI endpoint stays private; public applications use Magnanimous APIs rather than exposing PBX management directly.

### Telecom observability
HOMER/HEP-style signaling capture is a future observability module. SIP/RTC traces, quality metrics and troubleshooting data should be separated from customer-visible call history and stored with restricted access.

### Mobile-core evolution
Open5GS, free5GC and Magma demonstrate how EPC/5GC functions can be software-defined. Magnanimous may maintain isolated lab/simulation modules for AMF/MME, SMF/PGW, UPF, HSS/UDM, PCF/PCRF, IMS/VoLTE and charging integration. Engineering demonstrations of free5GC with simulated UE/RAN and containerized control plane are useful for lab validation only. A lab is not public mobile authority: spectrum/RAN rights, interconnects, emergency service and regulatory authorization remain external gates.

### SIM/eSIM standards
Consumer eSIM orchestration tracks current GSMA SGP.22 architecture/technical baselines and IoT eSIM tracks SGP.31/SGP.32. Magnanimous must never generate, clone, copy or store raw Ki/OPc/ADM secrets. Actual profiles are issued through authorized carrier/MVNO/SM-DP+/eIM infrastructure.

### MVNO/MVNE abstraction
Plans, users, addresses, SIMs, subscriptions, porting, usage and balances are modeled independently so a wholesale mobile partner can be swapped. Magnanimous Telecom remains the provider identity presented to customers.

### Provider APIs are consequential adapters
Some upstream connectivity APIs can activate/terminate subscribers, allocate paid resources or change billable services. Magnanimous adapters must classify those operations as consequential and keep explicit purchase/regulatory gates in front of them. Read-only usage, health and inventory retrieval may be automated more freely than paid provisioning.

### Retail offer flexibility
Magnanimous can model recurring postpaid, prepaid, hybrid, fixed-validity, no-expiry, roaming, shared balance, allowance conversion, add-ons, perks and unlimited-policy offers. These are general telecom product patterns, not copies of another carrier's brand or pricing.

## Global mobile economics and resilience benchmark — 2026-09-26

This pass preserves the earlier Popcorn-derived Magnanimous Skills/Routines work and adds only the telecom/mobile lessons that were not yet durable in the repository. Public retail services such as Popcorn and Fonus are research benchmarks, not providers, licensors, or identities for Magnanimous Telecom unless a separate authorized wholesale/commercial agreement is later executed.

### Low-cost global service mechanics worth absorbing

- **One mobile identity, many visited networks.** A single eSIM can roam across many partner networks, so the customer does not need to swap SIMs country by country. Magnanimous should expose one customer relationship while routing through replaceable authorized wholesale roaming/MVNO rails.
- **Separate data access from app-layer communications.** Fonus publicly states that its calls and texts use VoIP through its app. This pattern can reduce dependence on native circuit-switched roaming for voice/SMS and lets the service use Magnanimous-owned calling, voicemail, inbox and AI features over the data path. It must still use authorized numbering, messaging and termination providers and must not be represented as native carrier SMS when it is not.
- **Tiered high-speed allowances make unlimited economically bounded.** Public benchmark plans can advertise continued service while throttling or reviewing usage after a documented high-speed/fair-use threshold. Magnanimous plan policy should therefore distinguish high-speed allowance, post-threshold speed/QoS, hard caps, hotspot allowance, roaming allowance and review/suspension rules.
- **Prepaid funding protects margin.** Global mobile usage should be funded before variable wholesale consumption. Rating must reserve cost before service where practical, keep hard spend/usage limits, and never silently fall through to an unfunded paid roaming path.
- **Multiple numbers can ride one data subscription.** Local/international DID numbers, ported numbers and outbound identity selection are logically separate from the eSIM data profile. Magnanimous should keep number inventory/porting independent from the mobile data adapter so one eSIM subscription can support multiple authorized numbers.
- **Backup connectivity is part of the product, not an afterthought.** Popcorn publicly markets a backup eSIM and in-app backup dialer. Magnanimous should model a primary mobile profile, optional backup profile, manual/automatic network selection policy and an app-over-data calling fallback. Failover must be observable and must not create duplicate charges or emergency-calling ambiguity.
- **Home-routed roaming can add latency.** Popcorn documents that its US-based eSIM may route data through the US while the user is abroad. Magnanimous should measure latency, packet loss and regional breakout/anchor behavior rather than assuming all roaming paths have local internet egress.
- **AI call handling belongs above the carrier rail.** Popcorn's optional assistant uses call forwarding to screen/answer missed or unknown calls, block spam, record calls and summarize outcomes. Magnanimous already owns the AI/contact-center brain, so equivalent capability should remain in Magnanimous AI and use carrier forwarding only as a replaceable network primitive.
- **Porting and 2FA truth need explicit product boundaries.** VoIP-number SMS may be rejected by some banks or 2FA senders. Number-port workflows need step-up authorization and temporary transfer credentials. Customer UI must distinguish carrier/mobile-number capabilities from app/VoIP-number capabilities rather than promising universal 2FA delivery.
- **Personal-use retail plans are not wholesale telecom inputs.** Popcorn's published rules prohibit resale/commercial/call-center use, and Fonus publishes similar personal/non-commercial restrictions. Magnanimous must not place customer or call-center traffic onto those consumer plans. Their public behavior is architecture/pricing research only.

### Magnanimous global-mobile control blueprint

The native control plane should represent these independently:

1. `mobile_access_profile` — eSIM/pSIM provider reference, visited-network eligibility, APN/access policy, home-routing/egress region and active/backup priority.
2. `global_plan_policy` — high-speed allowance, post-threshold policy, hotspot allowance, roaming geography, voice/text inclusion, per-destination rates, prepaid reserve and maximum funded exposure.
3. `number_identity_set` — one or more authorized DIDs, port state, inbound/outbound capability, 2FA/short-code limitations and caller-ID policy.
4. `app_communications_fallback` — Magnanimous SIP/WebRTC/VoIP calling, messaging where authorized, voicemail, unified inbox and backup dialer over any usable data path.
5. `ai_call_assistance` — optional missed/unknown/all-call handling, spam screening, summaries/transcripts and consent-gated recordings controlled by Magnanimous AI.
6. `connectivity_resilience` — primary/backup eSIM, network-selection policy, measured latency/packet loss, failover reason, duplicate-charge prevention and user-visible truth state.
7. `fair_use_and_cost_guard` — plan threshold state, network-reported usage, normalized usage mediation, reserve/commit/release charging and explicit throttle/review/suspension policy.
8. `regulatory_and_emergency_boundary` — emergency-routing capability, SIM-registration/KYC status, jurisdiction, roaming restrictions and authority state kept separate from software readiness.

### Public benchmark facts captured on 2026-09-26

- Fonus publicly advertised USD 19.99 / 29.99 / 49.99 monthly global plans, with high-speed tiers of 5 GB and 20 GB on the first two plans before slower service, service in 100+ data countries, calling coverage extending to 200+ destinations, eSIM/physical-SIM support and multi-country number support. Its terms state service is delivered through multiple international wireless carriers and that calls/texts use VoIP.
- Popcorn publicly advertised one USD 69/month plan including taxes, coverage in 180+ countries, a US-based eSIM, no 90-day roaming cutoff, US-number porting, a backup eSIM/dialer and an optional AI call assistant. Its fair-use documentation says usage beyond roughly 50 GB/month may be reviewed and temporarily limited.
- These retail prices are **benchmarks only**. They do not reveal wholesale rates or guarantee that Magnanimous can match them in every geography. Magnanimous retail pricing must be computed from verified wholesale cost + taxes/fees + funded risk reserve + the owner-approved margin/upsell policy, with hard limits protecting the business.

### Research references

- Fonus: https://www.fonusmobile.com/
- Fonus coverage/rates: https://www.fonusmobile.com/coverage/
- Fonus service terms: https://www.fonusmobile.com/legal-2/
- Popcorn: https://popcorn.space/
- Popcorn pricing: https://popcorn.space/pricing
- Popcorn fair-use rules: https://popcorn.space/rules
- Popcorn help center: https://help.popcorn.space/en/

## Starter deployment versus scale-out

The starter Singapore/owner-hosted node stays intentionally small. Do not run every carrier component on the 2 GB starter node.

Starter node:
- Magnanimous Telecom control API
- Asterisk/PJSIP voice core
- Magnanimous call-control bridge
- secure carrier/MVNO adapters
- basic metrics and health

Scale-out modules when needed:
- SIP edge/SBC and HA dispatcher
- dedicated media/PBX nodes
- real-time OCS/rating engine
- SIP/RTC observability and packet capture
- additional fraud/analytics workers
- mobile-core/IMS lab nodes
- redundant interconnects and regional failover

## Standards and references watched

- TM Forum Open APIs: https://www.tmforum.org/oda/open-apis
- 3GPP charging specifications (TS 32-series): https://www.3gpp.org/dynareport?code=32-series.htm
- GSMA eSIM specifications: https://www.gsma.com/solutions-and-impact/technologies/esim/esim-specification/
- Republic Act No. 11934 (Philippines SIM Registration Act): https://lawphil.net/statutes/repacts/ra2022/ra_11934_2022.html
- Asterisk documentation: https://docs.asterisk.org/
- Kamailio dispatcher: https://kamailio.org/docs/modules/stable/modules/dispatcher.html
- Open5GS: https://open5gs.org/open5gs/
- free5GC: https://free5gc.org/
- free5GC engineering demo (project channel): https://www.youtube.com/watch?v=tMcVTx1XlIk
- containerized free5GC + UE/RAN simulator demonstration: https://www.youtube.com/watch?v=q8cfxhCtIPs
- Magma: https://magmacore.org/
- CGRateS: https://github.com/cgrates/cgrates
- SigScale: https://github.com/sigscale
- HOMER/HEP: https://github.com/sipcapture/homer
- Gigs API: https://developers.gigs.com/
- Soracom API: https://developers.soracom.io/en/api/
- Soracom usage/billing-unit reference: https://developers.soracom.io/en/docs/reference/data-usage-calculation/
- Smart public prepaid offers (retail product-pattern research): https://store.smart.com.ph/
- Globe public prepaid offers (retail product-pattern research): https://www.globe.com.ph/prepaid/promos
- DITO public prepaid offers (retail product-pattern research): https://dito.ph/prepaid

These references inform Magnanimous architecture. Their names should stay in owner/admin engineering context and not replace Magnanimous Telecom branding in customer-facing service. They do not establish a commercial relationship, wholesale agreement, license, certification or regulatory authorization for Magnanimous Telecom.
