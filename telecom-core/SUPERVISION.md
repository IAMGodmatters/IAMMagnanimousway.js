# Magnanimous Telecom supervision and recording

This subsystem is a private, consent-gated call-center control plane beneath Magnanimous AI / Magnanimous Telecom. It is not a covert-monitoring feature and it does not grant regulatory or carrier authority.

## Default state

- `ASTERISK_SUPERVISOR_CONTROL_ENABLED=false` by default.
- `TELECOM_NATIVE_WEBRTC_LIVE` remains a separate truth gate for browser supervisor audio.
- Monitor, whisper and barge stay unavailable until the public native WebRTC path has passed the required external WSS/TLS/browser media verification.
- Bridge recording can be enabled independently only after the private Stasis event stream is healthy and the workspace supplies the required consent, notice and jurisdiction data.
- Raw Asterisk recording files are not exposed by the Worker or Contact Center API.

## Private Stasis control plane

The Telecom Core keeps one server-side ARI event WebSocket registered to the `magnanimous-supervisor` Stasis application. ARI credentials remain inside Telecom Core. The browser, Worker clients and end users never receive the ARI username/password or the ARI event URL.

Supervisor audio uses an Asterisk snoop channel attached to a Stasis-owned mixing bridge:

- **Monitor** — spy on both target directions; no whisper audio is injected.
- **Whisper** — spy on both directions; supervisor audio can be injected to the target channel.
- **Barge** — spy on both directions and allow supervisor audio into both directions through the supervision bridge.

The supervisor endpoint is not accepted from an arbitrary browser request. The Worker resolves it from the signed-in owner's active, tenant-scoped native WebRTC session.

## Consent and notice gates

Every supervisor-audio start requires:

1. owner/admin workspace role;
2. active connected call belonging to the same tenant;
3. call metadata proving `control_plane=magnanimous-telecom-core`;
4. `TELECOM_NATIVE_WEBRTC_LIVE=true`;
5. a currently valid owner native WebRTC session;
6. explicit `consent_confirmed=true`;
7. explicit `notice_confirmed=true`;
8. private Telecom Core supervision readiness.

The Telecom Core repeats the consent and notice checks instead of trusting the Worker alone.

## Bridge recording

Call recording uses a headless Stasis path so a supervisor browser does not need to remain online:

1. create an ARI snoop channel for both directions of the active call;
2. create a Stasis-owned mixing bridge;
3. add the snoop channel to that bridge;
4. start an Asterisk bridge recording with `beep=true`;
5. enforce a bounded maximum duration;
6. keep the raw recording file private to the Telecom host.

Recording additionally requires a non-empty jurisdiction value. The Worker stores only tenant-scoped recording session/audit state. It does not return an Asterisk spool path or downloadable recording file.

A later storage-ingestion feature must define retention, access control, deletion, encryption and legal policy before any stored recording is surfaced to users.

## Audit and cleanup

The Worker records supervision and recording lifecycle state in:

- `cc_supervisor_sessions`
- `cc_recording_sessions`
- `call_events`

Deployment smoke cleanup deletes disposable rows for these tenant-scoped tables in both the Worker data plane and standalone runtime.

## Real-host verification workflow

The repository includes **Telecom Stasis Live Verification** (`.github/workflows/telecom-stasis-live-verification.yml`) plus the external verifier at `telecom-core/scripts/verify-supervision-live.py`.

The workflow is intentionally manual because it requires a real, active, consented test call and cannot safely invent one. Configure:

- repository variable `TELECOM_PUBLIC_CONTROL_API_URL` — HTTPS origin of the protected public Telecom Core control API;
- repository secret `TELECOM_PUBLIC_CONTROL_API_TOKEN` — the bearer token for that protected API;
- repository variable `TELECOM_NATIVE_WEBRTC_LIVE=true` **only after** the separate Public Telecom WebRTC Verification has already passed, and only when monitor/whisper/barge lifecycle verification is requested.

Each manual run supplies the active Asterisk target channel ID, recording jurisdiction, optional online supervisor PJSIP endpoint, and an explicit confirmation that all test-call participants received the required consent/notice.

The verifier always proves the negative consent gate first. Recording verification then proves the real host can create the snoop channel and mixing bridge, start a beep-enabled recording, stop it, clean up, and keep raw recording paths private.

Monitor/whisper/barge lifecycle verification is a separate optional path. It refuses to run unless the WebRTC live gate is already true and an online supervisor endpoint is supplied. It proves that the real host creates the expected snoop/supervisor/bridge resources and cleans them up for all three modes. It **does not** claim that acoustic semantics were automatically proven; a final production promotion still requires observed monitor/whisper/barge behavior on the consented real call.

The workflow uploads a 30-day evidence artifact. It never writes either live flag and never promotes `ASTERISK_SUPERVISOR_CONTROL_ENABLED` or `TELECOM_NATIVE_WEBRTC_LIVE` automatically.
## Activation checklist

Do not set `ASTERISK_SUPERVISOR_CONTROL_ENABLED=true` merely because the source code exists.

Before activation, verify all of the following on the real Telecom Core host:

- private ARI event WebSocket stays connected to the Stasis app;
- active call channel can be snooped;
- registered supervisor endpoint rings and joins the supervision bridge;
- monitor, whisper and barge behave as labeled;
- consent/notice rejection happens before any ARI media action;
- bridge recording beeps and stops cleanly;
- recording lifecycle does not expose raw file paths or ARI credentials;
- tenant/owner authorization and audit rows are correct;
- cleanup succeeds after call/session termination;
- browser supervisor audio is only enabled after the separate public WebRTC proof passes.

Until those checks are green, keep the feature disabled in production and do not describe it as live.
