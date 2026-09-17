# Connected Assistant review workflow — 2026-09-17

Magnanimous AI remains the control, reasoning, orchestration, continuity, and public identity layer. Connected providers remain replaceable adapters.

## Consequential-action contract

1. Choose a connected account.
2. Prepare an action.
3. Read-only actions may execute immediately when the tenant has read permission.
4. Consequential writes are persisted as `needs_confirmation` and do not execute from the preparation request.
5. The user reviews the pending payload.
6. Approval happens through `POST /api/assistant-integrations/actions/{id}/confirm`.
7. Approval expires after 15 minutes.
8. Only the action creator or workspace owner may approve.
9. Permission changes cannot disable separate confirmation for consequential writes.
10. Completion/failure remains auditable.

## UI invariants

The Connected Assistant UI must not say or imply that a staged write was already executed. It must not use same-request confirmation and must not inject `require_confirmation:false`.

The interface exposes an explicit four-step flow: Choose account → Prepare action → Review pending write → Approve & Run. Pending payloads are visible before approval. Read-only actions remain clearly distinct from writes.

## Accessibility invariants

Interactive targets are at least 44px where practical, focus-visible treatment is present, status changes are announced through a live region, controls have labels, and the workflow does not depend on drag-only interaction.

## Regression locks

`qa/scripts/consequential-actions-lock.mjs` validates the backend and cross-layer policy contract.

`qa/scripts/connected-assistant-ui-lock.mjs` validates the Connected Assistant UI contract.

Both run in `.github/workflows/consequential-actions-lock.yml` for pull requests to `main` and pushes to `main`.
