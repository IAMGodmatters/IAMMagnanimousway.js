# Magnanimous TV Network — implementation baseline

## Product decision

Create one general-interest internet television network with two separate channel destinations:

- **Magnanimous TV Philippines** — intended for viewers in the Philippines.
- **Magnanimous TV Worldwide** — intended for Filipinos overseas and worldwide viewers.

This is not a Christian-only network. Programming areas include news and public affairs, entertainment, education, documentaries, sports, lifestyle, community stories, Filipino culture, and faith/inspiration as one category among many.

## Current implementation in this change

- Adds a responsive network landing page at `/tv`.
- Adds channel pages at `/tv/philippines` and `/tv/worldwide`.
- States clearly that both channels are in pre-launch and no broadcast feed is connected.
- Does not invent schedules, live programs, audience counts, stream URLs, or rights clearances.
- Explains that Philippines-only geofencing is not active until server-side geographic enforcement is configured and tested.
- Describes independent producer submissions as planned, not open, until rights review and moderation are implemented.
- Leaves the existing approved home artwork and other platform features untouched.

## Required before a real public broadcast

1. Choose a rights-cleared video origin and delivery path. Prefer a free/native pilot first, but do not promise unlimited free live delivery; sustained video egress can create cost.
2. Create distinct stream configurations for the Philippines and Worldwide channels. Keep stream-ingest credentials server-side. A public playback URL may be exposed only after review.
3. Implement server-side territory enforcement for the Philippines channel and test VPN, proxy, IPv4/IPv6, and false-positive cases. A separate URL or page does not constitute geoblocking.
4. Implement durable program metadata, scheduling, moderation, takedown, and creator submission workflows with explicit rights/licence attestations and audit history.
5. Verify music, footage, sports, news, and contributor permissions for each territory. Do not rebroadcast third-party TV channels or copyrighted content without the required licences.
6. Complete applicable Philippine legal and regulatory review for the selected internet distribution model. This implementation is internet streaming, not a terrestrial broadcast and does not claim a broadcast franchise or NTC authorization.
7. Add subtitles/captions, accessibility, Smart-TV browser testing, mobile testing, and real-device playback checks.
8. Meter bandwidth and variable service usage. Do not activate paid infrastructure, subscriptions, or third-party API usage without explicit approval and a funded cost plan.

## Architecture constraints

- Magnanimous AI remains the platform's identity, memory, orchestration and decision layer.
- Video hosts/CDNs are replaceable delivery infrastructure, not the network's identity.
- Do not put ingest keys, provider secrets, OAuth secrets or admin credentials in browser code or public repository variables.
- Do not auto-publish creator submissions.
- Keep the existing TV Companion remote-control feature separate from the television channel product.
- Do not merge or deploy until the normal repository QA and production verification pass.

## Programme catalogue and schedule implementation in the current development branch

The next feature branch adds a first-party programme-control layer without claiming that video is being transmitted:

- Creates tenant-aware programme and schedule tables, plus safe initialization of the existing personal-station table.
- Seeds the existing *Bahay Kubo — Kabataang Silay Rondalla* source with its CC BY 3.0 source, attribution and 215-second runtime.
- Accepts creator submissions only for a station owned by the submitting account. Submissions are restricted to CC0, CC BY or a verified public-domain claim and require source, rights-evidence, attribution, territory, permitted-use and duration fields.
- Keeps every creator submission pending. Only the platform owner can approve/reject it; approval requires a verified HTTPS media URL on an allowlisted host and a written review note. The owner review queue can see pending submissions across tenants; other users cannot.
- Enforces linear-use permission, programme territory, bounded scheduling up to 90 days, programme duration, overlap prevention, station ownership and owner-only network scheduling.
- Adds public programme-guide previews to the Philippines channel, Worldwide channel and personal station pages. Past slots are marked complete and schedules are cancelled when the programme rights record expires.
- Keeps an explicit playout_connected=false state. A schedule is a guide entry only; there is still no ingest server, HLS/WebRTC viewer delivery, continuous playout, social simulcast or Philippines-only geofencing.

This is a development branch until its regression checks and platform CI pass. It does not deploy a live broadcast or grant the network any additional copyright, broadcast franchise or regulatory authority.

## Status

The original network landing pages and channel profiles are the pre-launch frontend foundation. The current development branch adds the rights-reviewed programme catalogue, owner moderation queue, bounded EPG scheduler and public guide previews described above. No live channel, geofence, continuous playout, live ingest, HLS/WebRTC viewer delivery, social simulcast, broadcast franchise or regulatory approval is implied.
