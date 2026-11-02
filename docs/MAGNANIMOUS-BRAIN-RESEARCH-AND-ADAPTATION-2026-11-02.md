# Magnanimous AI knowledge-brain research and adaptation — 2026-11-02

## Source identified from the Facebook reel

The reel matches the October 2026 "37 AI agents run my entire company" demonstration. The independent review reports that the demo describes six departments, SOP cards and downloadable skills, human-led / human-assisted / autonomous labels, a GBrain knowledge base, and one Hermes harness. It also notes that the public reel does not provide revenue, client count, measured error rates, or evidence that all 37 agents operate autonomously. Treat it as an architecture demonstration, not proof of unattended company operations.

Primary sources reviewed:
- GBrain official repository: https://github.com/garrytan/gbrain
- GBrain README: https://github.com/garrytan/gbrain/blob/master/README.md
- GBrain source attribution: https://github.com/garrytan/gbrain/blob/master/docs/guides/source-attribution.md
- GBrain architecture: https://github.com/garrytan/gbrain/blob/master/docs/architecture/brains-and-sources.md
- Hermes persistent memory: https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/memory.md
- Hermes agent-managed skills: https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/skills.md
- OpenClaw security guidance: https://docs.openclaw.ai/gateway/security/prompt-injection
- Google research: https://research.google/pubs/openclaw-in-the-wild-security-analysis-of-autonomous-agents/
- Independent reel analysis: https://schreiergroup.com/hype-audit/thirty-seven-ai-agents-company-os-partly/

## What is genuinely useful

1. **Source-backed claims.** GBrain attaches provenance to claims, preserves original evidence, and makes conflicting claims visible rather than silently choosing one.
2. **A typed knowledge graph.** People, companies, projects, meetings, and ideas can be linked by source-backed relationships. The project reports graph traversal as an additional retrieval method, not a guaranteed universal accuracy boost.
3. **Hybrid retrieval and answer synthesis.** Keyword + vector retrieval + reciprocal-rank fusion + reranking can be followed by a cited answer and explicit gap analysis. The answer should say when information is stale, missing, or contradictory.
4. **A background maintenance loop.** Enrichment, deduplication, citation repair, salience scoring, and contradiction detection can keep knowledge useful, but must be bounded and consent-aware.
5. **Procedural memory.** Hermes distinguishes persistent facts/preferences from skills that store reusable procedures. Skills should be progressively disclosed and reviewed before promotion.
6. **Evaluation by replay.** Fixed synthetic or approved queries can be replayed after retrieval or skill changes to detect regressions in recall, citations, accuracy, cost, and latency.

## What should not be copied blindly

- The reel's agent count is not a performance metric. Magnanimous should add departments only when each has a real task contract, permissions, owner, budget, tests, and measurable outcomes.
- Do not install GBrain, Hermes, or OpenClaw as a replacement identity or second memory authority. Their public patterns can inform independent Magnanimous-native capabilities.
- Do not import third-party code or skill packs without reviewing the exact repository, commit, license, dependency tree, and security posture.
- Do not run unreviewed skills, shell commands, browser actions, or MCP tools merely because a knowledge page recommends them.
- OpenClaw's own security guidance and Google's security analysis identify indirect prompt injection, memory poisoning, tool execution, session boundaries, and extension supply chain as system-level risks. Model-level prompt defenses are not sufficient.

## Existing Magnanimous baseline found on main

The repository already contains:
- A Magnanimous-owned Agent Skills format parser, metadata-first catalog, goal resolver, and validation checks.
- A Capability Mesh that retains authorization ownership.
- A Tool Gateway with tenant-scoped manifest review, drift quarantine, and audit records.
- A White Label brain with tenant/user/client/app-scoped lessons, privacy-safe outcome signals, and owner-review requirement before global promotion.
- A Capability Roadmap that already calls for tenant-isolated memory and learning from confirmed successful workflows.

The White Label brain currently stores lesson keys/values/evidence and simple success signals, then recalls a bounded list by tenant/client/app scope. The reviewed code does not establish that a full typed entity graph, immutable event ledger, vector/hybrid retrieval, source-claim citation engine, contradiction detector, or scheduled dream/consolidation cycle is implemented there. Those are separate engineering increments, not features to claim as live.

## This change

Adds a native Magnanimous Agent Skill: `provenance-first-knowledge-engineering`. It converts the verified public patterns into an operational Magnanimous workflow with source provenance, entity resolution, conflict handling, freshness/gap analysis, tenant-safe consolidation, evaluation replay, and existing policy gates.

No GBrain, Hermes, or OpenClaw code is copied. No external package, provider, paid API, secret, or background ingestion job is installed or enabled. This is a skill-level workflow addition, not a claim that the underlying database/index/cron implementation is complete.

## Recommended implementation sequence after this skill

1. Audit current memory tables and APIs; define source, claim, entity, relationship, and event records without breaking existing lesson APIs.
2. Add provenance and correction/withdrawal lifecycle first, including tenant/client scope and retention propagation.
3. Add entity resolution and typed graph links with explicit source references.
4. Add hybrid retrieval only after synthetic benchmark baselines and index-health checks exist.
5. Add cited synthesis with explicit conflict, staleness, and missing-evidence reporting.
6. Add opt-in, dry-run-first background consolidation with strict budgets and no cross-tenant raw-content promotion.
7. Verify tenant isolation, deletion, prompt-injection containment, idempotency, cost caps, and production behavior before enabling any scheduled work.

## Acceptance criteria for the eventual runtime

- Every factual memory claim has a traceable source or is explicitly marked as an inference.
- Conflicting facts remain visible with both sources and dates.
- User correction and withdrawal propagate to all derived representations.
- Entity merges require evidence and remain reversible/audited.
- Search returns citation coverage and index-readiness metadata.
- Tenant/client scopes are enforced in every read, write, graph traversal, and background job.
- Background ingestion is opt-in, bounded, idempotent, auditable, and cost-capped.
- Synthetic replay tests cover recall, synthesis, conflicts, freshness, withdrawal, and isolation.
- No retrieved content can grant tool permissions or override the Capability Mesh.
