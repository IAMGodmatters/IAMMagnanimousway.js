# Magnanimous Universal App Fabric — 2026-09-22

## What changed

Magnanimous AI now has one native capability fabric that joins the platform's already-absorbed connector contracts, ChatGPT-visible plugin tool contracts, installed skill contracts, native build targets, and real tenant connection records.

The fabric does **not** copy proprietary provider implementations. It absorbs observable capability shapes, public contracts, open standards, user-authorized workflows, and measured outcomes into provider-neutral Magnanimous specifications.

## One brain, many execution rails

Magnanimous AI remains the owner of:

- intent understanding and planning;
- policy and permission decisions;
- memory and workflow state;
- tool/capability selection;
- result normalization;
- verification and failure recovery;
- outcome learning.

Outside services remain replaceable rails when the real world requires them: OAuth authorization, live account data, provider-side delivery, regulated networks, proprietary compute, or external repository/hosting accounts.

## Unified connection truth

The fabric reads the platform's two existing tenant-scoped connection stores:

1. `integrations` — Gmail, Meta, X, Outlook, Slack, commerce and other connected-account adapters.
2. `social_connections` — first-party social publishing authorization for YouTube, TikTok and LinkedIn.

This fixes an important visibility gap: LinkedIn publishing was already implemented natively under `/social-connect`, but it could be invisible to the broader Magnanimous capability mesh because it lived in a separate connection store.

Plugin visibility is never treated as account authorization. A connection is reported only when a tenant-scoped connection record actually exists.

## New Capability Mesh routes

The owner-only Capability Mesh now exposes:

- `apps.summary` — summarized absorbed capability and connection state.
- `apps.catalog` — filtered/paginated provider-neutral capability specifications.
- `apps.resolve` — ranked capability matching for a natural-language goal.
- `connections.summary` — normalized real connected-account state.
- `social.connections` — first-party social connection status.
- `social.linkedin.publish` — direct LinkedIn publishing through the existing first-party LinkedIn adapter.
- `social.tiktok.publish` — direct TikTok publishing through the existing adapter.
- `social.youtube.publish` — direct YouTube publishing through the existing adapter.

Publishing routes require an explicit `confirm:true` at the Magnanimous mesh boundary, then reuse the existing provider-specific consent and authorization checks. The router does not bypass platform safeguards or claim success when a provider rejects the action.

## LinkedIn independence

Magnanimous does not need Post Bridge to publish a LinkedIn member post when the platform's own LinkedIn developer app and member OAuth connection are configured.

The existing first-party path remains:

- OAuth: `/api/social-connect/linkedin/start`
- Connection state: `/api/social-connect/connections`
- Publish: `/api/social-connect/linkedin/publish`

The Universal App Fabric makes that existing capability visible to the Magnanimous brain instead of duplicating it.

## Truth and safety invariants

- No proprietary source code, hidden prompts, model weights, credentials or private provider internals are copied.
- A learned capability specification is not labeled native until implementation/runtime evidence exists.
- A visible plugin does not imply a connected account.
- External writes require real authorized account rails and confirmation.
- Provider failures are reported as failures; no false success states.
- Magnanimous remains provider-neutral and native-first.
