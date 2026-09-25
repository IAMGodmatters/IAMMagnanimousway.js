# Magnanimous Telecom Stasis Bridge

This document describes the **gated native call-control implementation**. It is source/runtime readiness, not a claim that public supervisor audio or recording is live in production.

## Purpose

Magnanimous Telecom keeps call orchestration and public identity inside Magnanimous while using Asterisk ARI/Stasis as the owned PBX/media control plane. Replaceable PSTN/SIP interconnects remain private infrastructure.

The managed path uses one Stasis application, `magnanimous-native-call` by default, and an Asterisk mixing/proxy-media bridge per managed call.

## Default gates

All consequential media controls remain off by default:

```bash
ASTERISK_STASIS_BRIDGE_ENABLED=false
ASTERISK_SUPERVISOR_AUDIO_ENABLED=false
ASTERISK_BRIDGE_RECORDING_ENABLED=false
```

Turning on source settings is not enough to call the feature public-live. The dedicated public Telecom Core host, trusted WSS/TLS, real browser registration, two-way RTP/media verification, and applicable consent/compliance policy must also be verified.

`TELECOM_NATIVE_WEBRTC_LIVE` remains the platform-facing public-host truth gate and must remain false until the external public verification succeeds.

## Managed call lifecycle

When the Stasis bridge gate is enabled and its ARI event stream is ready:

1. The existing Magnanimous route planner still selects the authorized SIP route.
2. The Telecom Core validates the selected PJSIP endpoint and authenticated Asterisk endpoint health.
3. The Core creates a `mixing,proxy_media` bridge.
4. The customer leg enters the configured Stasis application.
5. The configured Magnanimous agent/AI endpoint is originated into the same Stasis application.
6. Each `StasisStart` is added to the managed bridge.
7. The call is considered connected only after both managed legs join.
8. `StasisEnd`, explicit hangup, or application shutdown cleans child supervisor/recording resources, both call legs, and the bridge.

The ARI WebSocket reconnect loop is capped. Persistent failure transitions to a faulted state instead of retrying forever.

## Tenant isolation

Supervisor and recording controls never accept a raw call bridge identifier from the platform.

A managed operation must resolve through:

- `provider_call_id`
- the owning `tenant_id`
- the Core's in-memory managed-call record

Cross-tenant lookup returns not-found rather than disclosing another tenant's call topology.

Ephemeral native WebRTC sessions created for signed-in platform users also carry server-side tenant/user ownership metadata. That metadata is not returned to the browser.

## Supervisor media

A signed-in native browser session has a restricted internal supervisor entry extension, `6100` by default. It exists only in the ephemeral WebRTC context:

- it enters `Stasis(<configured-app>,supervisor)`
- it does not grant a Telecom Core bearer token
- it does not bypass the existing direct-PSTN block

For a supervisor operation, the Core:

1. verifies the supervisor WebRTC session belongs to the same tenant;
2. queries active Asterisk channels itself;
3. requires exactly one channel whose PJSIP endpoint is that session and whose current dialplan application is the configured Stasis supervisor entry;
4. derives the target call bridge and target leg from the tenant-owned managed call.

Modes:

- **Monitor** — an isolated snoop bridge spies on both directions; supervisor audio is not injected.
- **Whisper** — the isolated snoop bridge spies on both directions and whispers only toward the target leg.
- **Barge** — the verified supervisor channel is added directly to the managed call bridge with an explicit supervisor role.

No public request accepts an arbitrary target Asterisk channel ID.

## Recording

Bridge recording is independently gated and requires both:

- `consent_confirmed=true`
- a non-empty jurisdiction

The Core records the mixed managed bridge through ARI and caps duration at the configured maximum. Recording stop is tenant-scoped. Active recordings are also stopped best-effort when the parent managed call ends or the application shuts down.

This implementation does not create a public recording URL or silently export recordings to a third party.

## Activation checklist

Before calling these controls public-live:

- [ ] Merge and pass Telecom Core unit tests, Full Platform QA, security/payment/voice locks, ARM64, WebRTC media E2E, and release gates.
- [ ] Deploy the dedicated public Telecom Core host/domain.
- [ ] Verify trusted public WSS/TLS and required RTP/TURN path.
- [ ] Run external browser registration and real two-way media verification against that host.
- [ ] Confirm applicable recording/monitoring consent policy for the operating jurisdiction(s).
- [ ] Keep tenant isolation and audit requirements intact in the platform-facing supervisor UI/API.
- [ ] Only then enable the relevant public/live gates.

Until those conditions are satisfied, platform-facing monitor/whisper/barge remains reported as false.
