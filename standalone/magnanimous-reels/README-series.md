# Magnanimous Reels Series Layer

Magnanimous Reels treats each of the 60 original pilots as a Season 1 series with ten episodes: 60 series / 600 episode production packages.

Public-product rules:

- Viewer access is public and anonymous. Watching, browsing, My List, rewards, creator drafting, and free story previews do not require a sign-in portal.
- Episode 1 story previews are clearly labeled as previews, not finished cinematic video.
- Finished premium video means a real MP4 exists and passes runtime readiness checks.
- Premium coin packs and the weekly pass are fail-closed while no finished premium cinematic episode is available.
- A paid Episode 4+ unlock must never deduct coins while its cinematic video is pending.
- Creator-published animated previews stay labeled as previews until a finished cinematic render exists.

Runtime entry points:

- `server_epnova.py` — combined viewer/creator/series server.
- `stories.json` — the 60 original Episode 1 story seeds.
- `build_series_manifest.py` — reproducibly expands the seeds into 600 episode production packages.
- `series_runtime.py` — series access, render state, watch/unlock persistence.
- `series.js` — series/episode UI plus public UX hardening, My List/Continue Watching, share/install, mobile navigation, and premium readiness gating.
- `creator.js` — anonymous creator workflow with truthful preview labeling.
- `video_runtime.py` — provider-neutral real moving-video adapter.
- `REAL_VIDEO_RENDERING.md` — completion standard and renderer contract.
- `VERIFICATION-60-SERIES-2026-10-04.md` — verification evidence.

Do not mark an episode as real-video ready unless the MP4 asset actually exists and passes runtime readiness checks. Do not enable premium sales merely because scripts or animated preview assets exist.
