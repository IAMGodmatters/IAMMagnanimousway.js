# Magnanimous Reels — 60 Series / Real Video Verification

Date: 2026-10-04

## Verified series structure

- 60 original series.
- 10 Season 1 episodes per series.
- 600 total episode production packages.
- Every package has two quoted dialogue lines, a five-shot camera plan, four sound-design cues, a performance note, a cliffhanger and a live-action 9:16 generation prompt.
- Original pilot content remains Episode 1 for each series.
- Episodes 1–3 of every series are free.
- Episode 4+ uses server-side unlock state.

## Verified live behavior

The BasicDeploy Magnanimous Reels runtime returned:

- 60 series from `/api/series`.
- 600 render jobs.
- production target `cinematic_live_action_vertical`.
- real-video ready: 0.
- awaiting capacity: 600.
- no configured local NVIDIA GPU, Wan endpoint or BytePlus video key.

The browser regression passed:

- 60 series buttons shown.
- heading updated to 10 episodes each.
- a series modal opens.
- exactly 10 episode rows render.
- exactly 3 episodes are marked free.
- no paid Watch button is exposed while real video is unavailable.
- all 10 rows correctly show real-video pending in the current no-render-capacity state.

Payment protection passed:

- Episode 3 is accessible as a free preview.
- Episode 4 is locked.
- attempting to unlock Episode 4 before its real video exists returns HTTP 409 `REAL_VIDEO_PENDING`.
- account balance remained 90 coins before and after the rejected unlock.

## Important limitation

This verification does not claim that 600 finished moving videos exist. They do not. The scripts, dialogue, camera/sound plans, continuity information, access model and render queue are built and verified. Actual TV-style moving-video renders remain blocked until either funded hosted video generation or compatible self-hosted GPU capacity is connected.
