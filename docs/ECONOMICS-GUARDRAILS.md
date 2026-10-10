# I AM Magnanimous Way™ — Economics Guardrails

## Goal
Keep the core platform genuinely useful on the free tier while making paid products sustainable. Subscription economics and direct provider-origin usage are protected separately: subscriptions retain gross-margin controls, while direct metered provider-origin usage is customer-funded with the owner-required 20% markup.

A 20% profit or margin cannot be guaranteed because payment fees, refunds, taxes, support costs, provider usage, customer behavior and third-party pricing can change. The platform therefore uses transparent prices, prepaid variable-cost funding and hard usage controls rather than making a false profit guarantee.

## Free-first rule
- Magnanimous AI is the only public AI identity.
- Free users should route to Cloudflare Workers AI and other configured free-first providers before any metered provider.
- Metered AI providers remain disabled by default through `ENABLE_METERED_PROVIDERS=false`.
- Optional carrier calling, premium avatar/video, enrichment and other metered integrations must not be required for the free platform to function.
- Free translation remains available without a paid translation API.

## Paid-side rule
Current standard paid revenue paths include:
- Magnanimous Plus — $19.99/month.
- Magnanimous CRM Pro — $79/month standalone.
- Professional Business Plan — $79/month standalone.
- Magnanimous Studio — $79/month standalone.
- Magnanimous Business — $309/month, including CRM Pro + Professional Business Plan + Studio + Plus baseline with the required 20% bundle upsell.
- Magnanimous Business Annual — $3,708/year for new annual checkout.
- Sponsored placement — recurring paid placement when sold.

Existing active Stripe subscriptions are not silently repriced by this release. New checkout must use the current disclosed plan amount and interval.

## Business package formula
`79 + 79 + 79 + 19.99 = 256.99`

`256.99 × 1.20 = 308.388`

Rounded standard Business price: **$309/month**.

## Direct provider-origin markup
For a verified direct third-party variable cost `C`:

`customer_charge = C × 1.20`

This is a 20% markup on origin cost. It is distinct from gross margin. Direct provider usage must be funded before expensive work runs; it must not silently become owner-funded consumption.

## Operational guardrails
1. Keep metered AI disabled globally unless there is a deliberate funded-use reason to enable it.
2. Prefer free-first AI routing even for paid accounts unless a premium model materially improves the task.
3. Do not offer unlimited carrier minutes, avatar minutes, premium video rendering or CRM enrichment where the platform owner pays per use.
4. Gate high-variable-cost features behind paid plans, provider-owned billing, prepaid credits, usage caps, or explicit owner approval.
5. Verify Stripe price amount and interval before using a configured Price ID for new checkout.
6. If a configured Stripe Price is stale, create the Stripe-hosted recurring Checkout line with the current disclosed price instead of undercharging.
7. Review Stripe revenue against AI, calling, video, email, enrichment, hosting and other provider costs before increasing included allowances.
8. Do not describe advertising, affiliate income, subscription revenue or any plan as guaranteed profit.

## Subscription gross-margin formula
`gross_margin_percent = ((collected_revenue - direct_variable_cost) / collected_revenue) * 100`

Existing target floor: `>= TARGET_GROSS_MARGIN_PERCENT` (production default: 20).

The owner-required `origin_cost × 1.20` direct-usage markup is a separate policy and should not be mislabeled as 20% gross margin.

## Release rule
Any future feature that introduces a new per-use third-party charge must document its billing owner, expected unit cost, entitlement, usage limit and funding path before it is enabled for general users.
