# Urgent Security Repair — 2026-10-17

This change set closes security and reliability findings identified after PRs #690, #692, #693, and #694.

Key invariants:

- Telecom campaign execution derives consent, DNC, campaign/member state, calling window, carrier readiness, caller identity, billing-policy readiness, holiday-policy readiness, and jurisdiction-policy readiness from authenticated server state rather than request-supplied compliance booleans.
- Telecom execution leases are signed, bound to authoritative conditions, live-rechecked, and single-use.
- Campaign-like `/api/phone/calls/outbound` requests are intercepted by the telecom safety guard before carrier execution and must pass lease enforcement.
- Provider fallback selection and checkout re-check server readiness; paid checkout atomically reserves quote state and is bounded by quote expiry.
- Provider settlement uses quote-stable idempotency and permits safe retry after upstream failure without paying an already funded quote twice.
- Contact-center tool policy, call-flow validation, office-hours handling, predictive planning, callback planning, reporting, and secret detection are hardened fail-closed.
- Proprietary-source security locks reject narrowed PR triggers, excessive workflow permissions, nested public payloads, public source-like files, alternate public GitHub raw paths, and source-map regressions.

No security check in this repair should be weakened merely to make CI green; failures should be fixed at the underlying runtime or invariant.
