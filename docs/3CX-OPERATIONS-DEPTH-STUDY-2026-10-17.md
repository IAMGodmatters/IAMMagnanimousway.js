# 3CX operations-depth clean-room study for Magnanimous AI / Telecom / Call Center

Date: 2026-10-17

## Scope and boundary

This is a clean-room capability study. It examines publicly documented 3CX product behavior and operational patterns, then records original, provider-neutral Magnanimous adaptations. It does not copy proprietary 3CX implementation code, UI, prompts, templates, branding, protected assets or unverified source.

Magnanimous AI remains the brain, identity, reasoning, memory, policy, orchestration and verification layer. Magnanimous Telecom and Magnanimous Call Center remain the customer-facing telecom/contact-center services. PBXs, SIP trunks, carriers, media servers, AI engines and CRM systems remain replaceable adapters.

## Current release checkpoint

As of 2026-10-17, the current 3CX V20 Update 10 stream is Release Candidate build 20.0.10.1716, announced 2026-10-13. It is a useful current benchmark but must not be treated as a final production release.

Primary current sources:
- https://www.3cx.com/blog/releases/ai-call-transcription-mac/
- https://www.3cx.com/blog/change-log/phone-system-change-log-v20/

## 1. Predictive and power dialing

Public 3CX Call Flow Designer documentation distinguishes a steady-rate Power Dialer from a Predictive Dialer that adjusts calling pace based on queue-agent availability. Predictive mode can optimize for agents or callees.

Sources:
- https://www.3cx.com/docs/cfd-predictive-dialer/
- https://www.3cx.com/docs/manual/cfd-creating-callflows-dialers/

Magnanimous adaptation:
- `power`, `progressive`, and `predictive` remain explicit outbound planning modes.
- Predictive planning supports `agents` or `callees` optimization.
- The planner calculates a bounded recommendation from free agents, estimated answer rate, concurrency limits, per-minute caps, an overdial ceiling and remaining spend.
- The planner never directly places a call and always returns `execution_authorized:false`.
- Planning fails closed unless campaign enablement, consent, DNC clearance, calling window, holiday policy, spend cap and carrier readiness are all positive.
- Actual execution must re-check all gates at the moment of dialing.

This is deliberately stricter than simply reproducing a dialer algorithm because outbound calling can create regulatory, customer-experience and cost risk.

## 2. Department office hours, breaks, holidays and overrides

3CX V20 moved office hours, holidays, time zone and related routing behavior into Departments. Department-specific holiday prompts and temporary office-hours overrides are publicly documented.

Sources:
- https://www.3cx.com/blog/releases/v20-final/
- https://www.3cx.com/blog/docs/configuring-holiday-prompts/
- https://www.3cx.com/community/threads/v20-dial-codes-for-in-out-office-hours.127574/

Magnanimous adaptation:
- IANA time-zone-aware office-hours evaluation.
- day-specific open windows.
- break windows.
- department holiday dates.
- temporary `open`, `closed` or `break` override with expiry.
- result is a routing policy decision only; it does not bypass the normal call router.

## 3. Hot desking

3CX documents hot-desking phones as reusable devices that require user authentication before ordinary outbound calls. Idle hot-desk devices can still dial configured emergency numbers. Users can take over a phone and administrators can force logout.

Source:
- https://www.3cx.com/docs/hot-desking/

Magnanimous adaptation:
- idle emergency-only policy.
- explicit `user_allowed` policy.
- credential verification required for ordinary login.
- occupied-device takeover requires an explicit takeover decision plus authentication.
- a successful takeover returns `force_logout_previous:true` so the caller can perform a controlled prior-session logout.
- this is a policy planner, not device provisioning; provisioning remains a separately authorized operation.

## 4. Call Flow Designer / programmable workflows

3CX Call Flow Designer provides visual call flows using components such as prompts, menus, database access, HTTP/REST calls, JSON/XML/CSV parsing, transcription, file operations, sockets, and C# code execution.

Sources:
- https://www.3cx.com/docs/manual/call-flow-designer/
- https://www.3cx.com/docs/manual/cfd-components/
- https://www.3cx.com/docs/manual/cfd-workspace/

Magnanimous adaptation deliberately does **not** clone the most dangerous raw-execution features.

Allowed declarative component types include:
- start
- prompt
- menu
- input
- condition
- transfer
- queue
- voicemail
- callback
- HTTPS request
- CRM lookup
- database lookup
- TTS
- transcription
- set variable
- wait
- webhook
- hangup

Rejected component types include:
- execute code
- shell
- raw sockets
- direct filesystem access
- eval
- arbitrary scripts

Additional Magnanimous rules:
- exactly one start node.
- unique node IDs.
- valid edge references.
- HTTPS required for external HTTP/webhook calls.
- raw password/token/secret/private-key/credential fields are rejected.
- external credentials are represented by a generic server-side `binding_ref`, never embedded values.
- the validator returns `execution_authorized:false`; execution remains subject to tenant, tool, telecom, billing and compliance authorization.

## 5. Scheduled callbacks

3CX documents combining call flows and dialers to collect a callback date/time and later place the callback, including speech recognition and TTS in the example workflow.

Source:
- https://www.3cx.com/docs/cfd-callback/

Magnanimous adaptation:
- callback time must be in the future.
- bounded scheduling horizon.
- consent, DNC, carrier and spend gates must pass before scheduling eligibility is returned.
- callback planner never directly authorizes dialing.
- call-time execution must re-check office hours, consent, DNC, carrier state and spend.

## 6. Reporting and operations intelligence

3CX published a current contact-center reporting guide on 2026-10-07 organized around questions such as caller wait, answered/abandoned calls, queue demand, agent availability and call-level investigation.

Source:
- https://www.3cx.com/blog/docs/contact-center-reports/

Magnanimous adaptation starts with a provider-neutral reporting summary contract:
- offered calls.
- answered/completed calls.
- abandoned calls.
- answer rate.
- abandonment rate.
- SLA target and SLA percent.
- average wait time.
- average handle time.
- average wrap-up time.

The longer-term target is to combine these with existing Magnanimous call intelligence: sentiment, topics, action items, QA flags, compliance risk, route health and per-call telecom quality.

## 7. IVR and digital receptionist patterns

3CX documents digital receptionist / IVR behavior including prompts, key destinations, invalid/no-input handling, direct dialing, department-aware routing and SMS destinations.

Magnanimous adaptation target:
- reusable declarative IVR nodes.
- explicit invalid/no-input branches.
- destination resolution through Magnanimous policy.
- speech and TTS adapters remain replaceable.
- no embedded carrier/provider assumption.

## 8. Departments, permissions and cross-unit visibility

3CX V20 uses Departments for organizational scoping and granular administrative roles. Public documentation describes role-based rights around calls, presence, recordings, listening/whisper/barge and department administration.

Magnanimous adaptation:
- tenant separation remains the hard boundary.
- department/team scope can only narrow visibility, not cross tenant boundaries.
- recording access and supervisor capabilities remain separately permissioned.
- AI inherits no more authority than its authenticated principal.
- listen/whisper/barge remain consent/policy/audit gated.

## 9. Multi-company / multi-tenant operational patterns

3CX documents multi-company / multi-tenant operation with company-specific trunks, call handling, phonebooks and administrative scope.

Magnanimous adaptation:
- preserve true tenant isolation in data, secrets, routing and billing.
- shared infrastructure may host multiple tenants but must not share customer credentials, call records, transcripts or provider bindings across tenant boundaries.
- shared carrier adapters must route using tenant-specific authorized bindings and policy.

## 10. SIP trunk and routing depth

Current Update 10 changelog items include improved SIP Trunk Checker DNS validation, diagnostics and result reporting, plus call-report improvements.

Magnanimous adaptation target:
- route health is a first-class signal.
- DNS, registration, TLS/SRTP, SDP and inbound/outbound tests are explicit diagnostics.
- failed trunk/provider health removes a route from candidate selection instead of silently creating repeated failures.
- failover must prevent duplicate answered calls and duplicate billing.

## 11. TTS, transcription and speech workflows

3CX CFD supports TTS and transcription components, while recent V20 releases add private/on-premise transcription and retry/chunking improvements.

Sources:
- https://www.3cx.com/docs/cfd-text-to-speech-audio-prompt/
- https://www.3cx.com/blog/releases/agentic-ai/
- https://www.3cx.com/blog/releases/ai-call-transcription-mac/

Magnanimous adaptation:
- local/private-first speech processing when practical.
- cloud speech/AI remains an optional adapter.
- transient transcription failures may be retried with bounded policy.
- large media may be chunked, but tenant and retention policies apply to every chunk.
- transcript-to-knowledge remains human-review-only.

## 12. AI placement in the call flow

3CX's current Customer Service AI Agent guidance emphasizes defining the AI role, knowledge scope, human escalation path and where it sits in the call flow.

Source:
- https://www.3cx.com/blog/docs/customer-service-ai-agent-workflows/

Magnanimous adaptation:
- purpose-specific AI agents rather than one unrestricted voice agent.
- explicit knowledge sources.
- explicit handoff destination.
- explicit topic escalation.
- AI tool actions go through Magnanimous policy and approval gates.
- no AI may bypass tenant permissions, telecom regulation, payments or customer consent.

## 13. Security lesson from powerful workflow components

Some public 3CX CFD components allow file, socket and code execution. That is useful capability in a traditional trusted PBX environment, but it would create an unnecessarily broad attack surface in a multi-tenant AI/telecom platform.

Magnanimous therefore absorbs the **workflow capability**, not the raw execution surface:
- safe declarative graph.
- allowlisted component types.
- server-side tool bindings.
- secret references rather than raw secrets.
- HTTPS-only external requests.
- separate policy authorization before execution.

This preserves extensibility without turning a call-flow definition into arbitrary remote code execution.

## Phase 2 implementation map

Implemented in `worker/src/magnanimous-contact-center-advanced.js`:
- `planPredictiveDialing`
- `evaluateOfficeHours`
- `evaluateHotdeskPolicy`
- `validateCallFlow`
- `planScheduledCallback`
- `summarizeContactCenterReport`

Authenticated planning/policy endpoints:
- `POST /api/contact-center/advanced/predictive-plan`
- `POST /api/contact-center/advanced/office-hours`
- `POST /api/contact-center/advanced/hotdesk-policy`
- `POST /api/contact-center/advanced/callflow-validate`
- `POST /api/contact-center/advanced/callback-plan`
- `POST /api/contact-center/advanced/report-summary`

Permanent regression lock:
- `qa/scripts/contact-center-operations-depth-lock.mjs`
- `.github/workflows/contact-center-operations-depth-lock.yml`

## Explicit non-goals / fail-closed boundaries

- No autonomous predictive dialing is enabled by these planners.
- No carrier, emergency, caller-ID, STIR/SHAKEN or numbering authority is inferred from software capability.
- No raw customer transcript is automatically learned into durable Magnanimous knowledge.
- No raw shell/code/socket/filesystem execution is exposed in call-flow definitions.
- No unreviewed 3CX code or unverified-license source is imported.
- No `@3cx/*` runtime dependency is required.
- No paid provider is silently enabled.
- No department/team permission may cross tenant boundaries.
