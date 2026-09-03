# I AM Magnanimous Way™ — Tier Architecture

## Objective
Protect the free-first mission while targeting at least 20% gross margin on paid usage. Profit cannot be guaranteed because provider costs, payment fees, refunds, taxes, usage mix and revenue vary. The enforceable mechanism is to cap or meter variable-cost usage so paid usage cannot silently become unlimited.

## Official AI identity
The official AI/platform orchestration identity is **Magnanimous AI**. `Odin` is retired as a product/assistant name. Any temporary legacy identifiers or aliases exist only for migration compatibility and must not be treated as the official identity. New code, APIs, storage keys, docs and UI must use Magnanimous naming.

## Recommended customer tiers
| Tier | Price | Purpose | Variable-cost policy |
| --- | ---: | --- | --- |
| Free | $0 | Core Magnanimous AI, free-first AI, CRM, creator/browser tools, translation | Free-first providers only; no owner-funded unlimited premium usage |
| Magnanimous Plus | $19/mo | Affordable upgrade for individuals/creators | Expanded capacity; premium AI/calling/video only through explicit allowance/credits |
| Full Business | $49/mo | Existing complete business workspace | Controlled business integrations; usage caps/credits for paid providers |
| Professional Business Plan | $79/mo | Existing professional consulting/business-plan workflow | Recurring plan; consulting workflow entitlement, not unlimited third-party compute |
| Magnanimous Pro | $99/mo | Higher-capacity businesses | Larger controlled allowances; overage/credits for variable-cost services |
| Magnanimous Scale | $199/mo | High-capacity organizations | Largest standard allowances; hard spend controls; enterprise/custom pricing beyond standard limits |

Stripe live products created for the new tiers:
- Magnanimous Plus: product `prod_VBunX7YH14VEEI`, monthly price `price_1UBWxgDuxV2kib03EAdmCMei` ($19).
- Magnanimous Pro: product `prod_VBunIV3RLXKaOy`, monthly price `price_1UBWxlDuxV2kib03u7b61rOy` ($99).
- Magnanimous Scale: product `prod_VBungNiA6uKxWR`, monthly price `price_1UBWxqDuxV2kib0337oX8ARr` ($199).

## Cost research incorporated
- AI SaaS is best protected with hybrid subscription + usage/allowance pricing when variable inference cost rises with customer consumption.
- Cloudflare Workers AI provides a daily free allocation and then usage-based pricing on paid Workers, making it suitable for the free-first baseline but not a reason to promise unlimited compute.
- PSTN calling is usage-priced and varies sharply by destination. Browser/app calling is much cheaper than PSTN and should be preferred where it meets the user's need.
- Conversational avatar/video products have included-minute allowances plus material per-minute overage costs; they should never be exposed as uncapped owner-funded usage.

## Margin guard
For each paid tier, define `collected_revenue`, estimated payment/tax/refund reserve, and direct variable-cost budget. The platform should stop owner-funded variable usage or require prepaid credits/overage before projected gross margin drops below `TARGET_GROSS_MARGIN_PERCENT`.

Minimum rule:
`maximum_direct_variable_cost <= collected_revenue * 0.80`

Operationally use a lower internal ceiling (recommended 55–65% of collected revenue) to leave room for Stripe fees, refunds, support and owner income.

## Implementation rules
1. Free tier always prefers free-first providers and free browser calling.
2. No paid provider is marketed as unlimited unless the provider itself bears that usage cost.
3. Premium AI, PSTN, avatar/video and other per-use features consume an allowance or prepaid credits.
4. When an allowance is exhausted, downgrade to a free path where practical or require a paid top-up/overage; do not silently incur owner-funded overage.
5. Paid plan upgrades use Stripe-hosted Checkout and recurring Billing.
6. Customer Portal remains the self-service path for subscription management.
7. Review provider pricing before increasing included allowances.
8. Enterprise/high-volume customers receive custom pricing rather than unlimited standard-plan usage.
