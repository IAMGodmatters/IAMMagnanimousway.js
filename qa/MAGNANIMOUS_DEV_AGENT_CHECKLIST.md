# Magnanimous Dev Agent review checklist

- [x] Magnanimous remains the brain and public identity.
- [x] Codex is not required by the runtime.
- [x] Production still enters through `security-entrypoint.js`.
- [x] Developer APIs require platform-owner authorization.
- [x] Repository scope is allowlisted.
- [x] Credentials stay server-side.
- [x] Repository writes stage as `needs_confirmation`.
- [x] Approval is a separate request and expires after 15 minutes.
- [x] Merge has an independent hard lock.
- [x] Tool Foundry receives reusable engineering skills.
- [x] Frontend typecheck/build and Worker syntax checks pass on branch.
- [ ] Exact-head PR CI passes.
- [ ] Main deployment and production smoke pass after merge.
- [ ] Repository write authorization is configured and separately smoke-tested before write automation is called active.
