# Magnanimous Reels Series Layer

The standalone Magnanimous Reels app now treats each of the 60 original pilots as a Season 1 series with ten episodes.

Runtime entry points:

- `server_epnova.py` — combined viewer/creator/series server.
- `stories.json` — the 60 original Episode 1 story seeds.
- `build_series_manifest.py` — reproducibly expands the seeds into 600 episode production packages.
- `series_runtime.py` — series access, render state, watch/unlock persistence.
- `series.js` — series/episode UI.
- `video_runtime.py` — provider-neutral real moving-video adapter.
- `REAL_VIDEO_RENDERING.md` — completion standard and renderer contract.
- `VERIFICATION-60-SERIES-2026-10-04.md` — latest verification evidence.

The app deliberately distinguishes story-ready episodes from rendered cinematic video. Do not mark an episode as real-video ready unless the MP4 asset actually exists and passes runtime readiness checks.
