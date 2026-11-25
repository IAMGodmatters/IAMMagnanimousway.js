# Magnanimous TikTok LIVE Host — 2026 frontier technology review

**Research date:** 25 November 2026  
**Repository baseline:** `main` at `75aa1de9e2f95a65b47fcbbf5d2b43bebb97dec2`  
**Decision:** Keep Magnanimous as the brain and keep the long-session default free/local. Add external voice and avatar providers only as replaceable renderers, with server-side credentials, explicit consent, metering, and spend caps.

## Executive decision

There is no single provider that solves all of the following at once: a realistic speaking avatar, full-duplex conversation, hour-long sessions, TikTok LIVE account access, automatic TikTok comment ingestion, and zero cost.

The sensible approach is a layered system:

1. **Magnanimous owns the intelligence.** It is responsible for identity, conversation context, knowledge, safety rules, moderation decisions, and the final words spoken.
2. **Voice and avatar systems are replaceable output adapters.** A model may speak or animate the face, but it does not acquire Magnanimous's identity, memory, or authority.
3. **Kyutai Pocket TTS is the preferred first local voice benchmark.** Its official CPU-first engine streams audio, reports roughly 200 ms to first chunk, and supports seven languages without GPU inference. Run it locally through the existing Magnanimous Local Bridge; do not assume its community browser ports are production-ready. HeadTTS remains the better lip-sync/viseme candidate because it exposes phoneme timing.
4. **OBS is the local broadcast bridge.** Use OBS for the scene, audio/video composition, and an authorized TikTok output. Its WebSocket API is included in OBS Studio 28+ and should be password-protected. TikTok Shop Philippines LIVE Manager documentation also describes OBS Virtual Camera as a desktop video source without a stream key; audio is selected separately, and account availability remains TikTok-controlled.
5. **Make the live format bigger than the avatar.** Gaming, interactive storytelling, audience polls, music, education, art, community chat, and product demonstrations can each use a different stage layout and interaction loop. A stylized 2D/3D avatar or owned VRM/Live2D model is often more practical than a photoreal clone; a person should not need to show their own face.
6. **Use a secure local event bus.** Streamer.bot can receive supported Twitch/YouTube/Kick, OBS and connected-app events locally. The current LIVE page connects to Streamer.bot over its authenticated local WebSocket, discovers supported event categories, subscribes only to selected events, and reads the local action catalog. It offers only enabled actions whose names begin exactly `Magnanimous Approved - ` and requires a separate human confirmation before sending `DoAction`. No viewer text or AI-generated response can invoke a local action.
7. **Keep a human operator in the loop.** TikTok does not expose a general public LIVE chat/broadcast scope to this app. Use the account's authorized LIVE workflow and manually relay TikTok comments until an approved API permission is documented.
8. **Do not silently buy minutes.** Local speech and the local event bus are the default. Paid models and avatar services stay disabled until there is a user-controlled budget, usage ceiling, provider key stored server-side, and a working stop control.

## Technology comparison

| Technology | What it does well | Limits relevant to a TikTok broadcast | Acquisition recommendation |
|---|---|---|---|
| Magnanimous native host + browser speech | Uses the existing platform brain and local browser voice; no new per-minute voice/avatar bill | Current browser portrait is illustrative, not a photorealistic lip-synced digital human; comments are manually relayed | **Use now** as the no-new-provider-cost baseline |
| **TalkingHead + HeadAudio (native browser 3D avatar)** | MIT-licensed 3D renderer for GLB characters, full-body animation, facial expression/gesture, and streaming audio/lip-sync; HeadAudio adds a local AudioWorklet that estimates visemes from arbitrary speech audio without transcripts or a server | Requires a compatible rig and blend shapes; HeadAudio's audio-driven lip-sync is approximate and less accurate in noisy audio; asset licenses are separate and must be checked | **Primary free-first avatar renderer**: run locally in the browser, use an original or CC0 model, and keep Simli/Tavus as optional photorealistic upgrades |\n| **Kyutai Pocket TTS (local CPU streaming)** | Official CPU-first model, audio streaming, ~200 ms first chunk, reported faster-than-real-time synthesis on M4 CPU using two cores; seven languages (English, French, German, Portuguese, Italian, Spanish, Dutch); Windows x86 binaries and Python API | Official local Python/Rust application, not a first-party browser SDK; browser/WASM versions are community ports; actual performance on the user's older Windows PC must be measured; voice cloning only with consent | **Preferred first voice benchmark** through the existing Local Bridge: no GPU rental or per-minute API; keep HeadTTS as a lip-sync/viseme alternative and browser speech as fallback |\n| **HeadTTS + Kokoro 82M (local browser TTS)** | MIT-licensed browser TTS, runs locally through WebGPU/WASM and emits PCM/WAV audio with phoneme timestamps and visemes | English-only at present; model load uses memory; WASM fallback is much slower than WebGPU; default audio is 24 kHz and needs resampling to Simli's documented PCM16/16 kHz input. Not yet benchmarked on the user's PC | Best first no-per-minute-fee speech experiment, subject to local hardware test; keep browser SpeechSynthesis as fallback |
| **Simli Trinity-2 + Magnanimous** | Modular real-time avatar renderer: accepts audio generated by the platform's chosen TTS and returns video/audio over WebRTC; keeps the LLM and voice provider independent | It renders the face only; Magnanimous still needs a real audio-output/TTS stream. The browser's existing SpeechSynthesis does not automatically provide the MediaStreamTrack Simli needs. API key must stay on the server and only a short-lived session token reaches the browser | **Best next low-cost avatar adapter**: free 50 minutes/month; Hobby $10/month for 1,000 minutes, about $0.01/min; Pro $49/month for 5,500 minutes; Scale $249/month for 27,500 minutes. Do not enable without a hard spend cap |
| **Tavus CVI with bring-your-own LLM/audio** | Full face-to-face video agent with Phoenix-4 real-time 40 FPS rendering; platform offers a BYO LLM and BYO audio path, so it can be made a replaceable rendering/presence layer underneath Magnanimous | More complete and higher-cost pipeline; Developer Basic includes 25 minutes/month; Starter is $59/month with 100 included minutes and 3 concurrent streams. Official overage is $0.37/minute on Basic and $0.32/minute on Starter, with no automatic overage cap; each conversation has a 30-second minimum. Set a hard cap and ensure BYO LLM/audio is used | Premium photoreal option for later controlled trial; not first choice under no-spend constraints |
| Google Gemini 3.8 Live + Live Avatar | Integrated low-latency audio/video model; synchronized 24 FPS avatar, affective dialogue, proactive audio, function calling and 97-language support | Google lists the Live Avatar capability as GA in Gemini Enterprise with US/EU endpoints; custom avatar creation is allowlist-only. Without context compression, audio/video sessions are limited to 2 minutes and socket connections about 10 minutes; long sessions require context compression and session resumption. The model also supplies reasoning, so it is not a clean avatar-only adapter for Magnanimous | Excellent technology, but not the default while preserving Magnanimous as the sole brain; trial only if the enterprise access, region, privacy, and model-boundary conditions are acceptable |
| OpenAI GPT-Live 1.1 | Full-duplex voice can listen and speak concurrently and delegate tasks to a backend agent | It is a voice conversation engine, not an avatar renderer; current documented rates are $0.05/min active and $0.02/min standby, with backend model/tool usage billed separately | Optional voice path; use only if Magnanimous owns the response text and a strict spend limit is configured |
| HeyGen LiveAvatar | API/SDK for real-time avatar speech, facial animation, and lip-sync; has a free test tier | Official Free: 10 credits/month, max two minutes/session. Starter $19/month (150 credits, max five minutes), Essential $99/month (1,000 credits, max 20 minutes), Business $475/month (5,000 credits, max 60 minutes); each credit gives 30s Full or 1m Lite | Available proof-of-concept, but short session ceilings and higher subscription cost make Simli a better first low-cost visual adapter |
| **Streamer.bot Local Event Bus** | Local app/game event orchestrator that can receive Twitch/YouTube/Kick, OBS, Streamlabs/StreamElements, MIDI, speech-to-text and custom events; supports event-driven actions and third-party integrations | A separate Windows desktop app must be running; integrations must be configured by the creator; its WebSocket is a local control surface and must be authenticated | **Use as the first app/game event source**; keep the socket on loopback/private LAN and enable Authentication + Enforce. The LIVE page now reads events and fetches the local action catalog; it only offers enabled actions named with the exact `Magnanimous Approved - ` prefix and requires a separate operator confirmation before sending Streamer.bot's `DoAction` request. Inspect every action's sub-actions locally before allowing it |
| **VTube Studio Public API** | Local WebSocket API can list models/hotkeys/expressions, subscribe to events and trigger model expressions/animations; supports a faceless Live2D persona | Requires VTube Studio running, a model supplied by the creator, plugin authorization, and separate integration work; this current release only has the Streamer.bot bridge | **Next stylized faceless avatar adapter** after the local event bus; VTube Studio exposes a documented WebSocket API for model/hotkey/item/parameter control and event subscriptions. Requires a local adapter, plugin authentication, and explicit user permission; it is not yet connected directly |
| OBS Studio + obs-websocket | Local scene, overlay, and broadcast control; included with OBS 28+; does not require a paid avatar provider | Must run on the operator's computer; stream destination still depends on TikTok account eligibility and the authorized stream workflow | **Use as the local media and stage manager**; enable password authentication and never expose its WebSocket port publicly |

### Pricing and session details checked on 25 November 2026

- **Simli:** The official pricing page lists 50 free minutes/month for personal testing, with one concurrent session and template avatars. Hobby is $10/month for 1,000 minutes ($0.01/min); Pro is $49/month for 5,500 minutes ($0.0095/min); Scale is $249/month for 27,500 minutes ($0.009/min); enterprise starts as low as $0.005/min at scale. The marketing page claims about 150 ms video response after sending speech audio. These figures cover avatar rendering, not the LLM or TTS audio that Magnanimous needs to provide.
- **Tavus CVI:** Its current developer pricing lists a free Basic plan with 25 minutes of conversational video and 25 stock replicas; Starter is $59/month with 100 included minutes and 3 concurrent streams. The official table lists $0.37/minute overage on Basic and $0.32/minute on Starter, with no automatic overage cap; each conversation has a 30-second minimum. Tavus advertises Phoenix-4 live face rendering at 40 FPS and supports bring-your-own LLM and bring-your-own audio; use those modular options to preserve Magnanimous as the brain.
- **GPT-Live 1.1:** OpenAI's current developer guide configures the `gpt-live-1.1` voice model. The published GPT-Live-1 model page lists $0.05/minute active and $0.02/minute standby for paused WebRTC sessions, billed by the second; backend model/tool calls are separate. It is a voice agent rather than an avatar renderer.
- **Gemini 3.8 Live:** Google's standard paid pricing lists audio input at $0.005/minute and audio output at $0.018/minute, with text and other modalities billed separately. The pricing page currently lists a free tier. It says free-tier content may be used to improve Google products; avoid sending personal, family, ministry-member, or private viewer information through that tier.
- **HeyGen LiveAvatar:** The current official homepage lists Free at $0 (10 credits/month, maximum two minutes per session, one concurrent session, watermark); Starter at $19/month (150 credits, maximum five minutes per session, up to five concurrent sessions); Essential at $99/month (1,000 credits, maximum 20 minutes per session, up to 20 concurrent sessions); and Business at $475/month (5,000 credits, maximum 60 minutes per session, up to 40 concurrent sessions). One credit buys 30 seconds in Full mode or one minute in Lite mode. This means even Business's stated 60-minute session ceiling is not proof of a continuous multi-hour broadcast; credit consumption is a separate limit. Prices and credit allowances may change.

No paid provider is activated by this update. The UI identifies which choices are available to test, which are paid, and which remain unconnected.

## TikTok platform access and integration boundary

TikTok's public developer scope reference lists the LIVE scope `smb.creator_data.read` as permission to read daily statistics for partner creators within the authorized scope. That is not a general-purpose permission to read live chat comments, start a LIVE, or control a stream.

Therefore:

- TikTok account connection in the existing Social Hub must not be represented as permission to read live comments or start a LIVE.
- The operator must use TikTok's own LIVE interface and account-authorized streaming options.
- Third-party RTMP access is account-dependent. Do not assume every account that can start a mobile LIVE can also stream from desktop software.
- Do not capture passwords, session cookies, private app tokens, or hidden browser data to get around the platform's access controls.
- If TikTok later grants an official chat or broadcast API scope to this app, implement it as a documented adapter with least privilege and user-visible consent.

## Philippines policy and content safeguards

TikTok Shop Philippines' AI-Generated Content guidance, last checked on 25 November 2026, says AI-generated content is allowed when it complies with the Shop Content Policy and Community Guidelines. It specifically warns against AI content that misrepresents product details, fabricates results, or invents sympathy or crisis stories to push a sale.

TikTok Shop Philippines' **AI-Generated Content (AIGC)** page (updated 21 October 2026) permits AI-generated images, video, and audio when they comply with Community Guidelines and the Shop Content Policy and carry the required AIGC label. It prohibits misrepresenting product details, faking results, and inventing crisis or sympathy stories to pressure buyers. The **Unoriginal Content** page (dated 24 December 2025) prohibits copied/repackaged material; it does not mention AI-generated audio or narration. The separate **Non-Interactive Content** page (updated 5 November 2026) identifies recorded or computer-generated voices used instead of sustained, real-time verbal engagement as a non-interactive-content risk. The safe operating design for Shop LIVE is therefore a real operator who remains actively engaged and answers viewers; do not run a passive synthetic-voice loop or static avatar scene. Magnanimous may support the operator behind the scenes. This is not a blanket ban on AI avatars or synthetic voices in every ordinary, non-Shop LIVE.

For ministry and educational LIVE sessions, keep the AI identity clearly disclosed, answer viewers meaningfully, and do not impersonate a real person or use a likeness/voice without permission. TikTok's general AI-generated content guidance requires disclosure for realistic AI-generated audio/video. Re-check TikTok's current guidance before each new content type because policies and account eligibility can change.

## What this update implements

- Adds a visible, dated technology/acquisition comparison inside the TikTok LIVE Host page.
- Adds a working browser-side Streamer.bot connector: validates loopback/private-LAN WebSocket targets, requires the local authentication challenge, discovers the event catalog, subscribes to supported categories, and retains only a bounded feed of sanitized event summaries in the page. The password is not persisted or sent to Magnanimous; incoming events are not automatically spoken or used to execute actions. Browser local-network permission remains user-controlled and is not bypassed.
- Adds a Magnanimous Creative Director: an operator-approved event can be sent to the brain for a live reaction and an audience interaction idea; a separate control creates a 10-minute show rundown with timed beats and a quiet-chat fallback. Both use the existing Magnanimous chat/knowledge path with `use_tools:false`.
- Identifies Simli as the best low-cost modular avatar renderer for Magnanimous because it receives a separate speech-audio stream and leaves the intelligence layer outside the avatar service.
- Adds Tavus CVI as a higher-end alternative, with BYO LLM/audio support and explicit free-tier, paid-tier, and overage costs.
- Explains Gemini Live Avatar's enterprise access, session compression and reconnect requirements, and the tradeoff of using another model as the conversation brain.
- Shows GPT-Live 1.1's active/standby pricing and makes clear it is a voice engine rather than an avatar.
- Recommends OBS as the local media bridge and keeps Magnanimous as the intelligence layer.
- Correct policy boundary: TikTok Shop Philippines' Non-Interactive Content rule treats recorded or computer-generated voices as a risk when they replace sustained, real-time verbal interaction. The Unoriginal Content page does not explicitly ban AI voice. The UI therefore warns against passive AI-only Shop LIVE streams, not all synthetic voices or all non-Shop AI hosts.
- Keeps manual comment relay and truthful preview-only status. No unofficial TikTok comment scraper, hidden session access, or automatic LIVE launch is added.
- Does not install a paid SDK, store a provider key, start a paid session, or enable an automatic charge.

## Cloud resilience findings relevant to LIVE and the wider platform

Cloudflare's current official limits confirm the known Magnanimous D1 pressure point: the Workers Free plan allows 5 million D1 rows read/day and 100,000 rows written/day, with daily limits enforced from 1 September 2026. Once exhausted, D1 queries fail until midnight UTC; stored data is not deleted. Workers Free also has 100,000 requests/day and a 10 ms CPU-time limit per request. These are different failure modes and must be diagnosed separately.

The repository already has important protections:
- D1 schema is migration-owned rather than recreated on each request.
- Known D1 quota errors are classified as explicit 503 responses with a UTC reset time.
- Deployment refuses to deploy code when a changed migration cannot be applied.
- If no migration changed, deployment can defer only the D1 control-plane/materialization step after verifying required production tables.
- The checked-in Magnanimous capability manifest remains authoritative when its D1 cache cannot be refreshed.
- A scheduled maintenance workflow retries deferred migrations/materialization after the UTC reset.
- The standalone runtime includes provider-neutral SQL, object storage, KV, queue, event, vector, analytics, and secret-vault adapters, but its public production deployment is not yet proven live in this task.

This update adds a **read-only account-wide D1 analytics check** to `.github/workflows/cloudflare-worker-resource-diagnostic.yml`. It queries the official `d1AnalyticsAdaptiveGroups` dataset, reports rows read/written by database for the current UTC day, and warns at 70% and 90% of the documented Free thresholds. It requires a dedicated `CLOUDFLARE_ANALYTICS_READ_TOKEN` with Account Analytics:Read and does not mutate Worker settings, billing, D1, or deployments. Analytics values are estimates, not an exact live quota meter; the account's actual quota status must be confirmed from Cloudflare's error response or dashboard.

For the faceless creator experience, the preferred no-per-minute-cost stack is **Magnanimous brain → local Pocket TTS voice → TalkingHead 3D GLB renderer → HeadAudio real-time lip-sync → OBS/TikTok LIVE Studio**. Pocket TTS and TalkingHead run locally; no GPU rental or avatar-minute meter is required. A photorealistic Simli/Tavus renderer remains an optional upgrade. The 3D model must have a compatible rig/blend shapes and a license that permits the creator's intended commercial use. HeadAudio's audio-driven viseme estimates are approximate and must be tested under real microphone/voice noise.

The correct longer-term path is not to remove D1 or weaken payment/auth guarantees. Reduce avoidable row scans and writes, keep the capability manifest in source control as the authoritative brain, use idempotent conditional upserts, preserve quota-aware deferral, and graduate to a controlled paid plan only when real measured usage and revenue justify it. Do not move production identity, billing, credentials, or tenant authorization to an unverified standalone host merely to avoid D1 limits.

Primary Cloudflare references:
- D1 Free daily query enforcement (1 September 2026): https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/
- D1 pricing and row thresholds: https://developers.cloudflare.com/d1/platform/pricing/
- D1 analytics metrics and GraphQL datasets: https://developers.cloudflare.com/d1/observability/metrics-analytics/
- D1 expensive-query analysis: https://developers.cloudflare.com/d1/observability/find-expensive-queries/
- Workers plan and CPU limits (updated 18 November 2026): https://developers.cloudflare.com/workers/platform/limits/

## Next integration sequence

1. **Benchmark the local voice first.** Run official Kyutai Pocket TTS through the Magnanimous Local Bridge on the actual Windows stream computer. Measure first-audio latency, CPU/RAM, real-time factor, voice quality, reconnect behavior, and sustained output. Keep browser SpeechSynthesis as a fallback. Do not assume the M4 benchmark predicts performance on the user's older PC.
2. **Build the native 3D avatar renderer.** Add TalkingHead and HeadAudio as local browser modules, load only an original or rights-cleared GLB model, validate its rig/blend shapes, and synchronize the audio stream with mouth motion, expressions, and gestures. This is the preferred no-per-minute-cost path.
3. **Add the photoreal avatar as an optional upgrade.** Install the official Simli browser SDK and connect it to the existing server-minted LiveKit session token. Send tested mono PCM16 16 kHz chunks from the selected TTS engine. Keep the provider key in a Worker secret, enforce the existing 120-second session cap and 20-launch/40-minute monthly reservation budget, and verify the end-session path. The SDK is not yet installed or connected in this branch.
4. **Connect VTube Studio with explicit plugin consent.** Discover model/hotkey lists; let the creator map expressions and motions to approved event types; require operator confirmation until the scoped allowlist has been configured and tested.
5. **Improve the live world model and moderation.** The current event bridge reads a small allowlist of app/game event fields, redacts credential-like values, caps bursts at 12 events/5 seconds, stores the last 20 in page memory, and requires an operator to select a reaction. Next add confidence scoring, blocked-term and spam policies, moderator override, event deduplication, and per-action cooldowns. Keep game actions separate from raw viewer text.
6. **Add direct platform adapters only where they improve the local event bus.** OAuth must be tenant-isolated and request only the required chat/event scopes. For YouTube prefer `liveChatMessages.streamList` with resume tokens. Do not build an unofficial TikTok comment scraper.
7. **Implement a durable event relay only if required.** Keep high-rate WebSocket, media and game events on the desktop. If remote multi-device fan-out is needed, use a bounded Durable Object/queue for event metadata—not full video/audio frames—with tenant limits and idempotency.
8. **Add cost, safety and rights gates** before any paid voice/avatar API is enabled: session limits, no-overage defaults, spending caps, pause/stop, user confirmation, creator-owned/authorized assets, and AI disclosure.
9. **Run a local end-to-end test** with the user's real Windows machine, browser, OBS, Streamer.bot, VTube Studio (if chosen), and an eligible TikTok account in practice mode. For TikTok Shop LIVE, the operator must remain meaningfully engaged in sustained real-time interaction; a passive recorded or computer-generated voice loop risks non-interactive-content enforcement. For realistic AI-generated audio/video, follow TikTok's AI-generated content disclosure/labeling requirements.
10. **Keep TikTok comments manual** until a documented, account-authorized LIVE chat API actually exists.

## Primary sources

- Google DeepMind, Gemini 3.8 Audio model card (15 September 2026): https://deepmind.google/models/model-cards/gemini-3-8-audio/
- Google Gemini Live API session lifecycle, limits, context compression and session resumption: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api/start-manage-session
- Google Gemini 3.8 Live Avatar availability and capabilities: https://cloud.google.com/blog/products/ai-machine-learning/gemini-3-8-live-with-live-avatar-is-now-generally-available
- Google Gemini API pricing (checked 25 November 2026): https://ai.google.dev/gemini-api/docs/pricing
- OpenAI, GPT-Live-1 API announcement (10 September 2026): https://openai.com/index/introducing-gpt-live-1-in-the-api/
- OpenAI API pricing (checked 25 November 2026): https://platform.openai.com/pricing/
- HeyGen LiveAvatar current official plan/price table (checked 25 November 2026): https://www.liveavatar.com/
- HeyGen LiveAvatar FAQ (credit calculation): https://help.heygen.com/en/articles/12758866-liveavatar-faq
- TalkingHead MIT 3D renderer: https://github.com/met4citizen/TalkingHead\n- HeadAudio MIT audio-driven lip-sync: https://github.com/met4citizen/HeadAudio\n- MPFB open-source Blender/MakeHuman character creator: https://github.com/met4citizen/MPFB\n- Kyutai Pocket TTS official source (CPU, streaming, seven languages, voice export): https://github.com/kyutai-labs/pocket-tts 
- Pocket TTS voice export and voice-consent workflow: https://github.com/kyutai-labs/pocket-tts/blob/main/docs/CLI%20Commands/export_voice.md 
- HeadTTS official source (MIT license, WebGPU/WASM, Kokoro audio/viseme output, English-only limits): https://github.com/met4citizen/HeadTTS
- HeadTTS browser demo: https://met4citizen.github.io/HeadTTS/
- Simli official pricing and plan limits: https://www.simli.com/pricing
- Simli official Javascript SDK integration: https://docs.simli.com/api-reference/simli-client
- Simli current API v2 migration guide (legacy endpoints renamed to /compose/token and /compose/ice; P2P and LiveKit transports documented): https://docs.simli.com/api-reference/api_migration_guide
- Simli Compose session-token API v2: https://docs.simli.com/api-reference/compose-session-token
- Simli Compose ICE API: https://docs.simli.com/api-reference/get-ice-servers
- Simli JavaScript WebRTC SDK (16 kHz PCM16 audio input): https://docs.simli.com/api-reference/simli-client
- Simli official JavaScript SDK: https://github.com/simliai/simli-client
- Simli WebRTC client package: https://www.npmjs.com/package/simli-client
- Tavus CVI modular architecture and BYO LLM/audio: https://www.tavus.io/cvi
- Tavus developer plans and minute overage: https://www.tavus.io/pricing
- HeyGen LiveAvatar official Help Center plan detail: https://help.heygen.com/en/articles/12758516-introducing-liveavatar
- TikTok for Developers, API scopes reference: https://developers.tiktok.com/docs/en/tiktok-api-scopes
- TikTok official AI-generated content disclosure and labeling: https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content\n- TikTok developer LIVE scope (partner-creator daily statistics only): https://developers.tiktok.com/docs/en/tiktok-api-scopes
- TikTok Shop Philippines, AI-Generated Content (AIGC, dated 01/28/2026): https://seller-ph.tiktok.com/university/essay?default_language=en&identity=1&knowledge_id=7188082378639105
- TikTok Shop Philippines, Unoriginal Content (dated 12/24/2025; copied/repackaged-content policy): https://seller-ph.tiktok.com/university/essay?knowledge_id=7654197957084929
- TikTok Shop Philippines, Non-Interactive Content (dated 09/10/2025): https://seller-ph.tiktok.com/university/essay?default_language=en&knowledge_id=7654203686192897
- TikTok Shop Philippines, Non-Interactive Content: https://seller-ph.tiktok.com/university/essay?from=policy&identity=1&knowledge_id=7654203686192897&role=1
- TikTok, About AI-generated content: https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content
- TikTok Shop Philippines, LIVE Manager / desktop and OBS Virtual Camera: https://seller-ph.tiktok.com/university/essay?knowledge_id=8100940387305232
- OBS Project, obs-websocket: https://github.com/obsproject/obs-websocket
- Streamer.bot integrations (Discord, Crowd Control, Elgato, StreamElements and more): https://docs.streamer.bot/guide/integrations
- Streamer.bot Crowd Control game-event adapter: https://docs.streamer.bot/guide/integrations/crowd-control
- Crowd Control developer API (Unity, Unreal, Godot, modded connectors and WebSocket/HTTP): https://developer.crowdcontrol.live/
- VTube Studio API and event stream: https://github.com/DenchiSoft/VTubeStudio

---

**Truth boundary:** This research and UI update do not mean a TikTok account has been authorized, a provider account has been connected, an API key has been installed, a LIVE has been started, or a human-like avatar has been activated in production.


## Interactive apps, games, and audience co-creation

The avatar should not be the product's only capability. The stronger pattern is an event-driven live world:

1. **Local event ingress:** The new browser connector talks directly to the creator's Streamer.bot instance. It restricts the socket to localhost, `.local`, or private LAN; performs the documented SHA-256 salt/challenge authentication; asks Streamer.bot for its local event catalog; and subscribes only to the currently supported event types. Current subscription categories include Twitch chat/follows/cheers/subs/rewards/polls/predictions, YouTube chat/superchats/memberships/broadcast state, OBS connected/disconnected, general custom events, Streamlabs, StreamElements, MIDI and speech-to-text events. The UI keeps 20 recent sanitized summaries in page memory. The operator selects an event before sending it to Magnanimous. The browser connector does not execute arbitrary commands or auto-speak. It can invoke only enabled, creator-preconfigured actions with the exact approved-name prefix after a separate operator confirmation; every action's sub-actions must be reviewed locally first.
2. **Stylized faceless personas:** VTube Studio provides a local public WebSocket API for Live2D models, hotkeys, expressions, model state and event notifications. That gives the creator a character that can blink, emote, react, change pose, or trigger an animation without exposing their real face. A future adapter should request VTube Studio's own plugin permission and let the creator choose from their existing model hotkeys; do not assume access to a model or face-tracking stream before the user grants it.
3. **Magnanimous event understanding:** Normalize each selected event into a small schema (tenant, source, event type, timestamp, actor alias, sanitized payload, consent/permission, risk, confidence). Deduplicate, rate-limit per source and actor, redact identifiers and sensitive information, and keep a short bounded context window. Magnanimous decides whether to react, ask a follow-up, propose a viewer vote, suggest a scene or avatar expression, or ignore the event.
4. **Action broker:** The model never receives unrestricted access to OBS, games, or viewer accounts. It proposes typed actions; deterministic policy checks a creator-configured allowlist, user authorization, cooldown, cost/resource budget and risk tier; a local bridge executes only approved actions and returns evidence. Scene switching, avatar expressions and game actions remain suggestions until their individual adapter is integrated and authorized.
5. **Game adapters:** Support documented extension points only: official game/server plugins, mod SDKs, user-owned Unity/Unreal projects, controller inputs, or explicit local game events. Use Crowd Control or an approved game plugin only if the game and user's account support it. Do not inject code, read protected process memory, bypass anti-cheat, or automate competitive gameplay. For games with no documented event surface, use safe manual/controller interaction and do not claim deep integration.
6. **Audience co-creation:** Polls, branching stories, trivia, cooperative goals, sound cues, avatar expressions, scene transitions and highlight markers can be driven by moderated viewer events. Every action needs a stop control and a human moderator override.

**Platform adapters:** Twitch EventSub supports WebSocket notifications for chat, follows, subscriptions, Bits, channel points, polls, predictions and related channel events. Twitch OAuth requires explicit scopes; a chatbot that reads and sends chat needs `user:read:chat` and `user:write:chat`, while installed chatbot and cloud chatbot flows have different scopes and consent rules. YouTube Live Chat `streamList` is a low-latency server-streaming feed with a resume page token; prefer it over tight polling to reduce quota use. TikTok's documented LIVE scope currently covers daily partner-creator statistics, not a general live-chat feed or broadcast-control API. Keep TikTok comments manual until a documented, account-authorized chat API is verified.

**Creative home intelligence:** Use the same event model in Magnanimous's native media studio: the brain proposes a show rundown, title/caption variants, visual direction, stage plan, audio/voice choice, accessibility captions, and highlight candidates. A rights/policy gate checks music, images, likeness, disclosure and platform rules before a renderer or local media tool is called. A render is not marked complete until the media worker returns an artifact and verification evidence. Heavy rendering belongs on owner-controlled local compute or a replaceable isolated media worker—not on a Cloudflare request CPU path.

### Primary integration sources

- Streamer.bot WebSocket API and event catalog: https://docs.streamer.bot/api/websocket ; https://docs.streamer.bot/api/websocket/events
- Streamer.bot secure WebSocket configuration: https://docs.streamer.bot/api/websocket/guide/configuration
- Streamer.bot authentication challenge: https://docs.streamer.bot/api/websocket/guide/authentication
- Chrome Local Network Access restrictions and WebSocket permission prompt: https://developer.chrome.com/blog/local-network-access
- Chrome Local Network Access WebSocket guidance: https://developer.chrome.google.cn/docs/modern-web-guidance/guides/security/local-network-access?hl=en
- Streamer.bot Subscribe/GetEvents request reference: https://docs.streamer.bot/api/websocket/requests
- VTube Studio public API (model, hotkeys, expressions, local WebSocket): https://github.com/DenchiSoft/VTubeStudio
- VTube Studio hotkey action reference: https://github.com/DenchiSoft/VTubeStudio/blob/master/Files/HotkeyAction.cs
- Twitch chat/EventSub authentication and scope requirements: https://dev.twitch.tv/docs/chat/authenticating/
- Twitch EventSub subscription types: https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/
- Twitch EventSub WebSocket lifecycle: https://dev.twitch.tv/docs/eventsub/handling-websocket-events/
- YouTube Live Chat streamList: https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/streamList
- OBS WebSocket (included in OBS 28+; password protection recommended): https://github.com/obsproject/obs-websocket

## Cloud incident: measurement before changing production

The existing Cloudflare incident is an account-level alert (1,000+ resource-limit exceedances/day) and does not identify the script or route. The Cloud Exit regression lock validates the independent runtime architecture; it does not prove the production Cloudflare Worker is the source or that its CPU issue is fixed.

A new owner-only read-only API endpoint and GitHub Actions workflow query Cloudflare's Workers Analytics GraphQL API using a separate `CLOUDFLARE_ANALYTICS_READ_TOKEN` with `Account Analytics:Read` and the `CLOUDFLARE_ACCOUNT_ID`. They deliberately do not reuse the deployment token. The query is limited to the last 24 hours in the Owner Cloudflare console and groups adaptive request/error estimates and CPU p50/p99 by Worker script and invocation status. If the dedicated secret is absent, the scheduled workflow skips with a notice; the owner console reports the exact missing permission. It never changes Worker settings, deployments, plan or billing.

**Next step after first successful telemetry:** identify the affected Worker(s), inspect CPU p50/p99 and status distribution, correlate with deployed revisions and route logs, then profile and optimize only the measured hotspot. Do not increase the CPU allowance or upgrade the account as a substitute for root-cause diagnosis.
