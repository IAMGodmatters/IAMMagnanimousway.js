# Magnanimous Creator Growth — vidIQ capability absorption record

Date: 2026-09-25

## Rule

This work studies current public/connected vidIQ tool contracts and official vidIQ product documentation as a capability benchmark. It does **not** copy vidIQ source code, hidden prompts, private indexes, proprietary models, credentials, archived thumbnail datasets, or prediction internals.

Magnanimous AI remains the customer-facing identity and owns orchestration, policy, memory, verification, creator history, scoring heuristics, media storage, and workflow state.

## True-source references reviewed

- https://vidiq.com/plans/
- https://support.vidiq.com/en/articles/13928456-features-credits-by-plan
- https://vidiq.com/features/competitors/
- https://vidiq.com/features/daily-ideas/
- https://vidiq.com/features/ai-youtube-coach/
- Connected vidIQ MCP tool contracts visible to the authorized ChatGPT session on 2026-09-25.
- Official YouTube Data API: https://developers.google.com/youtube/v3/
- Official YouTube Analytics API: https://developers.google.com/youtube/analytics/

## Observed capability families

The connected vidIQ surface exposed 63 current tool contracts. The major capability families observed were:

1. Keyword research: keyword metrics, related/matching/question/rising terms, country/topic search.
2. Video discovery: YouTube search, trending velocity, outliers/breakouts, similar videos, similar thumbnails.
3. Channel intelligence: channel search/stats/videos, similar channels, competitors, performance trends.
4. Owned-channel analytics: watch time, views, subscribers, retention, traffic sources, geography, demographics and revenue reports where separately authorized.
5. Audience intelligence: comments, comment insights, subscriber overlap, best-time analysis.
6. Packaging: title scoring/generation, thumbnail scoring/generation/refinement, title/thumbnail change history.
7. Planning: scripts, chapters, comment replies, daily ideas / creator-coach style planning.
8. Media creation: video generation, thumbnails, B-roll, voiceover, music, motion graphics.
9. Media post-production: upload, compose, trim, extract audio, extract thumbnail, normalize loudness, probe media, long-video-to-short clips.
10. Publishing/account workflows: YouTube authorization/metadata updates, Instagram account/reel workflows, bookmarks, jobs and competitor tracking.

## Native Magnanimous implementation

### Implemented now

- /creator-growth
  - title scoring and title ideas
  - thumbnail production brief
  - keyword demand/competition proxy using official YouTube evidence instead of fabricated monthly search volume
  - YouTube search and current trending videos
  - channel-relative outlier/breakout computation
  - channel stats, recent videos and video stats
  - comment retrieval and native audience-question/request/pain-point analysis
  - owned-channel YouTube Analytics reports after explicit OAuth authorization
  - retention, traffic-source, geography and top-video reporting
  - historical posting-window analysis
  - Magnanimous-owned title/thumbnail observation history
  - Magnanimous-owned video growth history
  - chapter planning from timestamped captions
  - clip planning from timestamped captions
  - script structure planning
  - RPM-based earnings estimates with clear estimate disclosure
- /movie-maker
  - image/video/narration creation
  - free-first and funded premium routes
  - reference images
  - plan-enforced watermark policy
  - download, file sharing, copy link, public watch page and social handoff
- /video-stack
  - short-lived media sessions
  - chunked uploads
  - private object storage
  - playlists/tags/metadata
  - range playback and temporary playback links
  - trim/reorder editor and MP4 finalization
  - browser recording/live-session scaffolding
- /social-connect
  - authorized YouTube/TikTok/LinkedIn publishing
  - YouTube connection now requests read-only Analytics scope in addition to existing read/upload permissions

### Intentionally different from vidIQ

- Magnanimous does **not** claim vidIQ's proprietary keyword search-volume values. YouTube's public Data API does not expose an official monthly search-volume metric, so Magnanimous reports transparent demand and competition proxies.
- Magnanimous does **not** claim historical title/thumbnail changes from before Magnanimous first observes a video. It builds its own history prospectively.
- Magnanimous does **not** copy vidIQ's private outlier index or view-prediction model. It computes channel-relative breakout from official/public samples and builds its own evidence over time.
- Revenue estimates remain estimates unless the user separately authorizes the monetary YouTube Analytics scope. Least privilege is preserved by default.
- Voice cloning is not silently reproduced. Any future cloning workflow must require a consenting speaker and a separate explicit authorization path.
- Third-party stock/B-roll libraries are not copied. Magnanimous can use its own generated media, user-owned uploads, or separately licensed stock sources with attribution/license evidence.
- Proprietary media-generation models are never represented as Magnanimous-owned. They may be private replaceable paid/free execution rails behind Magnanimous when the account, license and funding rules allow them.

## Creator data truth rules

- Never invent search volume.
- Never present a demand proxy as official YouTube search count.
- Never call a video an outlier without stating the baseline used.
- Never call historical edits complete when observation began later.
- Never expose private provider names on consumer creator surfaces.
- Never publish to a social account without the connected account and explicit publish action.
- Never bypass plan funding for paid creator/media generation.
- Never encourage artificial views, fake engagement, incentivized ad clicks or other platform manipulation.

## Next-native behavior

Magnanimous should continue collecting its own creator/video observations so the platform's native history, performance curves and recommendations improve without dependence on vidIQ. External creator-intelligence services remain optional research sources, not the Magnanimous identity or memory.