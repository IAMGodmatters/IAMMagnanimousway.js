# Magnanimous Live Event Fabric

## Purpose

Magnanimous AI remains the platform brain. Provider connections are replaceable adapters that deliver evidence-bearing events into one bounded event fabric. They do not own identity, memory, orchestration, or policy.

The same event can be consumed by the online AI Host, the local USB Creator, OBS scene suggestions, audience participation modules, and approved game integrations without teaching each consumer a different provider protocol.

## Runtime boundaries

1. **Provider adapter** — authenticates with one provider, subscribes to explicitly authorized event types, normalizes provider payloads, tracks its own cursor/session, and reports health.
2. **Magnanimous relay** — validates the canonical event contract, applies tenant and provider authorization, redacts contact details and credentials, deduplicates, bounds storage, and delivers to the signed-in browser role.
3. **Browser inbox** — persists normalized events before acknowledging relay delivery; the AI Host receives the event through the same-origin channel and records its local delivery receipt.
4. **Local companion** — keeps its own encrypted event journal and can reconnect without losing queued events. It accepts only the narrow command contract.
5. **Decision layer** — Magnanimous may reason over events and suggest an action. A consequential action still requires the appropriate owner approval and local capability check.

A provider adapter may emit events. It cannot directly execute OBS actions, moderation, account changes, purchases, public broadcast start/stop, or arbitrary code.

## Canonical event envelope

Every adapter maps into the versioned LiveEvent contract:

- Stable provider event ID, provider name, and event type
- Provider occurrence timestamp and local receive timestamp
- Bounded actor and message fields
- Optional bounded amount/currency fields for gifts or tips
- Small, allowlisted metadata tags

The relay rejects unknown providers, malformed IDs, invalid timestamps, unsupported event types, and oversized payloads. Contact details and pasted credentials are redacted before durable event storage. The relay's durable inbox is bounded to 100 events with a 24-hour expiry; the browser inbox is bounded to 100 events with a 24-hour retention window.

Each provider adapter must preserve its native cursor or session identifier separately from the canonical event. A single generic cursor cannot safely represent different provider recovery rules.

## Provider-specific recovery

### YouTube Live Chat

Use the official YouTube Live Streaming API liveChatMessages.streamList server-streaming method rather than tight polling. Google documents that the stream sends recent chat history and new messages, and that nextPageToken can resume a disconnected stream from the last received position.

Adapter requirements:

- Resolve the active broadcast's liveChatId from the authorized channel/broadcast context.
- Store the latest nextPageToken only in the encrypted provider state for that tenant.
- Resume from the last successfully committed token after interruption.
- Deduplicate by the provider's stable message ID before forwarding.
- Respect provider quota and authorization errors; do not silently fall back to scraping the public watch page.

Official documentation: https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/streamList

### Twitch EventSub

Use the official EventSub WebSocket transport with a user-authorized token. The adapter must follow Twitch's session protocol rather than treating the socket as an ordinary message stream.

Adapter requirements:

- Read the session_welcome message and subscribe using that session ID within the documented welcome window.
- On session_reconnect, connect to the supplied reconnect_url and keep the old socket until the new socket receives its welcome message.
- If the connection is lost without a reconnect handover, recreate the subscriptions; Twitch documents that disconnected WebSocket subscriptions are disabled and events missed during resubscription are not replayed.
- Deduplicate by Twitch message ID because notifications may be delivered more than once.
- Respond to keepalive/ping rules exactly as documented and surface subscription revocations as a degraded adapter state.

Official documentation:
- https://dev.twitch.tv/docs/eventsub/handling-websocket-events/
- https://dev.twitch.tv/docs/eventsub/websocket-reference/

### OBS Studio

Keep OBS WebSocket on the local machine. The companion may expose only the approved scene allowlist and explicitly supported controls. Scene completion is reported only after OBS confirms the requested scene change. OBS passwords remain local and are never forwarded to the cloud relay.

### TikTok LIVE and other platforms

Do not use scraping, reverse-engineered private endpoints, browser-cookie extraction, or unofficial account automation. A TikTok adapter remains disabled until a documented, authorized access path and the necessary account permissions are available. The same rule applies to Facebook, Zoom, and any future provider.

## Command contract

The current relay supports only:

- scene.set — an allowlisted OBS scene, approved on the local companion and confirmed by OBS.
- host.speak — bounded host text, approved locally, played by the device speech engine, and reported as completed or failed.

Command states are monotonic:

sent → received → approved → completed

A command may instead end as rejected or failed. A companion cannot claim completion before approval. The browser cannot forge companion receipts. The local host waits for the relay to confirm that approval/rejection was durably recorded before it executes or discards a request.

## Resilience and observability

- At-least-once delivery with stable IDs and idempotent consumers
- Durable event inbox, explicit acknowledgements, expiry, and reconnect replay
- Bounded queues, message sizes, command lifetimes, and rate limits
- Per-tenant pairing, role-specific credentials, hashed token storage, short pairing window, revocation, and session expiry
- Health states distinguish disconnected, connecting, connected, degraded, revoked, and expired
- Receipts distinguish companion-reported status from independently verified provider or OBS state
- No secrets, full chat payloads, or personal contact details in logs

## Next implementation sequence

1. Complete Worker, browser, USB host, and OBS bridge QA; fix all failing checks before merge.
2. Add a provider-adapter interface with health, authorization, start/stop, cursor persistence, and deterministic replay tests.
3. Implement YouTube Live Chat first using streamList and per-tenant OAuth state.
4. Implement Twitch EventSub with reconnect handover, subscription reconciliation, and duplicate delivery tests.
5. Add additional providers only after documented permissions, security review, and cost/quota limits are in place.

No provider is considered connected until its OAuth authorization, subscription, live event receipt, reconnect, and revocation paths have all been exercised with an authorized test account.
