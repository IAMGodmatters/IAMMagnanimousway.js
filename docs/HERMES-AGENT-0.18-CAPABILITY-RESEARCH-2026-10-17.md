# Hermes Agent 0.18 Capability Research — Magnanimous Clean-Room Assimilation

Date: 2026-10-17

## Purpose

Research the public Hermes Agent v0.18 "Judgment Release" and later reliability lessons, then absorb only useful public capability patterns into Magnanimous AI without making Hermes, Nous Research, any model provider, or any outside runtime part of Magnanimous identity, memory ownership, orchestration ownership, or policy authority.

Magnanimous AI remains the brain. External models, APIs, browsers, MCP servers, carriers, hosted agents, and inference providers remain replaceable workers/tools.

## Primary sources reviewed

- Nous Research Hermes Agent repository: https://github.com/NousResearch/hermes-agent
- Hermes Agent v0.18.0 Judgment Release: https://github.com/NousResearch/hermes-agent/releases/tag/v2026.7.1
- Hermes Agent current release checked during this research: https://github.com/NousResearch/hermes-agent/releases/tag/v0.22.2
- Hermes Agent MIT license: https://github.com/NousResearch/hermes-agent/blob/v2026.7.1/LICENSE
- Completion-contract implementation/docs: `hermes_cli/goals.py`, `hermes_cli/goal_command.py`, `website/docs/user-guide/features/goals.md`
- Mixture-of-Agents implementation/docs: `agent/moa_loop.py`, `hermes_cli/moa_config.py`, `website/docs/user-guide/features/mixture-of-agents.md`
- Learning/journey docs: `website/docs/user-guide/features/memory.md`, slash-command references for `/learn` and `/journey`
- Background delegation implementation/docs: `tools/delegate_tool.py`, `tools/async_delegation.py`, `tools/process_registry_notifications.py`, `website/docs/user-guide/features/delegation.md`

## Video material reviewed

Public YouTube material was used as secondary workflow evidence, not as the source of truth for implementation details:

- "Hermes Agent Full Setup Tutorial: How to Setup Your First AI Agent (Gemma 4)" — Bart Slodyczka, 2026-04-08. Demonstrates local Ollama/Gemma usage, self-hosted Firecrawl and Telegram without mandatory paid model APIs.
- "Full Hermes Agent Set-Up For Beginners in 2026! (24/7 AI Agent)" — AI Foundations, 2026-05-12. Chapters cover memory, skills, cron jobs, the agent loop, VPS/web setup and Telegram.
- Indexed v0.18 Judgment Release walkthrough material was reviewed for workflow confirmation; official release notes and repository source remain authoritative where video descriptions differ or omit details.

## License boundary

Hermes Agent v0.18 is MIT licensed. The license permits use, modification and redistribution provided the copyright and permission notice are retained in copies or substantial portions of the software.

This Magnanimous change does **not** vendor or copy Hermes source files. It implements original Magnanimous-native contracts inspired by public behavior and architecture, so Hermes does not become a runtime dependency or platform identity. If future work copies a substantial MIT-licensed code portion, preserve the upstream notice in the applicable third-party attribution/NOTICE material.

## Capability findings

### 1. Evidence-backed completion contracts

Hermes v0.18 made completion contracts first class: important work is judged against declared completion conditions and evidence rather than an agent simply claiming it is finished.

**Magnanimous adoption:** `worker/src/magnanimous-judgment-core.js` adds explicit completion contracts and evidence evaluation. Missing or failed required criteria keep a task incomplete.

### 2. Provider-neutral model councils

Hermes Mixture-of-Agents runs reference models independently and uses an aggregator model to synthesize the result.

**Magnanimous adaptation:** the council planner is free/native-first, budget constrained, provider neutral, and retains Magnanimous AI as aggregator/final decision owner. External providers are workers. Unlike surfaces that display full model reasoning, Magnanimous stores only concise conclusions, evidence references and confidence; hidden chain-of-thought is neither required nor exposed.

### 3. Learn-from-workflow skill synthesis

Hermes `/learn` turns a directory, URL or recent workflow into a reusable skill.

**Magnanimous adaptation:** successful workflows become **candidate** skills with steps, permissions, tests and provenance. Candidates do not auto-activate; promotion requires schema validity, permission review, regression success, reversibility and recorded provenance.

### 4. Visible learning journey

Hermes `/journey` and its memory graph make accumulated memory/skills visible and editable.

**Magnanimous adaptation:** the judgment core adds structured learning-journey events designed for an append-only/auditable learning ledger. Events explicitly exclude raw hidden reasoning and are suitable for a future UI timeline/graph.

### 5. Durable background fan-out

Hermes can dispatch background subagents/fan-out units and later consolidate results. Later releases added substantial reliability work around delegation, scheduler continuity, process registries and gateway state.

**Magnanimous adaptation:** a bounded durable-task state machine now defines queued/running/waiting/verifying/complete/failed/cancelled transitions, retry limits, checkpoint references and evidence references. This is intentionally infrastructure-neutral so local workers, specialist agents or authorized outside providers can plug underneath it.

### 6. Cost-aware auxiliary work

Hermes reduced self-improvement cost by moving review work to auxiliary models and digesting context instead of replaying the whole conversation.

**Magnanimous adaptation:** council selection prefers native/free workers and refuses metered workers when the task budget is zero. Paid fan-out can be enabled only through an explicit nonzero budget supplied by the calling layer; existing Magnanimous billing/authorization controls remain authoritative.

### 7. Current reliability lessons beyond v0.18

The current v0.22.2 line adds operational fixes that reinforce several architectural rules already present in Magnanimous: robust process/gateway liveness, long local-model turns that account for sleep/stalls, provider/profile correctness, generated wire contracts, plugin review/pinning, scheduler durability, and state-store safety.

These are treated as engineering benchmarks, not as a reason to import Hermes wholesale. Magnanimous should continue strengthening its existing Local Bridge, provider adapters, capability mesh, durable storage, scheduling and CI using its own contracts and tests.

## What was already present in Magnanimous

Before this research, Magnanimous already had provider-neutral routing, specialist agents, parallel workstreams, persistent memory domains, reusable skills, research checkpoints/resume, browser/local execution paths, capability discovery, approval gates, provider readiness, native-first fallback selection, security/reliability controls and continuous evidence-driven self-evolution. The new work fills the clearest gaps instead of duplicating those systems.

## Implemented in this change

- `worker/src/magnanimous-judgment-core.js`
  - completion contracts and evidence evaluator
  - free/native-first council planner
  - council judgment contract
  - skill-candidate synthesis
  - learning-journey event format
  - durable delegated-task transition contract
  - Magnanimous Judgment prompt policy
- `worker/src/magnanimous-cognitive-architecture.js`
  - wires the Judgment Core into the live Magnanimous cognitive prompt used by the brain runtime
  - adds evidence-backed judgment to architecture, development literacy and research priorities
- `qa/scripts/magnanimous-judgment-core-lock.mjs`
  - regression checks for identity ownership, evidence completion, zero-budget paid-worker exclusion, consensus judgment, skill non-auto-activation, no raw chain-of-thought storage and durable state transitions
- `.github/workflows/magnanimous-judgment-core-lock.yml`
  - runs the regression lock on pushes and pull requests with Node 22

## Deliberately not imported

- Hermes branding, provider identity or UI identity
- Hermes memory ownership or state database
- Hermes provider credentials/accounts
- raw model chain-of-thought display/storage
- provider-specific paid routing as a default
- proprietary model internals, weights, private prompts, credentials or non-public data
- wholesale runtime replacement

## Next native expansion targets

The next useful increments, after this foundation proves clean in CI, are to persist completion contracts/journey events in the existing Magnanimous database, expose owner-visible read-only audit surfaces, and connect durable task state to the existing specialist-agent/research/scheduler runtimes. Those changes should continue to use existing authorization, tenant separation, billing, rollback and verification gates rather than creating a second policy path.
