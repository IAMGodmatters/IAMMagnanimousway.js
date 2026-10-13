# Magnanimous public API finish — 2026-10-14

This checkpoint completes the next production-hardening wave of the API Vault discovery-only work. API Vault source/catalog material is still not copied or derived. Provider integrations are implemented independently against official public contracts.

## Added sources

- FederalRegister.gov public REST API: regulatory-document discovery with an explicit verify-against-official-edition boundary.
- NASA EONET v3: bounded natural-event situational awareness with an explicit non-emergency boundary.
- U.S. Treasury Fiscal Data: Debt to the Penny, preserving currency amounts as decimal strings so values above JavaScript safe-integer precision are not corrupted.

The U.S. Census API remains disabled. Official documentation describes a no-key allowance, but a live ACS probe on 2026-10-14 returned a Missing Key page. Magnanimous records that discrepancy instead of pretending the integration is ready.

## Reliability hardening

- Signed-in access and GET-only behavior remain mandatory.
- Fixed provider hosts only; redirects remain rejected.
- 9-second provider timeout and 1.5 MB streamed response cap remain enforced.
- Bounded per-isolate provider cache (160 entries) reduces repeated public-provider calls.
- Concurrent identical GETs are coalesced so one provider request can satisfy duplicate in-flight lookups.
- Per-user/per-route per-isolate burst guards reduce accidental request storms; the MDN owned-domain scan is restricted more aggressively.
- `/api/public-data/health` exposes non-secret, current-isolate cache/provider health diagnostics.
- `/api/public-data/capabilities` reports the resilience controls.

These controls are intentionally described as per-isolate rather than global. They improve resilience without falsely claiming distributed global throttling.
