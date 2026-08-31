# I AM Magnanimous Way — Project Safety Rules

This file documents the protected integration policy for future changes.

## Rules

1. Preserve existing working features; do not replace them unnecessarily.
2. Add new functionality as isolated modules/routes/components where practical.
3. Do not remove or rewrite the existing MUX/Video Studio integration without a verified replacement and regression test.
4. Do not alter the existing CRM/D1 schema unnecessarily; additive migrations are preferred.
5. Lead generation, automatic lead filtering, CRM enhancements, and phone/VoIP must fail independently and must not take down unrelated services.
6. Keep Cloudflare deployment configuration stable unless a change is required to fix a verified deployment problem.
7. Run frontend typecheck/build and Worker/D1 deployment checks after significant changes.
8. Do not claim a live integration works until its live credentials/configuration and end-to-end behavior have been verified.

## Current verified baseline (2026-08-31)

- Frontend typecheck: passing in latest successful GitHub Actions deployment.
- Frontend build: passing in latest successful GitHub Actions deployment.
- D1 migrations: passing in latest successful GitHub Actions deployment.
- Cloudflare Worker deploy: passing in latest successful GitHub Actions deployment.
- MUX integration: present in the video-renderer service; live MUX authentication/upload remains to be verified.
