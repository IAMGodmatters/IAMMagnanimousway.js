# Magnanimous AI — Meta Capability Absorption

## Identity rule

Magnanimous AI remains the brain, memory, reasoning, orchestration and public identity. Meta is a replaceable external provider ecosystem beneath Magnanimous.

Do not expose Meta as the owner or brain of the platform. Do not replace existing Facebook, Instagram or WhatsApp integrations. Extend them through normalized Magnanimous capabilities and preserve permission/confirmation gates.

## Existing live integration foundation

The repository already supports Meta OAuth and connected-account actions for:

- Facebook Pages
- Instagram Business
- WhatsApp Business

Those live actions remain routed through the existing integration and assistant-action layers so encrypted tokens, tenant boundaries, read/write permissions and confirmation requirements stay centralized.

## Absorbed Meta platform capabilities

### Core platform and identity
- Graph API: versioned node/edge/field access, cursor pagination and resource traversal.
- Facebook Login / OAuth: user authorization, access tokens, permissions, token debugging and app-scoped access.
- Business Management: business portfolios, system users and business-asset assignment.
- App Review / access levels: permission review, business verification and Marketing API Access Tier readiness.

### Facebook and Instagram
- Facebook Pages: page inventory, feeds, publishing, media, comments, engagement and insights.
- Instagram Platform: professional account profile/media, publishing, Reels, comments, mentions and insights where permissions allow.
- Messenger Platform: business messaging, templates, quick replies, webhooks and support workflows.

### WhatsApp and Threads
- WhatsApp Cloud API: programmatic business messaging, templates, media, webhooks, phone-number/business-profile operations and delivery status.
- Threads API: authorization, publishing, replies and insights subject to app/user permissions.

### Advertising and measurement
- Marketing API: campaigns, ad sets, ads, creatives, audiences, placements, insights and budget controls.
- Conversions API: server-side web/app/offline/CRM conversion events, event matching and deduplication.
- Lead Ads: lead forms, lead retrieval, webhook delivery and CRM synchronization.
- Insights APIs: page, Instagram and advertising reporting, breakdowns and attribution data.
- Custom Audiences: customer/engagement audiences, lookalikes and exclusions where policy and permissions permit.
- App Events: application events and optimization signals.

### Commerce
- Catalog API: catalogs, products, feeds, product sets, availability and pricing.
- Commerce API: shops, orders, fulfillment, returns, inventory and merchant settings where available to the connected business.

### Events and security
- Webhooks: subscription verification and normalized event ingestion for Pages, Instagram, WhatsApp, lead events and other supported Graph objects.
- Least-privilege tokens, system users, token rotation and expiry tracking.
- App-secret proof and webhook-signature validation should be used where supported.
- Provider access tokens and app secrets must never be returned to customer-facing UIs or logs.

### Broader Meta developer knowledge
Magnanimous should track Meta's broader developer ecosystem as future/adaptable capability sources without claiming those products are natively owned or connected:
- Llama / Meta AI models
- Meta Horizon / Quest / Horizon OS development
- Unity and Unreal integrations for Meta immersive platforms
- Wearables / AI glasses device-access tooling
- official SDKs, Postman collections, Graph API Explorer, Access Token Debugger, changelogs, developer support and rate-limit guidance

## Current version-awareness rule

As of 2026-09-16, Meta's current Graph API release reference is v26.0, released 2026-07-29. Existing repository integrations default to v23.0 when `META_GRAPH_VERSION` is not set. v23.0 is still within its published support window, so Magnanimous must not silently upgrade it. Review the current changelog and app permissions before changing versions.

The Meta control plane reports both the configured version and the current reference version so the owner can make an intentional migration.

## Consequential-action rules

Read actions may run when the connected account and requested permission are authorized.

The following remain consequential and must preserve explicit confirmation and permission checks:
- publishing posts/media
- sending customer messages
- creating or modifying campaigns
- changing ad budgets or statuses
- creating audiences from customer data
- commerce/order mutations
- destructive deletions
- any action that can create spend or billing impact

The Meta capability layer itself does not spend money, buy ads, make purchases, or bypass existing confirmation gates.

## Provider independence

Magnanimous owns the normalized capability model. Meta-specific object IDs, tokens and API details stay at adapter boundaries.

A future alternative social, messaging, advertising, commerce or analytics provider should be able to implement the same Magnanimous capability contract without changing the Magnanimous public identity.

## Data boundaries

Allowed:
- authorized API outputs
- normalized metadata and analytics the user is entitled to access
- user/business-owned content and configuration
- permission/readiness state
- provider object references required for synchronization

Not allowed:
- copying or mirroring Meta proprietary platform datasets outside authorized API terms
- exposing access tokens or app secrets
- claiming unrestricted access to assets or users the connected account cannot access
- bypassing Meta App Review, business verification, rate limits or policy controls

## Source watch

Owner/admin engineering should monitor:
- Graph API and Marketing API version changelogs
- Instagram Platform changes
- WhatsApp Business Platform / Cloud API changes
- Threads API changelog
- Marketing API Access Tier and permission requirements
- official Meta Postman collections
- security, privacy, webhook and business-verification requirements

Absorption means Magnanimous understands, normalizes and can orchestrate these capabilities when properly authorized. It does not mean copying Meta's proprietary systems or claiming provider authority that does not exist.
