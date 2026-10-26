# I AM Phone and Call Center

The platform has two calling layers:

1. **I AM Internet Phone** — free browser-to-browser audio between signed-in I AM users using WebRTC.
2. **Carrier bridge** — optional mobile and landline calling through a compatible telephony provider.

Magnanimous AI remains the brain and policy layer. Magnanimous Telecom owns the provider-neutral telecom boundary. PBXs, carriers, AI voice engines, SIP trunks and media services remain replaceable adapters.

## Included call-center features

- agent presence: available, busy, break, and offline
- call queues with longest-idle, round-robin, or priority strategies
- browser-call session signaling and automatic call records
- outbound public-number dialer when a carrier bridge is configured
- carrier status webhooks
- assignments, call duration, notes, and dispositions
- campaigns: preview, progressive, and power
- IVR flows, callbacks, queue voicemail and dispositions
- AI agent-assist rules and call intelligence
- omnichannel interaction/message records
- native WebRTC sessions
- policy-gated supervisor and recording sessions
- tenant-separated call-center data

## Advanced clean-room capability layer

The advanced contact-center control plane adds provider-neutral patterns researched from modern enterprise contact-center systems without copying proprietary vendor implementation code.

Authenticated endpoints:

- `GET /api/contact-center/advanced/capabilities`
- `POST /api/contact-center/advanced/route-plan`
- `POST /api/contact-center/advanced/tool-policy`
- `POST /api/contact-center/advanced/knowledge-draft`

### Queue route planning

Supported planning strategies:

- `ring_all`
- `prioritized_hunt`
- `random_start`
- `round_robin`
- `longest_idle`
- `least_talk_time`
- `fewest_answered`
- `hunt_three_random`
- `hunt_three_priority`
- `skills_ring_all`
- `skills_random_start`
- `skills_round_robin`
- `skills_fewest_answered`

Skills-based routing supports `availability`, `time`, and `cumulative` escalation planning. Only active, logged-in, available agents are considered. This planner is additive; existing queue behavior remains available while runtime/UI adoption proceeds.

Target queue controls include caller-requested/automatic/offered callbacks, wrap-up time, maximum callers, priority queue, SLA, queue login/logout automation, supervisors, queue voicemail, recording opt-in/out and chat ownership.

### AI tool safety

The advanced AI tool-policy evaluator follows Magnanimous fail-closed rules:

- tools must be explicitly allowlisted
- read-only is preferred by default
- client approval cannot grant server authority
- write, delete, paid, regulated, recording and supervision actions require explicit approval
- paid/regulated actions require owner/admin authority at this planning boundary
- real actions still remain subject to their existing server-side permission, billing, consent and regulatory gates

### Transcript-to-knowledge review

The knowledge-draft endpoint reduces obvious email, phone, payment-number and secret patterns, then returns a `needs_review` draft with `publish_allowed:false`.

Raw customer transcripts are never automatically promoted into durable Magnanimous AI knowledge. A human must verify accuracy, remove transient/customer-specific information, remove remaining confidential data and approve reusable knowledge.

### Advanced target architecture

Magnanimous Call Center now carries the following explicit target contract:

- skills routing and escalation
- SLA/callback/wrap-up controls
- supervisor monitor/whisper/barge with authorization, consent and audit
- unified voice/chat/SMS/MMS/WhatsApp/Facebook/email/voicemail interaction model
- provider-neutral REST/WebSocket call-control plane
- service-principal/scoped-token access
- local/private-first transcription with speaker detection where supported
- summaries, sentiment, topics, action items, QA flags and compliance risk
- targeted AI receptionist/personal-assistant/customer-service/specialist agents
- human handoff, AI fallback, spam/abuse/nonresponsive policies
- CRM lookup, screen pop and call/chat journaling
- SIP trunk health checks, TLS/SRTP, SBC/site-edge and NAT/firewall diagnostics
- dependency/firmware/security hotfix discipline

See `docs/3CX-CLEAN-ROOM-CAPABILITY-STUDY-2026-10-17.md` for the current public-source research and clean-room boundary.

## Carrier bridge configuration

Store these values as Cloudflare secrets or deployment variables. Never place tokens in frontend code.

```text
VOIP_PROVIDER_NAME=
VOIP_PROVIDER_URL=
VOIP_PROVIDER_TOKEN=
VOIP_WEBHOOK_SECRET=
VOIP_CALLER_ID=
VOIP_PROVIDER_ROUTE_CONTROL_ENABLED=false
VOIP_PROVIDER_HEALTH_URL=
```

The platform sends an authenticated JSON `POST` to `VOIP_PROVIDER_URL`:

```json
{
  "call_id": 123,
  "tenant_id": "tenant-id",
  "to": "+15551234567",
  "from": "+15557654321",
  "agent_id": "agent-id-or-null",
  "queue_id": "queue-id-or-null",
  "webhook_url": "https://iammagnanimousway.com/api/phone/webhook"
}
```

The bridge must return JSON containing a durable call identifier:

```json
{
  "provider_call_id": "provider-call-id",
  "status": "dialing"
}
```

Send call updates to the supplied webhook URL with the `x-iam-webhook-secret` header. The JSON body should contain `provider_call_id`, `status`, and optionally `event_type`, `detail`, or `recording_url`.

### Optional selected-route contract for a generic BYOC bridge

Generic BYOC route control is disabled by default. Turn on `VOIP_PROVIDER_ROUTE_CONTROL_ENABLED=true` only when the bridge implements the Magnanimous selected-route contract and `VOIP_PROVIDER_HEALTH_URL` is an HTTPS URL on the **same origin** as `VOIP_PROVIDER_URL`.

A carrier route opts in with a non-secret policy key such as:

```json
{
  "bridge_route_key": "primary-us-east"
}
```

Before Magnanimous sends the call, it authenticates a `GET` to `VOIP_PROVIDER_HEALTH_URL`. The bridge must return:

```json
{
  "selected_route_contract": "magnanimous-selected-route-v1",
  "routes": [
    { "route_key": "primary-us-east", "healthy": true, "status": "ready" }
  ]
}
```

Only then will the outbound call payload include a `selected_route` object. After accepting the call, the bridge should echo the exact route it actually applied:

```json
{
  "provider_call_id": "provider-call-id",
  "status": "dialing",
  "selected_route_applied": true,
  "route_id": 12,
  "interconnect_id": 4,
  "bridge_route_key": "primary-us-east"
}
```

Magnanimous reports a selected route as applied only when all of those identifiers match the request. A mismatched or missing confirmation is recorded as unconfirmed and is never promoted as route-control success. Bridge credentials remain server-side; `bridge_route_key` is a stable routing label, not a secret.

## Cost and compliance

Browser-to-browser calls use the free Internet-phone layer. Calls to ordinary phone numbers require an authorized carrier path, an assigned caller ID, and the carrier's usage charges. Before automated outreach, recording or supervisor monitoring, obtain required consent and follow do-not-call, recording, privacy, telemarketing and other applicable rules.

Emergency calling, direct numbering, carrier status and caller-identity attestation remain fail-closed until the external technical, contractual and regulatory prerequisites are actually verified.
