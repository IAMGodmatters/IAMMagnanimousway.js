# Magnanimous GPU Render Node
This directory is the deployment contract for the self-hosted GPU renderer.

## Required runtime behavior
- expose POST /v1/sessions, /v1/sessions/{id}/speak, /v1/sessions/{id}/interrupt
- ingest streaming speech audio
- drive facial animation from audio/prosody
- preserve avatar identity and temporal consistency
- output 30 FPS WebRTC-compatible video/audio
- support interruption in under one conversational turn
- emit latency/FPS/dropped-frame metrics
- degrade quality before dropping conversational responsiveness

## Renderer backends
Use a pluggable backend interface. Recommended evaluation lanes:
1. Audio2Face-3D-style blendshape backend for controllable 3D humans.
2. MuseTalk-class identity-preserving 2D lip-sync backend.
3. Future native diffusion/neural-rendering backends.

Do not hard-code Magnanimous to one model or GPU vendor.

## Realism QA gates
Evaluate lip/audio sync, identity drift, temporal jitter, eye/blink naturalness, emotion/prosody match, teeth/lip artifacts, head-motion plausibility, first-frame latency, interruption latency, sustained FPS, reconnect recovery and mobile bandwidth adaptation.
