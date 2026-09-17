# Connected Assistant QA locks

The Connected Assistant is protected by two source-level regression locks:

1. `consequential-actions-lock.mjs` checks the central backend policy, approval lifecycle, owner permission requirements, and cross-layer invariants.
2. `connected-assistant-ui-lock.mjs` checks the private UI for staged-write wording, the separate approval endpoint, confirmation preservation, pending review visibility, and accessibility protections.

These locks complement functional/browser QA. They are intentionally cheap so unsafe UX or approval regressions fail quickly in pull requests.
