# Magnanimous Live Studio Bridge Protocol

## Purpose
Magnanimous is the brain and owner of creator identity, audience context, event interpretation, safety policy, creative direction and orchestration. Platform APIs, OBS, games, browser sources, voices and cloud runtimes are replaceable adapters.

The browser bridge client in `frontend/lib/live-studio/` is a protocol foundation. A tenant-scoped Cloudflare Durable Object relay is now implemented on the feature branch, but it is **not deployed** until its PR passes CI, the Durable Object SQLite namespace is provisioned, and the production CPU incident is safely assessed. The local companion and platform provider adapters are still separate implementation gates; this relay alone does not connect OBS, TikTok, Facebook, Twitch, YouTube, Zoom or games.

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

Outgoing commands are restricted to scene selection, overlay visibility, approved audio cues and host speech. No broadcast start/stop, account management, moderation, payments, arbitrary navigation, shell or arbitrary code execution is exposed.

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
## Online relay implementation (feature branch, not deployed)

The first online transport layer is implemented in `worker/src/live-bridge-relay.js`:

- An authenticated Magnanimous account creates a bridge pair through `POST /api/live-bridge/pair`.
- The server issues separate 256-bit browser and companion tokens. Only SHA-256 token hashes are stored in the room; the raw tokens are returned once and must remain in memory or be copied into the local companion's protected pairing screen.
- The pairing endpoint is HTTPS/WSS only and is limited to five pair creations per minute per tenant/user using Cloudflare's native rate-limit binding. Tokens travel in the first WebSocket message body, never in a URL, query string, cookie or log.
- Each room binds one browser and one companion to the creating tenant/user. It validates provider/event schemas, rejects unsupported commands, bounds messages and deduplicates recent event IDs per companion connection.
- Pairing codes expire after ten minutes; an authenticated bridge session expires after twelve hours. Reconnection is permitted only during that authenticated session.
- The relay forwards only normalized events from the companion to the browser and the allowlisted scene/overlay/audio/host commands in the opposite direction. It does not expose broadcast start/stop, account management, moderation, shell access or arbitrary code execution.
- The room uses SQLite-backed Durable Object storage and hibernatable WebSockets. This is designed to avoid holding an always-awake relay for idle sessions; usage still remains subject to the account's free-tier limits and must be measured before production rollout.
- A new pair initially authorizes only local/manual, OBS, game and browser event sources. TikTok, Facebook, YouTube, Twitch and Zoom are recognized by the event schema but are **not authorized by default**. They must receive explicit per-account adapter authorization before the relay accepts events labelled with those providers.

The online relay has no provider OAuth tokens and does not itself fetch platform chat. A separate local companion and separately authorized provider adapters are required. The default pair cannot impersonate a platform provider merely by labelling a message with its name. A connected socket is not proof of a TikTok/Facebook/YouTube/Zoom account connection or a live broadcast.

### Deployment gate

Do not deploy this branch directly. First run the full Worker bundle dry-run and CI tests, verify the Durable Object namespace migration against a staging environment, and measure CPU/request/storage behavior. Production rollout is blocked until the affected Worker/route in issue #743 is identified and the online relay's cost and CPU profile can be attributed. No paid plan upgrade is implied.
