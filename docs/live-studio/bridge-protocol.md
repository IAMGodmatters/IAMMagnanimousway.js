# Magnanimous Live Studio Bridge Protocol

## Purpose
Magnanimous is the brain and owner of creator identity, audience context, event interpretation, safety policy, creative direction and orchestration. Platform APIs, OBS, games, browser sources, voices and cloud runtimes are replaceable adapters.

The browser bridge client in `frontend/lib/live-studio/` is a protocol foundation. It is **not** a deployed companion server and does not claim that OBS, TikTok, Twitch, YouTube or game integrations are already connected.

## Provider adapters
Each provider adapter translates only authorized events into the common `LiveEvent` envelope:
- `youtube`: official YouTube Live Streaming API; prefer `liveChatMessages.streamList` to aggressive polling.
- `twitch`: official EventSub WebSocket or webhook transport with required broadcaster scopes.
- `tiktok`: use only official account-authorized LIVE/streaming paths available to the creator. Where no supported comment API is available, use operator-entered comments or another permitted surface. Never scrape private endpoints or collect passwords.
- `obs`: connect through a local companion process to OBS WebSocket. Require OBS authentication and explicit operator pairing; never expose the OBS password remotely.
- `game` and `browser`: documented plugin APIs, local game events, strict-origin browser postMessage, or explicit operator-triggered events. Never inject code into games or bypass anti-cheat.

## Protocol
Protocol version 1 begins with an `auth` envelope carrying a short-lived pairing token in the message body, never the URL. The server authenticates it, binds it to one owner/tenant and allowlisted adapters, then sends `{ "kind": "ready", "protocolVersion": 1 }`.

Incoming events use `event-contract.ts`. Unknown providers/types, malformed IDs, stale timestamps and oversized fields are rejected. Sensitive values such as tokens, cookies, passwords and authorization headers are invalid event tags.

Outgoing commands currently support only local-owner-approved scene selection (`scene.set`) and host speech (`host.speak`). Overlay visibility and audio-cue commands are not enabled in this relay version. No broadcast start/stop, account management, moderation, payments, arbitrary navigation, shell or arbitrary code execution is exposed.

## Reliability and privacy
- Pairing tokens remain in memory and never enter browser storage, URLs or logs.
- Remote bridges require TLS, short-lived pairing, revocation, tenant authorization, replay protection, event deduplication, bounded queues and audit logs.
- Reconnect attempts are bounded; after five attempts the operator must retry.
- Minimize events before adding them to Magnanimous context. Raw provider payload retention requires explicit creator settings.
- AI hosts remain disclosed. Viewer text is untrusted and cannot grant tools, account, moderation, payment or deployment permissions.

## Rollout gates
1. Contract and normalization tests.
2. Local companion bridge with OBS authentication and pairing.
3. YouTube and Twitch adapters using official OAuth and event APIs.
4. TikTok capability detection limited to currently authorized features.
5. Game/browser adapters with per-source permissions.
6. Latency, disconnect, replay, tenant-isolation and abuse tests.
7. Production only after a zero-charge deployment path and provider consent are verified.