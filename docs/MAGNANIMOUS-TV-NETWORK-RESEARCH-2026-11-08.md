# Magnanimous TV Network — Rights, Open-Source and Broadcast Architecture Research

Research date: 2026-11-08  
Status: research baseline for implementation; not a legal opinion or a statement that live distribution is operational.

## Product direction

Magnanimous owns the identity, user accounts, tenant isolation, station metadata, programming scheduler, rights ledger, moderation, scene composition, automation and destination orchestration. Media servers, encoders, CDNs and social platforms are replaceable infrastructure adapters. A personal station is a tenant-owned channel with a persistent URL and Magnanimous co-branding; users may customize their own station name, logo and colours without removing the Magnanimous attribution/technology mark.

The existing repository already has:
- a native video stack with browser camera recording, chunked uploads, private assets, playlists, range playback and FFmpeg editing;
- an existing Video Studio, Movie Maker and Social Studio;
- a TV network landing page and separate Philippines / Worldwide channel pages;
- a video-stack live-session record endpoint.

Important limitation: the current `POST /api/video-stack/live` endpoint only creates a database session record. It does **not** ingest a live media stream, generate HLS/WebRTC playback, or distribute to viewers. Do not describe it as an operational broadcast. The native video stack's browser WebRTC capability is currently a free-first concept/metadata flag, not a verified media transport. A real media plane is still required.

## Lawful automatic programming: source policy

The platform must not scrape and rebroadcast arbitrary videos, TV stations, music, news reports, or a celebrity's voice simply because they are publicly viewable.

### Green-light source types (subject to item-level verification)
1. Public-domain works whose status has been checked in the relevant territory and for the exact recording/version.
2. Creative Commons CC0 / CC BY works, provided the licence permits the planned use and attribution is retained. CC BY-SA requires compatible share-alike handling; CC BY-NC is not suitable for a generally available platform that may be monetized or promoted.
3. Directly licensed content with a signed grant covering worldwide internet streaming, scheduled linear channels, on-demand replay, clips/promos, social simulcast, derivative edits, language versions, territory, term and sublicensing to station users where needed.
4. Government data and public information only where the particular source page/dataset's terms explicitly allow the intended reuse. Keep the attribution, source link, retrieval time and licence snapshot with each item.

### Sources researched
- Philippine Statistics Authority / GOVPH pages state that site data and content are licensed under Creative Commons Attribution 4.0 International (CC BY 4.0), unless otherwise stated. This is a promising source for factual data explainers and automated data bulletins. The platform must still check the specific page, dataset, embedded media, photographs and third-party contributions before reuse. Source: https://psa.gov.ph/ (example licence statement also appears on https://psa.gov.ph/content/psa-approves-conduct-survey-role-social-networks-accessing-and-utilizing-weather-and-0).
- Philippine News Agency (PNA) terms state that site content is for personal, non-commercial use within stated daily limits; commercial reproduction, publication and use require written consent from NIB-PNA. PNA content must therefore not be automatically republished or broadcast in Magnanimous TV without a separate written syndication licence. Sources: https://www.pna.gov.ph/terms-of-use and https://www.pna.gov.ph/index.php/about.
- PAGASA has useful current weather and hazard information at https://www.pagasa.dost.gov.ph/ and public downloadable advisories at https://pubfiles.pagasa.dost.gov.ph/tamss/weather/. However, the specific CC BY 4.0 licence previously attributed to a PAGASA alert feed was **not independently verified** in this research. Do not ingest, narrate, or rebroadcast PAGASA content as licensed until its reuse terms are confirmed in writing or an explicit licence is found. Linking to the official page is different from copying or rebroadcasting its content.
- IPOPHL explains that copyright owners control reproduction, public performance, communication to the public, broadcasting and adaptation. Philippine law also gives performers rights over broadcasting/communication of performances and gives sound-recording producers rights. A commercial sound recording used directly for broadcasting/communication may trigger equitable remuneration under Section 209 of RA 8293. Sources: https://www.ipophil.gov.ph/copyright/ ; https://www.ipophil.gov.ph/help-and-support/copyright/ ; https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/4371.
- IPOPHL's August 31, 2026 notice emphasizes that performers authorize recording and distribution of their performances; non-commercial purpose alone does not automatically make a use fair. Source: https://www.ipophil.gov.ph/news/ipophl-reminds-concertgoers-on-recording-concerns-and-to-respect-performers-rights/.

### Known Filipino vocalist / voice
No famous Filipino vocalist's recordings, voice clone, likeness, stage performance, or signature intro should be used without direct permission from the person and the relevant recording/label/producer/rightsholders. A voice licence needs explicit permission for synthetic voice generation if requested, territory, term, media, commercial/promotional use, editing, and downstream sublicensing. A public-domain song does not make a modern recording of that song public domain. Use a non-imitative licensed narrator or ordinary text-to-speech voice until a named artist signs a release. Do not synthesize a celebrity voice from interviews or YouTube clips.

### Automatic programme types that can be built first
- PSA data and statistics explainers with CC BY 4.0 attribution, item-level licence checks and links to source material.
- Public-service explainers generated from verified, licensed datasets and official public notices whose reuse terms are confirmed.
- Original Magnanimous educational, culture, community and studio graphics with original narration.
- Public-domain / CC-licensed archival footage and music after exact file-level licence checks.
- User-contributed programmes only after uploader warranty, rights evidence, moderation and takedown workflow.

A programme item must have a rights record before entering a playlist: source, creator, original URL, exact asset URL/hash, licence identifier/version, attribution text, territory, start/end dates, allowed uses, edit rights, sublicensing rights, evidence file, reviewer, review timestamp and takedown status. The scheduler must reject items with missing/expired/unclear rights.

## Open-source broadcast technologies

These are implementation references, not mandatory dependencies or claims that they are already deployed.

- MediaMTX: MIT-licensed media router/server supporting RTMP, SRT, WebRTC, HLS, RTSP and other protocols; it can publish/read/proxy/record/play streams and authenticate users. Its always-on streams and protocol conversion make it a strong candidate for the replaceable media plane. Source: https://mediamtx.org/docs/misc/license and https://mediamtx.org/docs/kickoff/introduction.
- Owncast: MIT-licensed self-hosted live video and chat server with HLS playback and documented compatibility with common Smart TV/player paths. It is explicitly a single-user service, so it is useful as a benchmark or optional personal-server adapter, not the whole multi-tenant Magnanimous control plane. Sources: https://github.com/owncast/owncast and https://owncast.online/docs/watching-streams/.
- OBS Studio: a mature open-source desktop encoder/studio. It is a useful supported publisher for creators, but it is not the Magnanimous identity and should remain an optional client. Source: https://obsproject.com/ and https://github.com/obsproject/obs-studio.
- FFmpeg: media packaging, transcoding, playout and compositing engine already used by the repository's renderer. Build/licence configuration must be audited before redistributing binaries because FFmpeg's effective licence depends on enabled components/build flags. Source: https://ffmpeg.org/legal.html.

### Recommended architecture
1. **Magnanimous control plane (native):** tenant/station management, station URLs, account entitlements, programme schedule, rights ledger, source connectors, moderation, branding, audit logs, consent and cost controls.
2. **Studio (native UI):** browser camera/screen capture, scene layouts, overlays/lower-thirds, guest invitations, audio mixer controls, local preview, recording, scheduled events and stream health. Use browser APIs where possible; do not require paid AI or a paid encoder.
3. **Media plane (replaceable):** MediaMTX or a comparable self-hosted media router for ingest and egress; HLS for broad device compatibility, WebRTC for low latency, RTMP/SRT ingest for OBS/encoders. Keep it outside the static website/Cloudflare Worker request path; Workers are not a video transcoding/continuous streaming host.
4. **Linear playout / auto channel:** rights-approved playlist scheduler, deterministic fallback slate, source refresh jobs, programme metadata, HLS output and continuity monitoring. If no rights-cleared item exists, show a Magnanimous-branded slate or verified data bulletin—not unlicensed third-party video.
5. **Destination adapters:** YouTube Live API, Meta/Facebook destinations, Instagram Live Producer/approved ingest, and future platforms. Each destination must be individually authorized by the user and respect current API permissions/eligibility. A successful stream to Magnanimous does not guarantee a simultaneous stream to another platform.
6. **Public player:** channel pages consume a signed or public HLS/WebRTC manifest according to station visibility and access policy; Philippines-only access requires server-side geolocation enforcement, not client-side hiding.
7. **Multi-tenant:** unique station slug, tenant/user ownership, isolated keys and storage, role-based collaborators, station-level usage budgets, audit logs, rate limits and abuse reporting.

## Destination platform research

- YouTube Live Streaming API supports creating/scheduling broadcasts, creating stream ingest resources, binding the broadcast to a stream, and transitioning the broadcast to live. OAuth, API project configuration, account eligibility and quota apply. Official docs: https://developers.google.com/youtube/data/live/getting-started and https://developers.google.com/youtube/data/live/guides/implementation/broadcasts-and-streams.
- Instagram Live's current ingest and producer workflows are controlled by Meta and can change. Meta described deploying Media over QUIC for Instagram Live ingest in October 2026. Do not assume an open public API exists for every account or that an RTMP key is always available. Require a user-authorized connection or explicit manual stream-key setup, and re-check Meta's current docs/permissions at implementation time. Source: https://engineering.fb.com/2026/10/12/video-engineering/shipping-media-over-quic-at-meta-scale-for-instagram-live-ingest/.
- Netflix is not a general-purpose live-stream destination or a social simulcast endpoint. Netflix says it does not accept unsolicited materials; pitches must come through an established agent, producer, attorney, manager or executive with a Netflix relationship. Treat Netflix as a future content-licensing/distribution relationship, not a button in the live studio. Source: https://help.netflix.com/en/node/100386/.

## Free plan and cost protection

"Free for everyone" can mean free access to the Magnanimous station tools and reasonable free viewing, but it cannot mean unlimited global video delivery with no cost. Egress bandwidth, transcoding, storage, moderation and abuse handling have real costs. Free-first launch should:
- start with local browser preview, direct creator publishing, low-resolution/limited-duration free sessions and small audiences;
- use a self-hosted/open-source media plane only when a controlled host with available capacity is ready;
- enforce transparent free-tier quotas and fair-use limits, with no silent paid overages;
- require prepaid funding or explicit approval before high-cost transcoding/CDN/telecom/API usage;
- meter egress, storage, concurrency, recording retention and transcoding;
- fail safely to a branded slate if media capacity or rights checks fail;
- never expose ingest keys or provider credentials in the browser.

## Implementation sequence / acceptance gates

1. Add a rights-aware programme source registry and licence evidence model.
2. Build station profile creation and tenant-isolated station pages.
3. Build visual scene/studio controls on top of the existing native video stack.
4. Add a real media ingest/playback plane and verify end-to-end HLS/WebRTC from a creator to a separate viewer.
5. Add a scheduled playout engine and verified, licensed starter content; include a source attribution slate.
6. Add user-authorized destination adapters and test each provider independently.
7. Add geofencing, moderation, rights takedown, retention and abuse controls.
8. Test on iPhone, desktop browsers, Android TV/Google TV, Samsung/LG TV browser or player, and low-bandwidth connections.
9. Deploy only after typecheck, production build, route audit, Worker tests, media tests, security review and production smoke tests pass.

## Explicitly not complete yet

- No licensed celebrity/vocalist has been contracted.
- No fully cleared continuous video/music library is attached.
- No automated live feed or 24/7 playout is running.
- The current live-session record endpoint is not a live streaming server.
- No YouTube/Meta/Instagram OAuth destinations are connected by this research.
- No Netflix partnership or content licence exists.
- No Philippines geofence is active.
- No production Smart TV playback test has been completed.
