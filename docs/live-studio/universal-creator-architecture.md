# Magnanimous Universal Creator and Broadcast Architecture

## Product rule

Magnanimous AI remains the identity, memory, reasoning, creative director, event interpreter, safety policy and orchestration brain. TikTok, Meta, YouTube, Twitch, Zoom, OBS, games, model engines, speech engines, GPUs and cloud hosts are replaceable adapters. A provider outage must not erase projects or disable unrelated local creation.

This architecture serves everyday faceless creators, teachers, streamers, gamers, ministries, communities, businesses and people who want to create without selling anything. Commerce is an optional use case, never the default LIVE experience.

## Capability and authorization matrix

The table distinguishes a documented integration path from one that has actually been implemented and verified in production. An API being documented by a vendor does not mean the Magnanimous connector is already authorized or connected.

| Destination / tool | Supported path to build against | Required gate | Current Magnanimous status |
| --- | --- | --- | --- |
| TikTok LIVE | Creator-controlled stream output via supported LIVE Studio/OBS workflow; use only TikTok APIs or partner interfaces specifically approved for the intended LIVE events and actions | Account LIVE eligibility; app review and access to the exact APIs/scopes; creator consent; platform policy review | Existing AI Host is a preview with operator-entered comments. Event protocol/client UI exists. TikTok comment/event adapter and broadcast start are not deployed |
| Facebook Page Live | Meta Page Live Video API, including Page `/{page_id}/live_videos` where available; OBS/RTMP for the actual media pipeline | Meta app review, Page task/permission grants, Page ownership/admin role, current Page/account LIVE eligibility and current API product access | No production Meta LIVE adapter is claimed |
| YouTube Live | YouTube Live Streaming API for broadcast/chat management; `liveChatMessages.streamList` for a low-latency chat feed; OBS/RTMP for media output | Google OAuth consent, channel authorization, enabled API/quota and a live broadcast/chat ID | Event contract can represent YouTube events; OAuth/provider adapter and live-broadcast proof are not complete |
| Twitch | Twitch EventSub WebSocket or webhook subscriptions for chat and audience events; OBS/RTMP for media output | Broadcaster authorization and least-privilege scopes; chat reading and chat writing require their distinct scopes; EventSub subscription/transport lifecycle | Event contract can represent Twitch events; official OAuth/EventSub adapter is not deployed |
| OBS Studio | Local OBS WebSocket v5 for scene discovery, program-scene switching, recording start/stop and recording state | Explicit local pairing; authentication password; fixed loopback endpoint; operator approval for every control action | Portable Creator now includes the local adapter and control panel; mock protocol/security tests added; physical OBS hardware test still pending |
| Zoom desktop meetings | Human-hosted Zoom client with OBS Virtual Camera and an explicitly selected audio source | Network access, Zoom host/participant rights, OS camera/audio permissions; on Windows, OBS Virtual Camera driver installation may require administrator action | Documented integration route; no Zoom account connection is claimed |
| Zoom Video SDK | Embed a Zoom Video SDK session in a creator application; approved RTMP live-stream push to a supported destination | Zoom SDK credentials, application review where required, host/session authority and any paid usage/feature entitlement | Architecture option only; not bundled into offline USB and not activated |
| Zoom RTMS | Authorized Real-Time Media Streams flow for applications that genuinely need meeting media access or AI-notetaker behavior | Zoom enablement, meeting host/admin authorization, consent/disclosure and RTMS access | Not connected |
| Games and browser apps | Public/local game SDKs, game server webhooks, approved plugin APIs, local IPC, or browser `postMessage` with strict origin allowlists | Per-game/API permissions, local user pairing, anti-cheat compatibility, explicit source allowlists | Common event types are defined; no arbitrary game process injection or anti-cheat bypass |

## Vendor-specific boundaries

### TikTok

TikTok's developer documentation says API access requires an app submission and approval. That general app-review statement is not proof that a public, general-purpose LIVE chat/gift API is available to every creator app. Magnanimous must request and verify the specific LIVE capability and scope with TikTok or an authorized partner before enabling an adapter.

Until that access is confirmed, keep the manual comment workflow and the creator's own TikTok LIVE Studio/OBS controls. Do not collect TikTok passwords, cookies or session tokens; do not scrape private web sockets/endpoints; do not imitate a user to evade eligibility; and do not advertise an unapproved auto-chat connector as working.

### Meta / Facebook

The Meta Page Live Videos Graph API documents creation through the Page `live_videos` edge. Meta also documents account-age and Page/professional-profile follower eligibility requirements for going live. These conditions and API permissions may change; check current Meta developer documentation and the actual Page's permissions immediately before connecting. An API endpoint alone does not guarantee access to a user's Page or permission to publish.

### YouTube

Use `liveChatMessages.streamList` rather than a tight polling loop when consuming a supported live chat: Google's documentation describes it as a server-streaming, low-latency feed and the efficient alternative to constant polling. Persist the continuation token safely and resume after disconnect. Apply quota budgets, exponential backoff, duplicate-event suppression and an offline chat state.

### Twitch

Use EventSub's documented WebSocket or webhook transport. Keep read-chat and write-chat permissions separate. Never request write permission when the creator only wants audience interaction to be read and spoken by the AI. Renew/reconnect subscriptions and deduplicate event IDs.

### OBS

OBS WebSocket is included with OBS Studio 28 and later. Protect it with authentication. The remote-control guide recommends a password. A remote companion must not expose the OBS password to cloud code or browser storage; keep it local, encrypted where persisted, revocable and scoped to approved scenes/actions.

The Portable Creator's local companion now implements an OBS WebSocket v5 client on the fixed endpoint `ws://127.0.0.1:4455`. It performs the OBS salted SHA-256 challenge/response handshake, exposes scene discovery and allowlisted program-scene switching, and supports explicit recording start/stop. The browser never opens a direct WebSocket to OBS; it calls the same-origin loopback host, which keeps the OBS password out of browser storage and all cloud services. The password is not persisted. The host disconnects OBS when it exits.

This is local production control, not public streaming. OBS must already be installed and running with its WebSocket server enabled. Mock-protocol tests cover authentication, scene validation, recording requests and disconnect behavior. A physical OBS test on the target computer is still required before claiming real-device operation.

### Zoom

Do not implement an invisible or deceptive meeting bot by automating the normal Zoom client. Zoom's Meeting SDK policy says it is designed for human use cases and does not support bots or AI notetakers; Zoom directs AI-notetaker/realtime-media use cases to RTMS. For a person's own meeting, the practical producer path is a human-hosted Zoom client receiving the OBS Virtual Camera and chosen audio input. For a custom creator/meeting product, evaluate the Zoom Video SDK under its own authorization and usage terms. The Video SDK can push a session to RTMP destinations such as YouTube, Facebook and Twitch. Incoming OBS RTMP into a Video SDK session is a separate feature and may require Zoom enablement.

## Runtime architecture

1. **Creator workspace:** scenes, host personas, content calendar, scripts, asset library, audience game plans, show rundown and post-live review. Workspace identity and saved data belong to Magnanimous.
2. **Production graph:** scene sources, avatar renderer, captions, audio buses, music cues, overlays, browser sources, local media and recording output. All media paths must be portable when using a removable drive.
3. **Local companion:** runs beside OBS and local apps; pairs on loopback by default; receives approved local events; authenticates to OBS locally; accepts only allowlisted commands. Remote access, if later enabled, must use TLS, short-lived pairing, tenant scoping and revocation.
4. **Provider adapters:** distinct OAuth/connect, permission, health, event-read, approved write and disconnect lifecycle for each platform. Tokens are encrypted on the server or held in protected local storage; never put credentials in URLs, browser localStorage or event payloads.
5. **Event normalizer:** converts events to the common protocol, validates provider, actor, timestamp, event ID and bounded fields, strips credentials, deduplicates and records source/tenant context.
6. **Magnanimous director:** interprets the event and chooses among safe options such as answer, speak, show a poll, switch a pre-approved scene, show an overlay, or ask the operator. Viewer text is untrusted input and does not grant tool or account authority.
7. **Approval and receipts:** stage/source changes can be operator-approved. Account actions, broadcast start/stop, chat moderation, payments and destructive actions require explicit user confirmation and provider permission. Every completed action produces a verifiable receipt.
8. **Resilience:** bounded queues, per-provider rate limits, idempotency keys, reconnect cursors, retry budgets, circuit breakers, durable event receipts and a manual fallback. One provider outage cannot stop local recording or unrelated destinations.

## Multiple destinations and games

A single scene graph may feed multiple authorized output encoders, but each destination has independent aspect ratio, codec, bitrate, latency, audio, moderation and policy settings. A creator may publish vertical video to one destination and horizontal video to another when the relevant platform and encoder support it. Never assume that one stream key, one chat feed or one account permission authorizes every network.

Game integration should begin with official plugin/SDK surfaces or a user-installed local bridge. The companion maps game events—round start, score, achievement, inventory change, player join, match result—to the common event schema. It does not read game memory, inject code, defeat anti-cheat, extract credentials, or automate gameplay in ways prohibited by the game.

## Offline USB / SSD mode

Offline mode separates **local creation** from **Internet delivery**:

- Local: scripts, storyboards, lesson plans, avatar/scene preparation, local model inference, local TTS, recording, rendering, file organization and encrypted workspace storage—provided the runtime, model weights, codecs and assets are present on the drive/device.
- Network-required: TikTok/Facebook/YouTube/Twitch broadcast delivery, OAuth, cloud sync, remote game APIs, Zoom meetings, provider chat, app review and license validation.
- Local network is not Internet: a user may optionally stream to a private LAN target when an appropriate local receiver is installed, but this does not publish to public platforms.

A USB SSD is a portable storage format, not a universal executable. The release pipeline must provide separate signed builds for Windows x64, Windows ARM64, macOS Apple Silicon/Intel and Linux architectures. OBS Portable configuration is Windows-specific; macOS/Linux must use their supported application layout. Camera/microphone permissions, codecs, GPU drivers, virtual-camera drivers, OS security policies and available RAM/VRAM differ by machine.

No model weights or third-party binaries should be bundled until the exact version, source, cryptographic checksum, license, notices and redistribution rights are recorded. The launcher must never download assets silently or write caches to the system drive when a portable path is available. Profile hardware before loading a model, select an appropriate quantization, enforce memory limits and provide a manual/offline fallback when the hardware is insufficient.

## Cost and safety rules

- Free/native/local capabilities first; paid provider use is disabled until a cost estimate, funding source and margin rule are explicit.
- Prepaid funding and metering for variable GPU, voice, transcription and telecom consumption.
- No automatic GPU/cloud wake or paid upgrade in response to a workload failure.
- No broadcasting or publishing until a human operator starts the session and confirms the selected destinations.
- Disclose AI-generated hosts; obtain permission for likeness/voice use; never impersonate a real person.
- Follow each platform's AI, commercial-content, age, music, rights, moderation, privacy and accessibility policies.

## Readiness checklist before calling a destination operational

- [ ] Official app/API and current access requirements verified.
- [ ] Least-privilege OAuth scopes and revocation tested.
- [ ] Tenant isolation and encrypted credential storage verified.
- [ ] Event subscription, deduplication, reconnect and rate budget tested.
- [ ] OBS/Zoom/audio/video path tested on real hardware.
- [ ] 5-minute private/practice broadcast verified with audio/video sync.
- [ ] Creator-facing disclosure and platform policy reviewed.
- [ ] Failure fallback, disconnect and provider outage tested.
- [ ] No-cost/free-tier behavior and paid-cost guard verified.
- [ ] Human operator approval and action receipts confirmed.

## Show director policy boundary

The first Magnanimous director release is intentionally a recommendation engine, not an autonomous actor. It maps normalized events to short-lived, typed review cues; it does not execute actions. The local UI renders cue text using text nodes, never HTML injection. Viewer-provided text is displayed as data and is not embedded into the director's instruction prompt. The next phase can add an explicit operator approval surface and receipts, then separately authorized speech/overlay/scene adapters.

## Portability and Zoom research update (November 2026)

- OBS Portable Mode is officially documented for Windows. OBS says portable mode stores its configuration beside the application, but scene-collection media paths are not automatically portable; those paths must be made relative/common or repaired for each device. OBS says portable configuration mode is not supported on macOS or Linux. Therefore, the USB distribution must treat OBS as a Windows-specific optional component, package media with relative paths, and provide per-OS install/launch guidance instead of promising one identical executable for every computer. See [OBS Portable Mode](https://obsproject.com/kb/portable-mode).
- OBS hardware capability depends on CPU, encoder, resolution, frame rate and scene complexity. A compatible OS/GPU alone does not guarantee reliable streaming; each device needs a local encoder/recording check. See [OBS System Requirements](https://obsproject.com/kb/system-requirements/).
- For Zoom meetings, the lowest-friction route remains a human-operated Zoom desktop client with OBS Virtual Camera and explicitly selected audio. The Zoom Meeting SDK is for human use cases and its policy says it does not support bots or AI notetakers. Zoom provides separate RTMS for authorized realtime audio/video/transcript access, but RTMS requires Zoom Developer Pack credits, so it is not a free default. See [Meeting SDK policy](https://developers.zoom.us/docs/meeting-sdk/) and [RTMS pricing/overview](https://developers.zoom.us/docs/rtms/). Zoom also documents On Behalf Of tokens for user-authorized bot participants, with OAuth, app review and host authorization; that is a distinct reviewed integration path, not a bypass. See [On Behalf Of bot flow](https://developers.zoom.us/docs/meeting-sdk/auth/obf/).
- YouTube's `liveChatMessages.streamList` supports server-streaming delivery and continuation tokens after disconnect, so the eventual adapter should persist the last continuation token, resume safely, deduplicate event IDs and use bounded retry/backoff instead of aggressive polling. See [streamList](https://developers.google.com/youtube/v3/live/docs/liveChatMessages/streamList).



## Verified online provider constraints (25 November 2026)

The platform adapters must remain separate, replaceable connectors behind the Magnanimous event contract. A single "connect all" switch cannot bypass each provider's access, account eligibility, OAuth scope or review process.

| Destination | Verified route | Product decision |
|---|---|---|
| TikTok LIVE | Third-party RTMP access is account-granted and not universally available. TikTok's developer integrations are subject to app review. A creator's ability to go LIVE in the mobile app does not prove desktop/third-party RTMP access. | Support official LIVE Studio/manual handoff for eligible accounts and a user-entered short-lived Custom RTMP key only when TikTok supplies it. Never scrape session cookies, reverse-engineer private endpoints or promise access for every account. |
| Facebook Live | Meta's Page Live Videos Graph API can create a live video and return secure ingest URLs. Meta's current reference states account-age and Page/professional-mode follower eligibility requirements; API publishing also requires the matching Page permissions and app feature access. | Build an official Page OAuth connector with least-privilege scopes and a preview-first workflow. RTMPS/stream-key fallback is account-controlled. Do not assume personal profile, Group and Page permissions are interchangeable. |
| YouTube Live | The YouTube Live Streaming API supports broadcast/stream lifecycle and live chat. The liveChatMessages.streamList method pushes messages over a server-streaming connection and provides a continuation token for resumption; Google lists a 5-unit quota cost for the method. | Prefer streamList over aggressive polling. Persist continuation tokens encrypted per channel, deduplicate message IDs and respect API quota/backoff. |
| Twitch | Twitch EventSub supports WebSocket, webhook and conduit transports. WebSocket subscriptions require a user access token; webhook subscriptions require an app access token and appropriate user authorization. | Prefer one persistent EventSub connection per authorized user session; resubscribe after reconnect and deduplicate event IDs. Request only scopes for the selected event types. |
| Zoom | Zoom Meeting SDK policy is for human use cases and does not support bots or AI notetakers. RTMS is the supported realtime media pipeline for authorized meeting audio/video/transcripts, and requires Zoom Developer Pack credits. | Free-first path: a human joins the Zoom meeting and selects OBS Virtual Camera/audio. Paid/approved path: an explicit RTMS integration with participant notice, host authorization, credits metering and a clear stop control. Do not impersonate a human attendee. |

### Provider evidence

- TikTok developer app review and maintenance: [TikTok Developer Guidelines](https://developers.tiktok.com/docs/en/our-guidelines-developer-guidelines). Current third-party RTMP access is account-dependent; provider help references describe Custom RTMP keys issued by TikTok, not a public universal API: [StreamYard TikTok guide](https://support.streamyard.com/hc/en-us/articles/360051974452-Create-a-Live-Stream-on-TikTok), [Restream TikTok access guide](https://support.restream.io/en/articles/6721574-stream-to-tiktok).
- Meta Page live video endpoint and current requirements: [Page Live Videos Graph API](https://developers.facebook.com/docs/graph-api/reference/page/live_videos/).
- YouTube live chat streaming and continuation token: [liveChatMessages.streamList](https://developers.google.com/youtube/v3/live/reference/rest/v3/liveChatMessages/streamList).
- Twitch EventSub transport and token requirements: [EventSub overview](https://dev.twitch.tv/docs/eventsub), [WebSocket handling](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/), [chat authentication](https://dev.twitch.tv/docs/chat/authenticating/).
- Zoom Meeting SDK policy and RTMS credit requirement: [Meeting SDK](https://developers.zoom.us/docs/meeting-sdk/), [RTMS overview](https://developers.zoom.us/docs/rtms/), [RTMS getting started](https://developers.zoom.us/docs/rtms/meetings/getting-started/).

### Universal host behavior

The same Magnanimous AI host should run in both environments, but the model/voice engine can differ:

- **Online:** Magnanimous chat/creative services, authorized provider events, remote collaboration, and optional cloud voice/model execution under explicit quotas.
- **Offline:** locally installed model and voice assets, locally stored scripts, game-event cues, OBS scene graph and encrypted project vault. No online chat, provider chat, or public broadcast is represented as available while disconnected.
- **Handoff:** the script, scene metadata, event history and host persona sync as versioned project data; credentials and short-lived provider tokens do not sync as project content. Conflicts create a reviewable branch instead of overwriting a newer project.
- **AI host safety:** label the host as AI-generated, treat audience/game text as untrusted input, require operator approval before remote speech or production actions, and never claim to see a game state unless a permitted adapter actually supplies it.
