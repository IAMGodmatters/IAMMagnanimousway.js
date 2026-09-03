# Magnanimous Multi-Video Agents

The platform now exposes multiple specialist video agents instead of one monolithic video tool.

Agents:
- Social Short Agent — vertical Reels/Shorts/TikTok-style content
- Product Demo Agent — product and feature walkthroughs
- Enterprise Promo Agent — B2B launch and capability videos
- Training Agent — onboarding, SOP and explainer media
- Faith Story Agent — ministry, testimony and inspirational media
- Virtual Presenter Agent — optional HeyGen/Tavus presenter-led output when authorized and funded

## Free-first execution
Free-first agents use the existing I AM Cinematic Free pipeline: optional Gemini visual direction, Cloudflare FLUX scene generation and browser animation/video assembly. This keeps ordinary video creation from requiring a paid avatar/video API.

## Premium presenter providers
HeyGen and Tavus are optional. They are reported as available only when the provider credential exists. Their absence does not disable the free-first agents. Premium usage should be funded by customer plan allowance, prepaid usage credits, customer-owned provider accounts or an approved contract budget.

## API
- `GET /api/video-agents` — agent/provider readiness catalog
- `POST /api/video-agents/storyboard` — authenticated specialist-agent storyboard and scene generation

Storyboards return scene narration, rendered scene images, prompts, provider metadata and browser-assembly instructions.

## Truthfulness
Provider readiness is not the same as a completed provider integration or customer authorization. The UI and API should never claim a premium provider or private customer system is live until it is actually configured and validated.
