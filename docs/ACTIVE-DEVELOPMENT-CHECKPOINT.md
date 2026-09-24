# Active Development Checkpoint

Last updated: 2026-09-24
Repository: IAMGodmatters/IAMMagnanimousway.js
Production: https://iammagnanimousway.com/
Current base before this work: `5278519e54416a99936fffc0e5826be47c4e7545`
Active branch: `fix/deep-telecom-architecture-2026-09-24`

## Original task

Complete a through-and-through deep study of the telecom, carrier, PBX/SIP, browser calling, contact-center, call-center UX, routing, resilience, pricing and regulatory structure. Compare relevant carrier, CPaaS, SIP, PBX, media and CCaaS patterns, then apply the useful findings to Magnanimous without replacing working functionality or making a third party the product identity.

Also preserve enough durable state that a chat or streaming interruption cannot erase the development task, decisions, completed work, verification evidence or exact unfinished next actions.

## Permanent architecture decisions

- Magnanimous AI remains the brain, policy, orchestration, memory, verification and decision layer.
- Magnanimous Telecom / Magnanimous Carrier remain the public communications identity.
- Upstream PSTN/SIP carriers are replaceable transport, not the owner of the customer experience.
- Free browser-to-browser calling is preferred when both endpoints can use the platform.
- The owned telecom core remains Asterisk for PBX/media/features plus the existing Magnanimous Kamailio SIP core; RTPengine/SBC scale components are additive when traffic requires them.
- Native browser-agent WebRTC should move toward the owned Asterisk/Kamailio core instead of making a metered compatibility SDK the permanent agent-phone dependency.
- Live carrier selection must eventually use measured quality + rate + health by destination rather than a single globally hard-coded carrier.
- Provider credentials alone never count as a live route.
- Regulated public VoIP/carrier status, numbering rights, emergency-service authority and interconnect authority are external legal/contractual facts and must never be inferred from source code.

## Deep-research findings being applied

- Asterisk supports browser WebRTC through secure WebSocket signaling plus DTLS-SRTP/ICE and provides ARI bridge, recording and snoop primitives suitable for native supervisor features.
- The repository already contains a WSS transport placeholder, but Asterisk HTTP/TLS is currently localhost-only with TLS disabled, so the native WebRTC target is not yet a usable production transport.
- The current route planner supports balanced / least-cost / priority planning, but live outbound execution is still partly selected by runtime-provider readiness rather than the planner's measured route decision.
- Current carrier comparison supports a multi-carrier strategy: Telnyx is a strong programmable SIP/network candidate, Plivo can be economically useful on some Philippines routes, Twilio remains a broad compatibility path, and Bandwidth/SignalWire are useful additional candidates by geography/contract. No carrier is universally best.
- Philippines NTC rules require a truthful separation between software/contact-center capability and actual public VoIP provider/reseller authority.

## Completed before this checkpoint

- PR #367 / commit `3d39a225188bd975f2a2ba2a11e0c7472f87fc70`: full platform/provider/contact-center/telecom audit and runtime wiring.
- PR #368 / commit `2ae52c5cdf029affdd3da0816a473cd7473b8865`: hardened transient non-mutating production validation probes.
- PR #369 / commit `5278519e54416a99936fffc0e5826be47c4e7545`: aligned compatibility softphone with Magnanimous Carrier contract.
- Final production deployment for that base was verified successful before this new deep pass.

## Active work

Completed on the active branch:
- [x] Replaced the unusable WSS placeholder with gated Asterisk WSS + TLS + DTLS-SRTP + ICE + RTCP mux + Opus source configuration.
- [x] Preserved ordinary Kamailio/SIP behavior and kept WebRTC disabled by default until verified.
- [x] Removed the hard-coded public STUN dependency; STUN is now optional and operator-selected.
- [x] Added route-quality telemetry contracts (ASR, ACD, PDD, network failures, sample floor and freshness) with configured-quality fallback.
- [x] Enforced route maximum-rate policy in carrier selection.
- [x] Expanded carrier candidate types without changing Magnanimous public identity.
- [x] Updated the owner telecom/network surface to show the owned core, native WebRTC truth state, carrier candidates and measured route metrics.
- [x] Kept the compatibility softphone rail and exposed native-vs-compatibility readiness truthfully.
- [x] Added and wired the durable development checkpoint QA lock.

Still required before this branch is complete:
- [ ] Expand permanent telecom QA locks for the new WSS/TLS, telemetry, rate-cap and UI truth contracts.
- [ ] Version the deep research/architecture evidence with current carrier, Asterisk, CCaaS and NTC references.
- [ ] Run source/build/QA on the branch and fix any failures.
- [ ] Merge only when CI is green.
- [ ] Deploy the existing production service and verify exact-commit production smoke.
- [ ] Do not mark native WebRTC live until a dedicated Telecom Core host/domain/TLS endpoint completes real browser registration and two-way media verification.
- [ ] Do not move legacy live carrier adapters behind route-plan execution until each adapter has an explicit selected-route mapping and authenticated health proof.

## Production verification

Do not write SUCCESS here until the exact new merge commit has passed CI, deployment and production smoke. The verified production baseline entering this work is `5278519e54416a99936fffc0e5826be47c4e7545`.

## Unfinished work / exact resume point

If interrupted, resume from this file first. Then:
- inspect the active branch diff against main;
- continue the first unchecked item in **Active work**; currently that is expanding the permanent telecom QA locks;
- do not recreate already-merged PRs #367-#369;
- do not create a new Railway project/service;
- do not enable a paid carrier or purchase numbers without an explicit paid-action gate;
- do not mark native WebRTC, emergency calling, direct numbering, supervisor whisper/barge or a carrier route live without runtime evidence.

## Recovery rule

Git commits/branches/PRs/CI/deployment IDs are the authoritative development record. This checkpoint preserves the task, decisions, work state and next actions. It does not claim to control or prevent the ChatGPT client transport itself from showing a streaming interruption, and it does not pretend that every raw chat token is copied into Git.
