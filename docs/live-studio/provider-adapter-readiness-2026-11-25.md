# Magnanimous LIVE provider readiness — 2026-11-25

## Product and security rule

Magnanimous AI remains the identity, memory, event interpreter, creative director and policy owner. Provider APIs are replaceable transport adapters. A connector is not "supported" merely because an API exists: it is operational only after the exact app permission, account eligibility, consent, connection lifecycle, event recovery, rate budget and end-to-end broadcast path have passed verification.

This system is for faceless creators, teachers, streamers, gamers, ministries, communities and people who want to create without selling. Commerce is optional. Audience messages are untrusted data and never become tool instructions.

## Current official provider facts and implementation consequences

### YouTube Live

Official references:
- Live chat streaming: https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/streamList
- Live chat list: https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/list
- Authorization: https://developers.google.com/youtube/data/live/authentication

Facts:
- `liveChatMessages.streamList` is the server-streaming, low-latency option and sends recent history followed by new messages.
- Each response carries a `nextPageToken`; a reconnect can resume from the last token.
- The documented quota cost is 5 units per streamList call.
- OAuth 2.0 is required for private channel data and broadcast management. An API key can be used for public live-chat retrieval, but it does not authorize management of the creator's private broadcast.

Implementation:
- Prefer streamList over tight polling.
- Persist the last continuation token with the provider connection record; resume after reconnect.
- Deduplicate on YouTube message ID before enqueueing to the durable Magnanimous event journal.
- Track quota and stream state; use bounded reconnect backoff and surface LIVE_CHAT_DISABLED / LIVE_CHAT_ENDED distinctly.
- Request only the least-privilege OAuth scopes needed for the selected actions. Read-only chat must not request chat-write or moderation permissions.

### Facebook Page Live

Official references:
- Page Live Videos, Graph API v27.0: https://developers.facebook.com/docs/graph-api/reference/page/live_videos/
- Live Video Comments: https://developers.facebook.com/docs/graph-api/reference/live-video/comments/

Facts:
- The Page `/{page_id}/live_videos` edge creates a LiveVideo resource. The current reference says reading is not supported on that edge.
- The Live Video Comments edge supports reading comments for New Page Experience. It supports a stream filter and reverse-chronological ordering; the documentation recommends continually polling in reverse-chronological mode for live comments.
- Meta's current Page Live Videos reference states the account must be at least 60 days old and the Page or professional-mode profile must have at least 100 followers before the account can go live.
- The existence of the Graph API edge does not grant an app the Live Video API feature, Page permissions, Page task grants or review approval.

Implementation:
- Keep broadcast creation and comment ingestion as separate adapter capabilities with separate readiness checks.
- Before connection, verify the user's Page role/tasks, current account eligibility, the app's Live Video API feature and the exact approved Page permissions.
- Use a durable comment cursor based on timestamp/ID where supported; account for pagination, overlap and duplicate delivery.
- Do not label a Page as connected or broadcast-ready until a private test broadcast and comment read path both pass.

### Twitch

Official references:
- EventSub overview: https://dev.twitch.tv/docs/eventsub/
- Chat event reference: https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage
- WebSocket handling: https://dev.twitch.tv/docs/eventsub/handling-websocket-events/
- Chat authentication: https://dev.twitch.tv/docs/chat/authenticating/

Facts:
- EventSub supports WebSocket, webhook and conduit transports.
- `channel.chat.message` can deliver chat events over EventSub.
- A user access token needs `user:read:chat` to read chat as that user. App-token subscriptions have additional prior-authorization requirements, including `user:read:chat` and `user:bot` for the reader and `channel:bot` for the broadcaster unless the reader is the broadcaster or a moderator.
- Sending chat requires the separate `user:write:chat` permission.
- The WebSocket server requires the client to use the Welcome message's session ID when subscribing. Twitch says a lost WebSocket connection requires reconnecting and resubscribing; events missed during the disconnect/re-subscribe gap are not replayed.

Implementation:
- Keep read-chat and write-chat permissions separate; default to read-only.
- Maintain one WebSocket connection unless there is a specific reason to create another.
- Handle Welcome, Keepalive, Reconnect, Revocation and close messages explicitly.
- Persist subscription configuration and deduplicate by Twitch message/event ID.
- Record a visible gap/degraded status when Twitch reports a disconnect; the local durable journal protects only events already received and cannot recreate events Twitch did not replay.

### TikTok LIVE

Official references:
- TikTok Developer Guidelines: https://developers.tiktok.com/docs/en/our-guidelines/developer-guidelines
- TikTok Webhooks and Events: https://developers.tiktok.com/docs/en/webhooks-events

Facts:
- TikTok states that apps integrating with APIs and SDKs in Live are reviewed, and approved apps may receive authorized access to end-user data.
- The published general webhook event list includes authorization removal and video upload/publish events. It does not document a general public LIVE chat/comment/gift stream in that webhook reference.
- A third-party library that reverse-engineers TikTok's internal LIVE Webcast protocol is not an official TikTok API or proof of authorized access.

Implementation:
- Do not scrape private WebSockets, reuse browser cookies/session IDs, automate account sessions, or ship a reverse-engineered connector as a supported provider.
- Keep the creator-controlled LIVE Studio/OBS output workflow and operator-entered event workflow available.
- Build a TikTok adapter only when the exact LIVE capability and scopes are confirmed in an approved developer app or authorized partner agreement. Keep it disabled until a live account test and policy review pass.

### Zoom

Official reference:
- Realtime Media Streams (RTMS): https://developers.zoom.us/docs/rtms/

Facts:
- RTMS is Zoom's data pipeline for live meeting audio, video and transcript data, rather than a participant bot or automated meeting client.
- RTMS uses WebSocket by default and can use SRT with protocol V2.
- Zoom says RTMS use requires account credits and has plan/concurrency limits.

Implementation:
- For ordinary meetings, use a human-hosted Zoom client with OBS Virtual Camera and explicitly selected audio.
- For an AI media-processing workflow, evaluate RTMS under its own authorization, consent and cost gates.
- Do not create an invisible participant bot. Do not activate RTMS or paid credits without an explicit funded budget and user authorization.

### OBS

Official reference:
- OBS Portable Mode: https://obsproject.com/kb/portable-mode

Facts:
- Windows Portable Mode keeps OBS configuration beside the application.
- OBS explicitly warns that scene media files are not automatically portable; paths must be corrected or made common across devices.
- OBS Portable Mode is not supported on macOS or Linux.

Implementation:
- Package OBS separately per supported OS; do not claim one portable binary works everywhere.
- Add a scene/media manifest and relative-path remapper before claiming scene portability.
- Validate every referenced media file and report missing files before a show.
- Keep the OBS WebSocket password local, encrypted if persisted, revocable and scoped to operator-approved actions.

## Shared adapter contract

Every provider adapter must expose these separate lifecycle states:

1. `not_configured`
2. `awaiting_user_authorization`
3. `authorized`
4. `connecting`
5. `connected`
6. `degraded`
7. `reconnecting`
8. `revoked`
9. `disconnected`
10. `error`

Each adapter must implement:
- explicit connect, health, disconnect and revocation handling;
- least-privilege scopes and token revocation;
- tenant-bound encrypted credential storage;
- event normalization, provider-scoped idempotency and timestamp validation;
- cursor/continuation persistence where the provider supports replay;
- explicit gap status where the provider does not replay missed events;
- rate limits, bounded queues, exponential backoff and circuit breakers;
- encrypted durable local event acceptance (workspace-derived AES-GCM key) and delivery acknowledgements;
- read-only mode by default;
- separate approval gates for chat writes, moderation, scene changes, broadcast start/stop, payments and destructive actions;
- an operator-visible action receipt and audit trail.

## Readiness gate before enabling a destination

- [ ] Official API/SDK or authorized partner capability confirmed for the exact event/action.
- [ ] App review and production scopes approved.
- [ ] User consent and account/Page/channel eligibility checked.
- [ ] OAuth token storage, revocation and tenant isolation tested.
- [ ] Event transport reconnect and replay/gap behavior tested.
- [ ] Durable event journal, idempotency and acknowledgement path tested.
- [ ] OBS scene, media, audio and video path tested on real hardware.
- [ ] Private/practice broadcast completed with synchronized audio/video.
- [ ] AI-host disclosure, moderation, privacy, music and content rights reviewed.
- [ ] Provider outage, disconnect, retry, stop and manual fallback tested.
- [ ] Free-tier limits and any variable paid costs are disclosed and funded before use.

## Current Magnanimous status

The portable Creator Studio has a local event normalizer, bounded review-only show director, OBS local control foundation, and a durable event journal under development in PR #1018. The online provider adapters are not represented as connected or production-ready merely because the vendor APIs are documented. TikTok LIVE remains approval-gated; YouTube, Meta and Twitch still need their authorized adapter implementations and real account tests; Zoom RTMS is a separately funded option.

This document is a research and implementation contract, not evidence that a provider account has been connected or a public broadcast has been completed.
