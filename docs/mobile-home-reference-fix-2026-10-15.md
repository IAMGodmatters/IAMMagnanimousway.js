# Mobile home reference correction — 2026-10-15

The approved desktop dashboard remains unchanged.

The mobile home now uses a client-mounted, mobile-only dashboard from the root layout so it works with the production static export. This replaces the earlier unsupported Next proxy rewrite approach.

Protections retained:

- desktop dashboard markup and artwork remain unchanged
- mobile-only activation at `/` and widths up to 1024px
- collapsible mobile drawer, search, AI guide, bottom navigation and safe-area handling
- reduced-motion and focus-visible support
- home sponsored advertising and AdSense behavior
- routes for Movie Maker and AI Tools & More remain available
- authentication, Stripe, billing, CRM, Telecom, Kids and all existing business logic are untouched
