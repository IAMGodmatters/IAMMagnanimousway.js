# Magnanimous Studio Tools — SaaS integration

## Customer-facing route

- Route: `/studio-tools`
- Brand: I AM MAGNANIMOUS WAY™
- Product nickname: Studio Tools
- Canonical URL: `https://iammagnanimousway.com/studio-tools`

## What it does

Studio Tools provides a signed-in workspace for tasks, notes, planning items and habits. It is intended to be available on desktop and mobile and to follow the customer between devices after sign-in.

## Storage and isolation

The frontend uses the existing authenticated Operations API. It creates or reuses a workspace of kind `personal-tools` and a board of kind `personal-tools`, then stores items as tenant-scoped Operations records. The Worker Operations runtime resolves the authenticated user and derives the tenant from that user; all workspace, board and record reads/writes are scoped to that tenant. The browser does not submit a tenant ID.

## Pricing

No new Stripe product, price, or paid infrastructure is introduced by this feature. Keep the basic tools available in the existing free-first platform. If premium limits are later added, use the existing platform billing and entitlement system, disclose limits before checkout, and do not alter existing plan prices without a separately approved business decision.

## Current boundaries

- The first integrated release covers tasks, notes, planner entries and habits.
- Calculator, converters, JSON formatter, text tools, backup/restore and focus timer from the standalone Preact app are not yet migrated into this route.
- The app requires an authenticated Magnanimous account and the existing Operations API / D1 database.
- Verify cross-tenant isolation, mobile behavior, auth expiry, and persistence with two separate test tenants before production release.


## Talking Recorder and narration

The Studio Tools workspace includes a browser-based microphone recorder, editable transcript, in-browser audio playback and download, and spoken read-back using the device's available speech synthesis voices. Microphone access is permission-gated. Transcript and recording metadata are saved through the authenticated tenant-scoped Operations API. In this initial free-first version, the raw audio remains on the device until downloaded; it is not represented as cloud-synced audio. Browser speech recognition and voice quality vary by device and browser. The canonical public route is `/studio-tools/` (the platform's static export uses trailing-slash routes).
