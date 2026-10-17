# 3CX clean-room capability study for Magnanimous AI / Telecom / Call Center

Date: 2026-10-17

## Purpose

This study extracts publicly documented product patterns, standards, interfaces and operational lessons that can improve Magnanimous AI, Magnanimous Telecom and Magnanimous Call Center without making 3CX part of the platform identity or copying proprietary 3CX implementation code, branding, prompts, templates, UI assets or protected material.

Magnanimous AI remains the brain, identity, memory, reasoning, orchestration, policy and verification layer. Magnanimous Telecom remains the provider-neutral telecom service. Carriers, PBXs, AI providers, media servers and third-party integrations remain replaceable adapters.

## Clean-room and license boundary

- Public 3CX product documentation and release notes are behavioral/reference sources only.
- Public interfaces can inform original interoperable implementations, subject to their published terms and applicable law.
- No proprietary 3CX source code is copied into Magnanimous.
- No 3CX trademark, product identity or customer-facing branding becomes Magnanimous identity.
- The public `3cx/call-control-sdk-ts` repository has a verified MIT license dated 2026. If any substantial code from that repository is ever reused, preserve the MIT copyright and permission notice.
- `3cx/agentic-call-control` is used here as an architectural reference only unless the exact file/revision license is separately verified before reuse.
- Unverified public examples are reference material only, not code-import sources.

## Current 3CX release state researched

As of 2026-10-17, 3CX V20 Update 10 is at Release Candidate stage, build 20.0.10.1716, announced 2026-10-13. It should not be treated as a final production release yet. Update 10 continues the AI and programmability work introduced in its Alpha/Beta stream: native MCP, standalone AI Server, Customer Service AI Agents, AI Call Scripts and Programmable Extensions. The RC also adds Apple Silicon support for private AI transcription, improved firmware/template management, ad-hoc conferencing, department-specific hold music and transcription retry/chunking improvements.

## Capability map absorbed into Magnanimous

### 1. Advanced queue routing

Publicly documented 3CX queue behavior includes Ring All, Prioritized Hunt, Hunt Random Start, Round Robin, Longest Waiting, Least Talk Time, Fewest Answered, Hunt-by-Three random/prioritized, and skill-based variants with availability, time or cumulative escalation.

Magnanimous implementation target:
- ring_all
- prioritized_hunt
- random_start
- round_robin
- longest_idle
- least_talk_time
- fewest_answered
- hunt_three_random
- hunt_three_priority
- skills_ring_all
- skills_random_start
- skills_round_robin
- skills_fewest_answered
- skill escalation modes: availability, time, cumulative

The first provider-neutral route-planning implementation is added in `worker/src/magnanimous-contact-center-advanced.js` and exposed only to authenticated users.

### 2. Queue controls and agent lifecycle

Absorbed patterns:
- caller-requested callback
- automatic callback after timeout
- callback offer after configured wait
- wrap-up time
- maximum callers in queue
- queue priority
- SLA target and breach tracking
- queue login/logout
- status-based and time-based queue participation
- queue supervisors
- queue voicemail
- recording opt-in/out policy
- chat ownership / first-response assignment

Magnanimous already has callbacks, voicemail, agent presence, campaigns, queue structures, daily metrics and call intelligence. These patterns become the target contract for further runtime/UI expansion.

### 3. Supervisor controls

Absorbed patterns:
- monitor/listen
- whisper
- barge
- recording control

Magnanimous rule: these are never simple UI privileges. They require authenticated role authority, tenant and call scope, policy authorization, jurisdiction/consent checks where applicable and immutable audit evidence.

### 4. AI telephony roles

Public 3CX materials use receptionist, personal-assistant and customer-service AI roles, with human handoff, escalation topics, availability checking, spam filtering, abusive/nonresponsive caller handling, fallback when an AI engine is unavailable and configurable prompts.

Magnanimous adaptation:
- receptionist
- personal_assistant
- customer_service
- specialist
- small purpose-specific agents rather than one unrestricted agent
- provider-neutral realtime AI adapters
- explicit knowledge-source scope
- human handoff and topic escalation
- engine fallback
- abuse/spam/nonresponsive policies
- prompt versioning and audit

### 5. AI tool / MCP-style permission model

Public 3CX MCP documentation separates read-only and write/action tools, inherits authenticated-user permissions, and supports client policies such as always allow, needs approval and deny. Its programmable-extension examples expose only explicitly allowlisted MCP tools.

Magnanimous adaptation:
- server-side user/tenant/resource authorization remains authoritative
- deny tools not explicitly allowlisted
- read-only is the preferred default
- write, delete, paid, regulated, recording and supervision actions require explicit approval plus server permission
- client approval cannot increase server authority
- immutable audit for consequential actions
- external MCP servers remain optional adapters and may never bypass Magnanimous policy

The authenticated `POST /api/contact-center/advanced/tool-policy` endpoint implements this fail-closed planning gate.

### 6. Call-control API patterns

Absorbed patterns:
- service principals
- scoped application permissions
- short-lived/scoped tokens
- REST configuration surfaces
- WebSocket/event-driven active-call state
- create/answer/transfer/terminate call-control actions
- webhooks for lifecycle events

Magnanimous keeps provider-specific credentials out of client code and retains Telecom Core as the policy/orchestration boundary.

### 7. Programmable AI extensions

Public 3CX materials show an externally hosted voice application behaving like an extension: bidirectional audio, call-control events and selected tools while telephony remains on the PBX.

Magnanimous adaptation:
- provider-neutral programmable voice workers beneath Magnanimous identity
- bidirectional realtime media adapter
- per-call orchestrator
- provider bridge chosen at runtime
- explicitly allowlisted local/business tools
- transfer/voicemail/end-call controls only after policy authorization
- paid model/provider use remains opt-in with cost controls

### 8. Transcription and call intelligence

Absorbed patterns:
- local/private transcription server
- speaker detection/diarization where supported
- retry transient failures
- chunk large recordings then combine results
- call summary
- sentiment
- topics/action items
- queue/ring-group policy scope

Magnanimous already stores summary, sentiment, topics, action items, QA flags and compliance risk in `cc_call_intelligence`. The target is local/private-first transcription with paid cloud fallback only when explicitly enabled.

### 9. Transcript-to-knowledge learning

Public 3CX guidance turns selected call transcripts into reviewed knowledge sources.

Magnanimous adaptation is stricter:
1. Select relevant calls/transcripts.
2. Reduce obvious PII and secrets.
3. Extract reusable facts, FAQs, objections and approved answers.
4. Remove customer-specific/transient facts.
5. Flag uncertainty.
6. Require human review.
7. Publish only approved knowledge.

Raw transcripts are never automatically promoted into durable Magnanimous knowledge. `POST /api/contact-center/advanced/knowledge-draft` creates a sanitized review draft and always returns `publish_allowed:false`.

### 10. Omnichannel agent inbox

Absorbed target channels:
- voice
- web chat
- browser click-to-call
- SMS/MMS
- WhatsApp
- Facebook messaging
- email
- voicemail

Magnanimous already has interaction/message tables and communications/WhatsApp infrastructure. The design target is one tenant-scoped agent conversation surface with provider-private transport details.

### 11. CRM integration pattern

Absorbed patterns:
- contact lookup
- contact creation
- screen pop
- call journaling
- chat journaling
- activity/disposition synchronization
- OAuth2/API-key/basic adapters with secrets server-side

Magnanimous CRM remains its own platform service; outside CRMs are optional adapters.

### 12. SIP trunk health and interoperability

Absorbed operational pattern:
- validate SIP trunk configuration before calling it production-ready
- inspect signaling, TLS/SRTP and routing health
- surface diagnostic failures rather than silently retrying forever
- track route/provider health separately from customer identity

Magnanimous route selection continues to be health/capability/jurisdiction/cost aware and must prevent duplicate answered calls and duplicate billing during failover.

### 13. SBC / site-edge pattern

Absorbed pattern:
- a local site edge/SBC can aggregate SIP/RTP, simplify NAT/firewall traversal and connect remote phones/sites securely to a cloud control plane.

Magnanimous adaptation:
- replaceable SBC/edge proxy
- TLS SIP and SRTP where supported
- STUN/TURN/WebRTC traversal
- NAT/firewall diagnostics
- explicit ACLs
- no implicit trust path into the rest of the platform
- multi-site/prefix federation as an optional topology, not the public identity

### 14. Department / tenant RBAC

Absorbed pattern:
- permissions and visibility can be scoped by organizational unit and role.

Magnanimous rule:
- tenant separation is mandatory
- role and resource scope are server enforced
- recording/transcript/call-log access is separately permissioned
- AI inherits no more authority than the authenticated principal

### 15. Security and supply-chain lessons

3CX has published security hotfixes and its historic 2023 supply-chain incident. The useful clean-room lesson is architectural, not vendor-specific:
- keep telephony hosts patched quickly
- minimize trust paths
- use TLS/SRTP where possible
- protect endpoints and phone web UIs
- rate-limit and anti-abuse exposed services
- maintain dependency and firmware update paths
- audit privileged access and recording downloads
- isolate secrets
- prefer signed/verifiable/reproducible release evidence
- ensure a compromised voice component cannot pivot into unrelated platform systems

These principles align with Magnanimous permanent security invariants and private-source direction.

## What was implemented in this upgrade branch

1. `worker/src/magnanimous-contact-center-advanced.js`
   - authenticated advanced capability endpoint
   - advanced queue routing planner
   - skills-based escalation planner
   - AI tool allowlist/approval policy evaluator
   - transcript sanitization + human-review knowledge draft pipeline

2. `worker/src/entrypoint.js`
   - mounts the advanced Magnanimous contact-center runtime before the existing contact-center fallback, preserving existing behavior.

3. `worker/src/magnanimous-telecom-knowledge.js`
   - expands Magnanimous AI's provider-neutral telecom/contact-center knowledge and benchmark references.

4. QA/CI lock
   - clean-room boundary
   - runtime mount
   - queue strategy coverage
   - AI permission fail-closed behavior
   - transcript no-auto-publish behavior
   - no 3CX runtime dependency introduced

## Sources reviewed

Primary current/public sources:
- https://www.3cx.com/blog/releases/ai-call-transcription-mac/
- https://www.3cx.com/blog/releases/v20-update-10-beta/
- https://www.3cx.com/blog/releases/native-model-context-protocol/
- https://www.3cx.com/blog/change-log/phone-system-change-log-v20/
- https://www.3cx.com/docs/manual/call-center-queues/
- https://www.3cx.com/docs/mcp-tools-permissions/
- https://www.3cx.com/docs/programmable-extensions/
- https://www.3cx.com/docs/ai-agent-configuration/
- https://www.3cx.com/docs/ai-customer-service-agent/
- https://www.3cx.com/blog/docs/call-transcripts-ai-agent/
- https://www.3cx.com/docs/transcription-engine-server/
- https://www.3cx.com/docs/configuration-rest-api/
- https://www.3cx.com/docs/call-control-api/
- https://www.3cx.com/docs/call-control-api-endpoints/
- https://www.3cx.com/docs/manual/call-processing-script/
- https://www.3cx.com/docs/manual/live-chat/
- https://www.3cx.com/docs/business-chat/
- https://www.3cx.com/docs/manual/whatsapp/
- https://www.3cx.com/docs/whatsapp-sip-calling-integration/
- https://www.3cx.com/docs/crm-integration-guides/
- https://www.3cx.com/docs/crm-integration/
- https://www.3cx.com/docs/3cx-tunnel-session-border-controller/
- https://www.3cx.com/docs/manual/connecting-pbx-bridges/
- https://www.3cx.com/docs/manual/firewall-router-configuration/
- https://www.3cx.com/docs/firewall-checker/
- https://www.3cx.com/docs/manual/access-roles/
- https://www.3cx.com/docs/manual/departments/
- https://www.3cx.com/docs/manual/rights-recordings/
- https://www.3cx.com/docs/manual/advanced-features/
- https://www.3cx.com/blog/docs/pbx-security-best-practices/
- https://www.3cx.com/blog/news/security-hotfix-june-2026/
- https://www.3cx.com/blog/news/security-incident-updates/
- https://github.com/3cx/call-control-sdk-ts
- https://github.com/3cx/agentic-call-control

## Explicit non-goals

- Do not import 3CX as Magnanimous runtime infrastructure merely to imitate features.
- Do not claim Magnanimous is 3CX-compatible unless an actual tested interoperability adapter is added.
- Do not copy proprietary source or UI.
- Do not bypass telecom regulatory gates, emergency-service validation, caller-ID authority, carrier contracts, recording consent, DNC rules or payment controls.
- Do not auto-publish customer transcripts into durable AI memory.
