# Magnanimous Render Engine
Native/self-hosted realtime digital-human rendering contract.

## Architecture
Browser microphone/camera controls -> Magnanimous AI conversation/orchestration -> streaming TTS/audio -> GPU avatar renderer -> WebRTC video/audio -> browser.
Magnanimous owns identity, memory, policy, tools and session state. Render nodes are replaceable workers.

## Render-node contract
POST /v1/sessions
Input: tenant_id, user_id, avatar_ref, voice_ref, mode, transport.
Output should include session_id plus WebRTC signaling/session metadata.

POST /v1/sessions/{id}/speak
Accept streaming/audio reference or text-to-speech payload.

POST /v1/sessions/{id}/interrupt
Immediately stop current speech/render queue for barge-in.

## Worker implementation targets
Support pluggable lip-sync engines such as MuseTalk/Wav2Lip-class pipelines, GPU worker pools, avatar preprocessing/cache, idle motion, gesture/event choreography, multiple sessions, health checks and metrics. WebRTC transport should remain independent of the visual model so the model can be upgraded without changing Magnanimous AI.

## Security
No provider secret in browser. Authenticate render nodes server-to-server. Tenant scope every session. Require explicit subject consent for cloned/custom human likenesses and voices. Keep audit metadata for avatar provenance and consent.
