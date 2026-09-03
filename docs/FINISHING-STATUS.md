# I AM Magnanimous Way — Final Hardening

This file tracks the remaining production-hardening work for Magnanimous AI. The authoritative deployment branch is `main`.

## Required before calling the platform fully finished

- Enforce paid-tier entitlements and direct variable-cost ceilings server-side.
- Prevent duplicate Stripe subscriptions and map subscription price IDs back to plans.
- Route paid-plan changes safely through Stripe Customer Portal or subscription update logic.
- Record premium AI, carrier calling, avatar, and premium video direct variable cost before allowing further owner-funded spend.
- Keep free-first providers available without requiring paid inference.
- Finish canonical Magnanimous admin-token migration while retaining temporary Odin compatibility only where required.
- Verify production deployment and public health endpoints from the exact final release commit.

No document in this repository should claim guaranteed profit. The platform targets at least 20% gross margin through usage controls, pricing, free-first routing, and spend ceilings.