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

See `docs/3CX-CLEAN-ROOM-CAPABILITY-STUDY-2026-10-17.md` for the current public-source research and clean-room boundary. See `docs/MAGNANIMOUS-REALTIME-VOICE-ENGINE-RESEARCH-2026-11-02.md` for the Asterisk WebSocket + Pipecat evaluation, speech-engine options, licensing, localization tests and runtime acceptance gates. See `docs/MICROSOFT-CALL-CENTER-AI-CLEAN-ROOM-RESEARCH-2026-11-02.md` for the exact Microsoft Reel project audit, Apache-2.0 reuse terms, Azure-independent capability patterns and acceptance tests. This is a researched design; no Pipecat runtime or new paid voice service is enabled.

## Carrier bridge configuration

Store these values as Cloudflare secrets or deployment variables. Never place tokens in frontend code.

```text
VOIP_PROVIDER_NAME=
VOIP_PROVIDER_URL=
VOIP_PROVIDER_TOKEN=
VOIP_WEBHOOK_SECRET=
VOIP_CALLER_ID=
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

## Realtime PSTN voice — low-cost streaming path

The existing Twilio carrier, phone number, call records and status callbacks remain in place. When the realtime adapter is ready, new inbound and outbound PSTN calls use Twilio bidirectional Media Streams instead of the old turn-by-turn `Gather` speech loop. If the realtime provider is not ready, the existing Gather path remains available.

### Runtime ownership

- **Magnanimous AI** remains the only conversation-reasoning endpoint. Deepgram sends each turn to the authenticated `/api/voice-agent/think` endpoint, which invokes the existing Workers AI binding and the tenant's selected voice-agent instructions.
- **Deepgram Voice Agent** handles streaming speech recognition, turn events and audio transport.
- **Cartesia Sonic multilingual TTS** is selected through Deepgram's managed Cartesia integration. The default public voice is the Customer Support Man preset; its voice ID can be changed in Wrangler configuration after listening tests. No separate Cartesia API key is required.
- **Twilio** remains the PSTN carrier and bidirectional media transport. This does not replace Asterisk Telecom Core or browser calling.

### Activation

The adapter is fail-closed until the Deepgram secret is present. Do not paste API keys into chat, source code, Wrangler `vars`, or the browser.

1. Create a Deepgram account using the free Pay-As-You-Go signup. Deepgram currently advertises a $200 starting credit, no credit-card requirement and no expiration for Pay-As-You-Go credits. Keep auto-load off and do not add a payment method for the initial trial.
2. Create a server-side API key with only the required Voice Agent access.
3. After the streaming adapter has been deployed, run this from the repository's `worker` directory and paste the key only at the secure prompt:

   ```powershell
   npx wrangler secret put DEEPGRAM_API_KEY
   ```

4. The AI Receptionist page shows the realtime voice readiness check. Calls use streaming only when the secret, existing Workers AI binding and required runtime settings are all present.

No Cartesia account or key is needed for the managed TTS configuration. The initial multilingual voice preset uses Cartesia Sonic 3.5 with the public Cartesia preset voice ID from the Deepgram integration example. Test English, Filipino/Tagalog and code-switching with real phone audio before enabling this for customer traffic. Cebuano/Bisaya is not claimed by this first Deepgram Nova-3/Cartesia path. Google Cloud Speech-to-Text lists Cebuano (`ceb-PH`) in selected regions, but adding it requires a separate streaming integration and Google billing credentials; no Google speech provider is activated in this pilot.

### Cost guardrails

The initial pilot is deliberately small:

- One concurrent Deepgram voice session platform-wide.
- Maximum 30 WebSocket handshakes per minute per source IP, stored as a keyed hash rather than a raw IP address.
- Maximum 30 Magnanimous AI think requests per minute for each call.
- Maximum 5 minutes per day and 20 minutes per calendar month.
- Maximum 5 minutes per call.
- At Deepgram's current listed Custom BYO LLM rate of $0.059/minute, 20 minutes is approximately $1.18; if the session is billed at the Standard rate of $0.075/minute, the same cap is $1.50. The advertised starting credit covers the initial test when available.
- Existing Twilio carrier minutes, caller ID and any transfer leg are separate carrier charges. The usage cap here does not pretend to cover them.
- Workers AI uses the existing Magnanimous binding; no new paid LLM key or model subscription is introduced by this adapter.

The daily/monthly caps are enforced server-side against a durable usage ledger, including active sessions. The session is closed when its remaining allowance is used. A failed provider handshake falls back to a short TwiML failure message and hangup; it does not silently transfer the call or start another paid provider.

### Consent, handoff and retention

- Before any Deepgram audio stream starts, the caller hears an AI/speech-processing disclosure and must press 1. Declining or timing out starts no AI conversation.
- No raw call audio is stored by this adapter. New voice transcripts are retained for 30 days; pre-existing transcript rows without an expiry are left unchanged.
- Caller opt-out phrases are handled in the streaming bridge and written to the tenant-scoped do-not-call list before the assistant ends the call.
- Each workspace voice assistant can have its own E.164 human handoff number in the AI Receptionist page. Pressing 0 redirects that specific Twilio call to that number. If no number is configured, the assistant does not claim a transfer is available.
- The handoff number is stored on the tenant-scoped voice-agent record; it is not a global fallback shared between tenants.

### Runtime verification

The readiness endpoint reports missing provider configuration without exposing secrets. Required acceptance tests include: bidirectional audio, first-response latency, interruption/barge-in, English and Filipino/Tagalog, noisy mobile audio, DNC, caller hangup, human transfer, provider outage, usage-cap exhaustion, duplicate callbacks and cross-tenant isolation.

## Cost and compliance

Browser-to-browser calls use the free Internet-phone layer. Calls to ordinary phone numbers require an authorized carrier path, an assigned caller ID, and the carrier's usage charges. Before automated outreach, recording or supervisor monitoring, obtain required consent and follow do-not-call, recording, privacy, telemarketing and other applicable rules.

Emergency calling, direct numbering, carrier status and caller-identity attestation remain fail-closed until the external technical, contractual and regulatory prerequisites are actually verified.
