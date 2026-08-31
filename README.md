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

## Odin and AI

Odin is part of the main platform interface. The Worker connects to the OpenAI Responses API using the server-side `OPENAI_API_KEY`; private API keys are never placed in the frontend.

The platform also contains the AI helper catalog and the owner/admin functionality built into the current application.

## Owner administration

Owner credentials and session secrets remain server-side. Do not commit passwords, API keys, or other private credentials to GitHub.

## Revenue

The owner dashboard supports legitimate sponsored, referral, and affiliate links. Connecting a monetization provider and receiving payment still depends on that provider's own account, approval, and terms.

## Deployment status

The latest `main` deployment workflow completed successfully on August 31, 2026, including frontend installation, type-checking, frontend build, D1 migrations, and Cloudflare Worker deployment.

The repository intentionally keeps the main application deployment and the video gateway deployment separate while retaining the FastAPI backend for local development/video support.
