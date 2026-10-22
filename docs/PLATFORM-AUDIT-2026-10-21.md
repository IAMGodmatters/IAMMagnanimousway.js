# Platform integrity audit — 21 October 2026

Status: IN PROGRESS. This is a resumable checkpoint, not a completion certificate.

Baseline: main 1c9d35a7ad0802a91100d2042e57bc49348633fd (PR #729).

Verified:
- Repository fetched from current main, preserving existing functionality.
- Production homepage responded HTTP 200 with text/html on 21 October 2026.
- GitHub deployment run 39544255735 reports success for the baseline SHA.
- Surface audit run 39424042605 and production verification workflows report success for that SHA. Their assertions still require review; green workflow status alone does not establish every feature works.

Audit scope: route and control inventory; real versus simulated execution; authentication and tenant isolation; payments/consent/cost protection; tools/skills/providers; mobile accessibility; deployment parity.

Pending: inspect coverage of existing tests, run available checks, repair verified defects, publish reviewed changes and verify production. Do not claim comparative superiority or universal readiness without evidence. No spending or customer communications are authorized by this audit.

## Checkpoint 2 — source, build and browser checks

- Frontend installation, TypeScript check and production build passed.
- Source interaction scan: 207 source files, 140 routes, 750 literal links, 676 buttons. This checks syntax and handler presence, not successful execution.
- Built surface scan: 211 source files, 143 HTML files, 142 generated routes, 1,065 internal links, 46 external anchor occurrences, 464 rendered buttons, 157 images; zero errors or warnings. External destinations were not verified by this static scan.
- Browser: homepage rendered; sidebar collapse changed its state; CRM navigation redirected a signed-out visitor to `/login/?returnTo=%2Fcrm`.
- Existing payment safety suite passed 26 assertions. Payment-reference signatures, webhook replay/idempotency, password hashing, opaque downstream sessions, billing-plan alignment, payment consent, proprietary security invariants, and Orca execution-security checks passed. These are source/local tests, not evidence of a real paid checkout or carrier call.
- Native skill compatibility tests passed. Source inventory contains 30 built-in instructional skills and 92 Capability Mesh routes. The integration catalog has 68 targets and 255 capability targets. The September 19 snapshot contains 867 external skill descriptions across 109 namespaces; it explicitly does not establish authorization or copied implementations. None of these inventory counts certifies live execution.

## Repairs in PR #730

- Homepage probes reject failed HTTP responses and malformed JSON, avoid stale cache, abort after ten seconds, and require a nonempty tool catalog.
- Homepage status reports health/catalog reachability only; it no longer claims all systems are ready.
- Shared sidebar and customer sign-in no longer display hard-coded all-systems-operational, AI-active or network-active claims.
- Five regression tests pass, including HTTP failure, invalid payload, timeout, success, and public-copy integration. They are included in the surface audit workflow.
- Existing mobile/home artwork integrity tests pass; navigation and artwork are preserved.

## Remaining verification boundaries

- The authenticated owner/customer workspaces are not signed in in this audit browser. Every private button, tenant-specific connection, memory action, media generation, and paid fulfillment still requires authenticated execution evidence.
- The existing deep-control test samples at most twelve non-consequential buttons per route. It does not exercise every button. Source scans and green workflows cannot substitute for that missing coverage.
- Existing visual-provider verification tests configuration and authentication denial, not actual rendered output. Do not present its success as video/image quality certification.
- Device-dependent tools need the paired Local Bridge and actual device. The Samsung skill names Local Bridge operations in metadata; these are not direct Capability Mesh route names.
- Regulatory, funding, consent and provider authorization gates remain intact. No claim is made that gated telecom or other external services are active.
- Comparative superiority has not been benchmarked. No universal readiness certification is issued.

## Checkpoint 3 — live read-only HTTP sweep

All 140 source page routes returned successfully in a 148-request GET sweep. Public health, tools, provider catalog and visual-provider catalog returned JSON HTTP 200. Unauthenticated `auth/me`, public-data health and Capability Mesh catalog returned HTTP 401; admin settings returned HTTP 403. Full per-route evidence is in `artifacts/audit-readonly-2026-10-21.json`.

The visual-provider response declares two of six entries configured: the cinematic fallback and native procedural scene renderer. Local generative image, legacy FLUX, visual-director and paid video entries are disabled/unconfigured. This is explicit evidence against claiming every provider is live. Do not enable paid providers or pretend procedural scene rendering proves generative-image/video capability.

The public `/health` response explicitly bypasses database bootstrap and is database-independent. Its success must not be represented as proof of database, billing, memory or tenant health.

PR #730 saves the implementation and evidence. Merge, deployment and post-deployment verification must be recorded separately; this document does not predeclare those outcomes.

## Checkpoint 4 — pricing interaction and accessible labels

The live pricing page disclosed recurring billing and displayed unchecked plan-specific consent. Selecting CRM Pro changed the selected terms and price to $79/month without accepting an agreement or initiating payment. The generated tooltip incorrectly retained the previous Business terms label/destination, also observed after collapsing the home sidebar. Fixed the shared InteractionClarity helper to refresh its generated titles when labels, text or destinations change, preserve author-provided titles, and stop copying visible button text into a permanent aria-label. Typecheck and interaction scan passed after this repair; post-deployment browser verification is still required.
