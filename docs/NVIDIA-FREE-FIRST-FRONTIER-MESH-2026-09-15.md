# NVIDIA Free-First Frontier Mesh — 2026-09-15

This change is additive. No existing Magnanimous AI provider, fallback, memory path, specialist, or paid-provider option was removed.

## Architecture invariant

Magnanimous AI remains the commander-in-chief and durable remembrance layer for the platform. Provider models are replaceable execution engines. Decisions, learned lessons, useful context, proven workflows, tool recipes, and continuity belong to Magnanimous memory rather than any outside model.

## Added optional free-first execution engines

When `NVIDIA_API_KEY` is configured, Magnanimous may add these NVIDIA NIM endpoints to its free-first routing pool:

- Kimi K3 — `moonshotai/kimi-k3`
- DeepSeek V4 Pro — `deepseek-ai/deepseek-v4-pro-0813`
- DeepSeek V4 Flash — `deepseek-ai/deepseek-v4-flash-0731`

The NVIDIA route is optional. If the key is absent, the existing Cloudflare Workers AI, Gemini, Groq, Mistral, and configured paid fallbacks continue unchanged. Provider errors or quota exhaustion fall through to the next configured engine.

NVIDIA-hosted prototype endpoints remain subject to NVIDIA availability and quotas; the platform must not represent them as guaranteed unlimited service.

## Activation

The Owner Credentials catalog now accepts `NVIDIA_API_KEY`. The runtime credential overlay can use it without making NVIDIA the platform identity or memory owner.

Validated source commit: `338c48f320343722d6477b90f70ab704bff8f409`.
