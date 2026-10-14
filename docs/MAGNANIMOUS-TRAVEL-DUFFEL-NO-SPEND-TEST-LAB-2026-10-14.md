# Magnanimous Travel — Duffel No-Spend Flight Test Lab

Date: 2026-10-14

## Purpose

Add a legitimate, provider-documented air-travel development path that lets the owner exercise flight search and an unpaid hold-order flow without opening live ticketing, sending a payment, using provider balance funds, or claiming production authority.

## Official provider facts verified 2026-10-14

Duffel documents **Test mode** as a sandbox where developers can build and test without the risk of spending money or booking unwanted live flights. Test access tokens begin with `duffel_test_`, and test resources are isolated from live-mode resources.

Duffel also documents hold orders: when an offer reports `payment_requirements.requires_instant_payment = false`, an order may be created with `type = hold` and without sending payments at order creation. A held order still does not become permission for Magnanimous to sell live travel; production authority remains a separate provider/commercial gate.

Official references:

- https://duffel.com/docs/api/overview/test-mode
- https://duffel.com/docs/guides/getting-started-with-flights
- https://duffel.com/docs/guides/test-your-integration
- https://duffel.com/docs/api/orders/create-an-order
- https://duffel.com/docs/guides/hold-orders-and-pay-later

## Magnanimous fail-closed boundary

The no-spend adapter and owner UI enforce:

- only `duffel_test_...` credentials are accepted by the test lab;
- the test lab rejects live-mode offers and live-mode order responses;
- test search and hold routes are owner-only;
- no instant order is created;
- no `payments` array is sent;
- no payment intent is created;
- no balance amount, card data, wallet data or transaction reference is accepted or sent;
- an offer is re-read from Duffel immediately before a hold;
- only offers explicitly reporting `requires_instant_payment === false` can proceed;
- expired offers fail with a non-success response;
- supplied passenger IDs must match the selected test offer when Duffel supplies the expected IDs;
- success requires a confirmed non-live Duffel order ID;
- supplier responses are bounded and time-limited;
- normal Magnanimous live flight search refuses a `duffel_test_...` credential and does not count it as a live source;
- normal booking/ticketing remains authority-gated through the Magnanimous reservation service.

## Owner UI

The Travel Agency page now contains a **NO-SPEND FLIGHT TEST LAB** beside the existing LiteAPI hotel sandbox lab. It provides:

1. Duffel test-mode readiness.
2. Test flight search.
3. Display of only test offers.
4. Selection of only offers that can be held without instant payment.
5. Passenger identity fields tied to Duffel's returned test passenger ID.
6. Creation of an unpaid **test-mode hold** only.
7. Display of a confirmed test order ID after Duffel returns it.

The UI labels the boundary explicitly: **NO REAL BOOKING**, **NO PAYMENT SENT**, **TEST TOKEN ONLY**, **OWNER ONLY**, and **LIVE TICKETING LOCKED**.

The default JFK → EWR route is used because Duffel's testing documentation includes deterministic scenarios around test-mode order behavior. It is a developer test path, not a customer booking recommendation.

## Credential use

The existing platform credential field `DUFFEL_ACCESS_TOKEN` can hold a Duffel developer test token while Magnanimous is in supplier test/onboarding mode. The no-spend lab requires the `duffel_test_` prefix. The normal live flight path explicitly refuses such a token, preventing test inventory from being represented as live supply.

If/when Duffel production access is commercially approved, the live credential must be treated as production supplier authority and must not be used by these sandbox endpoints. Live ticketing remains closed until all supplier, settlement, fraud, refund, commercial, and owner-approval gates are satisfied.

## Historical Magnanimous rules preserved

This implementation follows the standing travel architecture established in September–October 2026:

- supplier true cost stays private;
- Magnanimous applies its owner/source margin;
- approved resellers may add their own markup;
- 'lowest verified' is claimed only when fresh, bookable evidence supports it;
- supplier onboarding remains contact → sandbox → certification → commercial approval → credentials → production → LIVE;
- no fake inventory, fake booking authority, fake payment success or unverified supplier pricing;
- free/native/sandbox routes are preferred before paid provider activation;
- ApiVault.dev is discovery-only and never a substitute for provider credentials, licensing or official documentation.

## Regression lock

`qa/scripts/magnanimous-travel-duffel-test-lock.mjs` is wired into the Native-First Brain Lock. CI fails if test tokens can leak into live search, owner-only test routes disappear, instant/payment paths appear, test/live isolation is weakened, test-order confirmation is no longer required, or the UI loses its no-spend safety boundary.
