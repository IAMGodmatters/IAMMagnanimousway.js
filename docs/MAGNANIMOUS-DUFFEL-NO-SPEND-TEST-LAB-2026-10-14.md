# Magnanimous Travel — Duffel No-Spend Flight Test Lab

Date: 2026-10-14

## Purpose

Provide the owner a legitimate, provider-supported flight-development path that can search and create unpaid **test-mode hold orders** without spending money, touching live flight inventory, attaching payment instruments, or weakening Magnanimous production booking gates.

## Official provider facts verified on 2026-10-14

Duffel's official documentation says:

- Developer **test mode** is a sandbox with no danger of spending money or booking unwanted flights.
- Test access tokens begin with `duffel_test_`.
- A test token can access only test-mode resources; a live token can access only live-mode resources.
- Hold-capable offers explicitly report `payment_requirements.requires_instant_payment = false`.
- A hold order is created with `type: hold` and the `payments` key omitted.

Official references:

- https://duffel.com/docs/api/overview/test-mode
- https://duffel.com/docs/guides/holding-orders-and-paying-later
- https://duffel.com/docs/api/orders/create-order

## Magnanimous implementation

### Backend adapter

`worker/src/magnanimous-travel-duffel-sandbox.js`

The adapter:

- accepts only tokens beginning with `duffel_test_`;
- rejects live Duffel tokens before any network request;
- bounds upstream response size and timeout;
- validates search slices, passengers, airport codes and cabin class;
- rejects any live-mode data returned into the test path;
- exposes only test offers;
- marks an offer holdable only when Duffel explicitly returns `requires_instant_payment === false`;
- re-fetches the selected offer before hold creation;
- rejects instant-payment offers;
- rejects expired offers;
- requires the submitted passenger IDs to match the selected Duffel test offer;
- creates only `type: hold` orders;
- sends no `payments` key, no card, no balance instruction, no payment intent and no production credential;
- reports success only after Duffel returns a non-live test order ID.

### Owner-only API routes

The Travel Agency runtime exposes:

- `GET /api/travel-agency/sandbox/duffel/status`
- `POST /api/travel-agency/sandbox/duffel/search`
- `POST /api/travel-agency/sandbox/duffel/hold`

All three routes require an authenticated Magnanimous owner session.

The status route activates only if the existing `DUFFEL_ACCESS_TOKEN` value is a Duffel developer test token. If the configured token is live, this lab remains locked.

### Owner page

`/travel-agency/duffel-test`

The page allows the owner to:

1. Verify whether a Duffel test token is configured.
2. Search test-mode flight inventory.
3. See which returned offers are eligible for an unpaid hold.
4. Select a hold-capable offer.
5. Supply only passenger identity/contact fields.
6. Create an unpaid Duffel test hold.
7. See the confirmed test order ID, test booking reference and payment deadline when returned.

The browser contains no card, CVV, balance or payment-intent input.

## Production boundary

This feature does **not** authorize live ticketing. It does not change the existing Magnanimous reservation authority, Stripe/payment protections, owner economics, reseller pricing, supplier onboarding or production credentials.

Live Duffel booking/payment remains outside this lab and must continue through the existing production authority/payment gates.

## Regression protection

`qa/scripts/magnanimous-travel-duffel-no-spend-lock.mjs` executes mocked provider flows and fails if:

- a live token reaches the supplier;
- a leaked live-mode offer is exposed;
- an instant-payment offer reaches order creation;
- a test hold sends a payment key;
- an order is reported successful without a non-live supplier order ID;
- the owner-only routes disappear;
- the dedicated owner page starts collecting payment-shaped inputs.

`.github/workflows/duffel-no-spend-test-lock.yml` runs the safety lock and syntax checks on pushes and pull requests.

## ApiVault / discovery boundary

ApiVault.dev remains a discovery source, not copied commercial source code. Candidates discovered through API directories are independently verified against the official provider's documentation, pricing, licensing and terms before Magnanimous implements them. The Duffel path above is based on Duffel's own official documentation, not on an undocumented billing workaround.
