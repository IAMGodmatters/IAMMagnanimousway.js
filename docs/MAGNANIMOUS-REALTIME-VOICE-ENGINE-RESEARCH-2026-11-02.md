# Magnanimous Realtime Voice Engine — Research and Integration Decision

Date: 2026-11-02
Base commit reviewed: 524737c53e57d8013e5c945621b30710d582b990 (main)

## Evidence boundary

The Facebook Reel's caption/source metadata was subsequently retrieved and identified Microsoft's `microsoft/call-center-ai` project. The Reel itself was not available as a playable audiovisual asset or transcript, so this document does not claim to quote or verify its spoken narration. The exact repository, README, LICENSE and implementation files were inspected; the clean-room audit is recorded in `docs/MICROSOFT-CALL-CENTER-AI-CLEAN-ROOM-RESEARCH-2026-11-02.md`.

## Executive decision

The supplied Reel specifically promotes Microsoft's `microsoft/call-center-ai` repository. Its clean-room feature, code-path, Apache-2.0 license and Azure-dependency review is recorded in `docs/MICROSOFT-CALL-CENTER-AI-CLEAN-ROOM-RESEARCH-2026-11-02.md`. Absorb its structured call-state, bidirectional media, event idempotency, customer task capture, human handoff and post-call quality patterns; do not adopt its Azure stack as a mandatory dependency.

Do not replace the owned Magnanimous Telecom Core and do not add a second PBX. Keep Magnanimous AI as the only identity, memory, reasoning, policy and orchestration brain. Keep Asterisk as the authoritative SIP/PBX/call lifecycle layer. For immediate PSTN operation, add a guarded Deepgram Voice Agent adapter behind the existing Twilio bidirectional Media Streams path; Deepgram handles streaming speech while its custom LLM endpoint calls Magnanimous AI. Use Deepgram-managed Cartesia Sonic 3.5 for multilingual speech. This replaces only the old Twilio Gather turn loop when readiness checks pass. Keep Pipecat as the future Asterisk-native media pipeline candidate; do not add LiveKit as a second media/PBX stack by default.

The current implementation branch adds the guarded Worker streaming adapter, consent gate, custom Magnanimous LLM endpoint, per-agent human handoff and usage ledger. It is not yet deployed or live-tested; the Deepgram secret is not configured, so the runtime readiness check remains false and the existing Gather path remains active.

## Existing systems preserved from the main-branch baseline

The reviewed main branch contains:
- An Asterisk 22.11.0 image in telecom-core/asterisk/Dockerfile.
- A Magnanimous Telecom control API and protected ARI integration.
- Native Asterisk WebRTC/SIP.js browser-call source and a Chromium media E2E workflow.
- A provider-neutral Worker carrier bridge.
- Tenant-local included AI receptionist, customer-support, sales and appointment profiles.
- A current Twilio voice path in worker/src/voice-agent-runtime.js. It uses Twilio <Gather input="speech"> turn collection, receives a SpeechResult webhook, calls Cloudflare Workers AI with the text history, and returns another TwiML Gather response. This is a request/response speech-turn loop, not a full-duplex streaming voice pipeline.
- This implementation branch adds worker/src/deepgram-voice-agent-runtime.js. It opens a Twilio bidirectional Media Stream only after DTMF consent, bridges 8 kHz mu-law audio to Deepgram Voice Agent, and routes every reasoning turn to Magnanimous AI through a short-lived call-scoped HMAC token. The legacy Gather route remains the fail-closed fallback until the provider is ready.
- No Pipecat service in telecom-core/docker-compose.yml and no verified production Pipecat-to-Asterisk media adapter.

The source also preserves fail-closed gates for carrier readiness, outbound consent, AI disclosure, Do Not Call checks, automated campaign policy, recording controls, emergency calling and public Telecom host activation. Those gates must remain intact.

## Research findings and licensing

### Immediate Twilio/Deepgram runtime — first operational path

The existing Twilio carrier is retained. The Worker returns a consent TwiML prompt first; only a caller pressing 1 receives a short-lived, call-bound stream token and a bidirectional `<Connect><Stream>` session. Twilio sends 8 kHz mu-law frames to the Worker, the Worker bridges them to Deepgram Voice Agent, and returned audio is sent back to the same Twilio stream.

- Deepgram Voice Agent authentication uses the documented WebSocket subprotocols `token` and the API key.
- Nova-3 uses `language: "multi"` for English/Filipino code-switching. Cartesia Sonic 3.5 uses the multilingual TTS mode; its supported language list includes Tagalog/Filipino. Actual phone-audio quality still requires a measured test. Cebuano/Bisaya is not included in this first adapter's verified language scope. Google Cloud Speech-to-Text lists `ceb-PH` for selected regions, but that would require a separate streaming STT/TTS integration and billing credentials; it is not silently enabled here.
- Deepgram's custom OpenAI-compatible think endpoint is `/api/voice-agent/think`. It validates a short-lived HMAC token bound to the call, tenant and agent, then invokes the existing Workers AI binding. No Deepgram-managed LLM is selected.
- The bridge handles Twilio media frames, Deepgram binary audio, barge-in clear events, DTMF 0 handoff, caller opt-out and caller hangup. Human handoff numbers are stored per voice agent and tenant.
- The new stream is not used until the server-side `DEEPGRAM_API_KEY` secret and the existing AI binding are ready. No key is embedded in source, browser code or Wrangler vars.
- The usage ledger enforces two concurrent sessions platform-wide, thirty minutes per day, three hundred minutes per calendar month and ten minutes per call. Each workspace is limited to one concurrent session, twenty minutes per day and one hundred fifty minutes per month. It also limits WebSocket handshakes to 30/minute per keyed source-IP hash and Magnanimous AI think requests to 30/minute per call. New transcripts expire after thirty days; no raw audio is persisted by this adapter.
- The first pilot uses the existing Twilio carrier and the existing Workers AI binding. No new PBX, phone number, separate Cartesia account, Cartesia API key, LLM key, container or host is required.

Deepgram currently lists $0.059/minute for its Custom BYO LLM tier and $0.075/minute for Standard; three hundred minutes therefore bounds the Deepgram portion to approximately $17.70–$22.50 per month if promotional credits are exhausted. The advertised $200 starting credit would cover roughly nine to eleven months at the full monthly cap, if eligible. Deepgram currently advertises a $200 starting credit with no credit card required and no expiration for Pay-As-You-Go credits. Keep auto-load disabled. Twilio carrier minutes and any human-transfer leg remain separate costs.

### Asterisk media path — selected integration boundary

Asterisk documents the chan_websocket channel driver for bidirectional media over WebSocket. It is available from Asterisk 22.6.0; JSON control-message format is available from 22.8.0. The repository's pinned 22.11.0 source version is new enough to support that interface, subject to confirming the built image includes the module and the required runtime configuration.

The media protocol uses binary WebSocket frames for audio and text frames for control/events. The Asterisk docs describe TLS support and explain that the channel driver handles framing/timing that older RTP/AudioSocket integrations require the application to manage.

Use a dedicated per-call WSS connection on the private Telecom Core network. Authenticate each call/session, correlate it to the existing Magnanimous call ID, enforce a strict call/tenant scope, close the stream on hangup, and never expose ARI or the media worker as an unauthenticated public endpoint.

Important: Pipecat does not supply a ready-made Asterisk chan_websocket adapter in the reviewed sources. Magnanimous must build and test a custom Pipecat FrameSerializer/transport adapter for the Asterisk JSON control messages and binary media frames. Do not represent this adapter as already available.

### Pipecat — preferred realtime pipeline candidate

Pipecat is an open-source Python framework for realtime voice and multimodal agents. Its core license is BSD 2-Clause. It has a frame-based processor pipeline and generic WebSocket transports with serialization support. It provides the right abstraction for streaming audio input/output, speech recognition, synthesis, turn handling and interruption logic while keeping media-provider connectors replaceable.

Adopt Pipecat only as a media/speech execution worker. It must not own Magnanimous customer identity, persistent memory, billing, tenant policy or authorization. It should ask Magnanimous AI for intent/reasoning and use only explicitly scoped tools.

### LiveKit Agents — useful alternative, not an immediate dependency

LiveKit Agents is Apache-2.0 and supports realtime voice agents, multi-agent handoff, tool use, interruptions and SIP integrations. LiveKit is a capable alternate WebRTC/media plane. Adding it immediately beside the existing Asterisk/Kamailio/Telecom Core would increase resource use and operational duplication. Keep it as a measured alternative, not a default second PBX.

### Offline speech components

- sherpa-onnx is Apache-2.0 and supports offline ASR, TTS, VAD, speaker diarization and speech enhancement across a broad range of CPU/ARM and other targets. It is a candidate local speech runtime; each chosen model/voice still needs its own license and quality review.
- whisper.cpp is MIT-licensed and includes streaming microphone/transcription examples plus a local HTTP transcription server. It is a good candidate ASR fallback, but benchmark real phone audio, CPU load and latency before choosing a production model.
- Kokoro-82M is published with Apache-2.0 model weights and can be evaluated for natural English TTS. The upstream model card identifies English as its language; do not claim that this model provides Filipino/Tagalog speech. Validate model, phonemizer and voice-pack licensing separately.

For Philippines-first rollout, English and Filipino/Tagalog must be measured separately for speech recognition accuracy, TTS naturalness, pronunciation, code-switching and latency. Do not claim Filipino speech support from an English model or from a generic language list.

### CallKit classification

CallKit's public site describes a self-hosted commercial voice-agent builder and provider connectors. The research did not verify an open-source license for its source code. Treat it as a product to evaluate, not as open-source code to clone, vendor into Magnanimous or describe as an open-source dependency.

### Asterisk distribution note

Asterisk is distributed under GPLv2, subject to its published licensing terms and exceptions. Keep it as a separately built/operated telephony service; preserve notices and review source-distribution obligations before redistributing containers or modified binaries to white-label customers. Do not link proprietary Magnanimous code into GPL modules without an explicit licensing review.

## Target runtime design

Asterisk receives and routes telephone calls. On a call assigned to an AI queue, its call-control layer opens a scoped private WebSocket media session to the Magnanimous voice worker. The custom adapter maps Asterisk control/media frames to Pipecat audio frames.

Pipeline:
1. Asterisk call lifecycle and queue policy.
2. Voice worker receives audio and performs VAD/turn detection.
3. Local/private STT produces a transcript.
4. Magnanimous AI resolves intent, retrieves tenant-approved knowledge and decides whether a permitted tool is needed.
5. Tool calls go through Magnanimous's existing server-side tenant/role/approval policy. The voice worker cannot grant itself authority.
6. TTS streams audio back through the per-call Asterisk media session.
7. Barge-in cancels current speech generation cleanly; silence, timeout, disconnect and model failure use controlled fallback.
8. Human handoff transfers the caller to the appropriate queue with a concise, tenant-scoped context summary and explicit handoff reason.
9. The existing call record and call-intelligence systems record allowed metadata; raw media/transcripts are governed by consent and retention policy.

The same Magnanimous AI brain handles both public-telephone and browser/WebRTC interactions. Do not create independent agent memories in Pipecat, LiveKit, a speech provider or a tenant's carrier.

## Cost and deployment policy

- Do not create a new Railway service, paid host, phone number, carrier account or paid model usage for this research.
- The eventual voice worker should be an opt-in service on the already-planned dedicated Telecom Core host, not a new always-on cloud service.
- Keep the worker disabled until resource limits, ARM64 compatibility, model availability and real-call media tests pass.
- Prefer local/offline models where they meet quality and latency. Local execution is not literally cost-free: CPU, RAM, storage, bandwidth and electricity still have costs.
- Remote STT/TTS/LLM providers remain opt-in, replaceable adapters. Require explicit tenant/owner enablement, prepaid balance, per-call/per-minute/token limits, idempotent usage ledger entries and a hard stop when the balance or budget cap is exhausted.
- No metered provider key belongs in the browser or tenant-visible configuration.

## Safety and privacy invariants

- Preserve AI identity disclosure and applicable recording/transcription notices and consent.
- Preserve tenant isolation for call audio, transcripts, notes, summaries, recordings and CRM references.
- Preserve DNC, opt-out, jurisdiction, local-time calling-window, campaign-consent and spend checks at call execution time. A voice model cannot bypass these checks.
- Recording and supervisor monitor/whisper/barge remain disabled unless role, call scope, notice/consent, retention and audit requirements pass.
- Redact phone numbers, emails, payment data, credentials and other sensitive data from review drafts. Never auto-publish raw customer transcripts into permanent Magnanimous knowledge.
- Do not solicit card numbers, bank passwords, authentication secrets or government ID data in AI calls.
- Emergency calling, public numbering and carrier authority remain separately gated until the required legal, contractual and real-world routing evidence exists.

## Required engineering and acceptance sequence

1. Inventory the exact Asterisk 22.11.0 build modules and verify chan_websocket is present; do not assume the driver is compiled in merely because the version supports it.
2. Implement a custom Asterisk WebSocket protocol adapter for JSON control frames and binary media frames. Add per-call authentication, bounded buffers, timeouts, cancellation, hangup cleanup and tenant/call correlation.
3. Build the Pipecat pipeline with provider-neutral STT/TTS interfaces and Magnanimous AI as the reasoning/tool authority.
4. Start with loopback/diagnostic calls. Prove two-way audio and barge-in without touching public PSTN.
5. Test English and Filipino/Tagalog separately with representative accents, code-switching, noisy mobile audio and slow networks. Record measured word error, task completion, first-audio latency and CPU/RAM. Do not set a language live until its acceptance threshold passes.
6. Test warm human transfer, agent-unavailable fallback, silence/no-input, interrupted TTS, speech-provider outage, websocket disconnect, Asterisk restart, duplicate webhook delivery and spend-cap exhaustion.
7. Verify no cross-tenant audio, transcript, CRM result or knowledge leakage; verify opt-out and recording-consent tests.
8. Run the existing Telecom Core, native WebRTC, voice conversation, full-platform and production smoke suites. Only after all tests and a real public-host media proof pass should any live readiness flag change.

## Sources

- Asterisk WebSocket channel driver: https://docs.asterisk.org/Configuration/Channel-Drivers/WebSocket/
- Asterisk ARI External Media: https://docs.asterisk.org/Development/Reference-Information/Asterisk-Framework-and-API-Examples/External-Media-and-ARI/
- Asterisk AudioSocket: https://docs.asterisk.org/Configuration/Channel-Drivers/AudioSocket/
- Asterisk licensing: https://docs.asterisk.org/About-the-Project/License-Information/
- Pipecat framework: https://github.com/pipecat-ai/pipecat
- Pipecat WebSocket transports: https://docs.pipecat.ai/api-reference/server/services/transport/websocket-server
- LiveKit Agents: https://github.com/livekit/agents
- LiveKit telephony transfers: https://docs.livekit.io/telephony/features/transfers/
- sherpa-onnx: https://github.com/k2-fsa/sherpa-onnx
- whisper.cpp: https://github.com/ggml-org/whisper.cpp
- Kokoro-82M model card: https://huggingface.co/hexgrad/Kokoro-82M
- CallKit: https://callkit.dev/
- Microsoft Call Center AI: https://github.com/microsoft/call-center-ai
- Microsoft Call Center AI clean-room review: `docs/MICROSOFT-CALL-CENTER-AI-CLEAN-ROOM-RESEARCH-2026-11-02.md`
- Deepgram Voice Agent API and custom think endpoint: https://developers.deepgram.com/docs/voice-agent
- Deepgram multilingual Voice Agent configuration: https://developers.deepgram.com/docs/voice-agent-multilingual\n- Deepgram Nova-3 language prompting and supported languages: https://developers.deepgram.com/docs/nova-3-language-prompting
- Deepgram Voice Agent pricing and starting credits: https://deepgram.com/pricing
- Deepgram WebSocket authentication: https://developers.deepgram.com/docs/voice-agent
- Twilio bidirectional Media Streams: https://www.twilio.com/docs/voice/media-streams
- Cartesia Sonic language support: https://docs.cartesia.ai/build-with-cartesia/tts-models/latest#language-support\n- Google Cloud Speech-to-Text language availability: https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages

## Current status

Research reviewed and the Deepgram streaming adapter added on the feature branch. No Deepgram API key is configured and no provider session, paid speech call, new phone number or production deployment has been activated. CI and live public-host acceptance tests remain outstanding; the legacy Twilio Gather path remains the active fallback.
