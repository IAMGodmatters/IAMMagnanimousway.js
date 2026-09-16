# Magnanimous Mux Capability Absorption

## Identity and architecture

Magnanimous AI remains the brain, reasoning, memory, policy, orchestration and public identity layer.

Mux is treated as a replaceable internal video infrastructure provider beneath Magnanimous AI. Provider branding must not override Magnanimous identity. Magnanimous owns the normalized resource model and can add or replace media providers later without redesigning the public product.

## Current platform shape researched September 16, 2026

Mux currently organizes its platform around Mux Video, Live Streaming, Mux Data, Mux Player, System APIs, image/video-derived media services and Mux Robots AI workflows.

Core provider concepts include organizations, environments, access tokens, assets, playback IDs, live streams, stream keys, signing keys and webhooks. Access tokens are environment-scoped. Stream keys, access-token secrets, private signing keys and webhook signing secrets are sensitive and are never part of Magnanimous public state.

## Absorbed capability families

### Video-on-demand assets
- asset create/read/update/delete lifecycle
- URL ingest and multi-input patterns
- metadata, passthrough and external identifiers
- processing states, tracks, duration, aspect ratio and quality tiers
- master access and source-quality download patterns

### Direct uploads
- server-created upload URLs
- browser/client direct upload
- CORS-aware upload sessions
- resumable/large-file upload patterns
- upload state and asset-created events

### Live streaming
- RTMP / RTMPS ingest
- SRT-aware live and simulcast patterns where supported
- standard, reduced and low latency modes
- reconnect windows
- slate during interruptions
- recorded asset generation
- test-live-stream patterns for development

### Simulcast / restreaming
- RTMP/RTMPS destinations
- SRT simulcast destinations when the source is connected over SRT
- third-party live destinations such as Facebook Live, YouTube Live, Instagram Live, Twitch, Vimeo and arbitrary compatible endpoints

### Playback and delivery
- HLS playback
- multiple playback IDs per asset/live stream
- public, signed and DRM policies
- playback modifiers such as resolution controls, redundant streams and instant clipping

### Secure playback
- server-generated JWT playback tokens
- tokenized playback, thumbnail and storyboard access
- expiration and claim-based access control
- playback restrictions by referrer/domain and User-Agent policy
- multi-DRM patterns including Widevine, FairPlay and PlayReady

### Static renditions and downloads
- MP4 / M4A static renditions
- standard and advanced renditions
- offline/social/post-production workflows
- current static-rendition model instead of relying on deprecated mp4_support for new builds

### Tracks, captions and accessibility
- video/audio/text tracks
- alternate audio
- SRT and WebVTT subtitles
- auto-generated captions
- plain-text transcripts
- translated/premium-caption workflows through Mux Robots where available

### Image and structural media APIs
- thumbnails
- JPG/PNG/WebP transforms
- animated GIF patterns
- storyboards
- smart crop
- latest live thumbnail
- instant clips
- Shots / shot-boundary preview images

### Mux Player and playback components
- Mux Player web component
- React player
- Mux Video element
- Media Chrome-based theming
- custom player themes and CSS controls
- signed tokens, captions, casting, Picture-in-Picture, metadata and resolution control

### Mux Data
- client SDK monitoring on web, iOS, Android, TV and player ecosystems
- views and watch time
- startup time
- rebuffering
- playback failures
- video quality
- viewer-experience metrics
- metadata/dimensions
- engagement heatmaps/hotspots

### Monitoring / real-time observability
- current concurrent viewers
- startup failures
- playback failures
- current rebuffering
- current average bitrate
- median startup time
- near-real-time timeseries and breakdowns
- anomaly/threshold alert patterns

### Data export
- daily raw-view CSV export patterns
- streaming exports to Kinesis or Pub/Sub where plan-enabled
- monitoring-sample streams where plan-enabled
- warehouse ingestion and long-term analytics patterns

### Webhooks
- asset events
- upload events
- live-stream events
- simulcast events
- Robots completion events
- webhook signature verification
- environment-scoped webhook configuration
- machine-readable webhook specification

### Usage and account operations
- token permission inspection through `whoami`
- environment isolation
- usage export patterns with environment/creator breakdowns
- billing remains provider-owned; Magnanimous does not copy payment credentials or silently create paid usage

## Mux Robots AI workflows

Mux Robots is currently documented as Beta. Magnanimous absorbs the workflow patterns but does not make Mux Robots the public AI identity.

Current workflow families include:
- summarize video into title/description/tags
- ask structured questions about video
- find key moments
- generate chapters
- find scenes
- moderation
- premium caption generation
- caption editing
- caption translation
- audio translation/dubbing
- best-thumbnail selection
- engagement insight generation

Robots jobs are asynchronous and can return through webhooks. Magnanimous models their outputs in provider-independent normalized state so the same public feature can later use another video-AI engine.

## Provider-independent normalized state

Migration `0051_magnanimous_mux_control.sql` adds Magnanimous-owned normalized records for:
- environments
- video assets
- playback IDs
- live streams
- direct uploads
- tracks
- webhooks
- Mux Robots jobs
- Mux Data snapshots
- simulcast targets
- playback restrictions
- usage snapshots
- player configurations

It explicitly excludes Mux token secrets, live stream keys, private signing keys, webhook signing secrets, raw media bytes, DRM secrets and billing credentials.

## Runtime control plane

`/api/mux` is owner-only and read-only in this release.

It reports:
- absorbed capabilities
- credential readiness
- normalized-state counts
- provider-safety locks

`/api/mux/whoami` is a safe read-only credential probe. When server-side Mux credentials are configured, it calls Mux's System `whoami` endpoint and returns environment/organization identifiers and token permissions without returning the token secret.

The control plane intentionally does not create assets, direct uploads, live streams, Robots jobs, signing keys, webhooks or other potentially cost-producing/security-sensitive provider resources.

## Consequential-action locks

Future write adapters must preserve all of these rules:
- explicit user/owner authorization for cost-producing provider writes
- permission and audit checks
- no Mux credential exposure to the browser
- no raw stream-key exposure
- no private signing-key exposure
- no webhook signing-secret exposure
- no silent DRM/security policy changes
- no silent playback-publicization
- no silent live simulcast to third parties
- no silent Robots jobs that create metered provider usage

## Primary current references

- https://www.mux.com/docs/core/mux-fundamentals
- https://www.mux.com/docs/core/ai-agents
- https://www.mux.com/docs/api-reference/video/assets
- https://www.mux.com/docs/api-reference/video/direct-uploads
- https://www.mux.com/docs/api-reference/video/live-streams
- https://www.mux.com/docs/guides/stream-live-to-3rd-party-platforms
- https://www.mux.com/docs/guides/play-your-videos
- https://www.mux.com/docs/guides/secure-video-playback
- https://www.mux.com/docs/api-reference/video/playback-restrictions
- https://www.mux.com/docs/guides/enable-static-mp4-renditions
- https://www.mux.com/docs/guides/add-autogenerated-captions-and-use-transcripts
- https://www.mux.com/docs/api-reference/image/thumbnails/get-thumbnail
- https://www.mux.com/docs/guides/player-api-reference/react
- https://www.mux.com/docs/guides/data
- https://www.mux.com/docs/guides/monitoring-metrics
- https://www.mux.com/docs/guides/export-raw-video-view-data
- https://www.mux.com/docs/core/manage-webhooks
- https://www.mux.com/docs/guides/robots
- https://www.mux.com/docs/changelog
