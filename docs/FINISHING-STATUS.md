# I AM Magnanimous Way — Production Completion Status

The authoritative deployment branch is `main`. Magnanimous AI is the official intelligence/orchestration identity. Any remaining Odin name is compatibility-only and must not be presented as the product identity.

## Production hardening completed

- [x] Paid-tier entitlements and direct variable-cost ceilings are enforced server-side.
- [x] Premium AI, carrier calling, inbound carrier calling, and real-time avatar usage are guarded by authenticated plan entitlement and monthly direct-cost budget.
- [x] Premium usage is recorded in a D1 usage ledger and aggregate monthly guard.
- [x] Free users stay on free-first AI/browser paths instead of silently creating owner-funded provider charges.
- [x] Duplicate Stripe subscriptions are blocked and active customers are directed to subscription management instead of creating a second subscription.
- [x] Stripe subscription price IDs map back to Plus, Business, Pro, and Scale entitlements.
- [x] Stripe webhooks are signature-verified, deduplicated, and price-aware.
- [x] Live recurring Stripe Payment Link fallback exists for Plus, Business, Pro, and Scale.
- [x] The pricing workspace exposes current plan, recorded premium direct cost, remaining included allowance, and premium-usage state.
- [x] Magnanimous owner sessions use `magnanimous_admin_token` as the canonical key. A temporary mirrored legacy token remains only so older screens cannot lock out an existing owner during migration.
- [x] Magnanimous AI health and free-first Agent Mesh are included in production smoke verification.
- [x] Free-first text-to-video is available through the I AM Cinematic Free pipeline: Cloudflare FLUX scene generation plus browser-side motion/video rendering, with local browser fallback rather than a required paid video-generation service.
- [x] AI Receptionist / voice-agent configuration exposes free browser calling and supports controlled carrier/avatar providers when configured.
- [x] Monetization configuration, sponsored-placement support, billing support, signup/session/consent, platform-owner isolation, and Stripe checkout are production-smoke tested.
- [x] Official social publishing infrastructure is deployed for YouTube, TikTok, and LinkedIn with encrypted token storage, OAuth state protection, disconnect support, explicit posting consent, provider-controlled approval reporting, YouTube upload support, TikTok creator-info/direct-post flow, and LinkedIn member posting.
- [x] `/social-connect` is deployed as the account authorization and publishing workspace and `/social-media` links into it.
- [x] Free translation remains part of the shared platform experience, including Tagalog and Cebuano access.
- [x] Production deployment, D1 migrations, frontend typecheck/build, Worker deployment, and smoke tests pass from `main`.

## Provider-controlled activation requirements

The platform code is complete even when an outside provider reports `configured: false`. These items cannot be manufactured or bypassed by application code and require the owner/provider account to supply or approve them:

- Google OAuth client + YouTube Data API/OAuth consent for YouTube account authorization and uploads.
- TikTok developer Client Key/Secret and Content Posting API/Login Kit approval for TikTok publishing.
- LinkedIn developer Client ID/Secret and the LinkedIn permissions/products required for member posting.
- Twilio credentials/number for paid carrier calling if carrier calling is desired.
- Tavus credentials for paid real-time human avatar service if desired; free browser/avatar paths remain available where implemented.
- AdSense publisher approval/ID before Google ad inventory can produce AdSense revenue.

The owner UI reports these states honestly rather than pretending an unconfigured outside account is connected.

## Economics rule

No repository document or customer-facing promise should claim guaranteed profit. The platform targets at least **20% gross margin** through free-first routing, paid-tier pricing, direct-cost ceilings, controlled allowances, usage recording, and refusal/downgrade when an included premium budget is exhausted. Actual net profit still depends on sales, provider fees, payment fees, refunds, taxes, disputes, advertising performance, and customer usage.
