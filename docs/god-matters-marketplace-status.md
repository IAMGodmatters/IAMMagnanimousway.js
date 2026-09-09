# God Matters Marketplace — Launch Checkpoint

Updated: 2026-09-09. This is a durable handoff for the separate God Matters Shopify business. It is not a declaration that every supplier, checkout, or Meta marketplace requirement is complete. No passwords, access tokens, payment credentials, or private customer data belong in this file.

## Business boundaries

- One intended Shopify store: God Matters, `gh9171-jy.myshopify.com`, primary storefront `https://puso-iam.myshopify.com`, PHP currency, Philippines business location.
- Philippines: print-on-demand only. United States: sourced Christian merchandise and print-on-demand. Other countries require deliberate later expansion and verified fulfillment.
- Keep this store distinct from the I AM MAGNANIMOUS WAY™ AI platform's subscriptions, agents, and infrastructure. The platform may link to the store.
- Brand: I AM MAGNANIMOUS WAY™. Slogan: ONE GOD • ONE PEOPLE • A BRIGHTER TOMORROW. Do not represent the trademark as registered without proof.
- Goal: 150+ genuinely fulfillable products, meaningful category coverage, original English/Tagalog/Cebuano content, low upfront cost, landed-cost pricing, customer-paid shipping where appropriate. Do not invent stock, commercial Scripture rights, or guaranteed profit.

## Verified Shopify snapshot

The connected Shopify Admin GraphQL read on 2026-09-09 confirmed all three products ACTIVE, all 25 variants at their intended PHP prices, and all three published to publication `gid://shopify/Publication/182765027370` (Facebook & Instagram by Meta). This publication state is not proof of Meta ingestion, approval, a native Facebook Shop, or a Marketplace listing.

| Product | Shopify product ID | Handle | Price | Variants |
| --- | --- | --- | --- | --- |
| Christian Scripture Ring | 8018809061418 | stainless-steel-christian-scripture-ring | PHP 899 | 18 |
| Christian Cross Necklace | 8018809225258 | stainless-steel-christian-cross-necklace-pendant | PHP 999 | 4 |
| Prayer Hands Pendant Necklace | 8018809323562 | vintage-christian-prayer-hands-pendant-necklace | PHP 1199 | 3 |

Verified product URLs:
- https://puso-iam.myshopify.com/products/stainless-steel-christian-scripture-ring
- https://puso-iam.myshopify.com/products/stainless-steel-christian-cross-necklace-pendant
- https://puso-iam.myshopify.com/products/vintage-christian-prayer-hands-pendant-necklace

All 25 variants have Shopify inventory policy DENY and imported quantity 50,000 each. These are supplier-imported quantities, not independently verified physical stock. Verify actual stock, variant mapping, material claims, destination shipping, return costs, and supplier billing before claiming end-to-end fulfillment is guaranteed. Do not fabricate quantities or turn on automatic fulfillment merely to make the storefront appear complete.

## Printful checkpoint

A current query for `managed_by:printful` returned zero variants. Printful is installed, but this does not establish production-ready products. The seven existing drafts remain launch-blocked until actual blank products, print-ready artwork, variant mappings, costs, shipping, mockups, and supplier billing are verified.

Collection `314384646186`, handle `god-matters-print-on-demand`.

| Draft | Product ID | Variant ID |
| --- | --- | --- |
| Prayer & Reflection Diary | 8018918375466 | 44812439650346 |
| Gratitude Journal | 8018936397866 | 44812465897514 |
| Purpose & Faith Planner | 8018936660010 | 44812466159658 |
| Faith Mug | 8018937839658 | 44812468092970 |
| Faith Tote | 8018938134570 | 44812468682794 |
| Faith Hoodie | 8018938429482 | 44812468977706 |
| Faith T-Shirt | 8018943770666 | 44812474515498 |

All were previously verified as DRAFT with zero price and no real Printful mapping. Do not publish a zero-price or unmapped product. Concept images are not production files. The approved original logo is not currently verified as a usable production asset.

Printful app: `https://gh9171-jy.myshopify.com/admin/apps/printful`.
Official sync instructions: https://help.printful.com/hc/en-us/articles/360014007480-How-do-I-add-and-sync-products-with-my-Shopify-store

## Website and save points

Repository: `IAMGodmatters/IAMMagnanimousway.js`, branch `main`.
Site: https://iammagnanimousway.com/
Marketplace: https://iammagnanimousway.com/shop
Source: `frontend/app/shop/page.tsx`.
Last verified pre-checkpoint blob: `af45c4cd7aa6d53ef87668e950ec0868306d3684`.
Previous marketplace commit: `89b3ce4d6b0f557ae121280642a396e437e1c203`.

The page contains the three jewelry prices and pairing suggestions at PHP 1,898, 2,198, and 3,097 (ordinary sums, not discounts). Existing product buttons lead to the store homepage. Next implementation should use verified product-specific URLs and make the pairing calls actionable without inventing checkout or bundle capabilities. Verify current source SHA before replacement. No current build, deployment, or public website smoke test has yet been confirmed for this checkpoint.

## Meta and social publishing

Correct Facebook page: God matters, Post Bridge account ID 93659. Do not post to the other connected pages. Earlier Post Bridge publish attempts returned HTTP 500 and no successful public post ID; its post listing was empty. Metricool previously had pending scheduled posts, but scheduling is not evidence of delivery, and a later read reported no connected Facebook page. Do not claim a Facebook post or Marketplace listing is live without its actual returned ID or public URL.

Meta Commerce Manager: https://business.facebook.com/commerce/
Required verification: correct commerce account, catalog ingestion, item review status, shop eligibility, approved customer-facing shop URL, and regional availability. Facebook Marketplace listings and Facebook Shop/catalog publication are separate outcomes.

## Suppliers, payments, and other blockers

- Intended Zendrop store ID 3606905. Unwanted second Zendrop store ID 3591369; only this extra store may be deactivated with the user's prior authorization. No deletion has been verified.
- Three jewelry imports are linked: ring catalog 2857306/import 63443827; cross 2815656/import 63443910; prayer 2766825/import 63443969. Physical stock and current supplier cost remain to be checked.
- Last verified Zendrop billing methods were empty; automatic and daily fulfillment were disabled. No supplier payment method or new subscription should be invented.
- Stripe merchant account is not automatically a spendable supplier payment card. No external supplier payment capability or funded issuing card is verified. Financial/identity confirmation must be completed through secure provider controls, never by sharing card numbers or secrets in chat.
- Existing archived products must not be blindly restored. The user authorized sourced merchandise again, but each item needs real sourcing, destination eligibility, costs, images, variant mapping, and fulfillment checks.
- Do not cancel Osco/Indexync or any other subscription without an explicit identified cancellation request.

## Next execution order

1. Save every meaningful implementation as a commit or checkpoint before moving to the next long task.
2. Replace the marketplace's homepage-only product actions with verified direct product links, preserving the existing page style and unrelated AI platform code. Validate and commit.
3. Verify public site response/deployment and distinguish GitHub commit success from actual Cloudflare deployment.
4. Inspect real Meta catalog/shop status through an authorized available integration; do not infer approval from Shopify publication.
5. Complete the first real Printful product using approved artwork and production mapping, then confirm landed cost, shipping, billing and safe retail price before activation. Repeat for the remaining drafts.
6. Reconcile supplier inventory and payment readiness; only expand US sourced products with verified fulfillment and margins. PH stays POD-only.
7. Test the buyer workflow and order routing using an authorized safe test; avoid placing real orders or incurring charges just to claim completion.

User constraint: no desktop browser installation, Opera requests, or computer storage workarounds. Use connected tools and iPhone-only steps only for genuinely nondelegable interactions. Routine account configuration and development are authorized without repeated permission requests.