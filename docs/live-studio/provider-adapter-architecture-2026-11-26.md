# Magnanimous Live Studio — provider adapter architecture

**Status:** architecture specification for future authorized integrations. This document does not claim that any creator platform account is connected.

## Core rule

Magnanimous remains the intelligence and policy layer. Provider adapters are replaceable transport workers. An adapter may collect platform events and submit normalized events; it does not own Magnanimous identity, memory, audience policy, or decision-making.

The system has three boundaries:

1. **Provider adapter:** OAuth/session lifecycle, platform-specific reconnect behavior, source event IDs, rate limits and cursor handling.
2. **Magnanimous event fabric:** validation, tenant scoping, deduplication, bounded durable inbox, replay and audit.
3. **Local action bridge:** explicit owner approval, local allowlist, execution result and emergency stop.

No provider is allowed to bypass the event fabric or send platform-controlled text directly into an action executor.

## Adapter contract

Each adapter should implement the same narrow lifecycle while preserving provider-specific recovery information:

- `authorize`: request only the scopes necessary for the chosen event types; record tenant, creator/channel, granted scopes, expiry and revocation state.
- `connect`: establish the provider's documented transport and verify that the channel/session belongs to the authorized tenant.
- `receive`: validate signature/session envelope, normalize timestamps and event IDs, and reject malformed or oversized payloads.
- `checkpoint`: persist the provider's resume cursor or session handoff data after the corresponding events have been durably accepted.
- `reconcile`: recover after restart using the provider's actual semantics; never assume every provider can replay missed events.
- `revoke`: stop collection, discard in-memory credentials, revoke remote authorization where supported, and record the action.

Recommended normalized event envelope:

```ts
type MagnanimousProviderEvent = {
  protocolVersion: 1;
  tenantId: string;
  creatorId: string;
  provider: 'youtube' | 'twitch' | 'tiktok' | 'facebook' | 'manual' | 'game' | 'obs';
  sourceEventId: string;
  eventType: string;
  occurredAt: string;
  receivedAt: string;
  payload: unknown; // validated and minimized by the provider adapter
};
```

The canonical idempotency key is `tenantId + provider + creatorId + sourceEventId`. The source event ID must be retained; a locally generated ID is not a replacement for source deduplication.

## Provider-specific recovery contracts

### YouTube Live Chat

Prefer the documented `liveChatMessages.streamList` server-streaming method over a polling loop. Persist the latest accepted `nextPageToken` for each authorized live chat. On reconnect, resume with that page token; only advance the cursor after all messages from the corresponding response have been written to the Magnanimous durable inbox. This prevents a page checkpoint from moving past uncommitted messages.

Keep quota accounting visible and bounded. If the provider returns an expired or invalid cursor, run the documented recovery path and surface a recoverable gap warning rather than pretending no messages were missed.

Official documentation:
- https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/streamList
- https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/list

### Twitch EventSub

Use the documented WebSocket EventSub lifecycle. Validate the welcome message, session ID, keepalive timeout, notification envelope, reconnect handoff URL and revocation message. Subscribe within the documented welcome window. When Twitch sends a reconnect message, use its handoff URL and preserve the active subscriptions as documented.

Twitch may resend notifications with the same message ID, so deduplicate on the provider message ID. A normal unexpected WebSocket loss does **not** replay messages missed while reconnecting and resubscribing; record a gap marker and tell the operator that the event feed may have missed activity. Do not fabricate recovery.

Official documentation:
- https://dev.twitch.tv/docs/eventsub/handling-websocket-events/
- https://dev.twitch.tv/docs/eventsub/websocket-reference/

### TikTok and Facebook

Do not implement undocumented endpoints, scrape private interfaces, automate creator-account sessions, or represent a browser-only workaround as official access. An adapter remains disabled until the specific account, official product/API, approved scopes and terms are verified. If the provider does not grant a supported public event feed for the requested creator account, keep manual ingestion as the honest fallback.

## Durable event processing

- Accept a provider event only after validating its tenant, creator, source ID, timestamp, allowed event type and bounded payload.
- Store it before acknowledging the provider or advancing a provider cursor.
- Deliver at least once; consumers must be idempotent.
- Keep acknowledged and unacknowledged retention separate. Compact acknowledged history first. When capacity is filled by unacknowledged events, apply backpressure and alert rather than dropping pending events.
- Track per-provider health: connection state, last event time, cursor age, reconnect count, duplicate count, rate-limit state, revocation and known gap windows.
- Keep raw payloads minimized. Avoid collecting private messages or profile data that the creator has not asked to process.

## Action safety and policy

Incoming comments, game events and provider text are untrusted data. They may inform the AI Host's response but cannot create permissions. Any consequential local action must be a new Magnanimous decision and pass the local owner approval gate. The current portable bridge allowlist is deliberately limited to OBS scene selection and host speech. Provider adapters must never receive shell, filesystem, payment, account-security or broadcast-control authority.

Command receipts are distinct states: `sent → received → approved → completed/failed`. The local companion waits for the relay's durable confirmation of the approval receipt before starting an approved action. A companion-reported completion is evidence from that companion, not independent hardware attestation.

## Implementation gates

Do not mark an adapter production-ready until all of these pass:

1. Official account authorization and least-privilege scope review.
2. Tenant isolation and encrypted credential storage tests.
3. Duplicate, delayed, malformed, expired and out-of-order event fixtures.
4. Provider reconnect, handoff, cursor-expiry and missed-event/gap tests.
5. Rate-limit and quota exhaustion handling with no silent paid usage.
6. Durable event persistence before provider acknowledgement/checkpoint.
7. Revocation, deletion, retention and opt-out tests.
8. Browser, local companion, mobile and network interruption tests.
9. Owner-visible health state and audit receipt for each connection.
10. Verified deployment with a real creator account before using the word “connected”.

This architecture is a roadmap. YouTube/Twitch transports described above are documented capabilities, not connected adapters in this repository today.
