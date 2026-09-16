# Magnanimous Release Hardening Audit — 2026-09-16

## Decision

Do not add another provider/capability until the current stacked release is hardened and merged in order.

1. Stabilize and merge PR #51 into `main` only after its current head is green.
2. Update/rebase PR #52 onto the new `main` and rerun every capability and platform-wide check.
3. Do not treat a capability registry as equivalent to a fully wired execution adapter.
4. Preserve all existing working features; hardening should be additive unless a security or correctness fix requires otherwise.

## Architecture that is correctly preserved

- Magnanimous AI remains the brain, memory, reasoning, orchestration and decision layer.
- External providers remain replaceable internal adapters.
- Magnanimous Telecom remains the retail provider identity and is not a white-label/reseller/subcarrier product.
- God Matters is the owner identity without trademark styling; I AM MAGNANIMOUS WAY™ remains the affiliated trademarked brand.
- Consequential provider purchases, regulated telecom actions, satellite flight commands and other sensitive writes remain gated.

## High-priority hardening findings

### P0 — QA gate was testing undeployed PR routes against production

The Full Platform QA workflow uses `https://iammagnanimousway.com` while discovering routes from the pull-request source tree. A newly added route could therefore fail with a production 404 before it had any chance to be deployed.

Action applied on PR #51:
- fetch `origin/main` as the deployed-route baseline during pull-request browser QA;
- allow a 404 only when the route is provably new relative to `main`;
- keep existing production routes subject to the same 404/runtime checks;
- keep the frontend production build as a required branch validation.

The owner-promo QA check was also hardened so multiple valid links to the same Amazon book URL do not cause Playwright strict-mode failure.

### P1 — Telecom charging integrity still needs a second hardening pass

Before treating the BSS charging ledger as production-grade financial accounting:
- move monetary ledger precision away from floating-point `REAL` toward integer minor units/micros;
- make balance decrement + reservation creation atomic under D1-supported transaction/batch semantics;
- add expired-reservation reconciliation/sweeping;
- enforce shared-balance member spend limits;
- complete daily unit/spend limit enforcement.

The current safety gates and idempotency controls are useful, but they do not eliminate these accounting-integrity risks.

### P1 — Mux credential ownership is partially duplicated

The platform already has a central encrypted `platform_credentials` vault and `provider-runtime-env` support for Mux token ID/secret. PR #52 also adds a Mux-specific credential helper that reimplements vault cryptography/audit behavior.

Follow-up:
- expose Mux fields through the central owner credential group;
- keep one canonical encryption/audit implementation;
- make any Mux-specific helper a thin adapter/status layer rather than a second credential system.

### P1 — PR #52 is a stacked release, not an independent release

PR #52 is based on the PR #51 branch. Its correct release path is:

`main` <- PR #51 <- PR #52

After PR #51 merges, PR #52 must be updated/rebased/retargeted to `main` and all checks rerun against the new base before merge.

### P2 — Capability maturity is intentionally uneven

- Space: owner-only control plane with purchase/flight-command locks; planning/readiness is wired, real spacecraft actions are not.
- Twilio: broad capability registry plus existing communications integrations; the new absorption layer is primarily a knowledge/capability catalog rather than one new universal write API.
- SciSpace: normalized research/evidence architecture; proprietary corpus is not copied.
- Meta: owner-only capability/readiness layer preserves existing Facebook/Instagram/WhatsApp action rails.
- WhatsApp: dedicated control plane plus repaired `send_messages`/`send_message` compatibility; protected existing send path remains authoritative.
- Mux: owner-only control plane/read probe, normalized state and provider-write gates; existing FFmpeg renderer preserved and automatic Mux publishing removed.

This distinction should remain visible in documentation and QA so the platform never claims an execution capability merely because its schema/registry exists.

### P2 — Telecom identity coverage

The shared `/telecom` layout covers nested `/telecom/*` routes. `/telecom-standalone` is a sibling route and does not automatically inherit that ownership/affiliation banner. Add explicit identity coverage there if the same public ownership statement is required on every telecom surface.

## Release gate

A release is ready only when:

- PR-specific capability checks are green;
- Full Platform QA is green for the current head or any remaining failure is proven unrelated and corrected at the test-design level rather than bypassed;
- migration scripts execute successfully in SQLite/D1-compatible validation;
- secrets/provider identities are not exposed publicly;
- paid, destructive, regulated and security-sensitive actions remain confirmation/permission gated;
- stacked PRs are merged in dependency order and retested after rebasing.

## Suggested action

**Release Hardening Gate:** finish PR #51 first, then rebase PR #52, centralize Mux credentials, harden Telecom ledger atomicity/precision, rerun full QA, and only then merge/deploy the provider-absorption stack.
