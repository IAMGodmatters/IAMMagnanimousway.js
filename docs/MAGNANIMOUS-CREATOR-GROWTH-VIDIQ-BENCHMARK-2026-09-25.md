# Magnanimous Creator Growth — vidIQ capability benchmark

Date: 2026-09-25

Purpose: use the live, user-authorized vidIQ tool contracts as a capability benchmark while keeping Magnanimous AI as the product identity and implementation owner. This document records public tool behaviors only. It does **not** copy proprietary code, hidden prompts, private ranking models, credentials, or private datasets.

Primary-source implementation basis:
- YouTube Data API v3 for public channels/videos/search/comments.
- YouTube Analytics API for authorized owned-channel analytics.
- Magnanimous-owned scoring, storage, history, media rendering, Movie Maker, Video Stack, and social publishing.
- Where a benchmark relies on a private historical/search/visual index that YouTube does not expose, Magnanimous builds its own evidence over time and labels the result as a proxy/native estimate rather than fabricating the missing data.

## Live benchmark coverage

| # | Benchmark capability | Magnanimous target | Exact current state |
|---:|---|---|---|
| 1 | `generate_video_chapters` | Creator Growth optimization | Native from supplied or owned timestamped captions |
| 2 | `keyword_research` | Creator Growth research | Official YouTube sample + native demand/competition proxies; no official monthly search volume |
| 3 | `outliers` | Creator Growth research | YouTube official data + native channel-relative breakout proxy |
| 4 | `similar_thumbnails` | Creator Growth research | Gap: no Magnanimous visual-thumbnail similarity index is claimed yet |
| 5 | `channel_stats` | Creator Growth analytics | Official YouTube Data API |
| 6 | `trending_videos` | Creator Growth research | Official YouTube most-popular chart + current velocity math; not a private trend index |
| 7 | `channel_search` | Creator Growth research | Official YouTube search |
| 8 | `comment_insights` | Creator Growth analytics | Official comments + native analysis |
| 9 | `video_earnings_estimate` | Creator Growth analytics | Native RPM-based estimate; not actual/official revenue |
| 10 | `earnings_calculate` | Creator Growth analytics | Native RPM calculator |
| 11 | `video_stats` | Creator Growth analytics | Official current stats + Magnanimous-observed history |
| 12 | `video_change_history` | Creator Growth analytics | Magnanimous-observed history beginning at first observation |
| 13 | `get_videos_by_ids` | Creator Growth workspace | Native batch route backed by official YouTube Data API |
| 14 | `youtube_search` | Creator Growth research | Official YouTube search |
| 15 | `get_channels_by_ids` | Creator Growth workspace | Native batch route backed by official YouTube Data API |
| 16 | `balance` | Creator Growth workspace | Not applicable: Magnanimous does not use vidIQ credits; platform billing/allowances remain separate |
| 17 | `user_channels` | Creator Growth workspace | Authorized connected YouTube channel context; no private vidIQ account list |
| 18 | `channel_videos` | Creator Growth workspace | Native route backed by official YouTube Data API |
| 19 | `video_transcript` | Creator Growth research | Authorized captions for videos owned by the connected channel; arbitrary public-video captions are not claimed |
| 20 | `video_comments` | Creator Growth research | Official YouTube comments/replies |
| 21 | `channel_performance_trends` | Creator Growth analytics | Partial: Magnanimous-observed video histories and historical posting windows; no copied private curve index |
| 22 | `channel_analytics` | Creator Growth analytics | Authorized YouTube Analytics API |
| 23 | `subscriber_insights` | Creator Growth analytics | Partial: owned analytics + historical posting performance; private subscriber-overlap data is not claimed |
| 24 | `trend_categories` | Creator Growth research | Gap: no first-party trend-category catalog route yet |
| 25 | `similar_channels` | Creator Growth research | Native topic/performance proxy over official YouTube results |
| 26 | `similar_videos` | Creator Growth research | Native topic/performance proxy; no copied visual/index similarity |
| 27 | `submit_feedback` | Creator Growth workspace | Native Magnanimous workspace feedback storage; never sent to vidIQ |
| 28 | `score_title` | Creator Growth optimization | Native transparent heuristic |
| 29 | `score_thumbnail` | Creator Growth optimization | Partial: native thumbnail brief/rubric; visual image scoring is not yet claimed |
| 30 | `generate_titles` | Creator Growth optimization | Native title generation + scoring |
| 31 | `generate_comment_replies` | Creator Growth optimization | Native draft replies by tone |
| 32 | `generate_thumbnail` | Movie Maker image studio | Native/free-first image workflow with optional funded studio capacity |
| 33 | `refine_thumbnail` | Movie Maker image studio | Reference-guided image workflow where configured |
| 34 | `video_watch` | Creator Growth research | Handoff only: no Creator Growth-native end-to-end video comprehension route is claimed |
| 35 | `watch_shortform_content` | Creator Growth research | Handoff only: no cross-platform scene-by-scene short-form watcher is claimed |
| 36 | `ig_profile` | Connected Assistant + Creator Growth | Authorized Instagram professional-account profile reads; arbitrary public-handle lookup is not claimed |
| 37 | `ig_profile_reels` | Connected Assistant + Creator Growth | Gap: no first-party arbitrary-handle Reels listing route |
| 38 | `instagram_publish_reel` | Connected Assistant | Partial: authorized Instagram media publishing exists; Reel-specific workflow is not claimed equivalent |
| 39 | `instagram_connected_accounts` | Connected Assistant | Native authorized connection context |
| 40 | `instagram_tiktok_outlier_search` | Creator Growth research | Not claimed: broad cross-platform outlier search needs an approved/licensed data source |
| 41 | `ig_accounts_from_outliers` | Creator Growth research | Not claimed until a lawful outlier source is configured |
| 42 | `list_competitors` | Creator Growth | Native workspace competitor tracking + official YouTube stats |
| 43 | `bookmarks_list` | Creator Growth workspace | Native storage/data |
| 44 | `bookmarks_save` | Creator Growth workspace | Native storage/data |
| 45 | `bookmarks_remove` | Creator Growth workspace | Native storage/data |
| 46 | `update_competitors` | Creator Growth | Native workspace competitor tracking |
| 47 | `authorize_with_youtube` | Social Connect + Creator Growth | Authorized official OAuth flow |
| 48 | `update_video` | Creator Growth | Authorized official YouTube owner update with explicit confirmation |
| 49 | `generate_broll` | Movie Maker + Media Library | Partial: scene/media generation and library search; no copied stock B-roll index |
| 50 | `voiceover_list_voices` | Movie Maker | Browser/native voice availability; no outside studio voice catalog is claimed |
| 51 | `voiceover_generate` | Movie Maker | Native browser voice + guarded optional funded studio voice |
| 52 | `generate_music` | Music Studio | Native project workflow; rendering only when a configured/free or funded engine exists |
| 53 | `compose` | Native Video Stack | Native edit/composition workflow |
| 54 | `motion_graphics` | Native Video Stack | Partial: overlays/transitions/editor primitives; no dedicated motion-graphics generator is claimed |
| 55 | `voiceover_clone` | Native Media Studio | Consent-bound capability contract; live execution depends on a configured authorized media worker |
| 56 | `voiceover_clone_start` | Native Media Studio | Consent-bound capability contract; live execution depends on a configured authorized media worker |
| 57 | `jobs_list` | Creator Growth workspace | Native persisted Movie Maker job list |
| 58 | `job_poll` | Creator Growth workspace | Native persisted state plus canonical Movie Maker poll URL |
| 59 | `generate_clips` | Creator Growth + Native Video Stack | Native transcript clip planning + editor; one-click AI clip rendering remains a separate workflow |
| 60 | `generate_script` | Creator Growth + Magnanimous AI | Native script plan plus full-script generation through Magnanimous AI free-first routing |
| 61 | `video_upload` | Native Video Stack | Native chunked upload/storage |
| 62 | `generate_video` | Movie Maker + Native Video Stack | Native/free-first workflow with optional funded studio capacity |
| 63 | `edit_media` | Native Video Stack | Native editor/finalize/media operations |

## Cross-platform truth boundary

The connected benchmark still exposes broader Instagram/TikTok discovery than ordinary commercial platform APIs make universally available. Magnanimous therefore does not fabricate those datasets.

- TikTok's Display API is authorization-based and exposes an authorized creator's profile and videos: https://developers.tiktok.com/docs/en/display-api-overview
- TikTok Research Tools expose broader public-data queries only to qualifying approved research use; TikTok explicitly states commercial users are not eligible for Research Tools: https://developers.tiktok.com/products/research-api and https://developers.tiktok.com/docs/en/research-api-faq
- Magnanimous may add broader cross-platform creator discovery only when a lawful official/licensed source is configured for that workspace. Until then, YouTube-native research and authorized-account reads stay separate from unsupported public-index claims.
- Existing Magnanimous Instagram support is authorization-based through the connected-assistant Meta broker. It must not be described as an arbitrary public Instagram/Reels index.

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

- `/api/creator-growth/*`: search, trends, YouTube outlier proxies, batch channel/video lookup, channel/video stats, keyword proxies, comments, comment insights/replies, title scoring/generation, thumbnail briefs, chapter/clip planning, full-script Magnanimous AI handoff, RPM estimates, owned-channel analytics, best-time history, similar videos/channels, bookmarks, creator feedback, Creator job visibility, competitor tracking, and observed change/performance history.
- `/api/movie-maker/*`: image/video/narration creation, watermark policy, studio quality tiers, sharing.
- `/api/video-stack/*`: upload, chunked storage, playback, editor/finalize, live session primitives.
- `/api/social-connect/*`: authorized publishing and account connection.
