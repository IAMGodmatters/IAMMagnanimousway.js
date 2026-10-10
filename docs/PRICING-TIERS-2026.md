# I AM Magnanimous Way™ — Tier Architecture

## Objective
Protect the free-first mission while applying the owner-required 20% upsell/markup to the rebuilt Business package and to direct metered provider-origin usage. Profit cannot be guaranteed because payment fees, refunds, taxes, usage mix and support costs vary. The enforceable mechanism is transparent plan pricing plus hard caps/prepaid funding for variable-cost usage.

## Official AI identity
The official AI/platform orchestration identity is **Magnanimous AI**. External providers and CRM products remain replaceable tools. Magnanimous owns the customer-facing identity, memory, routing, policy and orchestration layer.

## Current customer tiers
| Tier | Price | Purpose | Variable-cost policy |
| --- | ---: | --- | --- |
| Free | $0 | Core Magnanimous AI, creator/browser tools and CRM Lite | Free-first providers only; no owner-funded unlimited premium usage |
| Magnanimous Plus | $19.99/month | Expanded ordinary platform capacity | Premium provider usage only through explicit allowance/credits |
| Magnanimous CRM Pro | $79/month | Standalone AI-native CRM and revenue operating system | CRM base access included; metered provider usage remains prepaid at origin cost × 1.20 |
| Professional Business Plan | $79/month | Existing professional consulting/business-plan workflow | Recurring plan; included in Magnanimous Business |
| Magnanimous Business | $214/month | Complete business operating package | Includes CRM Pro + Professional Business Plan + Plus baseline; metered provider usage remains separately funded |
| Magnanimous Business Annual | $2,568/year | Twelve months of the complete Business package | Same controlled-cost policy as monthly Business |

## Business bundle formula
The complete Business plan includes three separately valuable paid components:

- Magnanimous CRM Pro: **$79/month**
- Professional Business Plan: **$79/month**
- Magnanimous Plus baseline: **$19.99/month**

Combined component value: **$177.99**.

Owner-required 20% upsell:

`$177.99 × 1.20 = $213.588`

Rounded public price: **$214/month**.

Annual Business is **$2,568/year**, equal to twelve monthly Business payments. No undisclosed annual discount is assumed.

## Stripe migration rule
Existing active Stripe subscriptions are not silently repriced. New CRM, Business and Business Annual checkout must use the disclosed current amount. If an environment variable points to an older Stripe Price with the wrong amount or billing interval, checkout must reject that Price and use Stripe-hosted recurring `price_data` for the correct current amount instead. Stripe-confirmed payment controls activation and webhook processing remains idempotent.

## Cost research incorporated
- AI SaaS is best protected with hybrid subscription + usage/allowance pricing when variable inference cost rises with customer consumption.
- Cloud/browser/native capabilities should remain the free-first baseline where practical.
- PSTN calling is usage-priced and varies sharply by destination. Browser/app calling should be preferred when it meets the need.
- Conversational avatar/video and enrichment products can create material per-use costs; they must not become uncapped owner-funded usage.
- CRM enrichment, telephony and premium research providers remain optional execution rails beneath Magnanimous CRM.

## Provider-origin markup guard
For a verified direct third-party variable cost `C`, customer-funded charge is:

`customer_charge = C × 1.20`

This is a **20% markup**, not the same calculation as a 20% gross-margin target. Existing gross-margin controls remain useful as a separate safety floor for subscriptions and enterprise contracts.

## Implementation rules
1. Free tier always prefers free/native/browser/edge providers where practical.
2. No paid provider is marketed as unlimited unless the provider itself bears that usage cost.
3. Premium AI, PSTN, avatar/video, enrichment and other per-use features consume an allowance or prepaid credits.
4. When an allowance is exhausted, downgrade to a free path where practical or require funded top-up/overage; do not silently incur owner-funded overage.
5. Paid plan upgrades use Stripe-hosted Checkout and recurring Billing.
6. Customer Portal remains the self-service path for subscription management.
7. Existing subscriptions are preserved unless a customer explicitly changes plans.
8. CRM can be purchased standalone; Business includes CRM Pro and the Professional Business Plan.
9. Enterprise/high-volume customers receive controlled/custom pricing rather than unlimited standard-plan usage.
