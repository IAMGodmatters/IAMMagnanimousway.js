# Cursor capability benchmark → Magnanimous AI (2026-10-27)

## Acquisition and licensing

SpaceX's roughly $60 billion acquisition of Anysphere/Cursor closed in August 2026 (reported in the SpaceX third-quarter earnings coverage). Cursor is an AI software-development editor and coding-agent system, **not an open-source package whose entire source can be imported**. Publicly documented concepts and openly licensed projects may be independently implemented; Cursor proprietary code, models, prompts, brand assets, customer data and internal services are not acquired or cloned by Magnanimous.

Sources reviewed:

- https://cursor.com/docs/agent/overview — code search, edits, terminal, model/tool/instruction orchestration
- https://cursor.com/docs/rules — project rules and `AGENTS.md` compatibility
- https://cursor.com/docs/skills — portable `SKILL.md` packaging
- https://cursor.com/docs/mcp — Model Context Protocol tool connections
- https://cursor.com/docs/cloud-agent — cloud development tasks
- https://cursor.com/docs/cli/using — CLI, planning, rules, MCP
- https://github.com/microsoft/vscode — MIT-licensed upstream Code OSS source; Microsoft's branded VS Code distribution/extension marketplace have separate terms
- https://github.com/continuedev/continue — Apache-2.0 coding-agent reference, with current maintenance status to be checked before selecting an integration

Any direct open-source reuse must preserve the upstream license and applicable notices. This change does not vendor external source or install paid software.

## Existing platform mapping at the reviewed main branch

| Cursor-like capability | Magnanimous path | Evidence / limits |
| --- | --- | --- |
| Codebase read, search, and development planning | `/developer-agent`, GitHub repository adapter | Implemented source routes. Real GitHub operations require active account authorization and runtime verification. |
| Multi-file repository edits and PRs | Magnanimous Dev Agent | Staged, owner-confirmed file/branch/PR workflow; not autonomous unreviewed writes. |
| Natural-language code generation + preview | `/vibe-studio` | Single-file HTML prototype scaffolds, editable preview, checkpoint history and export. Not full-stack deployment. |
| Reusable Agent Skills | `worker/src/magnanimous-agent-skills.js` | Native `SKILL.md` validator, discovery and skill resolution; no external automatic execution. |
| MCP integrations | Capability Mesh plus MCP invocation/manifest guards | Provider-neutral contracts with authorization, scopes and connection prerequisites. |
| Model-agnostic development assistance | Magnanimous compute and Dev Agent | Optional external model providers are replaceable; no undocumented Cursor model copied. |
| Sandboxed terminal and cloud agents | Native terminal and future isolated-runner contracts | Different execution paths require real runner readiness; don't claim unattended cloud coding parity. |
| Project rules and Cursor tool configuration analysis | `coding.compatibility.inspect` **added** | Owner-only, read-only rule (`.mdc`), `mcp.json` and Agent Skill inspection. No shell, network, import or auto-connection. |

## What this change adds

The owner-only Developer Agent screen now offers a **Coding Agent Compatibility Inspector**. Paste a single file from an authorized source and choose one of three formats:

1. Cursor-style `.mdc` rule: validates basic frontmatter, scoping declarations, body presence and risky instructions; returns an inventory and a safe migration plan.
2. Cursor-style `mcp.json`: inventories bounded server declarations, identifies local commands versus HTTPS transports, flags env fields, rejects loopback/private-address HTTP endpoints and invalid structure. It never echoes pasted env values, runs server commands, contacts providers or imports connections.
3. Portable `SKILL.md`: uses the existing native Agent Skills parser for syntax/metadata validation, while suppressing raw body content in the response and requiring license/security review before any actual promotion.

This is a **review tool**, not a Cursor account connector, privileged plugin installer or silent migration engine. A structurally accepted artifact is not automatically safe or approved for production use. Owners must review all instructions, dependency provenance and model data destinations before taking later actions.

The implementation is self-contained; no new npm package, database migration, external service, paid API, environment variable or subscription is required. `qa/scripts/magnanimous-coding-interop-lock.mjs` covers parser boundaries, redaction, dangerous-looking patterns, owner-route wiring and the native no-spend contract. The lock runs in full-platform QA, and the local production build is also verified before review.

## Major remaining engineering gaps

1. **True multi-file visual workspace:** a per-project virtual filesystem, dependency allowlists, coherent diffs, symbol-aware retrieval and incremental code changes.
2. **Real code execution:** independent unprivileged container/VM runner with CPU/time/disk/network quotas, audit logs, ephemeral credentials and strict tenant separation; never run imported `mcp.json` commands in the public Worker.
3. **Repository-grounded indexing:** verified per-tenant permission-scoped index with exact commit provenance, secret exclusion, robust invalidation and cost controls.
4. **Diff + test loop:** exact-head CI diagnostics, patch review, bounded retry, regression checking and mandatory explicit production release gates.
5. **MCP/skill promotion workflow:** separately approved allowlisted connections, provenance capture, supply-chain scanning, least-privilege scopes, and repeatable evaluations before activation.
6. **Operating economics:** free/native first, customer-funded paid usage, hard spend caps and clear premium terms. No automatic Cursor, Grok or Composer subscription is enabled.

Do not label these remaining items as live until actual runtime, tenant isolation, billing, deployment and browser evidence verify them. Magnanimous AI retains planning, identity, memory, tools, skill selection and policy authority.
