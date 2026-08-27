# I AM Magnanimous AI Platform

Production-oriented Cloudflare deployment for the I AM Magnanimous Way™ platform.

## Included

- Odin AI chat interface
- AI helper catalog
- Owner login and administration
- Persistent site settings and sponsored/affiliate links with Cloudflare D1
- Same-origin API and frontend on Cloudflare Workers
- OpenAI Responses API integration through a server-side Worker secret
- Static Next.js frontend prepared for Cloudflare asset hosting
- Existing FastAPI backend retained for local development and FFmpeg video rendering

## Cloudflare deployment

Cloudflare currently recommends vinext for new Next.js applications on Workers; this project uses a static Next.js export served by a Worker so the API and site can share one origin. Cloudflare D1 provides persistent settings and revenue-link storage.

1. Create a D1 database named `iam-magnanimous-db` and put its ID in `worker/wrangler.jsonc` in place of `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
2. Run the SQL in `worker/schema.sql` against that D1 database.
3. Configure Worker secrets/variables: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and `OPENAI_API_KEY`. Optionally set `OPENAI_MODEL`.
4. Build the frontend with `cd frontend && npm install && npm run build`.
5. Deploy from `worker` with `npx wrangler deploy`.

For a Cloudflare Workers Build connected to this repository, the build command should build `frontend`, and the deploy command should run Wrangler from `worker`.

## Video

The original FastAPI backend includes a local FFmpeg renderer. Cloudflare Workers does not provide that FFmpeg runtime in this deployment, so `/api/video/render` intentionally reports that the local renderer is required rather than pretending video rendering is available.

## Owner admin

The owner credentials are never stored in the frontend. Keep `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and `OPENAI_API_KEY` in Cloudflare secrets/environment configuration.

## Revenue

The owner dashboard supports legitimate sponsored, referral, and affiliate links. Revenue is not automatic merely because traffic arrives: each monetization provider must be connected and paid according to that provider's terms. The platform stores and displays the links; it does not impersonate a payment processor or redirect traffic deceptively.
