# Magnanimous Creator Growth — vidIQ capability benchmark

Date: 2026-09-25

Purpose: use the live, user-authorized vidIQ tool contracts as a capability benchmark while keeping Magnanimous AI as the product identity and implementation owner. This document records public tool behaviors only. It does **not** copy proprietary code, hidden prompts, private ranking models, credentials, or private datasets.

Primary-source implementation basis:
- YouTube Data API v3 for public channels/videos/search/comments.
- YouTube Analytics API for authorized owned-channel analytics.
- Magnanimous-owned scoring, storage, history, media rendering, Movie Maker, Video Stack, and social publishing.
- Where a benchmark relies on a private historical/search/visual index that YouTube does not expose, Magnanimous builds its own evidence over time and labels the result as a proxy/native estimate rather than fabricating the missing data.

## Live benchmark coverage

| # | Benchmark capability | Magnanimous target | Status |
|---:|---|---|---|
| 1 | `generate_video_chapters` | Creator Growth optimization | native / native-equivalent |
| 2 | `keyword_research` | Creator Growth research | native / native-equivalent |
| 3 | `outliers` | Creator Growth research | native / native-equivalent |
| 4 | `similar_thumbnails` | Creator Growth research | native / native-equivalent |
| 5 | `channel_stats` | Creator Growth analytics | native / authorized official data |
| 6 | `trending_videos` | Creator Growth research | native / native-equivalent |
| 7 | `channel_search` | Creator Growth research | native / native-equivalent |
| 8 | `comment_insights` | Creator Growth analytics | native / authorized official data |
| 9 | `video_earnings_estimate` | Creator Growth analytics | native / authorized official data |
| 10 | `earnings_calculate` | Creator Growth analytics | native / authorized official data |
| 11 | `video_stats` | Creator Growth analytics | native / authorized official data |
| 12 | `video_change_history` | Creator Growth analytics | native / authorized official data |
| 13 | `get_videos_by_ids` | Creator Growth workspace | native storage/data |
| 14 | `youtube_search` | Creator Growth research | native / native-equivalent |
| 15 | `get_channels_by_ids` | Creator Growth workspace | native storage/data |
| 16 | `balance` | Creator Growth workspace | native storage/data |
| 17 | `user_channels` | Creator Growth workspace | native storage/data |
| 18 | `channel_videos` | Creator Growth workspace | native / authorized official data |
| 19 | `video_transcript` | Creator Growth research | native / native-equivalent |
| 20 | `video_comments` | Creator Growth research | native / native-equivalent |
| 21 | `channel_performance_trends` | Creator Growth analytics | native / authorized official data |
| 22 | `channel_analytics` | Creator Growth analytics | native / authorized official data |
| 23 | `subscriber_insights` | Creator Growth analytics | native / authorized official data |
| 24 | `trend_categories` | Creator Growth research | native / native-equivalent |
| 25 | `similar_channels` | Creator Growth research | native / native-equivalent |
| 26 | `similar_videos` | Creator Growth research | native / native-equivalent |
| 27 | `submit_feedback` | Creator Growth workspace | native storage/data |
| 28 | `score_title` | Creator Growth optimization | native / native-equivalent |
| 29 | `score_thumbnail` | Creator Growth optimization | native / native-equivalent |
| 30 | `generate_titles` | Creator Growth optimization | native / native-equivalent |
| 31 | `generate_comment_replies` | Creator Growth optimization | native / native-equivalent |
| 32 | `generate_thumbnail` | Movie Maker image studio | native media |
| 33 | `refine_thumbnail` | Movie Maker image studio | native media |
| 34 | `video_watch` | Creator Growth research | native / native-equivalent |
| 35 | `watch_shortform_content` | Creator Growth research | native / native-equivalent |
| 36 | `ig_profile` | Creator Growth workspace | authorized official API / native tracking |
| 37 | `ig_profile_reels` | Creator Growth workspace | authorized official API / native tracking |
| 38 | `instagram_publish_reel` | Social Connect + Creator Growth | authorized official API / native tracking |
| 39 | `instagram_connected_accounts` | Creator Growth workspace | authorized official API / native tracking |
| 40 | `instagram_tiktok_outlier_search` | Creator Growth research | native / native-equivalent |
| 41 | `ig_accounts_from_outliers` | Creator Growth research | native / native-equivalent |
| 42 | `list_competitors` | Social Connect + Creator Growth | authorized official API / native tracking |
| 43 | `bookmarks_list` | Creator Growth workspace | native storage/data |
| 44 | `bookmarks_save` | Creator Growth workspace | native storage/data |
| 45 | `bookmarks_remove` | Creator Growth workspace | native storage/data |
| 46 | `update_competitors` | Social Connect + Creator Growth | authorized official API / native tracking |
| 47 | `authorize_with_youtube` | Social Connect + Creator Growth | authorized official API / native tracking |
| 48 | `update_video` | Social Connect + Creator Growth | authorized official API / native tracking |
| 49 | `generate_broll` | Movie Maker + Native Video Stack | native media / optional funded capacity |
| 50 | `voiceover_list_voices` | Movie Maker + Native Video Stack | native media / optional funded capacity |
| 51 | `voiceover_generate` | Movie Maker + Native Video Stack | native media / optional funded capacity |
| 52 | `generate_music` | Movie Maker + Native Video Stack | native media / optional funded capacity |
| 53 | `compose` | Movie Maker + Native Video Stack | native media / optional funded capacity |
| 54 | `motion_graphics` | Movie Maker + Native Video Stack | native media / optional funded capacity |
| 55 | `voiceover_clone` | Movie Maker + Native Video Stack | native media / optional funded capacity |
| 56 | `voiceover_clone_start` | Movie Maker + Native Video Stack | native media / optional funded capacity |
| 57 | `jobs_list` | Creator Growth workspace | native storage/data |
| 58 | `job_poll` | Creator Growth workspace | native orchestration |
| 59 | `generate_clips` | Movie Maker + Native Video Stack | native media / optional funded capacity |
| 60 | `generate_script` | Creator Growth optimization | native / native-equivalent |
| 61 | `video_upload` | Native Video Stack | native media |
| 62 | `generate_video` | Movie Maker + Native Video Stack | native media / optional funded capacity |
| 63 | `edit_media` | Native Video Stack | native media |



## Final mapped-gap closure

The remaining benchmark-only mappings were reconciled against the current Magnanimous runtime:

- `channel_videos` was already a live native route backed by the official YouTube Data API; the benchmark status was corrected.
- `submit_feedback` now persists tenant- and user-scoped Creator Growth feedback in Magnanimous-owned storage.
- `ig_profile`, `ig_profile_reels`, and `instagram_connected_accounts` now read only from an authorized Instagram Business connection through the official Meta graph rail. Access tokens remain server-side and workspace read permissions are honored.
- The existing Instagram assistant integration now actually implements its advertised `read_media` capability rather than exposing a capability that could not execute.
- `job_poll` now delegates to the existing Magnanimous Movie Maker job engine so Creator Growth does not create a competing queue or duplicate billing/reconciliation logic.

No private vidIQ index, scoring formula, prompt, dataset, credential, or proprietary implementation is used by these routes.

## Official YouTube owner actions added after reconciliation

- Owned caption retrieval now uses YouTube's authorized captions list/download path and only for videos owned by the connected channel.
- Owned video metadata updates now use the official `videos.update` path, preserve omitted fields, verify channel ownership, and require an explicit publish action.
- YouTube comment replies now use the official `comments.insert` path, verify that the parent comment belongs to a video owned by the connected channel, and require an explicit publish action.
- These owner operations require `https://www.googleapis.com/auth/youtube.force-ssl`. Existing YouTube connections may need one reconnect before owner actions become available.
- Read-only Creator Growth research remains usable independently when public API-key or read-only OAuth access is available.

These additions close the native workflow gap without consuming vidIQ credits or copying vidIQ implementation details. Public discovery and official owner actions remain subject to YouTube quota, OAuth approval, and account permissions.

## Non-copy rule

A native equivalent may reproduce the user-visible *function* of a benchmark where lawful and technically available, but it must not represent proprietary vidIQ data, code, ranking models, archived assets, private subscriber-overlap data, or secret prompts as Magnanimous-owned technology. Magnanimous-native results must identify when they use official platform data, Magnanimous-observed history, or heuristic/proxy analysis.

## Current native routes

- `/api/creator-growth/*`: search, trends, outliers, channel/video stats, keyword proxies, comments, comment insights/replies, title/thumbnail/script planning, owned-channel analytics, best-time history, similar videos/channels, bookmarks, competitor tracking, observed change/performance history.
- `/api/movie-maker/*`: image/video/narration creation, watermark policy, studio quality tiers, sharing.
- `/api/video-stack/*`: upload, chunked storage, playback, editor/finalize, live session primitives.
- `/api/social-connect/*`: authorized publishing and account connection.
