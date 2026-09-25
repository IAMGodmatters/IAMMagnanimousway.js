# Active Development Checkpoint

Last updated: 2026-09-24
Repository: IAMGodmatters/IAMMagnanimousway.js
Production: https://iammagnanimousway.com/
Status: **Deep telecom/carrier/contact-center software architecture pass completed; native Chromium↔Asterisk WebRTC registration and bidirectional media proof is merged and verified; strict public-host readiness is merged; ephemeral per-browser SIP sessions and the platform-facing native SIP.js softphone handoff are merged, deployed, and production-smoke verified. Actual public-host activation remains separately gated.**

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

Intentionally gated follow-on work, not falsely marked live:
- [ ] Deploy a dedicated public Telecom Core host/domain with trusted WSS TLS and required SIP/RTP exposure. No paid host has been created by this work.
- [x] Complete a real browser SIP registration plus two-way audio/media verification in CI against the actual owned Asterisk stack.
- [ ] Configure the public host's GitHub variables/secret and run `Public Telecom WebRTC Verification` from the external GitHub runner.
- [ ] Repeat browser registration + two-way RTP on the dedicated public Telecom Core host with a trusted public certificate and real network/NAT path; only then set `TELECOM_NATIVE_WEBRTC_LIVE=true`.
- [x] Migrate the main agent softphone to the verified native WebRTC client for approved internal calling while preserving the compatibility SDK as the PSTN fallback.
- [ ] Map every live carrier adapter to explicit selected-route execution and authenticated carrier health before allowing the route planner to control all production calls.
- [ ] Implement/verify the full Stasis-managed native bridge lifecycle before activating supervisor monitor/whisper/barge and bridge recording.
- [ ] Obtain required NTC/FCC/other authorizations, carrier agreements, numbering/emergency-service arrangements before representing those regulated capabilities as live.

## Production verification

**SUCCESS for the completed software/runtime scope.**

Latest runtime-changing production commit:
- `9a0c5e6cc97cff324ae409142c9329e70f9875fe`

Existing Railway production service:
- project: `88bfb25b-3b34-40bd-87cb-188549b96a43`
- environment: `3cb0deba-a700-4fdb-a92d-d7da98172f1e`
- service: `71f6ecd9-4114-4431-8796-3fe4395bfd95`
- exact runtime deployment: `438ee35f-b9af-4160-8820-efbe9fe52667`
- deployed commit: `9a0c5e6cc97cff324ae409142c9329e70f9875fe`
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
- Relay-local TURN is peer-isolated: the Tailscale bootstrap pins Asterisk ICE and coturn relay/peer permissions to the host's exact Tailscale IPv4, while coturn denies all other IPv4/IPv6 peers. This protects the LAN/private network from misuse of temporary TURN credentials.
- Free-first alternative identified and source-prepared: an always-on Linux host can colocate Asterisk + coturn and use Tailscale Funnel public TCP/TLS on 443 (WSS), 8443 (TURN/TLS) and 10000 (protected Telecom Core API). This avoids public UDP by forcing TURN relay while keeping coturn-to-Asterisk RTP local. It still requires one-time Tailscale tailnet/Funnel authorization on the host and the strict external Chromium proof before the live flag may change.
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

The completed deep software/production pass, native Chromium/Asterisk media proof, ephemeral native browser sessions, platform server handoff, SIP.js agent softphone migration, TURN readiness, OCI A1 preflight, ARM64 proof, guarded Terraform module, and Cloud Shell plan/apply helper should **not** be recreated. The exact next telecom phase is user creation/sign-in of the Oracle Cloud tenancy, then using the already-versioned Cloud Shell helper to plan/apply the free A1 host, configuring DNS + trusted certificate + protected Telecom Core secrets, running the external public WebRTC workflow, and only after that promoting `TELECOM_NATIVE_WEBRTC_LIVE=true`. If OCI Always Free A1 capacity is unavailable, do not substitute a paid shape without a separate explicit cost review/approval. Once public proof is green, the existing native softphone path can activate without removing the compatibility PSTN fallback.

Rules:
- do not recreate PRs #367-#382;
- do not create a new Railway project/service for the existing Magnanimous web runtime;
- do not enable a paid carrier, buy numbers, or activate paid telecom resources without the applicable explicit approval gate;
- do not mark native WebRTC, emergency calling, direct numbering, supervisor whisper/barge, a carrier interconnect, or regulatory authority live without direct evidence;
- do not route production calls through a newly selected carrier merely because it is cheaper on a public rate card; require actual account/contract rate, health and route verification.

## Recovery rule

Git commits/branches/PRs/CI/deployment IDs are the authoritative development record. This checkpoint preserves the task, decisions, completed work, verification evidence and next safe actions. It does not claim to control or prevent the ChatGPT client transport itself from showing a streaming interruption, and it does not pretend that every raw chat token is copied into Git.
