# Creator Studio Recovery Checkpoint — 2026-11-26

## Source of truth

- Repository: `IAMGodmatters/IAMMagnanimousway.js`
- Pull request: [#1023 — Build secure Magnanimous Live Creator bridge and USB approval path](https://github.com/IAMGodmatters/IAMMagnanimousway.js/pull/1023)
- Working branch: `feat/magnanimous-creator-bridge-mainline-20261126`
- Base branch: `main`
- Main at checkpoint creation: `d30c1e1002dde261f85ffb379ccd0a3ae7f3bcd5`
- Branch head immediately before this checkpoint: `2c04d0eec43590aeb24d6905f7983b4811bbd2d7`
- PR remains a draft. Do not merge or deploy until the exact final branch head passes the required checks.

GitHub main remains authoritative. If main advances before merge, preserve its newer work and reconcile the PR before merging. Never reset main to this branch or to an older archive.

## Objective

Continue the Magnanimous Creator Studio as a provider-neutral live-production system. Magnanimous AI owns the show identity, context, direction, audience interpretation, memory, safety and verification. OBS, social platforms, games, local models, voices and cloud services are replaceable adapters.

The AI Host must be able to run an owner-approved show rundown, accept authorized live events, prepare and speak host lines, and request narrowly scoped production actions. The owner must always retain an immediate stop and local approval for sensitive actions.

## Implemented in PR #1023

### Secure bridge and local companion

- Tenant-scoped, short-lived browser/companion pairing with distinct browser and companion role tokens, token hashes at rest, revocation, same-origin/role checks and owner-scoped rate limits.
- The browser will send pairing credentials only to the official `wss://iammagnanimousway.com/api/live-bridge/ws/{pair-id}` endpoint. It rejects arbitrary remote endpoints, insecure transport, URL credentials and query tokens.
- The local USB companion connects outbound to the official relay. OBS remains local to the companion; OBS passwords are not sent to the cloud relay.
- The portable companion uses encrypted local workspace/journal protections and only accepts actions within its allowlist.

### Event delivery and interruption recovery

- Cloud Durable Object relay stores a bounded event inbox, deduplicates event IDs, replays unacknowledged events after reconnect, and rejects new events when all slots contain unacknowledged items rather than evicting earlier events.
- Browser IndexedDB persists normalized events before handing them to the Host. It reclaims only already-delivered items; a full inbox of pending records fails visibly without deleting them.
- A relay acknowledgement is sent only after Magnanimous completes the AI response and persists the Host-completion receipt in IndexedDB. Merely displaying an event or adding it to the React/in-memory queue never acknowledges it.
- Host queue items retain the source provider/event identity. Failed AI responses preserve that identity for retry; an owner-selected skip is recorded explicitly. Already-completed events are re-acknowledged after a reload without repeating the AI response.
- Events received while takeover is inactive remain pending in the local inbox and relay. Starting a new owner-approved takeover requests replay; stopping takeover clears only in-memory dedupe state and does not falsely complete queued events.
- The AI Host checks its 25-item work queue before marking an event seen or queuing it. When a queue slot opens, it asks the bridge tab to replay still-pending local events.
- Viewer names, text and event tags are bounded and redact email addresses, phone numbers (including international + prefixes) and common pasted credentials before durable relay storage.
- The browser bridge now sends a ping every 20 seconds and requires a pong within 45 seconds. It reconnects with exponential backoff capped at 30 seconds while the pairing/session remains valid. Explicit disconnect, authentication failure, revocation or expiry stops reconnection.
- The local companion already sends heartbeat pings and maintains a bounded receipt outbox for command completion acknowledgements.

### No-spend activation gate

- `LIVE_BRIDGE_ENABLED` defaults to `false` in the Worker configuration. The API routes return a fail-closed 503 until the owner explicitly enables the bridge.
- Do not enable or deploy the relay until the actual Cloudflare plan, Durable Objects limits, expected request/compute usage and an owner-approved spending budget are checked. Do not infer that the account is on Free from source defaults.
- The no-spend and payment-safety QA locks cover this default. No paid provider, AI model, carrier or GPU is activated by this branch.

### AI Host and controlled execution

- Owner opt-in and timed 10/30/60-minute takeover; separate six-phase show rundown; serialized 25-item audience/host queue; retry/skip controls for failed AI responses; visible emergency stop.
- Viewer text is untrusted input and cannot activate tools, account operations, payments, moderation, shell commands or arbitrary code.
- Current relay commands are only `scene.set` and `host.speak`. Both require local owner approval; the companion waits for durable relay confirmation of the approval receipt before acting.
- OBS scene selection is local and requires an authenticated local OBS WebSocket session. Public broadcast start/stop, account management, viewer moderation, purchasing and arbitrary game control are not exposed.

### Quality and recovery work

- Corrected nondeterministic pairing-expiry/rate-limit tests by removing shared global clock mutation.
- Updated the LIVE Host QA contract to reflect the official TLS-only relay, temporary memory-only pairing credentials, durable async event handoff, privacy redaction and lossless queue behavior.
- Added/updated regression assertions for queue backpressure, pending replay, two-phase acknowledgements, phone redaction and browser heartbeat/reconnect behavior.
- Updated bridge protocol documentation to state only the commands actually implemented.

## Follow-up hardening after initial checkpoint

- The portable companion now applies the same privacy boundary before local event-journal acceptance: viewer actor names, event text and safe string tags redact email addresses, international phone numbers (including the leading +), Bearer credentials and common API/access/refresh-token assignments.
- The local live-event runtime unit suite now includes a test proving that the journal callback receives only redacted content, including a Philippine `+63 917 123 4567` example. The portable Creator QA lock also checks the local redaction contract.
- This is an additional privacy layer; the encrypted journal remains encrypted at rest and is not a reason to retain raw viewer contact details.

## Not yet verified — do not claim complete

- The PR is not merged and this work has not been deployed to production.
- The production Durable Object binding/migration and live WSS path still require exact production verification.
- A real Windows/USB companion + real OBS session has not been proven by CI. Local OBS authentication, scene changes, speech playback and reconnect behavior require device-level tests.
- No TikTok, YouTube, Facebook, Twitch or Zoom OAuth adapter or public comment subscription is claimed as connected. Provider adapters require official supported API paths, user authorization and tenant-isolation tests. TikTok comment intake remains operator-driven unless an officially authorized supported feed is proven.
- CI is required on the final branch SHA. A queued or cancelled workflow is not a pass. Any failed test must be fixed; never bypass a security, payment, no-spend, build or branch-protection gate.
- A ChatGPT mobile-app “Streaming interrupted” banner is generated by the ChatGPT conversation transport, not this repository. Magnanimous source changes cannot control that app transport. This repository checkpoint and the event replay mechanisms preserve engineering progress and Creator Studio events across supported platform reconnects.

## Exact next actions

1. Read this checkpoint and the latest PR/branch head before continuing.
2. Re-read the current branch and compare it with current `main`; do not overwrite newer main changes.
3. Run and inspect the final branch SHA's TypeScript/build, deterministic native tests, Full Platform QA, standalone release build, security, payment, no-spend, privacy, routing and branch-protection checks.
4. Fix every real failure and rerun checks on the exact final commit. Do not mark queued, cancelled or skipped browser/device checks as passing.
5. Run real-device QA with the owner-controlled Windows/USB companion and OBS: pair/revoke, scene list, locally approved scene switch, speech approval, heartbeat loss/recovery, queue full/backpressure, replay, duplicate suppression, and emergency stop.
6. Verify cloud Durable Object bindings/migrations and production WSS only after the no-cost deployment path and current deployment configuration are confirmed. Do not purchase paid services or enable paid providers.
7. Add official platform adapters only after checking current official API capability, consent, OAuth scopes, platform rules, event replay/deduplication and tenant isolation.
8. Update this checkpoint with the exact merged SHA, deployment ID and observed device/production evidence only after those facts are verified.

## Recovery rule

If the chat or response stream is interrupted, resume from this file, then inspect PR #1023 and the current GitHub main/branch/Actions state. Continue from the newest verified commit. Never infer deployment, live broadcast, provider connection, regulatory approval or successful execution from source code alone.
