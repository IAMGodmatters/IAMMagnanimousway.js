# Magnanimous Universal Creator and Broadcast Architecture

## Product rule

Magnanimous AI remains the identity, memory, reasoning, creative director, event interpreter, safety policy and orchestration brain. TikTok, Meta, YouTube, Twitch, Zoom, OBS, games, model engines, speech engines, GPUs and cloud hosts are replaceable adapters. A provider outage must not erase projects or disable unrelated local creation.

This architecture serves everyday faceless creators, teachers, streamers, gamers, ministries, communities, businesses and people who want to create without selling anything. Commerce is an optional use case, never the default LIVE experience.

## Capability and authorization matrix

The table distinguishes a documented integration path from one that has actually been implemented and verified in production. An API being documented by a vendor does not mean the Magnanimous connector is already authorized or connected.

| Destination / tool | Supported path to build against | Required gate | Current Magnanimous status |
| --- | --- | --- | --- |
| TikTok LIVE | Creator-controlled stream output via supported LIVE Studio/OBS workflow; use only TikTok APIs or partner interfaces specifically approved for the intended LIVE events and actions | Account LIVE eligibility; app review and access to the exact APIs/scopes; creator consent; platform policy review | Existing AI Host provides optional owner-enabled, time-limited host-speech takeover for operator-queued comments, normalized events relayed by a paired companion, and an optional timed six-segment show rundown. The TikTok comment/event adapter and public broadcast start remain undeployed. |
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

## Live-show autonomy and authority model

Magnanimous AI may take over routine show-running tasks, but takeover is an explicit owner decision for each session—not a permanent account-wide permission. The default is **manual**. A supervised/co-pilot mode may suggest actions for review. **Autonomous** mode is available only when the owner starts it, selects capabilities, approves any OBS scene allowlist and can stop it at any time.

The online AI Host also offers an optional six-segment timed rundown (opening direction, main teaching, audience participation, interactive round, practical takeaway, and recap/closing). Each segment is an owner-approved internal cue scheduled against the chosen 10/30/60-minute session and serialized through the same bounded queue as audience events. The owner may leave this option off and use takeover only as a reactive co-host. The portable Creator currently supports local-model host speech and pre-approved OBS scene changes; the online host uses Magnanimous' existing chat and browser voice pipeline.

### Capabilities that may be delegated

- Host speech: generate concise, disclosed AI-host lines from validated events. Viewer text remains untrusted data and is never interpreted as a tool instruction. The speech channel must be tested, disclosed and routed to the broadcast mix deliberately.
- Show presentation: switch among scene names that the owner explicitly selected from the connected OBS scene list; display bounded overlays; run a show rundown and segment timer.
- Audience interaction: read permitted chat/events, answer routine questions and run polls or games only when the provider adapter explicitly declares the relevant read/write capability and the owner enables it for that session.
- Resilience: pause the affected ability when its provider disconnects, credentials expire, event delivery becomes unreliable or rate limits are reached. Do not silently switch to an unofficial integration or continue with stale permissions.

### Actions that stay operator-controlled

Autonomous mode must not ban, timeout, mute or delete a viewer's content; alter account security or OAuth permissions; change stream destinations or stream keys; start/end a public broadcast; purchase, donate, refund, spend, promise or move money; accept paid obligations; send private messages; or make legal, medical or financial decisions. Show the owner a prepared action and ask for an explicit decision instead. A provider's scope is necessary but never sufficient on its own to grant Magnanimous broader authority.

### Takeover safety contract

Every autonomous session has an explicit consent record, narrow capability list, bounded duration (maximum 60 minutes in the local runtime), bounded action rate, approved scene names, visible emergency stop, session receipts and a control-surface heartbeat. Stopping the session revokes pending action reservations immediately. The local runtime stops after the browser control surface misses its heartbeat lease or the companion process exits. The model may recommend a line or choose a pre-approved scene, but it cannot add permissions, expand the scene allowlist, change destinations, or override the owner's stop.

The current portable implementation supports local-model host speech and pre-approved OBS scene changes. It does not yet include platform account adapters or public-stream chat writes. The online Live Studio should use the same policy contract but connect provider-specific adapters only after OAuth, exact scopes, account ownership, revocation, tenant isolation and provider review have been verified.

### Provider-specific transport and permission constraints (verified November 26, 2026)

- **YouTube Live:** `liveChatMessages.streamList` establishes a server-streaming connection and supplies a continuation token that can resume from the last received point after a disconnect. Use it instead of aggressive polling where authorization permits; persist tokens securely, deduplicate message IDs and use bounded retry/backoff. Sending chat messages and polls is separately authorized and consumes quota. Deleting messages and banning users require channel-owner/moderator authority and must remain behind operator approval. References: https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/streamList, https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/insert, https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/delete
- **Twitch:** EventSub supports WebSocket, webhook and conduit transports. The planned `session_reconnect` flow preserves continuity when the old socket remains open until the new one receives its welcome message. A hard connection loss is different: subscriptions must be recreated and events missed during the outage are not replayed. Deduplicate message IDs and reconcile current state where permitted. Chat writing and moderation use distinct scopes, including `user:write:chat` and `moderator:manage:banned_users`; moderation stays operator-controlled. References: https://dev.twitch.tv/docs/eventsub/handling-websocket-events/, https://dev.twitch.tv/docs/api/reference/chat, https://dev.twitch.tv/docs/api/reference/moderation
- **TikTok:** the public developer scope catalog reviewed for this release lists LIVE creator daily-statistics access for partner creators and partner-event reporting; it does not list a general live-chat subscription scope. Keep general chat ingestion and automated replies disabled unless TikTok grants a currently documented, approved product capability for the exact account and use case. Never scrape the consumer app or rely on private endpoints. References: https://developers.tiktok.com/docs/en/tiktok-api-scopes, https://developers.tiktok.com/docs/en/our-guidelines-developer-guidelines
- **Facebook Live:** the current Graph API Live Video comments edge is documented as read-only; creating, updating or deleting comments is not supported through that edge. Treat the ability to read comments as no authority to reply or moderate. Verify Page/account permissions and any separate supported writing capability before enabling it. Reference: https://developers.facebook.com/docs/graph-api/reference/live-video/comments/
- **OBS:** WebSocket control can automate scenes and sources, but OBS recommends password authentication. Keep it on loopback for the portable companion; never expose its control socket to the public Internet. References: https://obsproject.com/kb/remote-control-guide

Every adapter must publish its own capability manifest: event types, read/write operations, OAuth scopes, delivery/replay semantics, quota, review state, rate limits and revocation behavior. The common Magnanimous event protocol normalizes events; it does not invent provider capabilities.
