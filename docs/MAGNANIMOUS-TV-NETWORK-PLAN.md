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

## Status

The pages in this change are a pre-launch frontend foundation only. No live channel, geofence, EPG database, creator intake backend, video origin, broadcast rights or regulatory approval is implied.
