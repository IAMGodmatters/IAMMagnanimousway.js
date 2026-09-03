# I AM Magnanimous AI Platform

Production-oriented deployment for the I AM Magnanimous Way™ platform.

## Consolidated structure

- `frontend/` — Next.js static frontend
- `worker/` — primary Cloudflare Worker, D1 database, and same-origin API
- `backend/` — FastAPI/local development support
- `video-gateway/` — Cloudflare video API gateway
- `video-renderer/` — Docker/FFmpeg renderer deployed separately on Render
- `render.yaml` — Render free video-renderer service definition
- `.github/workflows/deploy.yml` — primary application build and Cloudflare deployment
- `.github/workflows/video-gateway-deploy.yml` — video gateway deployment
- `.github/workflows/python-app.yml` — Python validation

## Primary Cloudflare deployment

The main application uses one Cloudflare Worker to serve the static Next.js frontend and the application API from the same origin. Cloudflare D1 provides persistent application data.

The production deployment requires these Cloudflare secrets/variables to be configured outside the repository:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `OPENAI_API_KEY`
- Optional: `OPENAI_MODEL`

The D1 database is configured in `worker/wrangler.jsonc` as `iam-magnanimous-db`.

### Local deployment commands

```bash
cd frontend
npm install
npm run typecheck
npm run build

cd ../worker
npm install
npx wrangler d1 migrations apply iam-magnanimous-db --remote
npx wrangler deploy --yes
```

The GitHub Actions workflow performs the frontend type-check/build, installs Worker dependencies, applies remote D1 migrations, and deploys the Worker.

## Video

Text-to-video is handled through the consolidated video path:

`frontend → Cloudflare Worker/video gateway → Render FFmpeg renderer`

The video gateway uses `VIDEO_RENDERER_URL` to reach the Render service. The Render service is defined by `render.yaml` and uses the Dockerfile in `video-renderer/`.

The video gateway is deployed separately from the main Worker so video-rendering infrastructure does not block the main application deployment.

## Magnanimous AI

Magnanimous AI is the canonical orchestration assistant in the platform interface. The Worker routes requests through Cloudflare Workers AI first. OpenAI and other metered providers are optional server-side fallbacks; private API keys are never placed in the frontend.

The platform also contains the AI helper catalog and the owner/admin functionality built into the current application.

Cloudflare Workers AI is the free-first provider. Metered providers remain disabled unless `ENABLE_METERED_PROVIDERS=true` is deliberately configured.

## Phone and call center

The `/phone` workspace includes free browser-to-browser WebRTC calling, agent presence, queues, call history, assignments, durations, and dispositions. An optional carrier bridge activates calls to ordinary mobile and landline numbers without changing the frontend.

See [`docs/call-center.md`](docs/call-center.md) for the carrier contract and deployment variables.

## Owner administration

Owner credentials and session secrets remain server-side. Do not commit passwords, API keys, or other private credentials to GitHub.

## Revenue

The main Free tier remains the default access model. Full Business is an optional $49/month upgrade, and the platform supports a separate $49/month sponsored-ad product. Metered provider usage remains opt-in so paid API costs do not silently become part of the free tier.

The owner dashboard can also support legitimate sponsored, referral, and affiliate links. Any external advertising or affiliate provider remains subject to that provider's approval and terms.

## Deployment status

The production baseline is deployed through the `Build and Deploy I AM` workflow, with D1 migrations, frontend type-check/build, and Cloudflare Worker deployment automated on `main`. See [`docs/PRODUCTION-COMPLETION.md`](docs/PRODUCTION-COMPLETION.md) for the verified production baseline and handoff record.

The repository intentionally keeps the main application deployment and the video gateway deployment separate while retaining the FastAPI backend for local development/video support.
