# Magnanimous TV live media adapter — 2026-11-08

## Purpose

Add an optional, replaceable live-media transport beneath Magnanimous AI. Magnanimous remains the identity, account, station ownership, rights acknowledgement, token issuer and authorization brain. MediaMTX is only the media plane.

The first supported pilot transport is WebRTC ingest through WHIP and HTTP Live Streaming (HLS) playback. OBS can publish through WHIP; a browser publisher can use the camera/microphone and the same WHIP endpoint. MediaMTX v1.21.3 is pinned for repeatable builds.

## Request flow

1. A signed-in station owner opens **TV Studio → Broadcast Studio** and selects their own station. Only the platform owner can select the two network-wide channels.
2. The publisher must explicitly attest that every video, voice, image, performance and music track is cleared for broadcast.
3. Magnanimous issues a random 256-bit, one-hour publish token. Only its SHA-256 hash is stored in `magnanimous_tv_media_tokens`; the raw token is returned once to the browser.
4. The browser/OBS publishes to the WHIP endpoint over the HTTPS Caddy origin. The WebRTC media connection uses ICE UDP 8189.
5. MediaMTX delegates publish/read authorization back to `POST /api/tv/media/auth`. A private shared secret in the request URL prevents untrusted services from using the callback. The callback rechecks token expiry, revocation, the stream path, active account and current station ownership.
6. HLS viewers access `/tv-media/hls/{path}/index.m3u8`. Public/unlisted station visibility is checked for personal stations. Private station slugs are not authorized.
7. The browser publisher shows LIVE only after the WHIP response is accepted and its WebRTC peer connection reaches `connected`. OBS key issuance is not presented as proof that OBS is live.

## Host requirements and activation

This repository adds the adapter but **does not activate it on production**. The service is in the optional Docker Compose `broadcast` profile and defaults off.

On a separately administered standalone host, an operator must:

- Set `MAGNANIMOUS_TV_MEDIA_ENABLED=true`.
- Generate a separate random `MAGNANIMOUS_MEDIA_AUTH_SECRET` of at least 32 characters. Do not reuse session, service or provider secrets.
- Set `MAGNANIMOUS_TV_MEDIA_HOST` to the exact same hostname as `MAGNANIMOUS_DOMAIN`; Caddy serves one configured site in this stack.
- Set `MAGNANIMOUS_TV_WEBRTC_UDP_BIND=0.0.0.0` only after the public host firewall and network security group have an explicit UDP 8189 allow rule. The default is loopback, and the API reports media disabled while the ICE bind is loopback.
- Ensure DNS for the configured domain resolves to this host and Caddy has a valid public TLS certificate.
- Start the optional profile explicitly, for example `docker compose --profile broadcast up -d live-media`.

Do not expose TCP 8888, TCP 8889, the MediaMTX API, metrics, pprof or the control surface directly to the public internet. HTTP HLS and WHIP signalling go through Caddy over HTTPS; ICE media uses UDP 8189. The media container remains on the internal Docker network. No public stream service is enabled by default.

## Free-first pilot limits

- One active publisher key per channel/station path.
- Publish token lifetime: one hour.
- At most 40 viewers per stream path.
- MediaMTX service resource limit: 512 MB RAM and one CPU.
- No recording, no transcoding, no CDN, no R2 delivery, no paid provider and no automatic 24/7 playout.
- The profile is optional and consumes host/network capacity only when explicitly started.

These are pilot controls, not a promise of unlimited free distribution. A host that cannot maintain stable upload bandwidth or UDP reachability must not enable live broadcasting.

## Known boundaries

- No TURN relay is bundled. Some mobile carriers, corporate networks, strict NATs or firewalls will prevent direct ICE connectivity. Browser and OBS publishers can fail on those networks until a separately budgeted TURN path is implemented.
- The browser can confirm its own WHIP session. The current page cannot observe an independent OBS publisher's live state, so it only reports that an OBS key was issued. Stop the stream in OBS and then revoke its key.
- Revocation blocks new MediaMTX authorizations. An already-established external OBS session may remain until that publisher disconnects or the one-hour MediaMTX authorization expires. The browser publisher also sends WHIP DELETE when stopped.
- HLS playback is the viewer path exposed in this pilot. WHEP is accepted by the MediaMTX auth callback but a first-party WHEP viewer component is not part of this change.
- The Philippines and Worldwide paths are separate stream names only. There is no server-side geofencing, so the Philippines stream is not a Philippines-only broadcast.
- The EPG/scheduler remains a guide only. Scheduled content is not automatically played into MediaMTX.
- No social simulcast, recording library, captions pipeline, moderation dashboard for live feeds, audience analytics, content takedown workflow, regulatory approval or broadcast franchise is implied.

## Verification

The workflow pulls and bundles the pinned MediaMTX image for the offline standalone release, validates the exact checked-in `mediamtx.yml`, and retains the existing Caddy validation and standalone reload proof. The TV media regression lock checks auth routing, key hashing, expiry, revocation semantics, host readiness, port isolation, protocol settings and truthful UI states.

Do not merge or deploy if the configuration validator, platform QA, full surface audit, standalone offline reload, or cloud-exit checks fail. No production deployment is part of this branch.
