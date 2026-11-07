# Magnanimous TV Media Plane (free-first pilot)

This folder contains a separate, replaceable media plane for Magnanimous TV. Magnanimous remains the control plane and authority for station identity, tenancy, publish tokens, rights, scheduling and moderation. MediaMTX is only the media router.

## What this deployment provides

- Browser/OBS-compatible WebRTC ingest through WHIP.
- WebRTC playback through WHEP.
- HLS playback for broad device compatibility.
- Per-station publish authorization checked by the Magnanimous Worker.
- Public/unlisted station reads checked against the Magnanimous station table.
- HTTPS handled by Caddy with automatic Let's Encrypt certificates.

MediaMTX is pinned to v1.21.3 and is MIT-licensed. It supports WebRTC, HLS, RTMP, SRT and other protocols, but this first configuration deliberately enables only WebRTC and HLS. RTMP/RTMPS, SRT, the MediaMTX control API, metrics and pprof remain disabled until their own authentication and transport controls are implemented.

## Host requirements

A Linux VM with:
- a public IPv4 address;
- Docker Engine and the Docker Compose plugin;
- enough CPU, memory and network egress for the selected stream resolution and concurrent viewers;
- an attached persistent disk for Caddy certificate state and any future recordings.

A free-tier VM can be used for a small proof-of-concept if the provider has capacity. Free compute and outbound bandwidth are finite and may have reclaim/availability conditions. Do not promise unlimited viewers or 24/7 service on a free VM. Magnanimous must meter concurrent streams, recording storage and egress, enforce free-tier fair-use limits, and stop/limit sessions before any unfunded paid usage.

## DNS and firewall

1. Create `media.iammagnanimousway.com` pointing to the VM's public IP.
2. In Cloudflare DNS, set this record to **DNS only** (not proxied), because WebRTC media uses UDP.
3. Allow inbound TCP 80 and 443 for Caddy/HTTPS.
4. Allow inbound UDP 8189 for WebRTC ICE media.
5. Do **not** open ports 8888, 8889, 1935, 8554, 8890, 9997, 9998 or 9999 to the public internet. They are internal or disabled.

## Start

From this directory, after DNS and firewall are ready:

```sh
docker compose -f compose.yml config
docker compose -f compose.yml up -d
docker compose -f compose.yml ps
docker compose -f compose.yml logs -f mediamtx caddy
```

Caddy obtains and renews the HTTPS certificate automatically. Keep the `caddy_data` volume.

## Magnanimous Worker configuration

After the media server is reachable, set the non-secret Worker environment variable:

- `TV_MEDIA_PUBLIC_HOST=media.iammagnanimousway.com`

The Worker already uses the existing `SESSION_SECRET` (or the existing `auth_config.session_secret`) to sign short-lived, station-scoped publish tokens. Do not create a second copy of the secret and never put it in this repository.

The Worker endpoint `POST /api/tv/media/auth` is configured in MediaMTX. It:
- allows a publish only when a valid, unexpired Magnanimous token matches the exact station path and the original tenant/user still owns that station;
- allows HLS/WebRTC reads only for public or unlisted stations;
- denies unknown actions, protocols, station paths and invalid tokens.

A signed publish token is issued only to the authenticated station owner at `POST /api/tv/stations/{stationId}/publish-token`. The token expires after 12 hours and must be kept private.

## Stream URLs

After the Worker host variable is configured and the station owner requests a token:

- WHIP publisher URL: `https://media.iammagnanimousway.com/{station-slug}/whip`
- HLS viewer URL: `https://media.iammagnanimousway.com/{station-slug}/index.m3u8`
- WHEP viewer endpoint: `https://media.iammagnanimousway.com/{station-slug}/whep`

The publish token is sent as an HTTP Bearer token to a WHIP-compatible publisher. Never put it in a public page, URL query string, log, or support ticket.

## Current limitations

- This package is not deployed: no media VM, public media DNS record or media host variable has been configured.
- No RTMP ingest is exposed. A later phase can add secure RTMPS ingest or outbound RTMPS destination adapters after the TLS/auth path is tested.
- YouTube/Facebook/Instagram destination OAuth and publishing adapters are not connected yet.
- There is no server-side 24/7 playout scheduler in this package yet.
- TURN relay is not included. STUN-only WebRTC may fail on restrictive NAT/firewall networks; a self-hosted TURN service or carefully budgeted relay capacity will be required for broader reliability.
- No physical Smart TV, OBS or multi-network live-stream test has been completed.

## Security notes

- The MediaMTX Control API is disabled.
- RTMP, RTSP, SRT and MoQ listeners are disabled.
- Only the WebRTC UDP media port is exposed; HLS and WHIP/WHEP HTTP paths pass through Caddy.
- The Worker validates each publish/read action. Do not replace this with anonymous publish permissions.
- Review Caddy, MediaMTX and OS updates regularly; keep recordings off the root disk and apply retention limits before enabling recording.
