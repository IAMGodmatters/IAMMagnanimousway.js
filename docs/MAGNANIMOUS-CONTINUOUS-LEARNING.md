# Magnanimous AI — Continuous Learning

Magnanimous AI uses an always-on private continuous-learning layer. This is **not** a claim that the external foundation model is retrained every few minutes.

## Schedule

The Cloudflare Worker cron runs a learning cycle every 15 minutes (`*/15 * * * *`). The cycle is database-first and does not call a paid model merely to train.

## What Magnanimous learns from

1. **Explicit approved examples** — a signed-in user can save a prompt and an ideal response in the Training Center.
2. **Explicit corrections/feedback** — 1–5 ratings and corrections become private learning signals; provider-specific ratings can also contribute to outcome scoring.
3. **Execution outcomes** — existing `magnanimous_outcomes` records supply success, quality and latency evidence for provider/workflow selection.
4. **Persistent lessons** — promoted patterns are written to `magnanimous_lessons`, which the existing Magnanimous brain already retrieves for future reasoning.
5. **Private knowledge retrieval** — the existing knowledge and memory layers remain part of the central brain context.

## Promotion gate

Default promotion thresholds are deliberately conservative:

- at least 4 samples,
- at least 75% success rate,
- at least 0.60 average quality,
- evidence within a 30-day user lookback (configurable 7–90 days).

The scheduled learner compares eligible provider/workflow evidence per tenant, user and capability. Only the strongest observed candidate is promoted into an adaptive-routing lesson. New evidence can replace that preference later.

## Tenant isolation

Learning candidates, approved examples, feedback, outcomes and lessons are keyed by tenant and user. Private information from one customer is not used as another customer's private training context.

Scheduled aggregation groups by `tenant_id`, `user_id`, `capability` and `provider`; it never combines raw customer training examples across tenants.

## Secrets

The explicit training endpoint rejects common API-key, bearer-token, password and private-key patterns. Users should still avoid placing credentials or identity documents in training examples.

## APIs

Authenticated routes:

- `GET /api/magnanimous/training/status`
- `GET /api/magnanimous/training/settings`
- `POST /api/magnanimous/training/settings`
- `POST /api/magnanimous/training/teach`
- `POST /api/magnanimous/training/feedback`
- `GET /api/magnanimous/training/export`
- `POST /api/magnanimous/training/run` — owner only

The UI lives at `/magnanimous-training`.

## Fine-tuning boundary

Approved examples can be exported as JSONL in chat-message format. That export is a curated dataset artifact for evaluation or a future fine-tuning workflow.

No scheduled cycle automatically starts a paid fine-tuning job, changes model weights, spends money, or uploads private conversations to a provider. Before a future fine-tuning launch, validate the dataset against the selected provider/model's current fine-tuning requirements, run evaluations, estimate cost, and require owner approval.

## Release rule

A learning release should not be called verified until:

- frontend production build passes,
- Worker syntax/build checks pass,
- D1 migrations apply successfully,
- unauthenticated training APIs reject access,
- normal platform QA remains green,
- production deployment succeeds,
- at least one scheduled/manual learning cycle records a successful run after deployment.
