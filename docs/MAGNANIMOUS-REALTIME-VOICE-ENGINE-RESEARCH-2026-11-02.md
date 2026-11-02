# Magnanimous Realtime Voice Engine — Research and Integration Decision

Date: 2026-11-02
Base commit reviewed: 524737c53e57d8013e5c945621b30710d582b990 (main)

## Evidence boundary

The supplied Facebook Reel URL could not be retrieved by the research tools: Facebook returned a cache/fetch failure and searches for the share identifier returned no indexed transcript. This document therefore records independently verified voice/contact-center research and a repository audit. It does not claim to summarize the Reel's spoken content. The Reel itself still needs a file upload, screen recording or transcript for claim-by-claim verification.

## Executive decision

Do not replace the owned Magnanimous Telecom Core and do not add a second PBX. Keep Magnanimous AI as the only identity, memory, reasoning, policy and orchestration brain. Keep Asterisk as the authoritative SIP/PBX/call lifecycle layer. Evaluate Pipecat as the realtime speech-pipeline worker, connected through Asterisk's native WebSocket media channel. Do not add LiveKit as a second media/PBX stack by default; retain it as an alternate transport/agent framework if later measured requirements justify it.

This is an architecture decision and test plan, not a production activation. The current repository does not yet contain a deployed Pipecat adapter or prove a live public PSTN voice-agent call.

## What the current repository actually has

The reviewed main branch contains:
- An Asterisk 22.11.0 image in telecom-core/asterisk/Dockerfile.
- A Magnanimous Telecom control API and protected ARI integration.
- Native Asterisk WebRTC/SIP.js browser-call source and a Chromium media E2E workflow.
- A provider-neutral Worker carrier bridge.
- Tenant-local included AI receptionist, customer-support, sales and appointment profiles.
- A current Twilio voice path in worker/src/voice-agent-runtime.js. It uses Twilio <Gather input="speech"> turn collection, receives a SpeechResult webhook, calls Cloudflare Workers AI with the text history, and returns another TwiML Gather response. This is a request/response speech-turn loop, not a full-duplex streaming voice pipeline.
- No Pipecat service in telecom-core/docker-compose.yml and no verified production Pipecat-to-Asterisk media adapter.

The source also preserves fail-closed gates for carrier readiness, outbound consent, AI disclosure, Do Not Call checks, automated campaign policy, recording controls, emergency calling and public Telecom host activation. Those gates must remain intact.

## Research findings and licensing

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

## Current status

Research reviewed and architecture decision recorded. No Pipecat dependency, voice worker, container, deployment, carrier charge, paid speech provider, public number or production readiness flag has been activated by this change.
