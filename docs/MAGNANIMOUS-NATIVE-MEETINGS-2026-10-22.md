# Magnanimous Meet — native two-person meeting foundation

Date: 2026-10-22

## Why

The public MirrorFly advertisement describes a licensed self-hosted chat, video and meeting stack. It does **not** grant access to MirrorFly's proprietary server source code. This implementation uses original Magnanimous code and browser WebRTC APIs. Neither a MirrorFly account, its license, its SDK nor its branding is included.

## Delivered in this change

- `/meet` first-party responsive meeting page, linked from the existing Phone and paid White Label product directory. The existing landing artwork is unchanged.
- Signed-in host creates a 90-minute room; a second signed-in user in the **same tenant** joins with a cryptographically random, hashed invitation secret.
- Host + one guest only. No strangers, cross-tenant participants or third attendee can access the room.
- Camera, microphone, mute, video toggle, peer-to-peer media and screen sharing when the browser and network allow it.
- In-room text chat and WebRTC offer/answer/ICE signaling stored in Cloudflare D1. Messages are **not** end-to-end encrypted, and nothing is recorded.
- Event size and room count limits; chat, SDP, ICE and expired room records removed by the existing 15-minute cron, after a 24-hour expiration grace period.
- The meeting integration test is part of the existing deploy QA gate.

## Boundaries, limitations and costs

- This is a **two-person beta**, not a multi-party conferencing service or a standalone persistent messenger. A production-grade multi-user SFU, TURN availability, invitations across tenant boundaries, recording/retention consent, moderation, push notifications and load testing remain separate work.
- Host and guest must already have user accounts in the same Magnanimous tenant. Copying a private link does not bypass authentication.
- Browser calls require HTTPS and permission for camera/microphone. Mobile browsers may not support screen sharing.
- Signaling and room chat use bounded D1 reads/writes and a 2.5-second active-room poll. The media itself is browser-to-browser when possible. A public Google STUN service is the connectivity fallback; it sees connectivity metadata but **does not relay conversation media**. A controlled STUN/TURN deployment is needed for strict infrastructure independence and restrictive NATs.
- For an explicitly provisioned TURN server, configure the Worker secret `MAGNANIMOUS_MEETING_ICE_SERVERS_JSON` as an array of valid WebRTC `RTCIceServer` records. Generate **short-lived credentials**; do not publish permanent TURN credentials in source. A configured relay may carry bandwidth cost, so fund/limit it before enabling broad commercial use.
- This release does not add or promise paid telephony, calling ordinary phone numbers, professional conferencing capacity or telecom regulatory authority.

## Verification

`node qa/scripts/native-meeting-rooms-lock.mjs` tests authentication, tenant separation, hashed invite enforcement, two-user capacity, signaling/chat validation, meeting closure and retention against SQLite. The frontend typecheck, main contract audit and production build also cover the new route. End-to-end media needs a live two-browser/two-account test, plus TURN and mobile network checks before a production capability claim.
