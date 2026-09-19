# Magnanimous Full Plugin + Connector Assimilation — 2026-09-19

## Goal

Make Magnanimous AI own the durable capability model, planning, policy, memory, routing, reusable workflows, verification and learning behind every observable connector, plugin tool and installed skill contract available to the platform, while keeping unavoidable outside accounts and rails replaceable.

This is clean-room capability assimilation. It does **not** copy proprietary provider source code, hidden prompts, private skill implementations, credentials, model weights, restricted datasets or private backend infrastructure.

## Current researched inventory

The 2026-09-19 reconciliation found:

- 13 direct I AM MAGNANIMOUS WAY™ account connector types with official/public API research already recorded.
- 105 plugin/tool namespaces currently visible in the live tool catalog.
- 2,080 live observable plugin tool contracts with concise public purposes captured one by one.
- 109 previously observed plugin namespaces retained for continuity; Plugin Management is a newly live namespace not present in the older snapshot.
- 2,259 previously observed plugin tool contracts retained as historical/continuity knowledge.
- 107 currently visible installed-skill namespaces.
- 855 currently visible installed skill contracts.
- 109 previously observed skill namespaces and 867 skill contracts retained for continuity, including 12 no-longer-visible skill contracts as historical knowledge.
- The combined Magnanimous brain manifest now includes direct connector capability specifications plus the union of current/historical plugin tool contracts and current/historical skill contracts.

Older contracts are not deleted merely because they are not visible in the current session. They remain historical benchmark knowledge but are marked separately from currently visible capabilities.

## One-by-one research sources

### Direct connectors

Direct connectors use official/public provider API documentation where available. The existing research ledger covers Gmail/Google, Facebook, Instagram, WhatsApp, Shopify, Shopee, X, Snapchat, Outlook/Microsoft Graph, Slack, Discord, Telegram and Google Calendar.

### Plugin tools

`worker/src/magnanimous-live-plugin-tool-research-snapshot.js` captures the current live observable tool catalog one tool at a time:

- plugin namespace;
- observable tool/action name;
- concise public purpose;
- explicit no-authorization assumption;
- explicit no-proprietary-implementation-copying boundary.

### Installed plugin skills

`worker/src/magnanimous-live-plugin-skill-research-snapshot.js` captures the current installed skill catalog one skill at a time:

- plugin namespace;
- skill name;
- concise public purpose;
- explicit no-authorization assumption;
- explicit no-private-skill-implementation-copying boundary.

The older skill snapshot is retained so useful historical workflow knowledge is not removed simply because a skill disappears from the current catalog.

## Brain integration

Every retained capability contract is converted into a provider-neutral Magnanimous specification containing:

- intent and outcome;
- native target;
- input/output normalization;
- Magnanimous-owned planning;
- policy and approval boundary;
- memory and reusable workflow ownership;
- result normalization;
- verification requirements;
- failure recovery;
- outcome learning;
- explicit external-only boundary when required.

The full manifest is directly available to Tool Foundry routing through `getConnectorAbsorptionPrompt()`. This means plugin capability knowledge participates in Magnanimous reasoning without requiring the plugin to become the identity or memory owner.

The durable native-first materialization path now uses the **full brain manifest**, not only direct connector capability rows. The same Tool Foundry pipeline therefore supports:

1. direct connector capabilities;
2. observable plugin tool contracts;
3. observable installed skill purposes.

The owner God Coding control uses bounded batches to materialize the multi-thousand-contract ledger safely.

### Automatic production materialization

Production deployment no longer depends on the owner pressing the assimilation button.

Every deployment to `main` now:

1. generates the full provider-neutral manifest from the same connector/plugin/skill registry used by Magnanimous reasoning;
2. rejects capability-key or normalized Tool Foundry name collisions;
3. writes every retained capability into the durable D1 absorption ledger;
4. writes every capability into the global Magnanimous Tool Foundry with its inferred risk level;
5. keeps high-risk capabilities in `review-required` status instead of auto-promoting them;
6. records a SHA-256 digest and exact manifest count in `magnanimous_capability_materialization_state`;
7. queries production D1 and fails deployment unless the expected ledger count, Tool Foundry count, digest and completion state are present.

The deployment materialization is idempotent. Existing proven `ready` Tool Foundry recipes remain `ready`; lower-confidence specs are refreshed from the current manifest without granting new account authorization or bypassing consequential-action controls.

## Capability realization layer

Materialization is not the same as execution. Magnanimous now maintains a separate evidence-gated realization registry for every absorbed capability.

Each capability is classified into one of four states:

- `native-ready` — a Magnanimous-owned runtime surface and concrete internal API route are proven, and no irreducible external boundary is required for the capability class.
- `hybrid-ready` — Magnanimous owns the workflow/runtime layer but a real outside account, live-data source, network/payment rail, repository host, or provider authorization remains necessary.
- `bridge-required` — an external boundary is known, but no complete Magnanimous runtime surface is yet proven for that capability.
- `specified-only` — the provider-neutral behavior contract is understood and stored, but an independent runtime implementation is not yet proven.

Low-risk capabilities are automatically promoted to Tool Foundry `ready` only when the realization registry classifies them as `native-ready`. Medium-risk capabilities remain proposed, and high-risk capabilities remain `review-required`.

Current proven native execution surfaces include Magnanimous Agent Mesh, Workspace Suite, CRM, Data Studio, Evidence Notebook, Knowledge, Work Engine, Professional Workspace, Research, and tenant-owned workspace files. Hybrid surfaces include Unified Inbox/communications, Dev Agent engineering/deployment workflows, Media Library live catalogs, model compute routing, booking/calendar synchronization, social publishing, voice/PSTN calling, billing/payment settlement, and commerce account actions.

Tool Foundry now injects these realization routes into Magnanimous planning so the brain prefers a proven internal route when one exists, preserves external authorization when a hybrid route is required, and never claims `bridge-required` or `specified-only` capabilities are native.

## Native vs bridge boundary

Magnanimous should independently own where practical:

- intent interpretation;
- provider-neutral schemas;
- planning;
- workflow orchestration;
- policy;
- memory;
- reusable skills;
- transformation logic;
- deterministic utilities;
- UI;
- storage under Magnanimous control;
- verification;
- retry/failure recovery;
- outcome learning.

Keep a replaceable bridge where reality is external:

- third-party account authorization;
- private mailbox/calendar/CRM/store data;
- live provider-side writes or delivery;
- payment and banking rails;
- telecom/SMS/PSTN carrier rails;
- social network publishing rails;
- external hosting/deployment accounts;
- fresh provider data that does not belong to Magnanimous;
- proprietary specialized compute that has not been independently reproduced.

A specification is never labeled native merely because Magnanimous learned its observable contract. Native status requires an independent implementation plus runtime/regression evidence.

## Plugin Management addition

The current live catalog exposed Plugin Management after the older tool snapshot was created. Its observable capability family includes:

- inspect plugin permission settings;
- resolve plugin dependencies;
- search the plugin directory;
- suggest plugins;
- uninstall an explicitly selected plugin;
- update plugin permission settings.

Magnanimous assimilates the provider-neutral concepts behind discovery, dependency metadata, permission-policy representation and lifecycle management. Actual ChatGPT plugin installation/uninstallation and platform permission mutation remain external platform actions requiring the real plugin-management rail and its approval rules.

## Verification contract

QA now locks that:

- current live tool research is captured;
- current live skill research is captured;
- Plugin Management is included;
- full-brain manifest materialization reaches direct connectors, plugin tools and skills;
- Tool Foundry one-by-one research provenance is durable;
- current visibility is distinguished from historical continuity;
- authorization is never inferred from visibility;
- proprietary/private implementations are never treated as copied;
- the God Coding owner control can process the entire ledger in bounded batches;
- existing approval, security, CI and release boundaries stay intact.


## 2026-09-20 Floot-first live catalog refresh

The live ChatGPT connector/tool catalog was refreshed after Floot was connected.

Current observed surface:

- 111 live plugin/tool namespaces.
- 2,309 live observable tool contracts.
- 109 installed skill namespaces.
- 867 installed skill contracts.
- 3,470 total Magnanimous capability specifications after current + retained historical union.
- 59 native-ready realization routes.
- 3,411 hybrid-ready realization routes.
- 0 bridge-required and 0 specified-only current realization gaps.

### Floot

Floot is represented as a first-class clean-room capability source rather than a generic plugin.

The connected Floot account exposes 44 callable tools and 65 public guide/skill topics. Magnanimous maps them into ten provider-neutral families:

- project discovery;
- code authoring;
- quality verification;
- preview and UI observation;
- database and schema;
- resources and auth;
- assets and media;
- project lifecycle;
- production publishing;
- platform knowledge.

Magnanimous owns intent, planning, routing, memory, workflow, risk policy, verification, learning and normalized contracts. Floot account authorization, Floot hosting, Floot-managed resources, published-app infrastructure and provider-specific project state remain replaceable external execution rails.

Initiative rules are explicit:

- safe reads, inspection, status checks, tests, previews and verification may auto-initiate when the required authorized surface exists;
- writes, code execution, SQL mutation, resource provisioning, credential requests, publishing, unpublishing and destructive actions remain subject to existing confirmation and permission gates;
- no external action is reported complete without a real tool result.

The current connected Floot account has no projects yet. Magnanimous therefore does not create a throwaway Floot project merely to claim integration.

## 2026-09-20 live connector refresh and Floot assimilation

The live observable connector catalog was refreshed again after Floot was connected.

Current live research snapshot:

- 111 visible plugin/tool namespaces.
- 2,309 visible plugin tool contracts.
- 109 installed-skill namespaces.
- 867 installed plugin skill contracts.
- Floot contributes 44 observable callable tools and 65 public guide/skill topics.
- Floot currently has no projects in the connected account, so no throwaway project was created merely to claim integration.

Floot is treated as a first-class replaceable execution rail beneath Magnanimous. Its observable capabilities are grouped into project discovery, code authoring, quality verification, preview/UI observation, database/schema, resources/auth, assets/media, project lifecycle, production publishing, and platform knowledge. Floot guide topics are also materialized individually as Magnanimous skill contracts.

Initiative policy is persisted with every absorbed capability. Magnanimous may proactively suggest next actions. Read-only inspection, research, status, testing, preview, and verification can auto-initiate when the required surface is actually available and authorized. Writes, code/database mutation, provisioning, publishing/deployment, messaging/calling, payments, credentials, permissions, deletion, and destructive operations remain behind their existing real authorization and confirmation gates.

Floot-specific examples:

- `list_projects`, `read_file`, `search_code`, `typecheck`, `run_tests`, `get_logs`, `get_publish_status`, and preview inspection are read/verification operations and may be initiated when safe.
- `write_file`, `edit_file`, `apply_patch`, `execute_sql`, `provision_resource`, `request_external_resource`, `publish_app`, and `unpublish_app` are consequential/destructive actions and remain permission/confirmation-gated.
- Magnanimous never treats Floot account access, Floot hosting, secrets, or project state as native Magnanimous ownership merely because the observable capability contract was learned.

The realization registry now requires every current capability to resolve to either a proven Magnanimous-native surface or a truthful hybrid surface. Current CI rejects any `bridge-required` or `specified-only` row in the live manifest; this does not erase real external boundaries, which remain represented as `hybrid-ready`.
