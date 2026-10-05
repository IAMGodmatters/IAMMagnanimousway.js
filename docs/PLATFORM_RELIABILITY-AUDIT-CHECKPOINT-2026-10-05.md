# Platform reliability audit checkpoint — 2026-10-05

This checkpoint preserves the active owner-requested reliability pass so work can resume safely after streaming interruptions.

## Confirmed starting state

- Authoritative repository: `IAMGodmatters/IAMMagnanimousway.js` `main`.
- VideoExpress clean-room capability absorption is merged and deployed through PR #520.
- Production regression lock for the VideoExpress capability set is merged through PR #521.
- Railway production service `magnanimous` is online with a durable volume mounted and first-party SQLite/object-store paths configured through `MAGNANIMOUS_DB_PATH` and `MAGNANIMOUS_OBJECTS_PATH`.
- Full Platform QA exists with code health/build checks and a Playwright browser matrix for explicit/scheduled production runs.

## Reliability findings already confirmed

1. The standalone Magnanimous AI free-first Cloudflare execution path requests only 1,400 output tokens from `worker/src/provider-entrypoint.js`, which can make otherwise capable answers unnecessarily short.
2. Automatic research currently triggers from a narrow freshness-keyword matcher. Requests such as “help me with SSDI” or “give me the link” can therefore remain ungrounded unless Research mode is selected.
3. The standalone UI already renders grounded `sources` as clickable links. Improving automatic research for link/benefits/application/contact requests should make official links directly available without requiring paid access.
4. Railway build output reported one critical npm audit advisory. No forced audit repair has been applied; dependency remediation must be evidence-based and regression-tested.
5. The native Magnanimous runtime already includes durable SQLite, an object store, KV/cache, durable queue/workflows, vector storage/query, analytics, ingestion and backups. The active production Railway service already exposes volume variables, so storage expansion work should build on the native volume/object-store design rather than replace it.

## Next implementation steps

- Harden the standalone chat transport so public-information/link/application/benefit/contact/legal/current-data intents automatically enable fresh research.
- Raise the long-form free-first generation allowance without inflating short voice/tool calls.
- Add regression locks for those behaviors.
- Inspect and remediate the npm critical advisory without `npm audit fix --force`.
- Add storage-capacity observability and safe limits/usage reporting around the native object store and mounted volume.
- Run source/build/contract checks, deploy, verify Railway health, then exercise public production routes and HTTP/error behavior.
