# Magnanimous Travel — No-Charge Sandbox Lab

Date: 2026-10-14

## Purpose

Give the owner a complete hotel search → prebook → simulated booking path that can be exercised without enabling a real booking, attaching a production card, using wallet/credit balance, or opening a production-charge route.

## Legitimate free path

LiteAPI / Nuitee Connect currently documents a free sandbox key obtained after account signup with no credit card required to get started. Its sandbox can exercise search, prebook and booking simulation. LiteAPI documents `ACC_CREDIT_CARD` as the sandbox method that can simulate a booking without a real charge, and states that production requires a production key/payment setup.

Official references verified 2026-10-14:

- https://docs.liteapi.travel/docs/getting-a-sandbox-key
- https://docs.liteapi.travel/docs/booking-a-room
- https://docs.liteapi.travel/reference/post_rates-book
- https://docs.liteapi.travel/docs/account-credit-card

This is the allowed cost-saving path. It is not a bypass of production billing or supplier authorization.

## Magnanimous implementation boundary

The production Worker already enforces:

- sandbox key prefixes only (`sand_` / `sandbox_`)
- owner-only sandbox routes
- no production booking path in the sandbox adapter
- no wallet or credit-balance use
- payment SDK disabled for sandbox prebook
- no card number, CVV, expiry, billing, wallet, credit or transaction fields accepted from the client
- backend-only injection of `payment.method = ACC_CREDIT_CARD` for sandbox simulation
- confirmed supplier `prebookId` required before prebook success
- confirmed supplier `bookingId` required before simulated booking success
- HTTP 410 preserved for stale/expired booking attempts
- bounded supplier response size and timeout behavior
- `real_charge_allowed:false`, `production_enabled:false`, `booking_enabled:false`, `payment_enabled:false`

## Owner UI added

The Travel Agency page now exposes an owner-only **NO-CHARGE HOTEL SANDBOX LAB** that:

1. Reads sandbox readiness.
2. Searches sandbox hotel rates.
3. Extracts returned offer IDs for selection.
4. Prebooks only the selected sandbox offer.
5. Requires a confirmed prebook ID before the simulated booking step.
6. Collects only guest/holder identity fields required by the sandbox booking contract.
7. Sends no payment details from the browser.
8. Shows the confirmed sandbox booking ID only when the supplier returns one.

The UI explicitly labels the boundary: no real charge, no real reservation, no payment SDK, owner only, production disabled.

## ApiVault usage

ApiVault.dev remains discovery-only for I AM MAGNANIMOUS WAY™. The historical ApiVault repository used for this project is licensed CC BY-NC-ND 4.0, so Magnanimous does not copy its source code or catalog into the commercial platform. Candidates discovered there are independently checked against official provider documentation and terms before any adapter is implemented.

The stronger long-term strategy remains:

- use native/open-source logic where possible;
- use official government/open-data APIs for read-only intelligence;
- use free official sandboxes for transaction-flow development;
- keep paid/production supplier activation fail-closed until written pricing, terms, authorization and owner approval are present;
- never fabricate live inventory, pricing, booking authority, carrier authority or payment success.

## Regression lock

`qa/scripts/magnanimous-travel-no-charge-sandbox-ui-lock.mjs` is wired into the Native-First Brain Lock. It fails CI if the no-charge UI disappears, if sandbox routes lose expected boundaries, if the browser begins collecting payment fields, if production key prefixes are accepted, or if supplier confirmation IDs / 410 preservation / no-charge flags are weakened.
