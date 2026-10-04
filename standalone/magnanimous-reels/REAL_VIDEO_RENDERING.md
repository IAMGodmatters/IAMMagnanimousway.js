# Magnanimous Reels — Real Video Rendering Contract

## Required finished experience

Magnanimous Reels episodes are intended to feel like short vertical television drama, not a slideshow. A finished episode must use real moving video with people or characters in motion, natural performance, visible facial expression and body movement, changing camera coverage, dialogue or performance-quality speech, room tone/foley, sound effects and an appropriate music bed.

The existing animated-image/motion-comic path is a preview/fallback only. It must not be labeled as the finished cinematic episode.

## Series structure

- 60 original Magnanimous Reels series.
- Season 1 contains 10 episodes for each series: 600 episodes total.
- Episodes 1–3 of every series are free previews.
- Paid unlocks begin with Episode 4.
- A paid episode must not spend coins until a real rendered video asset exists.
- `series_runtime.py` enforces this through render state and `server_epnova.py` returns `REAL_VIDEO_PENDING` before any paid unlock can occur.

## Production package

`build_series_manifest.py` generates a reproducible package for every episode containing:

- continuing story beats and cliffhanger;
- lead/cast continuity note;
- 9:16 live-action video prompt;
- quoted spoken-dialogue plan;
- five-shot camera plan;
- sound-design plan;
- performance note;
- inherited voice/style context from the original pilot.

The renderer must preserve recurring character identity, wardrobe/location continuity and story state across a series unless the script explicitly changes them.

## Renderer order

1. **Self-hosted/open renderer when practical.** `video_runtime.py` supports a configured `WAN_VIDEO_API_URL`. Wan 2.2 TI2V-5B is the intended free-first class of renderer, but practical local use requires a GPU with roughly 24 GB VRAM.
2. **Funded hosted renderer.** `video_runtime.py` supports BytePlus Seedance through `BYTEPLUS_API_KEY` and an optional `BYTEPLUS_VIDEO_MODEL` override. The request targets 9:16, 720p and synchronized audio.
3. **Fallback only.** Existing motion-comic assets can remain available as previews, but are never treated as completed real-video episodes.

The current BasicDeploy runtime does not expose a suitable NVIDIA GPU and has no funded Wan endpoint or BytePlus video key configured. Therefore render jobs remain `awaiting_capacity` until compatible capacity is attached.

## Video asset convention

A completed episode is stored at:

`/workspace/static/series-video/<series_id>/<episode_number>.mp4`

`series_runtime.py` marks an episode ready only when that file exists and is non-trivial. The public app exposes a Watch button only after `real_video_ready` is true.

## Payment safety

No browser-only flag can activate paid content. Coin spending is server-side. Paid unlock requests for unrendered episodes return HTTP 409 with `REAL_VIDEO_PENDING`. Stripe-funded products remain separate from the video renderer, and provider/GPU costs must be funded or explicitly approved rather than silently charged to the owner.
