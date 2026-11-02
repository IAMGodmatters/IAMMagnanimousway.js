// Research-backed realtime voice-engine architecture for Magnanimous Call Center.
// Runtime activation is fail-closed until the provider secret is present and live call tests pass.
// Magnanimous AI remains the owner of identity, memory, reasoning, policy and authorization.

export const MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE = Object.freeze({
  version: '2026-11-02',
  status: 'runtime-implemented-pending-provider-secret-and-live-e2e-verification',
  identity: Object.freeze({
    brain: 'Magnanimous AI',
    service: 'Magnanimous Telecom',
    experience: 'Magnanimous Call Center',
    provider_policy: 'Speech, media, carrier and model providers are replaceable execution adapters.',
    memory_policy: 'Customer identity, durable memory, business knowledge, billing and audit remain in Magnanimous-owned services.'
  }),
  current_gap: Object.freeze({
    existing_voice_path: 'The existing Worker path retains Twilio Gather as a fallback; the new streaming adapter is added behind readiness checks.',
    missing_capability: 'Provider-secret activation and live public-host inbound/outbound call verification with measured English/Filipino quality; Cebuano/Bisaya is outside this adapter scope.',
    truth_boundary: 'Source code and green unit checks do not prove a live PSTN call; real inbound/outbound media tests are still required.'
  }),
  immediate_pstn_voice_adapter: Object.freeze({
    provider: 'Deepgram Voice Agent API',
    transport: 'Existing Twilio bidirectional Media Streams over WebSocket; no new PBX or phone number',
    speech_recognition: 'Deepgram Nova-3 multilingual listen provider with language=multi for English/Filipino code-switching; Cebuano/Bisaya is not claimed',
    speech_synthesis: 'Deepgram-managed Cartesia Sonic 3.5, language=multi, public Customer Support Man voice preset; Tagalog is in the supported language list',
    reasoning_brain: 'Magnanimous AI through the authenticated OpenAI-compatible think endpoint backed by the existing Workers AI binding',
    ownership: 'Deepgram is speech/transport infrastructure only; Magnanimous AI owns prompts, reasoning, tenant context and policy',
    consent: 'Caller hears speech-processing/transcript disclosure and must press 1 before a media stream is opened',
    human_handoff: 'Per-agent E.164 number, tenant-scoped; DTMF 0 redirects the active Twilio call only when configured',
    language_scope: 'English and Filipino/Tagalog are the initial target; Cebuano/Bisaya requires a separately tested streaming speech provider and is not silently enabled',
    transcript_policy: 'No raw audio persisted; new transcript rows expire after 30 days; legacy rows without expiry are unchanged',
    cost_controls: Object.freeze({ max_concurrent_calls: 1, max_call_seconds: 300, daily_minutes: 5, monthly_minutes: 20, usage_scope: 'platform-wide pilot cap' }),
    activation: 'DEEPGRAM_API_KEY Worker secret only; no separate Cartesia API key; fail-closed until key and existing Workers AI binding are available',
    status: 'implemented-on-branch; pending provider secret, CI and live PSTN acceptance tests'
  }),
  selected_architecture: Object.freeze({
    pbx: 'Existing Magnanimous Telecom Asterisk 22.11.0 remains the authoritative SIP/PBX/call lifecycle service.',
    media_boundary: 'Use Asterisk chan_websocket for a private per-call bidirectional media stream when the module is present and enabled.',
    speech_pipeline: 'Evaluate Pipecat as the realtime audio pipeline and implement a custom Asterisk chan_websocket FrameSerializer/transport adapter.',
    orchestrator: 'Magnanimous AI decides intent, memory retrieval, policy, tool access, action authorization and human escalation.',
    handoff: 'Transfer to existing Magnanimous Call Center queues with a scoped call summary and reason.',
    livekit: 'Alternative WebRTC/agent stack; not added by default because it would duplicate parts of the existing owned media plane.'
  }),
  reference_implementation: Object.freeze({
    project: 'Microsoft Call Center AI',
    repository: 'https://github.com/microsoft/call-center-ai',
    license: 'Apache-2.0; preserve license, copyright, NOTICE and modification notices when redistributing adapted source.',
    absorb_patterns: ['bidirectional telephone audio', 'per-call authenticated WebSocket lifecycle', 'idempotent event processing', 'structured customer case/task capture', 'human fallback', 'SMS follow-up with consent', 'post-call synthesis and quality review', 'tenant-scoped RAG with source grounding'],
    avoid_lock_in: 'Do not import Azure Communication Services, Event Grid, Queue Storage, Cosmos DB or Azure OpenAI as mandatory dependencies. Keep Magnanimous Telecom provider-neutral.',
    evidence_doc: 'docs/MICROSOFT-CALL-CENTER-AI-CLEAN-ROOM-RESEARCH-2026-11-02.md'
  }),
  adapter_contract: Object.freeze({
    protocol: 'Asterisk chan_websocket; binary frames for media and text frames for control/events.',
    channel: 'Private TLS-protected connection with per-call authentication and strict session binding.',
    controls: ['call_id', 'tenant_id', 'channel_id', 'connection_id', 'codec', 'hangup', 'dtmf', 'media_start', 'media_stop'],
    behavior: ['stream_input', 'stream_output', 'vad', 'turn_detection', 'barge_in', 'cancel_tts', 'timeout', 'disconnect_cleanup', 'warm_handoff'],
    isolation: 'One call-scoped media session; no cross-call shared conversation state.',
    limits: 'Bounded audio buffers, message sizes, concurrency, duration and memory; fail closed on authentication or correlation mismatch.'
  }),
  speech_candidates: Object.freeze({
    local_or_private_first: true,
    asr: [
      { name: 'sherpa-onnx', license: 'Apache-2.0', purpose: 'Offline ASR, VAD, diarization and speech pipeline candidate; select model and license per language.' },
      { name: 'whisper.cpp', license: 'MIT', purpose: 'Local multilingual ASR fallback candidate; benchmark phone audio and ARM64 CPU load.' }
    ],
    tts: [
      { name: 'Kokoro-82M', license: 'Apache-2.0 model weights', purpose: 'Natural English TTS candidate; upstream model card lists English, so it is not a Filipino/Tagalog-ready claim.' }
    ],
    localization_gate: 'English and Filipino/Tagalog require separate measured ASR/TTS quality, code-switching, accent and latency acceptance. A model license and voice-pack license must both be verified.'
  }),
  evaluated_not_selected: Object.freeze({
    livekit_agents: { license: 'Apache-2.0', disposition: 'Keep as alternate media/agent platform; add only if measured WebRTC/SIP requirements justify a second media plane.' },
    callkit: { disposition: 'Commercial self-hosted product candidate; no open-source source license verified in this review. Do not classify as open source or import its code.' },
    asterisk: { license: 'GPL-2.0 with published exceptions/terms', disposition: 'Keep separately operated; preserve required notices and review redistribution obligations for white-label/container distribution.' }
  }),
  safety: Object.freeze({
    ai_disclosure: 'Preserve AI identity disclosure and applicable notice/consent.',
    recording: 'Recording and supervisory media access require jurisdiction, notice/consent, role, call-scope, retention and audit gates.',
    outbound: 'Re-check DNC, consent, jurisdiction, local calling window, campaign policy and prepaid spend at execution time.',
    tools: 'Voice workers cannot grant themselves tools or permissions. All consequential tools remain server-authorized through Magnanimous.',
    transcripts: 'Tenant-scope all transcripts and redact personal/payment/secrets; transcript-to-knowledge requires human review and never auto-publishes.',
    emergencies: 'No emergency calling, numbering, carrier or regulatory capability is activated by this design.'
  }),
  cost: Object.freeze({
    default: 'local_or_private_first',
    paid_providers: 'Deepgram Voice Agent is an approved capped pilot; keep provider auto-load disabled and use free credits first; no paid activation occurs until the DEEPGRAM_API_KEY secret is present',
    protections: ['platform_wide_daily_monthly_minute_caps', 'per_call_duration_limit', 'global_concurrency_limit', 'durable_usage_ledger', 'stop_when_cap_reached'],
    provider_account_requirements: Object.freeze(['auto_load_disabled', 'use_free_credits_first', 'no_payment_method_until_owner_approval']),
    infrastructure: 'No new paid host or always-on service without a separate cost and capacity review.'
  }),
  readiness: Object.freeze([
    'Confirm chan_websocket is compiled and enabled in the pinned Asterisk image.',
    'Implement and security-test the custom Asterisk WebSocket FrameSerializer/transport.',
    'Prove loopback two-way media, interruption and hangup cleanup.',
    'Prove human warm-transfer and provider-outage fallback.',
    'Measure English and Filipino/Tagalog separately before enabling each language.',
    'Verify 200 ms Twilio audio batching, barge-in, streaming OpenAI-compatible SSE and Deepgram provider outage behavior.',
    'Prove tenant isolation, disclosure, consent, DNC, retention and tool-policy invariants.',
    'Pass Telecom Core, WebRTC, voice, full-platform and real public-host verification before routing customer traffic; provider secret remains a separate activation gate.'
  ]),
  references: Object.freeze([
    'https://docs.asterisk.org/Configuration/Channel-Drivers/WebSocket/',
    'https://docs.asterisk.org/Development/Reference-Information/Asterisk-Framework-and-API-Examples/External-Media-and-ARI/',
    'https://github.com/microsoft/call-center-ai',
    'https://github.com/pipecat-ai/pipecat',
    'https://docs.pipecat.ai/api-reference/server/services/transport/websocket-server',
    'https://developers.deepgram.com/docs/voice-agent',
    'https://developers.deepgram.com/docs/voice-agent-multilingual',
    'https://developers.deepgram.com/docs/nova-3-language-prompting',
    'https://deepgram.com/pricing',
    'https://www.twilio.com/docs/voice/media-streams',
    'https://docs.cartesia.ai/build-with-cartesia/tts-models/latest#language-support',
    'https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages',
    'https://github.com/livekit/agents',
    'https://github.com/k2-fsa/sherpa-onnx',
    'https://github.com/ggml-org/whisper.cpp',
    'https://huggingface.co/hexgrad/Kokoro-82M'
  ])
});

export function magnanimousVoiceEngineSummary() {
  return MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE;
}
