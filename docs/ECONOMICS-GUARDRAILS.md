# I AM Magnanimous Way™ — Economics Guardrails

## Goal
Keep the core platform genuinely useful on the free tier while operating paid features with a target gross margin of at least 20%.

A 20% profit or margin cannot be guaranteed because actual provider usage, payment fees, refunds, taxes, advertising revenue, customer behavior, and third-party pricing can change. The platform therefore uses cost controls and pricing rules designed to protect a 20%+ gross-margin target rather than making a false guarantee.

## Free-first rule
- Magnanimous AI is the only public AI identity.
- Free users should route to Cloudflare Workers AI and other configured free-first providers before any metered provider.
- Metered AI providers remain disabled by default through `ENABLE_METERED_PROVIDERS=false`.
- Optional carrier calling, premium avatar/video, and other metered integrations must not be required for the free platform to function.
- Free translation remains available without a paid translation API.

## Paid-side rule
Current paid revenue paths include:
- Full Business — $49/month.
- Professional Business Plan — $79/month recurring unless included with Full Business under the active entitlement rules.
- Sponsored placement — recurring paid placement when sold.

Paid features should be operated so direct variable cost stays below 80% of collected revenue, with a preferred internal ceiling substantially below that to leave room for payment fees, support, refunds, and owner income.

## Operational guardrails
1. Keep metered AI disabled globally unless there is a deliberate paid-use reason to enable it.
2. Prefer free-first AI routing even for paid accounts unless a premium model materially improves the requested task.
3. Do not offer unlimited carrier minutes, avatar minutes, or premium video rendering where the platform owner pays per use.
4. Gate high-variable-cost features behind paid plans, provider-owned billing, credits, usage caps, or explicit owner approval.
5. Review Stripe revenue against AI, calling, video, email, hosting, and other provider costs before increasing included paid usage.
6. Pause or restrict a paid feature if projected direct cost would push its gross margin below the configured target.
7. Do not describe advertising, affiliate income, subscription revenue, or any plan as guaranteed profit.

## Margin formula
`gross_margin_percent = ((collected_revenue - direct_variable_cost) / collected_revenue) * 100`

Target: `>= TARGET_GROSS_MARGIN_PERCENT` (production default: 20).

## Release rule
Any future feature that introduces a new per-use third-party charge should document its billing owner, expected unit cost, entitlement, and usage limit before being enabled for general users.
