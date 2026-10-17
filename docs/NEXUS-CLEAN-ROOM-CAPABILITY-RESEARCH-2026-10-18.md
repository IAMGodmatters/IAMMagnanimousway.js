# Nexus clean-room capability research — 2026-10-18

## Purpose

Research public products and open-source projects named **Nexus** for patterns that can improve Magnanimous AI without making Nexus part of Magnanimous, copying proprietary internals, weakening existing controls, or replacing the Magnanimous brain/orchestration layer.

## Sources reviewed

### Commercial / public product surface

- https://www.talktonexus.com/
  - Publicly advertises a local agentic assistant, intent routing, installable Skills, a large app/API catalog, SOP automations, an Obsidian-backed recall graph, snapshot/undo semantics, approval gates for destructive writes, and parallel deep research.
  - These are treated as **public product claims**, not as independently verified internal implementation details.

### Open-source Nexus implementations used as architecture references

- https://github.com/nexus-research-lab/nexus — Apache-2.0
  - Multi-agent Rooms and DMs
  - persistent Agent workspaces and file memory
  - durable Goals and WorkGraphs
  - scheduled tasks / proactive Echo follow-ups
  - AutoMemory / AutoDream background memory maintenance
  - Skills and Connectors
  - Browser integration and execution recovery

- https://github.com/praesidia-ai/nexus — MIT
  - durable DAG workflows
  - deterministic-first routing
  - quality/taste gates and auto-repair loops
  - tenant cost ledger and budget brake
  - capability-deny sandboxed plugins
  - signed audit log / execution receipts
  - local/self-hosted execution and MCP exposure

- https://github.com/santoshakil/nexus — MIT
  - unified MCP messaging adapter across Telegram, Gmail, WhatsApp, Slack and Discord
  - normalized tool contracts and recoverable error metadata

- https://github.com/Poi5eN/Nexus — MIT
  - local-first multi-persona delegation patterns
  - planner -> specialists -> synthesis structure
  - replaceable local model routing

## What Magnanimous already has and should preserve

Magnanimous already has many of the useful outcomes these projects target:

- Magnanimous AI remains the owned identity, reasoning, policy, memory and orchestration layer.
- provider-neutral standalone Node runtime
- native SQLite compatibility, object store, KV/TTL cache, durable jobs/workflows, event ledger/pubsub, vector retrieval, analytics and pipelines
- encrypted secret vault
- sandboxed local execution and browser rendering/automation
- provider-neutral AI/image bindings and free/native fallbacks
- Agent Mesh and specialist routing
- connector/capability registries and clean-room research boundaries
- authenticated/tenant-scoped operations and payment/cost controls
- native browser hash-chained action receipts with optional HMAC signing
- production QA locks, deployment evidence and truthful capability-state rules

Nexus should therefore **not** be embedded as a dependency or promoted above Magnanimous AI.

## High-value improvements identified

### 1. Generalize tamper-evident receipts beyond browser actions — IMPLEMENTED IN THIS BRANCH

The browser layer already had hash-chained receipts, but standalone durable jobs and workflows did not have an equivalent ledger.

This branch adds `magnanimous_work_receipts` to the standalone durable-work runtime and automatically records:

- job queued
- job claimed / leased
- job completed
- retry scheduled / terminal failure
- workflow started
- workflow checkpoint
- workflow completed
- workflow failed

Each receipt contains a bounded canonical record, SHA-256 content hash, previous-chain hash, derived chain hash, and optional HMAC-SHA-256 signature when a signing key is supplied. Verification detects content or chain tampering. Error/output/input payloads are represented by hashes where practical rather than duplicating sensitive data.

This is stronger than merely copying a UI pattern: it expands Magnanimous's owned evidence plane across its durable execution core.

### 2. Evidence-gated persistent WorkGraph — recommended next native build

Magnanimous durable workflows currently persist workflow state, but a first-class responsibility DAG could add:

- immutable graph versions
- node dependencies
- risk class / approval requirement per node
- expected cost and budget reservation
- acceptance tests per node
- artifact/evidence references
- retry/recovery state
- owner-visible graph timeline

Magnanimous should improve on generic WorkGraphs by requiring **evidence + budget + authority** before a node can be considered complete.

### 3. Capability-deny plugin sandbox

Magnanimous already has a sandbox and capability registries. A stronger plugin runtime should make permissions machine-enforced:

- network allowlist
- filesystem scope
- secret-reference scope
- CPU/memory/wall-clock/fuel limits
- tool/action class allowlist
- tenant scope
- explicit paid-provider permission

Do not adopt a third-party plugin runtime as the platform identity. Implement the contract natively over the existing sandbox when practical.

### 4. Outcome guarantee loop for builds

Add a bounded native loop around generated/modified software:

`build -> lint/typecheck/test -> smoke -> visual/accessibility/security checks -> patch -> repeat -> evidence receipt`

The loop should stop on a configured retry/budget ceiling and report the actual remaining failure rather than claiming completion.

### 5. Unified context assembly

Improve memory retrieval by ranking and assembling:

- active-session context
- durable user/project memory
- relevant failure lessons
- current task graph
- source evidence
- policy/authority constraints
- cost state

The assembled context should keep provenance and avoid importing raw hidden reasoning.

### 6. Unified communications adapter

A provider-neutral normalized contract for Gmail/Outlook/Slack/Discord/Telegram/WhatsApp can reduce duplicated connector logic. Magnanimous should preserve official OAuth/API boundaries and expose only configured providers dynamically.

## What not to copy

Do not copy or represent as Magnanimous-owned:

- talktonexus proprietary source code, prompts, private integrations, datasets or UI assets
- hidden implementation details inferred from marketing pages
- credentials, keys or private service configuration
- copyrighted brand assets or wording

Open-source code may be studied or reused only under its actual license and with required notices. Prefer original Magnanimous implementations of the useful architecture patterns.

## Better-than-equal target

The target is not "Nexus parity." The Magnanimous version should combine useful Nexus-style patterns with controls already required here:

1. Magnanimous AI remains the single brain and policy authority.
2. Evidence is required before work is called complete.
3. Consequential actions are permission/approval gated.
4. Variable-cost work is funded and budget bounded.
5. Tenant boundaries and secrets remain isolated.
6. External providers are replaceable tools.
7. Every durable action can produce a tamper-evident receipt.
8. Failed verification triggers repair or an honest blocked/failed state.
9. Free/native/local paths are preferred when practical.
10. Production claims require direct evidence.

## Branch implementation proof

Files changed/added:

- `magnanimous-runtime/src/durable-work.mjs`
- `qa/scripts/magnanimous-nexus-execution-receipt-lock.mjs`
- this research record

The regression lock creates signed job/workflow receipts, verifies the chain, deliberately tampers with one receipt, and requires verification to fail after tampering.
