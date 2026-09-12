# Product Boundary Locks

Updated: 2026-09-12

This repository has three protected product surfaces that may be improved or repaired without silently collapsing into one another:

1. **Standalone Magnanimous AI™** — `/magnanimous`
2. **I AM Magnanimous Way™ platform** — the full application and authenticated business workspace
3. **God Matters Shopify/store integration** — `/shop` plus the connected Shopify integration

## Standalone Magnanimous AI contract

The standalone AI must remain a distinct public interface centered only on Magnanimous AI.

Protected invariants:

- `/magnanimous` remains public and canonical.
- The standalone interface keeps its own shell and metadata.
- The main platform shop button, platform global tools, business-identity chrome, and ads stay hidden in standalone mode.
- The standalone interface continues to use the central Magnanimous health and chat runtime.
- Guest access remains available, with sign-in available for persistent memory and connected-account work.
- Third-party AI provider/model names and `execution engine` labels must not become customer-facing standalone UI.
- Shopify/store UI must not be inserted into the standalone AI surface.

Implementation details may change when they improve reliability, speed, capability, accessibility, security, privacy, or usability, as long as these invariants remain intact.

## Main platform contract

The full platform must remain distinct from the standalone AI shell.

Protected invariants:

- Core public, account, workspace, connection, commerce, Bible Study, pricing, and owner routes remain present.
- Platform chrome, global tools, and interaction-clarity protections remain mounted on the full platform.
- The standalone document mode applies only to `/magnanimous` and its descendants.
- The God Matters marketplace remains available from the platform.
- The main platform must not accidentally become the standalone AI page.

## God Matters Shopify/store contract

The connected commerce identity is **God Matters**, with the protected Shopify store domain:

`https://puso-iam.myshopify.com`

Protected invariants:

- `/shop` remains the God Matters marketplace route.
- Store calls-to-action remain wired to the protected Shopify domain unless the owner deliberately changes the store identity/domain and updates this contract at the same time.
- Shopify secrets remain server-side and must not be embedded in frontend source.
- The server-side Shopify credential group remains registered.
- Connected-assistant Shopify GraphQL support remains present for product, order, and customer reads.
- External Shopify links retain opener protections.

## Enforcement

`qa/scripts/product-contract-locks.mjs` enforces source-level product boundaries.

`qa/tests/product-boundaries.spec.ts` enforces browser-visible separation for the standalone AI, the full platform, and the store route.

`.github/workflows/full-platform-qa.yml` runs these locks on pushes, pull requests, manual QA runs, and the scheduled daily QA run. A contract regression fails Full Platform QA and opens/updates the automated QA regression issue. A healthy `main` run closes a stale automated regression issue.

## Change policy

These locks are **non-regression contracts, not a ban on development**. Code may be changed to improve the product or fix defects. A protected invariant should only be changed intentionally, with the corresponding contract and documentation changed in the same deliberate update.

GitHub repository rulesets are a separate repository-administration layer. The QA locks make regressions visible and fail CI, but a repository ruleset requiring Full Platform QA is the additional control that prevents an administrator from bypassing the check when merging protected branches.
