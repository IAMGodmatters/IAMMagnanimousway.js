# Active Development Checkpoint

Last updated: 2026-09-26
Repository: IAMGodmatters/IAMMagnanimousway.js
Production: https://iammagnanimousway.com/
Status: **Deep telecom/carrier/contact-center software architecture is merged; protected selected-route execution covers Magnanimous Telecom Core plus explicit Twilio/Plivo routes; consent-gated Stasis supervision/recording source is merged; native Chromium↔Asterisk media is CI-verified. Public-host activation, real-host Stasis evidence, regulatory authority and remaining generic BYOC migration stay separately gated.**

## Original task

Complete a through-and-through deep study of the telecom, carrier, PBX/SIP, browser calling, contact-center, call-center UX, routing, resilience, pricing and regulatory structure. Compare relevant carrier, CPaaS, SIP, PBX, media and CCaaS patterns, then apply the useful findings to Magnanimous without replacing working functionality or making a third party the product identity.

Also preserve enough durable state that a chat or streaming interruption cannot erase the development task, decisions, completed work, verification evidence or exact unfinished next actions.

## Permanent architecture decisions

- Magnanimous AI remains the brain, policy, orchestration, memory, verification and decision layer.
- Magnanimous Telecom / Magnanimous Carrier remain the public communications identity.
- Upstream PSTN/SIP carriers are replaceable transport, not the owner of the customer experience.
- Free browser-to-browser calling remains first choice when both endpoints can use the platform.
- The owned telecom core remains Asterisk for PBX/media/features plus the Magnanimous Kamailio SIP core; RTPengine/SBC scale components are additive when scale or topology requires them.
- Native browser-agent media targets the owned Asterisk WebRTC rail instead of making a metered compatibility SDK the permanent dependency.
- Carrier selection is destination-, health-, measured-quality- and cost-aware rather than globally hard-wired to one carrier.
- Provider credentials alone never count as a live route.
- Regulated public VoIP/carrier status, numbering rights, emergency-service authority and interconnect authority are external legal/contractual facts and must never be inferred from source code.

## Deep-research conclusions applied

- Native Asterisk WebRTC uses gated WSS signaling, TLS, DTLS-SRTP, ICE, RTCP mux and Opus/G.711.
- The prior WSS placeholder was not a production-ready browser transport because TLS/public readiness was not actually enabled.
- Route quality now incorporates recent ASR, ACD, PDD and network-failure evidence when sample count/freshness are sufficient, with configured quality as fallback.
- Routes above configured maximum rate are excluded instead of merely displaying the cap.
- Current carrier research supports a replaceable multi-carrier strategy. Telnyx, Plivo, Twilio, Bandwidth and SignalWire have different strengths/economics by geography and contract; no carrier is treated as universally best.
- Philippine NTC authority is kept separate from software readiness; Magnanimous must not claim public VoIP provider/reseller authority until the applicable registration and network agreements are actually in force.

Full research evidence is versioned in:
- `docs/TELECOM-DEEP-ARCHITECTURE-2026-09-24.md`
- `docs/FULL-PLATFORM-TELECOM-AUDIT-2026-09-24.md`
- `docs/GLOBAL-MOBILE-RETAIL-BENCHMARK-2026-09-26.md` — durable Fonus/Popcorn retail benchmark plus Gigs/1GLOBAL/Telna/BICS direct-source architecture and truth boundaries.

## Completed lineage

- PR #367 / `3d39a225188bd975f2a2ba2a11e0c7472f87fc70` — full platform/provider/contact-center/telecom audit and runtime wiring.
- PR #368 / `2ae52c5cdf029affdd3da0816a473cd7473b8865` — transient non-mutating production validation retry hardening.
- PR #369 / `5278519e54416a99936fffc0e5826be47c4e7545` — compatibility softphone aligned with Magnanimous Carrier contract.
- PR #370 / `e55f81ec528b0c018cef4f46349958097d237a2e` — deep telecom architecture, gated native WebRTC source, measured route quality, max-rate enforcement, carrier matrix, owner UI and durable checkpoint.
- PR #371 / `5674b48199e6839128ce43c59165aafeb5d9cc30` — bounded transient retry protection across read-only/expected-status production smoke probes after a rollout-time 502.
- PR #373 / `4db2487c3a4d734aa3b9938e8085646687631786` — real Chromium + SIP.js registration against owned Asterisk WSS, authenticated Echo() media diagnostic, bidirectional RTP assertions, stable Asterisk 22.11.0 image pin, and corrected secondary-carrier dialplan syntax.
- PR #375 / `5b7eb689547f8c8a100f40b2b937ddfdd3a607eb` — strict public Telecom Core readiness: external Chromium verification workflow, trusted-TLS hostname verification, public/private/CGNAT target rejection, safe Ubuntu host bootstrap, root-only certificate staging, Asterisk-owned runtime TLS key copy, and `TELECOM_PUBLIC_IP` external signaling/media wiring.
- PR #377 / `a5e6fc85772db42d95c6ee9cc397fdf330f11f71` — short-lived per-browser native WebRTC credentials through Asterisk ARI/Sorcery, bounded TTL, one-contact identities, restricted no-direct-PSTN context, automatic reaping, explicit revocation, and Chromium proof of issuance → registration → bidirectional RTP → revocation → endpoint removal.
- PR #379 / `f4ccc473dda3b10cbe806f689266194c803ba599` — gated platform server handoff to the private Telecom Core using protected owner-managed URL/token settings; fail-closed session proxy without exposing the control-plane token to browsers.
- PR #382 / `9a0c5e6cc97cff324ae409142c9329e70f9875fe` — native SIP.js client mounted into the main agent softphone, native internal-call preference when verified/live, compatibility PSTN fallback preserved, production routing boundary repaired, private/local Telecom Core targets rejected, and platform-facing migration locked in QA.
- PR #441 / `fc397a47e4793e25b50998719daec0371aa8a372` — protected Magnanimous Telecom Core selected-route execution with endpoint allowlisting, authenticated Asterisk health, fail-closed explicit routing and route/interconnect attribution.
- PR #444 / `98128d9c4820a2286cc741163b0bdc4c646712fc` — consent-gated private Stasis event stream, monitor/whisper/barge bridge lifecycle, headless bridge recording, owner/admin controls, UI, unit tests and cleanup locks without claiming production-live supervision.
- PR #445 / `b7960fc1e683bea07ea47284266feeb31251a323` — explicit Twilio/Plivo carrier routes moved behind Magnanimous planner execution with authenticated account health and fail-closed routing.
- PR #447 / `1ae099403e838ba005ea0ea238b7727cd1d3084e` — D1 read-quota deployment resilience without weakening payment/bootstrap verification.

## Continuation checkpoint — QBO contact repair

- Startup Philippines currently lists the QBO Accelerator as open and publishes `accelerator@qbo.com.ph`, but Gmail returned a 550 5.1.1 address-not-found failure for that mailbox (`gmail:1a0dc1135b9d92d0`).
- QBO's current official site publishes `hello@qbo.com.ph`; the Magnanimous pre-qualification inquiry was resent successfully there (`gmail:1a0dc3d535c87274`).
- The native watcher already covers the `qbo.com.ph` domain, so inbound QBO replies remain monitored without widening the mailbox scope.
- QBO/Startup Philippines remains the first funding target after SEC registration; no funding award, eligibility approval, or allowable-use approval is claimed until received in writing.

## Continuation checkpoint — SEC current filing route

- Official SEC eSPARC currently states that, from April 7, 2025, domestic stock corporations other than lending/financing companies are processed through SEC ZERO.
- OneSEC with ZERO is not a universal shortcut: its terms require a predetermined primary purpose and direct applications needing SEC/other-agency clearance or endorsement to Regular with ZERO.
- For Magnanimous, do not assume the future NTC-regulated telecom wording is accepted through OneSEC. Use OneSEC only if the actual selected purpose is eligible without an endorsement; otherwise use Regular with ZERO.
- SEC iMessage is the current official SEC ticketing channel for public inquiries/requests; the retired CPRD mailbox is not the current inquiry route.
- eSPARC/OneSEC forms require real applicant/authorized-representative data including TIN/contact details, and ZERO relies on eSECURE/eSAP credentials for relevant officers/signatories. Formal incorporation therefore remains blocked on real owner/signatory data and must never be completed with invented identity information.
- Latest GitHub main after the QBO repair is `c89adac58852cbe08bcf402a1c3b26cc62994903`; live Railway remains correctly on runtime commit `acf0eb84a9b256542dca3b09ab091d2779a130ba`, deployment `abdaa629-b917-45b4-b559-f7fa835343a9` (SUCCESS), because the newer commits are documentation-only.

## Continuation checkpoint — real SEC identity documents received

- Real owner-supplied Philippine identity/tax documents are now available for the intended Filipino participant.
- The supplied PhilHealth ID is an SEC-accepted eSECURE ID type; the supplied BIR card provides the required TIN.
- Sensitive values and ID images are intentionally not persisted in GitHub or project documentation.
- The owner confirmed **Hardin** is the current surname. The older BIR/TIN card displays **Capuno**; the reason for that difference is not assumed. The underlying BIR record may need reconciliation if SEC/eSECURE validation requires an exact match.
- Filing remains blocked only on unresolved form/account facts: personal email/mobile for OTP, nationality, complete current legal-name format, current address reconciliation, and the actual corporation ownership/role structure.
- The supplied cards still show different addresses; Magnanimous must not pick an address automatically.

## Continuation checkpoint — universal Email Writer + capability/business audit

- PR #468 is finished and merged as `d90d65b78bff0a9dfa84c5be14a868d5e516a35a`. Its identity-evidence/SEC checkpoint is no longer waiting on QA.
- PR #469 is finished, merged and deployed as main `0b0c3c6884fe0a1d4799a27a3ec762b2ec445951`; Railway deployment `901c9e79-ae4c-44ec-8204-eb792df8003d` is SUCCESS.
- The public production body at `/business-email/` was inspected after deployment and contains the Magnanimous AI Email Writer with New email, Reply, Follow-up, Rewrite, subject/body editing, copy controls and optional connected-mailbox sending.
- Email drafting is intentionally a platform-wide free-first capability; it does not require a sign-in token. Real mailbox sending remains a separate signed-in, connected-account, explicitly confirmed action.
- This branch strengthens the public wording and production smoke so that universal drafting access cannot silently regress.
- Added a one-by-one Magnanimous capability parity ledger covering 110 modern-assistant/platform capabilities with verified/live/auth/hybrid/fail-closed/gap status.
- Added a last-15-conversation audit that reconciles interrupted chat work against authoritative source/deployment/external-proof state.
- Added the SEC formation owner-input checklist. Remaining SEC blockers are real owner/account/corporation facts: complete current legal-name format, current address, personal email/mobile for OTP, nationality, ownership/governance roles, capitalization/subscription facts and signatory eSECURE identities. These values must not be invented or persisted in GitHub.
- Current surname is confirmed as Hardin. The older BIR/TIN card displays Capuno; the reason is not assumed. Reconcile through the proper BIR process only if SEC/eSECURE validation requires an exact taxpayer-name match.
- Added a current cost-basis ledger separating published fees from quote-required, usage-variable, optional and contingent costs. ChatGPT remains budgeted at US$20/month until Magnanimous closes the remaining proven parity gaps.
- Cloudflare D1 Free daily write exhaustion remains a real capacity risk. The checked-in runtime brain manifest stays authoritative when durable D1 materialization is deferred; a controlled Workers Paid baseline is a possible future cost, not automatically purchased.
- Telecom public/global live flags remain fail-closed until NTC/carrier/public Telecom Core/WSS/two-way media/SIM-eSIM proof exists.

## Production verification — PR #473

- PR #473 merged as `0b0c3c6884fe0a1d4799a27a3ec762b2ec445951`.
- Railway production deployment `901c9e79-ae4c-44ec-8204-eb792df8003d` is SUCCESS on that exact commit.
- Public production inspection of `/business-email/` confirms the all-user Magnanimous Email Writer copy, writer marker, `WRITE THE EMAIL` action, and Gmail/Outlook connection handoff are live.
- Drafting is available to every platform visitor on the free-first path. Real mailbox sending remains a separate signed-in, connected-account, explicitly confirmed action.
- PR #473 also carries the 110-item capability parity ledger, the last-15-conversation audit, the privacy-safe SEC input checklist, and the current business cost basis.
- Public/global telecom remains fail-closed where NTC/carrier/public-Core/media/SIM-eSIM evidence is still missing.

## Active work

Completed:
- [x] Durable repository checkpoint and recovery QA lock.
- [x] Deep telecom/carrier/contact-center research versioned.
- [x] Secure gated Asterisk WSS/WebRTC source configuration.
- [x] TLS certificate/private-key startup gate.
- [x] DTLS-SRTP, ICE, RTCP mux and Opus/G.711 native endpoint contract.
- [x] Removed hard-coded third-party STUN dependency; STUN is optional/operator-selected.
- [x] Preserved ordinary Kamailio/SIP and existing compatibility softphone behavior.
- [x] Added protected Telecom Core WebRTC readiness API and truthful health state.
- [x] Added measured ASR/ACD/PDD/network-failure route quality.
- [x] Added sample floor/freshness policy and configured-quality fallback.
- [x] Enforced max-rate exclusion in route planning.
- [x] Expanded carrier candidate model while keeping Magnanimous as identity.
- [x] Updated owner telecom UI with owned core, carrier candidates, route metrics and live-vs-source truth.
- [x] Added permanent deep-telecom QA contracts.
- [x] Passed branch CI/build/typecheck/Worker/Python/Telecom/standalone-release gates.
- [x] Merged and deployed the runtime-changing architecture commit.
- [x] Hardened production smoke against transient rollout-time 502/503/504 reads without retrying mutations.
- [x] Re-ran production verification successfully.
- [x] Added a real Chromium/SIP.js native browser test against the owned Asterisk WebRTC endpoint.
- [x] Verified Asterisk server-side browser contact registration.
- [x] Verified authenticated WebRTC call establishment through Asterisk `Echo()` without PSTN/carrier minutes.
- [x] Verified inbound and outbound RTP bytes/packets plus a real remote audio track in Chromium.
- [x] Fixed the invalid Asterisk `22.10.1` image pin by moving the Telecom Core image to stable `22.11.0`.
- [x] Fixed the secondary-carrier failover dialplan `NoOp` syntax issue exposed by the real Asterisk run.
- [x] Replaced the stale `/httpstatus` readiness probe with actual TLS socket + Asterisk `/ws` + PJSIP endpoint evidence.
- [x] Added `Public Telecom WebRTC Verification`, a manual external GitHub-hosted Chromium proof for the future public Telecom Core host.
- [x] Public verifier rejects localhost, RFC1918, link-local and CGNAT targets and requires `wss://`.
- [x] Public verifier performs trusted TLS chain + hostname verification with no certificate bypass.
- [x] Added safe public-host bootstrap and certificate-sync scripts without provisioning any paid infrastructure.
- [x] Host TLS private key can remain root-only; Asterisk startup copies it into a private Asterisk-owned runtime path at mode `0600`.
- [x] Wired `TELECOM_PUBLIC_IP` into optional WebRTC `external_signaling_address` and `external_media_address` transport settings for NAT/public deployments.
- [x] Added permanent QA locks and Telecom Core shell/tooling validation for the public-host path.
- [x] Added runtime-created ephemeral PJSIP `auth`/`aor`/`endpoint` objects through Asterisk ARI/Sorcery instead of one shared browser SIP password.
- [x] Added bounded session TTL, one-contact registration, background stale-session reaping, explicit browser-session revocation and post-revocation Asterisk endpoint-removal proof.
- [x] Added a restricted `magnanimous-webrtc-session` context that permits internal Magnanimous destinations/diagnostic echo while blocking direct public-number and emergency-code dialing.
- [x] Added protected platform → Telecom Core session handoff; browser clients never receive the Telecom Core bearer token or ARI credentials.
- [x] Added pinned SIP.js `0.21.2` to the production frontend and mounted the native Magnanimous browser phone into the agent softphone.
- [x] Native internal extension calling now prefers the owned Asterisk WebRTC rail only when `TELECOM_NATIVE_WEBRTC_LIVE` and the protected Telecom Core bridge are both ready.
- [x] Ordinary E.164 PSTN calling remains on the existing guarded compatibility route so billing, consent, DNC and regulatory controls are preserved during migration.
- [x] Repaired router precedence so `/api/contact-center/softphone/native-session` reaches the native contact-center runtime instead of being swallowed by the compatibility handler.
- [x] Rejected localhost, private IPv4/IPv6, link-local and embedded-credential Telecom Core targets in the platform handoff.
- [x] Revoked any prior native browser session for the same user before issuing a replacement to limit concurrent credential lifetime.
- [x] Merged, deployed and production-smoke verified the platform-facing native softphone handoff.
- [x] Permanently absorbed Fonus and Popcorn public global-mobile product patterns without copying proprietary code, private rate cards, carrier agreements or branding.
- [x] Added provider-neutral global SIM/eSIM architecture: primary/backup access paths, multi-network selection, app voice/text fallback, multiple-number identity, latency awareness, fair-use economics and a separate `TELECOM_GLOBAL_MOBILE_LIVE=false` truth gate.
- [x] Added owner-only verified-origin global-mobile retail quoting with the existing 20% uplift, explicit evidence confirmation, funded variable-cost caps and no silent paid fallback.
- [x] Added a reusable verified wholesale offer planner that excludes unverified commercial/country coverage and unfunded metered exposure, then prefers the lowest eligible landed retail cost and an independently grouped backup path when available.
- [x] Added executable global-mobile planner QA and Telecom CI/watch-path coverage so the Fonus/Popcorn work is not silently lost or regressed.
- [x] Hardened Asterisk recording stop state so Telecom Core verifies the corresponding stored-recording object, including already auto-completed recordings, without exposing the raw media file.
- [x] Added durable global-mobile launch evidence tables for country capability, verified wholesale offers, primary/backup access profiles and real connectivity observations.
- [x] Changed global-mobile live truth so `TELECOM_GLOBAL_MOBILE_LIVE=true` alone is insufficient; launch additionally requires production-verified country mobile data, a matching authorized/funded active wholesale offer, a matching active primary access profile, recent real connectivity evidence and an active data cost/fair-use policy.
- [x] Added separate multi-network-resilience truth that requires a recently verified backup profile on an independent network group; it is not implied by primary service readiness.
- [x] Added owner Carrier Access workflows to record verified country evidence, verified origin/commercial offer evidence, opaque access-profile references and measured subscriber connectivity without storing eSIM activation/authentication secrets.
- [x] Added executable global-mobile live-proof QA and Telecom CI coverage.
- [x] Added Magnanimous-owned one-time mobile enrollment tokens: 256-bit CSPRNG material, returned once, stored only as SHA-256 hashes, short-lived, auditable, atomic one-time redemption, prior-token revocation on replacement, and explicitly not carrier/SM-DP+/Ki/OPc/ADM credentials.
- [x] Added durable independent-backup failover proof. It requires a recorded primary detach/failover event, a later successful event on a backup profile, different network groups, and a durable evidence reference before multi-network resilience is marked verified.
- [x] Sent real no-spend commercial onboarding inquiries to Gigs, Telna and 1GLOBAL and preserved the acquisition state in `docs/GLOBAL-MOBILE-CARRIER-ACQUISITION-2026-09-26.md`.
- [x] 1GLOBAL opened onboarding/support case `02547094`; Gigs Support requested the sales contact path and received a same-thread follow-up containing the business email `Godmattersinc@iammagnanimousway.com` with a request for direct Sales/MVNO onboarding routing.
- [x] Located the official Fonus reseller application; did not submit invented phone/address data into its required form.
- [x] Sent an NTC Region VII pre-application classification request covering VoIP/VAS/reseller/mobile-host-network scope, current Form NTC 1-20 use, documentary/fee/bond/capital requirements and whether a branded SIM/eSIM offer needs additional VNO/MVNO authority. No regulatory grant is claimed.
- [x] Prepared `docs/PHILIPPINE-TELECOM-REGULATORY-PREFILING-2026-09-26.md` with the current public NTC filing path, provider/reseller research baseline, SIM-registration boundary, technical package structure and explicit entity-specific blanks that cannot be fabricated.
- [x] Sent a direct Fonus reseller/global-mobile inquiry to the current official `support@fonus.me` contact after the public reseller form required phone/address fields that should not be invented; no spend or activation was performed.
- [x] Fonus confirmed the reseller submission, supplied direct commercial contact `zhac@fonusmobile.com`, and the detailed no-spend wholesale/API/compliance inquiry was sent there; await agreement/rate/provisioning response.
- [x] Added a native owner-only Global Mobile Carrier Acquisition pipeline backed by `telecom_mobile_partner_acquisition`, seeded from the real Gigs/Telna/1GLOBAL/Fonus outreach state, with case/evidence/pricing/agreement/sandbox/country/capability/next-action fields.
- [x] Carrier acquisition records reject API keys, passwords, tokens and activation secrets; `contract_verified` is fail-closed unless an agreement-grade commercial reference is present.
- [x] Submitted the official Gigs sales/MVNO contact form successfully using the business email and truthful previously provided contact details; run evidence `0fbee7e5-a0af-4e02-b9ce-9a7b308fc42f` is preserved and the next action is to await the partnerships/sales response.
- [x] System-seeded partner acquisition rows may receive newer verified baseline updates only while `updated_by='system-seed'`; owner-edited rows are not overwritten by future seed refreshes.
- [x] Added executable carrier-acquisition QA and Telecom CI/deep-architecture locks.
- [x] Requested Gigs no-charge test project/API access in-thread after the official sales form submission; recorded that Gigs test SIMs support integration testing but do not provide real network connectivity and therefore cannot satisfy the live subscriber-connectivity gate.
- [x] Followed up 1GLOBAL case `02547094` requesting agreement-grade authority, platform/sandbox credentials, Philippines eligibility, wholesale pricing/fair-use, a later real trial eSIM and independent backup-path details.
- [x] Replied to Fonus after the direct commercial handoff and requested any application/case reference plus the missing agreement/rate/provisioning/country/trial-connectivity evidence.
- [x] Extended the owner Carrier Access states with `test_access_requested`, `case_followed_up` and `sales_contacted`; sandbox/test references are explicitly separated from production/live-network proof.

Intentionally gated follow-on work, not falsely marked live:
- [ ] Deploy a dedicated public Telecom Core host/domain with trusted WSS TLS and required SIP/RTP exposure. No paid host has been created by this work.
- [x] Complete a real browser SIP registration plus two-way audio/media verification in CI against the actual owned Asterisk stack.
- [ ] Configure the public host's GitHub variables/secret and run `Public Telecom WebRTC Verification` from the external GitHub runner.
- [ ] Repeat browser registration + two-way RTP on the dedicated public Telecom Core host with a trusted public certificate and real network/NAT path; only then set `TELECOM_NATIVE_WEBRTC_LIVE=true`.
- [x] Migrate the main agent softphone to the verified native WebRTC client for approved internal calling while preserving the compatibility SDK as the PSTN fallback.
- [x] Migrate the protected Magnanimous Telecom Core outbound bridge to the planner's explicit selected-route contract. The Core now allowlists the selected PJSIP endpoint, checks it through authenticated Asterisk ARI health before origination, carries route/interconnect IDs into the call, and prevents a planner-selected attempt from silently failing over to another trunk. The route payload is not sent to a generic outside BYOC origin.
- [x] Migrate explicit Twilio/Plivo carrier route types to Magnanimous planner execution. When a tenant has matching carrier routes, the selected compatibility adapter must be configured, pass an authenticated account-health check, and execute with route/interconnect attribution; unhealthy, unfunded or unsupported selections fail closed.
- [ ] Migrate the remaining generic BYOC compatibility path and retire no-route legacy Plivo/Twilio fallback only after affected tenants have explicit route configuration. Until then `live_execution_uses_route_planner` remains false even though configured Twilio/Plivo routes and the protected Telecom Core are planner-controlled.
- [x] Implement the consent-gated Stasis supervision/recording software path: private ARI event stream, monitor/whisper/barge snoop bridge, headless bridge recording, owner/admin controls, explicit consent + notice + jurisdiction gates, tenant audit tables, UI controls, unit tests and cleanup locks. Source implementation alone does **not** make the feature production-live.
- [x] Add a guarded external Stasis verification harness: `Telecom Stasis Live Verification` plus `telecom-core/scripts/verify-supervision-live.py` now require a real HTTPS Telecom Core target, protected API token, active consented call channel, explicit consent/notice confirmation, negative-gate proof, evidence artifact and cleanup; monitor/whisper/barge lifecycle remains additionally blocked behind `TELECOM_NATIVE_WEBRTC_LIVE=true`.
- [ ] Run that Stasis verification on the real Telecom Core host with an active native call and registered supervisor endpoint: prove recording beep/start/stop and cleanup, then prove monitor/whisper/barge bridge lifecycle and **observe the actual acoustic behavior** on the consented call. Only after that evidence may `ASTERISK_SUPERVISOR_CONTROL_ENABLED=true` be promoted for ordinary production use. Browser supervisor audio additionally remains blocked until `TELECOM_NATIVE_WEBRTC_LIVE=true` passes the separate external public-host proof.
- [ ] Keep `TELECOM_GLOBAL_MOBILE_LIVE=false` until the new durable proof gates can be populated from real external evidence: an authorized mobile/MVNO/eSIM agreement, production-verified country capability, actual provider-issued eSIM/SIM profile, real subscriber data connectivity, active fair-use/spend controls and applicable regulatory requirements. The runtime now refuses to honor the flag without those records.
- [ ] Obtain real commercial wholesale quotes/contracts for candidate global-mobile providers before generating customer sell prices; Fonus retail pricing and Popcorn retail pricing remain benchmarks, not origin cost.
- [ ] Connect and verify at least one authorized primary mobile adapter and an independently grouped backup path before claiming multi-network production resilience.
- [ ] Obtain required NTC/FCC/other authorizations, carrier agreements, numbering/emergency-service arrangements before representing those regulated capabilities as live.

## Production verification

**SUCCESS for the completed software/runtime scope.**

Latest verified authoritative production commit before this new global-mobile-proof branch:
- `fddcdfe841f37b38f7f8f3f4b3eb1591a065b533` — PR #450, stored-recording hardening + Fonus/Popcorn global-mobile architecture.

Existing Railway production service:
- project: `88bfb25b-3b34-40bd-87cb-188549b96a43`
- environment: `3cb0deba-a700-4fdb-a92d-d7da98172f1e`
- service: `71f6ecd9-4114-4431-8796-3fe4395bfd95`
- exact runtime deployment: `b06c880a-43a8-4924-8808-6716a2ffa309`
- deployed commit: `fddcdfe841f37b38f7f8f3f4b3eb1591a065b533`
- status: **SUCCESS**
- no new Railway project or service was created.

Latest native softphone main commit:
- `9a0c5e6cc97cff324ae409142c9329e70f9875fe`

Ephemeral native browser-session foundation:
- `a5e6fc85772db42d95c6ee9cc397fdf330f11f71`

Public-host-readiness foundation:
- `5b7eb689547f8c8a100f40b2b937ddfdd3a607eb`

Native WebRTC proof foundation commit:
- `4db2487c3a4d734aa3b9938e8085646687631786`

Previous smoke-hardening main commit:
- `5674b48199e6839128ce43c59165aafeb5d9cc30`

Verified GitHub runs:
- Full Platform QA: `35963686293` — SUCCESS
- Railway exact-commit gate: `35963686238` — SUCCESS
- Build and Deploy I AM: `35963686281` — SUCCESS, including production smoke
- Verify Magnanimous Telecom Production: `35963896100` — SUCCESS
- Voice Conversation Production Smoke: `35963896097` — SUCCESS
- Native WebRTC Browser Media E2E (merged main): `35966916101` — SUCCESS
- Full Platform QA (merged main): `35966916059` — SUCCESS
- Magnanimous Telecom Core Verification (merged main): `35966916332` — SUCCESS
- Build and Deploy I AM (merged main): `35966916377` — SUCCESS, including production smoke
- Railway exact-commit classification (merged main): `35966916148` — SUCCESS; no standalone Railway redeploy required for this Telecom Core/QA-only change
- Public-host readiness Native WebRTC E2E (merged main): `35970463254` — SUCCESS
- Public-host readiness Full Platform QA (merged main): `35970463281` — SUCCESS
- Public-host readiness Telecom Core Verification (merged main): `35970463221` — SUCCESS
- Public-host readiness Build and Deploy I AM (merged main): `35970463398` — SUCCESS, including production smoke
- Public-host readiness Railway exact-commit classification: `35970463109` — SUCCESS; no new standalone Railway service/deployment required
- Ephemeral browser sessions Native WebRTC Browser Media E2E (merged main): `35973304332` — SUCCESS
- Ephemeral browser sessions Full Platform QA (merged main): `35973304380` — SUCCESS
- Ephemeral browser sessions Build and Deploy I AM (merged main): `35973304388` — SUCCESS
- Ephemeral browser sessions Railway exact-commit gate (merged main): `35973304408` — SUCCESS
- Native softphone handoff Full Platform QA (merged main): `35976682261` — SUCCESS
- Native softphone handoff Standalone Release: `35976682142` — SUCCESS
- Native softphone handoff Railway exact-commit gate: `35976681990` — SUCCESS
- Native softphone handoff Build and Deploy I AM: `35976682107` — SUCCESS, including production smoke

Production smoke evidence included successful White Label depth, Agent Mesh, billing, AI Receptionist, Contact Center capabilities, Contact Center softphone readiness, Magnanimous health, auth revocation and cleanup. On the native softphone rollout, Railway HTTP evidence showed `/__magnanimous_runtime/health`, `/api/contact-center/capabilities`, `/api/contact-center/softphone/config`, billing, Agent Mesh, White Label, CRM, inbox and auth smoke probes returning their expected statuses.

Native WebRTC proof on the latest public-host-readiness merged main used real Chromium and the actual owned Asterisk 22.11.0 stack. The browser registered extension `1100`, the authenticated diagnostic call reached `Established`, Asterisk confirmed the registered contact and Echo media channel, and Chromium reported `784` inbound bytes / `784` outbound bytes, `10` packets in each direction, and `1` remote audio track with no error. This proves the native browser/Asterisk software-media path still works after the stricter certificate and public-address changes. `TELECOM_NATIVE_WEBRTC_LIVE` remains deliberately **false** until the public external workflow passes against a dedicated public Telecom Core host with a trusted public WSS certificate and real network/NAT path.

## Public host investigation — 2026-09-24

The platform-facing native softphone handoff is merged and deployed. The remaining blocker is external public Telecom Core hosting, not application code.

Verified infrastructure state:
- Railway production still contains the existing purpose-specific services `magnanimous`, `sandbox`, `browser-egress`, `browser`, and `media`; none should be repurposed because that would risk working functionality.
- Railway public networking supports HTTP/HTTPS and public TCP proxying, while UDP is available on Railway private networking only. The current direct public Asterisk RTP design therefore cannot be truthfully marked live on the existing Railway public edge without a different TURN/relay architecture.
- DigitalOcean connector currently exposes no Droplets, no SSH keys, and no billing history, while the account reports its Droplet quota as already full. A fresh 2026-09-24 account re-check still reports `droplet_limit: 3`, zero listed Droplets, zero SSH keys, zero billing history, and account status `warning` with the control-panel message that the team has created the maximum allowed number of Droplets. Do not create or assume a DigitalOcean host until that account inconsistency is resolved.
- The connected BasicDeploy account is on the free plan and currently has one sleeping container. Its documented public ingress is an HTTPS proxy to container port `8080`; free containers sleep when idle, custom domains are unavailable on Free, and the platform does not expose a directly reachable public UDP RTP range. It therefore does not satisfy the current Asterisk public RTP host requirement.
- A fresh Railway re-check still shows only the five existing purpose-specific services `magnanimous`, `sandbox`, `browser-egress`, `browser`, and `media`. The existing production deployment remains healthy. One unrelated staged service-config patch is present and was deliberately left untouched because it is outside this telecom-host activation and must not be accidentally applied as part of the RTP work.
- Among the connected host-capable services actually inspected in this pass (Railway, DigitalOcean and BasicDeploy), no already-existing, no-additional-cost host satisfies all required conditions: stable public IPv4, trusted public WSS/TCP, directly reachable public UDP RTP, DNS control and safe dedicated use for Telecom Core.
- No paid VPS, new Railway service, carrier resource, number, or other billable telecom infrastructure was created during this investigation.
- Additive TURN/TLS relay source support is now prepared: Telecom Core can derive short-lived per-browser TURN REST credentials from a server-only shared secret, the platform validates and proxies only TURN/TURNS ICE URLs, the native SIP.js client consumes session-scoped ICE servers and an explicit `relay`/`all` policy, and the Chromium proof accepts the same ICE policy. Relay-only mode remains disabled by default and fails closed when TURN is incomplete.
- The strict public verification workflow can now accept optional relay ICE configuration so a future relay deployment can prove real two-way browser media instead of being treated as live from source configuration alone.
- An owned coturn relay runtime is versioned as an opt-in Compose profile (`turn-relay`) pinned to coturn `4.18.0-r0`. It requires TLS plus secret-backed REST authentication, keeps browser ingress TCP/TLS-first, preserves UDP relay for Asterisk media, and stays disabled during ordinary Compose startup.
- Railway's current documented networking makes a separate relay topology technically testable: raw public TCP can reach a TURN TLS listener through TCP Proxy while service-to-service private networking supports UDP. No telecom-specific Railway service was created because that would cross the paid/new-infrastructure approval gate and the existing five production services must not be repurposed.
- No TURN service has been provisioned or marked production-live. `TELECOM_NATIVE_WEBRTC_LIVE` remains false until the external Chromium proof succeeds using the actual production ICE policy.
- PR #388 merged to main as `d4fdb3f9e8f903cb4f3b807adaa8a7897047192d` with the gated native TURN relay readiness work. All PR checks passed, including the dedicated real coturn build/start lock, Python, Full Platform QA, Telecom Core Verification, Owned SIP/PSTN Core, Standalone Release, and real Chromium two-way WebRTC media.
- The same merged runtime commit was deployed to the existing Railway `magnanimous` service as deployment `ddcb4f0a-997d-48f9-8f2d-75c81230a694` with status `SUCCESS`. No new Railway service/project/resource was created and the unrelated staged Railway patch `2b95647a-be11-4359-a3ca-cd8e63cd9edd` remained untouched.
- Post-merge `Magnanimous Railway Exact Commit Deploy` passed for `d4fdb3f9e8f903cb4f3b807adaa8a7897047192d`, and `Build and Deploy I AM` completed successfully including the production smoke test after the standalone session plane reported the exact merged runtime revision.
- PR #391 merged as `477db51644edd9ebb09435c7a0879a7e5f0fb4fd`, adding the guarded free-first OCI Always Free A1 host path. The repository now includes a read-only OCI metadata/public-IP preflight, an OCI activation guide, and a native ARM64 build lock.
- OCI ARM64 verification passed on the PR and merged main. Merged-main run `35987050660` built Asterisk 22.11.0, Telecom Core API, Kamailio SIP core, coturn 4.18.0-r0 and PostgreSQL on GitHub's native ARM64 runner, validated the guarded Compose model, and proved the A1 preflight accepts the required profile while rejecting the undersized E2.1.Micro/private-only cases.
- Merged-main Native WebRTC Browser Media E2E `35987050143` passed after the OCI additions, and Full Platform QA `35987050407` passed. The OCI changes did not alter the production web runtime: Build and Deploy I AM `35987050093` classified the change as non-runtime and skipped deployment, while Railway exact-commit gate `35987050048` confirmed no standalone Railway deployment was required.
- OCI A1 is therefore source-verified as the current free-first public-host option, but **no OCI tenancy/VM has been created and no production Telecom Core is live there**. Oracle account creation and any required phone/card verification are unavoidable user-only external actions. `TELECOM_NATIVE_WEBRTC_LIVE` remains false.
- PR #394 merged as `899455de49c6e3d963fe64ef152acba3a8f7d118`, fixing a race where Voice Conversation Production Smoke could read `Deploy Worker` before GitHub finalized step metadata. PR #395 then merged as `7498548dddbffe46bef38f6adfd1d121509c2162`, correctly treating a fully skipped deploy job as a no-runtime-change release. Live production voice smoke run `35988129960` passed the repaired skipped-deploy path instead of reporting a false failure.
- PR #396 merged as `f65b748543d44f420bd8e9b01e6b511a3c46c19c`, adding guarded OCI Terraform provisioning under `telecom-core/oci/`. The module pins Terraform 1.16.4 and OCI provider 8.29.0, hard-codes `VM.Standard.A1.Flex` at 2 OCPUs / 12 GiB RAM / 50 GB boot, creates only the VCN/public-subnet/IGW/minimal security-list/NSG rules plus one public A1 instance, and contains no paid-shape fallback. The fail-closed plan verifier rejects unknown create types, shape/CPU/memory/boot drift, private-only networking and multiple instance creates. Merged-main Terraform guard `35989471740`, ARM64 stack proof `35989471726`, Native WebRTC E2E `35989471901`, Build and Deploy I AM `35989471598`, Railway exact-commit gate `35989471719`, Voice Conversation Production Smoke `35989491924`, and Verify Magnanimous Telecom Production `35989491903` all passed.
- PR #398 merged as `6269a76a71432afa0ab8d8cb5c64befd0714c11e`, adding the preferred browser-only OCI Cloud Shell activation path. `telecom-core/oci/cloud-shell-plan.sh` uses Oracle Cloud Shell's signed-in OCI session, defaults to plan-only mode, generates a Cloud-Shell-only Ed25519 key if needed, requires restricted `ADMIN_SSH_CIDR`, installs/verifies the pinned Terraform version only when needed, validates the module, runs unit tests and `verify_free_plan.py`, and requires a separate explicit `--apply` invocation. It never uses `terraform apply -auto-approve`.
- Post-merge verification for `6269a76a71432afa0ab8d8cb5c64befd0714c11e` is green: OCI Terraform Free Guard `35991052221`, OCI ARM64 Telecom Lock `35991052254`, Native WebRTC Browser Media E2E `35991052277`, Telecom Core Verification `35991052184`, Owned SIP/PSTN Core Lock `35991052214`, Full Platform QA `35991052272`, Railway Exact Commit Deploy `35991052154`, Build and Deploy I AM `35991052325`, Voice Conversation Production Smoke `35991072758`, and Verify Magnanimous Telecom Production `35991072810` all passed.
- The deployment classifier correctly treated PR #398 as control/infrastructure-only: no Worker runtime deploy and no Railway standalone runtime deploy were required. The existing production runtime and staged unrelated Railway patch remained untouched.

Exact next external action:
- create/sign in to an Oracle Cloud tenancy; account creation, identity verification, and any required phone/card verification are the only remaining unavoidable user-only setup step;
- from OCI Cloud Shell, clone the repository, set a trusted `ADMIN_SSH_CIDR`, and run `bash telecom-core/oci/cloud-shell-plan.sh`; this performs a **plan only** and creates nothing;
- after reviewing the verified free-profile plan, rerun `bash telecom-core/oci/cloud-shell-plan.sh --apply` to create only the guarded A1 host/network. If Always Free A1 capacity is unavailable, stop or change only the availability-domain index—do not silently switch to a paid shape;
- then point the Telecom DNS hostname to the Terraform `public_ip` output, run `telecom-core/deploy/oci-always-free-preflight.sh`, configure trusted TLS + protected Telecom Core secrets, start the already-verified Asterisk/Kamailio/control API stack, and run `Public Telecom WebRTC Verification`;
- only after the external GitHub-hosted Chromium proof is green may `TELECOM_NATIVE_WEBRTC_LIVE=true` be promoted.

## Unfinished work / exact resume point

If interrupted, resume from this file first.

The completed deep software/production pass, native Chromium/Asterisk media proof, ephemeral native browser sessions, platform server handoff, SIP.js agent softphone migration, selected-route execution through the protected Telecom Core and explicit Twilio/Plivo routes, TURN readiness, OCI A1 preflight/ARM64/Terraform/Cloud Shell work, and the merged consent-gated Stasis supervision source path should **not** be recreated. The new guarded real-host Stasis verifier is the remaining software-side evidence harness; its workflow still requires a real public Telecom Core, protected API token and active consented call. Public browser supervisor audio remains blocked until the existing external public WebRTC workflow passes and `TELECOM_NATIVE_WEBRTC_LIVE=true` is truthfully promoted. Real-host Stasis recording/lifecycle evidence and observed acoustic monitor/whisper/barge behavior must then pass before `ASTERISK_SUPERVISOR_CONTROL_ENABLED=true` is promoted for ordinary production use. If OCI Always Free A1 capacity is unavailable, do not substitute a paid shape without a separate explicit cost review/approval.

Rules:
- do not recreate PRs #367-#382;
- do not create a new Railway project/service for the existing Magnanimous web runtime;
- do not enable a paid carrier, buy numbers, or activate paid telecom resources without the applicable explicit approval gate;
- do not mark native WebRTC, emergency calling, direct numbering, supervisor whisper/barge, a carrier interconnect, or regulatory authority live without direct evidence;
- do not route production calls through a newly selected carrier merely because it is cheaper on a public rate card; require actual account/contract rate, health and route verification.

## Recovery rule

Git commits/branches/PRs/CI/deployment IDs are the authoritative development record. This checkpoint preserves the task, decisions, completed work, verification evidence and next safe actions. It does not claim to control or prevent the ChatGPT client transport itself from showing a streaming interruption, and it does not pretend that every raw chat token is copied into Git.

- [x] 1GLOBAL case `02547094` sent an automated case-updated notice without the requested commercial/technical evidence; Magnanimous replied again requesting a named Connect / Embedded Telco owner and the outstanding agreement, Philippines, sandbox, pricing, real-trial-eSIM and backup-path evidence (`gmail:1a0dbcee2745d3d6`).

- [x] Fonus Support explicitly confirmed that Zhac will handle the reseller concern; Magnanimous acknowledged once and advanced Fonus to `sales_handoff` while awaiting substantive commercial terms (`gmail:1a0dbcecffc2054a`, reply `gmail:1a0dbd4cd3dd3738`).
- [x] 1GLOBAL sent another identical automated case-update notice (`gmail:1a0dbcf10d0bce25`); Magnanimous recorded it but deliberately suppressed a duplicate reply to prevent an automated email loop while case `02547094` remains open for a human/substantive response.

- [x] Sent focused NTC Region VII follow-up requesting routing through the Negros Oriental/Dumaguete licensing path and current classification/form/requirements/mobile-authority guidance (`gmail:1a0dbdbdf4a77102`).
- [x] Sent focused Telna CSP/eSIM qualification follow-up requesting Philippines network/IMSI eligibility, white-label agreement, sandbox/trial access, wholesale economics, compliance allocation and independent backup proof (`gmail:1a0dbdbf2f5daf4a`).
- [x] Added native 15-minute Telecom carrier/regulator Gmail watch using the platform's existing Google OAuth read/send connection, durable message-id dedupe, six-hour thread cooldown, automated-ack suppression, consequential-action non-acceptance, threaded replies, partner-evidence updates, owner-only status/manual-run endpoints and CI safety locks.
- [x] Opened Philippine host-network path with PLDT Enterprise / Smart via official business-development email, requesting reseller/MVNO/VNO agreement, NTC-required carrier evidence, SIM/eSIM/API provisioning, Philippine compliance allocation, wholesale economics, trial profile and backup-network guidance (`gmail:1a0dbe42b953cad0`).
- [x] Opened Philippine host-network path with DITO via official partner inquiry email with the same lawful reseller/MVNO/VNO, SIM/eSIM/API, NTC, pricing, trial and backup-network evidence request (`gmail:1a0dbe434a054d64`).
- [x] Extended native Telecom Gmail monitoring and carrier acquisition state to PLDT/Smart and DITO domains/records.
- [x] Added owner Telecom dashboard `Carrier + NTC Correspondence` monitoring panel with last-run/action/error state, recent non-secret evidence classifications and a safe `RUN WATCH NOW` action; OAuth tokens and message bodies remain hidden.
- [x] Opened parallel pre-qualification/quote requests for the ₱1,000,000 NTC VoIP Reseller bond fallback with Prudential Guarantee (`gmail:1a0dc0955ece2695`), Pioneer (`gmail:1a0dc096f7476354`), Stronghold (`gmail:1a0dc097acde8cc9`), Sterling (`gmail:1a0dc098882233f4`) and GSIS (`gmail:1a0dc0997d793b26`), asking for premium, taxes/fees, collateral, entity documents, indemnitors and NTC-specific bond wording. No issuance/payment/collateral was authorized.
- [x] Extended native Telecom email monitoring to the surety-provider domains so bond quote replies receive the same message-id dedupe, auto-ack suppression, six-hour thread cooldown and consequential-action non-acceptance protections.

- [x] Magnanimous Call Center and Magnanimous Telecom are now treated as one operating system: the Call Center is the anchor customer/workload, and Telecom is its owned communications backbone. Separate legal launch gates remain fail-closed for internal BPO use, B2B telecom resale, and public/global mobile/internet service.
- [x] Added `docs/CALL-CENTER-TELECOM-UNIFIED-LAUNCH-2026-09-26.md` with corporate, labor, privacy, NTC, carrier, bond, PEZA/incentive and public/global go-live dependencies.
- [x] Sent NTC Region VII the combined three-phase classification request (`gmail:1a0dc190299513a6`) covering own-call-center use, B2B hosted telecom for other call centers, and future public/global telephone/mobile/internet service.
- [x] Sent PEZA pre-qualification for integrated BPO/call-center + software activity and separate NTC-regulated telecom (`gmail:1a0dc193b98749b8`).
- [x] Sent National Privacy Commission pre-registration request for DPO/DPS, call recording/transcription, AI QA/profiling, PIC/PIP and cross-border processing guidance (`gmail:1a0dc196b53d7c60`).
- [x] Extended the native compliance email watcher to PEZA, NPC, DOLE and BOI domains while preserving dedupe, auto-ack suppression, six-hour thread cooldown and no-contract/no-payment boundaries.
- [x] Sent BOI pre-qualification for domestic-market contact-center, AI/software and mixed Philippine/global customer incentive treatment under current Strategic/Knowledge-Based Services guidance (`gmail:1a0dc1d5f82d796b`).
- [x] Confirmed Bayawan one-business/BOSS inquiry and Prudential coordinated-insurance inquiry were successfully sent despite the earlier batched Gmail connector error; no duplicate resend was needed.
- [x] Sent SEC one-corporation pre-filing guidance request asking whether BPO/call-center can be primary with AI/software/SaaS and NTC-regulated telecom as secondary purposes under one domestic corporation (`gmail:1a0dc2c822aa26e2`).
- [x] Extended the native compliance watcher to SEC, SBCorp, DICT, DOST, NDC, QBO and the exact Bayawan City Gmail address without broad-watching gmail.com.

- [x] Added `docs/ONE-COMPANY-COMPLIANCE-MASTER-2026-09-26.md` as the permanent one-corporation/multi-license legal and technical master: one SEC/BIR/accounting/domain identity, separate regulator-issued certificates where legally required, Bayawan local permits, NTC phases, privacy/labor stack, coordinated insurance strategy, funding sequence, current production Telecom blockers and truth gates.
- [x] Confirmed Bayawan BOSS/investment inquiry sent (`gmail:1a0dc35eeddb1e6c`) and clean Prudential coordinated-insurance + separate NTC surety inquiry sent (`gmail:1a0dc366a7d814c2`).
- [x] SEC retired the old CPRD registration mailbox and directed corporate-registration inquiries to SEC iMessage; do not treat the automated reply as a filing or approval.
