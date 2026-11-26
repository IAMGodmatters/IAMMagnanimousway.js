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

Outgoing commands are restricted to OBS scene selection and locally approved host speech. Overlay and audio-cue commands are rejected until their local engines are implemented and tested. No broadcast start/stop, account management, moderation, payments, arbitrary navigation, shell or arbitrary code execution is exposed.

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
- The pairing endpoint is HTTPS/WSS only, requires the canonical same-origin browser Origin and rejects cross-site Fetch Metadata. It is limited to five pair creations per minute per tenant/user using Cloudflare's native rate-limit binding. Tokens travel in the first WebSocket message body, never in a URL, query string, cookie or log.
- The browser token is accepted only from the canonical web Origin; the companion token is accepted only from a non-browser client with no Origin header. The two roles cannot be swapped between browser and local companion.
- The browser client refuses arbitrary secure WebSocket hosts, custom ports, query strings and fragments. It accepts only the official `wss://iammagnanimousway.com/api/live-bridge/ws/<pair-id>` address, preventing a look-alike page from redirecting a temporary token to an attacker-controlled server.
- Each room binds one browser and one companion to the creating tenant/user. It validates provider/event schemas, rejects unsupported commands, bounds messages and deduplicates recent event IDs per companion connection.
- Pairing tokens expire after ten minutes and cannot establish a new connection after that window, even if the other device has already authenticated. An already authenticated connection may remain active for up to twelve hours; if either side disconnects after the pairing window, the creator must establish a fresh pair. The signed-in account owner can revoke a pair at any time; revocation deletes the room record and closes both sockets.
- The relay forwards only normalized events from the companion to the browser and allowlisted scene/host commands in the opposite direction. If the local companion is offline or its socket cannot accept a command, the browser receives an explicit `COMMAND_NOT_DELIVERED` error; a command is never represented as delivered when the companion did not receive it. Overlay and audio-cue commands are not accepted. It does not expose broadcast start/stop, account management, moderation, shell access or arbitrary code execution. Command receipts are bound to browser-issued command IDs, stored with a five-minute expiry, limited to 20 active commands, and checked against an explicit state machine (`sent` → `received` → `approved` → `completed` or `failed`; `rejected` is terminal). The browser receives the USB host's `received`, `approved`, `rejected`, `completed` or `failed` receipt. Recent receipts are replayed after reconnect so the UI can recover a command's last known state. A `completed` receipt is sent only after OBS confirms a scene switch or the local voice engine reports the utterance ended; text is not included in receipts.
- The room uses SQLite-backed Durable Object storage and hibernatable WebSockets. This is designed to avoid holding an always-awake relay for idle sessions; usage still remains subject to the account's free-tier limits and must be measured before production rollout.
- A new pair initially authorizes only local/manual, OBS, game and browser event sources. TikTok, Facebook, YouTube, Twitch and Zoom are recognized by the event schema but are **not authorized by default**. They must receive explicit per-account adapter authorization before the relay accepts events labelled with those providers.
- Hard per-socket message caps are 30/minute from the companion and 10/minute from the browser. At the maximum 12-hour session length, that bounds one fully active pair to at most 28,800 messages before connection overhead. The Worker pair-creation rate limiter is 5/minute per tenant/user; Cloudflare documents that its rate-limit counters are approximate and per data-center location.

Cloudflare's current Free plan includes SQLite-backed Durable Objects, with a 100,000-request/day and 13,000 GB-s/day compute allowance; WebSocket messages count toward Durable Object requests. Hibernatable idle sockets are not billed for duration. These are account-wide limits shared with other workloads, not a promise of unlimited free streaming. The relay is deliberately bounded and must be load-tested against existing account usage before production rollout.

The online relay has no provider OAuth tokens and does not itself fetch platform chat. A separate local companion and separately authorized provider adapters are required. The default pair cannot impersonate a platform provider merely by labelling a message with its name. A connected socket is not proof of a TikTok/Facebook/YouTube/Zoom account connection or a live broadcast.

### Deployment gate

Do not deploy this branch directly. First run the full Worker bundle dry-run and CI tests, verify the Durable Object namespace migration against a staging environment, and measure CPU/request/storage behavior. Production rollout is blocked until the affected Worker/route in issue #743 is identified and the online relay's cost and CPU profile can be attributed. No paid plan upgrade is implied.
