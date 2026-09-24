# I AM MAGNANIMOUS WAY™ — Full Platform + Telecom Audit

Date: 2026-09-24

## Executive decision

Magnanimous AI remains the brain, identity, policy, orchestration, memory and verification layer. Magnanimous Telecom remains the customer-facing communications identity.

The contact-center architecture should **not** be replaced by a seat-priced third-party CCaaS. The owned target is:

1. free I AM browser/WebRTC calling where both parties can use the platform;
2. Magnanimous-owned SIP/PBX layer (Asterisk + Magnanimous SIP core);
3. workspace BYOC / wholesale SIP primary interconnect;
4. optional secondary SIP interconnect for network-failure failover;
5. metered compatibility transports only when needed.

Upstream carriers are replaceable transport. Credentials alone do not mean a carrier is live.

## Confirmed platform findings and actions

### Fixed in this audit branch

- Mounted the existing `contact-center-runtime.js` in the live Worker entrypoint. It was substantial source code but was not previously reachable from the live dispatch chain.
- Added provider-vault runtime overlay for `/api/phone`, `/api/contact-center`, `/api/telecom` and `/api/voice-agent` so protected runtime credentials can reach the actual telecom execution paths without entering frontend code.
- Completed missing Contact Center server contracts used by the UI:
  - `GET /api/contact-center/softphone/config`
  - `POST /api/contact-center/softphone/claim`
  - signed `POST /api/contact-center/softphone/outgoing`
  - signed `POST /api/contact-center/softphone/status`
  - campaign `dial-start`
  - campaign `dial-cancel`
- Added server-side browser-softphone token generation. API secrets remain server-side.
- Kept the public provider identity as **Magnanimous Carrier**.
- Preserved server-side DNC, consent, calling-window and campaign cap controls.
- Separated **configured upstream accounts** from **live PSTN routes**. Telnyx/Plivo/Twilio credentials no longer create a false-green “live route” state by themselves.
- Added a permanent Full Platform QA contact-center contract lock.
- Added an optional secondary SIP interconnect to the owned Asterisk core.
- Secondary routing is attempted only after network-level `CHANUNAVAIL` or `CONGESTION`, not after a real busy/no-answer result.
- Corrected the owner telecom overview to show the owned Magnanimous/Asterisk core separately from replaceable upstream candidates.
- Hardened the legacy Python standalone backend so it refuses weak/default admin or session secrets, uses an explicit trusted-origin CORS list, and cannot silently boot with known placeholder credentials.
- Expanded Full Platform QA syntax coverage across the legacy backend, video renderer, music engine and Telecom control API.

### Deliberately not claimed as complete

- Supervisor monitor/whisper/barge is **not** marked live. Correct ARI implementation requires calls to be managed through a durable Stasis/bridge lifecycle.
- Native Asterisk WebRTC is the target agent softphone, but the current browser carrier softphone still uses an optional compatibility Voice SDK rail.
- A Telnyx, Plivo, Twilio, or other account is not “connected” unless credentials and the corresponding live route/interconnect are verified.
- Telecom regulatory authority is external. Code cannot create FCC/NTC authority, direct numbering rights, emergency-service authority, or interconnection agreements.

## Contact-center capability benchmark

The current Magnanimous source already covers much of the major CCaaS feature set:

- inbound/outbound call records
- agent presence and queues
- preview/progressive/power campaigns
- IVR
- callbacks
- voicemail
- dispositions and retries
- DNC and calling-window controls
- CRM context / screen-pop foundations
- AI call intelligence and agent assist
- omnichannel interaction inbox
- WFM/QA/health metrics
- free browser calling
- carrier softphone compatibility
- provider-private customer experience

Remaining enterprise-floor work should be completed natively rather than by replacing Magnanimous with another CCaaS:

1. native Asterisk WebRTC agent registration and media;
2. Stasis-managed mixing/holding bridges;
3. then supervisor monitor/whisper/barge;
4. bridge-level recording with jurisdiction/consent policy;
5. skill/priority routing over the native PBX;
6. route-quality telemetry and automatic cost/quality routing;
7. production deployment of the standalone telecom core when hosting/budget and regulatory prerequisites are ready;
8. use the Carrier Route Planner to validate balanced, least-cost, or priority routing before changing production interconnect policy.

## Carrier research and provider roles

There is no single globally cheapest/best carrier. Routing should be destination- and quality-aware.

### Preferred primary candidate — Telnyx

Role: preferred upstream SIP/number/API candidate where pricing, availability and contract terms fit.

Current public reference:
- Voice API: https://telnyx.com/pricing/voice-api
- Published Voice API fee: $0.002/min plus SIP transport; example SIP rates show outbound around $0.005/min and inbound around $0.0032/min before destination-specific passthrough.
- Browser/app calling and recording are separately metered.

Reason for preference: carrier + API model, SIP-first fit, broad primitives, and good economics in many routes. It is **not** assumed cheapest for every country.

### Secondary candidate — Plivo

Role: alternative SIP/API route where its rate and coverage beat the primary path.

Current Philippines references:
- https://www.plivo.com/voice/pricing/ph/
- https://www.plivo.com/sip-trunking/pricing/ph/

For Philippine SIP trunking, Plivo currently publishes local outbound starting at $0.153/min and mobile outbound at $0.198/min, with local DID rental at $25/month. This can beat Twilio's published Philippine SIP termination on some routes, but it is still destination- and contract-dependent.

### Compatibility carrier — Twilio

Role: compatibility/browser Voice SDK and fallback ecosystem, not the identity of the platform.

Current Philippines references:
- https://www.twilio.com/en-us/voice/pricing/ph
- https://www.twilio.com/en-us/sip-trunking/pricing/ph

The current browser carrier softphone can use the Voice SDK compatibility path. The long-term native target remains Asterisk WebRTC. Twilio currently publishes Philippine SIP termination starting at $0.2026/min and mobile at $0.2898/min, so it should not be assumed to be the lowest-cost Philippine PSTN route.

### Other useful upstream candidates

These are benchmarked/eligible by geography and contract, not assumed connected:

- SignalWire — low-cost SIP/WebRTC in supported regions: https://signalwire.com/pricing/rates
- Bandwidth — direct-to-carrier U.S. network and BYOC integrations: https://www.bandwidth.com/pricing/
- Vonage — programmable voice/API alternative.
- Infobip — global communications/voice option.

## CCaaS benchmark — features to absorb, not runtimes to depend on

The following were reviewed as product benchmarks:

- Genesys Cloud CX — https://www.genesys.com/pricing
- Five9 — https://www.five9.com/products/pricing
- Talkdesk — https://www.talkdesk.com/pricing/
- NiCE CXone — https://www.nice.com/pricing
- Amazon Connect — https://aws.amazon.com/products/connect/customer/pricing/
- RingCX — https://www.ringcentral.com/ringcx
- Zoom Contact Center — https://www.zoom.com/en/products/contact-center/
- 8x8 Contact Center — https://www.8x8.com/products/plans-and-pricing
- Nextiva and Dialpad were also reviewed for agent/workforce/contact-center patterns.

These products validate the importance of omnichannel routing, agent/supervisor workspaces, WFM, QM, recording/compliance, outbound campaigns, AI assist, analytics and resilient routing. Magnanimous already owns many of these application-layer functions; paying another vendor per seat would move the runtime boundary away from the platform's ownership goal.

## Regulatory truth boundary

### Philippines

NTC currently publishes Form NTC 1-20 and a Certificate of Registration path for VAS/VOIP Provider/VOIP Reseller:
- https://region7.ntc.gov.ph/information/application-forms/
- https://ntc.gov.ph/wp-content/uploads/2023/citizens_charter/9-29-23/6-05%20SID%20CCT%2009282023.pdf
- https://region7.ntc.gov.ph/information/laws-rules-and-regulations/memorandum-circulars/value-added-services/

The provider path can require network/facilities agreements, corporate/financial requirements, service description, system design and other external evidence. Do not advance Magnanimous to a regulated-provider operating stage merely because software exists.

### United States

Interconnected VoIP/provider obligations can include FCC/USAC registration/reporting and other obligations depending on the actual service model:
- https://apps.fcc.gov/cgb/form499/499a.cfm
- https://apps.fcc.gov/cgb/form499/docs/index.htm

Direct numbering, STIR/SHAKEN, robocall mitigation, emergency calling and state/federal obligations remain external authorization/compliance work.

## Standalone/service audit status

At the audit start, current-main production workflows covering the web platform, Full Platform QA, voice, telecom, video, business operations, provider verification, email and security were green.

Railway production showed the Magnanimous service and sandbox/browser/browser-egress/media services with successful last-known deployments. The exact runtime promotion is commit-sensitive: CI-only commits do not force an unnecessary runtime rebuild.

A later read-only Railway status check showed no non-empty staged production changes (`stagedChanges: null`, `unmergedChangesCount: null`). An earlier inspection call timed out, but no unresolved production-drift mutation remains approved or pending from this audit.

The standalone telecom core exists as a tested deployable source project but is not represented as a separate production Railway service in the audited Railway project. It should not be described as a live public carrier core until a real host, domain, SIP interconnect and production health verification exist.

## Standalone inventory matrix

| Component | Audit state | Provider/service boundary |
| --- | --- | --- |
| Magnanimous standalone runtime | **Verified live in the audited Railway production project** | Magnanimous-owned runtime; outside compute/providers remain replaceable |
| Sandbox | **Verified Railway service** | Isolated execution capacity; not the Magnanimous identity |
| Browser egress | **Verified Railway service** | Network/browser support rail |
| Browser | **Verified Railway service** | Browser execution support rail |
| Media | **Verified Railway service** | Media capacity rail; this audit does not equate it to every source renderer without exact deployment metadata |
| Edge Worker | **Production-deploy workflow verified; exact post-merge runtime must be re-smoked after this branch lands** | Secured API/edge compatibility layer |
| Telecom core (Asterisk + SIP registrar + control API + Postgres) | **Source-ready and test-gated; not a separate live Railway service in the audited project** | Owned PBX/SIP target with replaceable authorized PSTN interconnects |
| Music engine | **Source-ready; live hosting not proven by this audit** | GPU-oriented Magnanimous adapter; no provider should be reported live without health evidence |
| Video renderer | **Source-ready; independent live hosting not proven by this audit** | Replaceable renderer behind Magnanimous video contracts |
| Video gateway | **Source-ready; independent live hosting not proven by this audit** | Edge/gateway adapter |
| Local Bridge | **Device-bound readiness; no specific paired device was promoted to live by this audit** | Owner-controlled local execution; health requires a real paired heartbeat |
| Legacy/backend FastAPI source | **Source-ready; no separate live Railway service verified** | Compatibility/service code, not an independently proven production service |
| GPU render node | **Contract-only; implementation/health/deployment not proven by this audit** | Future owner-controlled real-time renderer boundary; must not be reported live until implemented and health-verified |

**Audit rule:** source code, a manifest, a Docker image, a stored credential, or a provider account is not enough to claim a service is live. Live status requires runtime/deployment evidence or a successful authenticated health/capability probe.

## Q&A / operating decisions

**Should Magnanimous switch to Genesys, Five9, NiCE, Talkdesk, RingCX or Amazon Connect?**  
No runtime switch is required. Use their mature feature patterns as benchmarks while keeping Magnanimous as the platform and owning the PBX/control layer.

**Should Telnyx replace everything?**  
No. Treat Telnyx as the preferred upstream candidate where economics/coverage/quality fit. Keep the interconnect interface carrier-neutral and retain a secondary route.

**Should Twilio be removed?**  
No. Keep it as a compatibility/fallback rail while the native Asterisk WebRTC agent desk is completed. Do not make it the public identity.

**Can Plivo be the cheapest route?**  
Sometimes, but not universally. Philippine rates demonstrate why pricing must be checked per destination and route type.

**Are monitor/whisper/barge complete?**  
No. Do not enable them until outbound/inbound agent calls are migrated into a tested Stasis-managed bridge lifecycle.

**What should be built next?**  
Native Asterisk WebRTC agent media + Stasis bridge lifecycle, then supervisor controls and bridge recording. The carrier planner now supports balanced, least-cost and priority selection from configured route quality/rate data; the next routing step is to feed it measured ASR/ACD/PDD/error telemetry rather than relying only on configured scores.
