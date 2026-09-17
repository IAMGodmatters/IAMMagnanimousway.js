# Full Platform Audit Addendum — 2026-09-17

This addendum records post-merge reconciliation work after PR #59 and stacked PR #60 reached `main`.

## Connected Assistant finding

The central backend policy already staged consequential connected-account writes and required a separate confirmation request, but the current `frontend/app/assistant-actions/page.tsx` still presented the older immediate-execution UX. It also attempted to send `require_confirmation:false` when updating permissions.

That mismatch is corrected on the follow-up hardening branch:

- read-only operations remain immediate;
- consequential writes are prepared and visibly enter `needs_confirmation`;
- pending payloads are displayed for review;
- approval uses the separate `/actions/{id}/confirm` endpoint;
- the UI no longer claims a staged email/post/message was already sent;
- permission updates keep `require_confirmation:true`;
- 15-minute approval expiry is surfaced to the user;
- keyboard focus, live status messaging, labels, and minimum target sizing were strengthened;
- regression locks now cover both backend policy and the UI contract.

## Remaining audit work

Continue tenant-isolation review, D1 indexing/retention/PII review, owner/admin mutation endpoint review, legacy-token verifier retirement planning, and dormant auto-consent cleanup only after central enforcement remains proven in production.

No provider entitlement, license, paid product, carrier authority, or external account capability should be claimed active without runtime evidence.
