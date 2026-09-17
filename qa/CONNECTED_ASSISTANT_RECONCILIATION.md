# Connected Assistant reconciliation test matrix

- Read-only actions: allowed to execute immediately when read permission is enabled.
- Consequential writes: must return `needs_confirmation` from the preparation request.
- Same-request `confirm:true`: rejected by central policy.
- Permission update with `require_confirmation:false`: rejected by central policy; UI always sends `true`.
- Pending write review: payload is visible before approval.
- Approval: only through `/api/assistant-integrations/actions/{id}/confirm`.
- Approval age: expires after 15 minutes.
- Approver: action creator or workspace owner only.
- Completion: result shown only after read execution or approved write completion.
- UI wording: no `EXECUTE NOW`, no `AUTOMATIC ACCESS`, no immediate-send claim for staged writes.
- Accessibility: labeled inputs, live status region, focus-visible controls, 44px minimum target treatment.
