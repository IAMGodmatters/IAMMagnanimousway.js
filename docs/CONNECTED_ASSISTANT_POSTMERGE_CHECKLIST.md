# Connected Assistant post-merge verification checklist

After merge to `main`:

- confirm the deployment workflow used the merged commit;
- confirm frontend build/typecheck passed;
- confirm Worker syntax/build passed;
- confirm consequential-action locks passed;
- confirm production `/assistant-actions` remains authenticated/private;
- confirm a read-only action can complete without a write approval;
- confirm a write preparation returns `needs_confirmation` and does not execute;
- confirm the separate approval endpoint executes an unexpired action;
- confirm reuse after completion is rejected;
- confirm expired approval is rejected;
- confirm non-creator/non-owner approval is rejected;
- do not claim production complete until logs/smoke tests prove these checks.
