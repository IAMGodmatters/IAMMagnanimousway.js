# Agency Agents Facebook reel — source audit and Magnanimous adaptation

**Date:** 2026-10-28 (Asia/Manila). **Source reel:** https://www.facebook.com/reel/945474591835130

## What was actually observed

The user-supplied Facebook share URL redirects to this public reel by **Hyperautomation Labs**: **“Install 232 AI Agents in One Command: The 7-Agent Starter Squad for Claude Code.”** The expanded author description and Facebook's clearly labeled AI-generated video summary were readable in the browser. Those are **not** an independently captured, word-for-word audio transcript or complete frame-by-frame examination.

The description credits Michael Sitarzewski's project, **The Agency** (`msitarzewski/agency-agents`), and recommends seven roles: Rapid Prototyper, Backend Architect, AI Engineer, Whimsy Injector, Growth Hacker, Content Creator and Reality Checker. It says a coordinating agent can give them a common task. Its free cheat-sheet link is `https://hyperautomationlabs.co/free/squad`; it also links commercial/marketing guides. No paid guide is required to evaluate the open-source project.

**Verified upstream sources:**

- Main project and instructions: https://github.com/msitarzewski/agency-agents
- Exact source snapshot reviewed: https://github.com/msitarzewski/agency-agents/tree/b37b5bb33b78f2c1d6567d98e25ca818e3259219
- Canonical division inventory: https://github.com/msitarzewski/agency-agents/blob/main/divisions.json
- Canonical supported tool inventory: https://github.com/msitarzewski/agency-agents/blob/main/tools.json
- Installation and conversions: https://github.com/msitarzewski/agency-agents/tree/main/scripts
- License: https://github.com/msitarzewski/agency-agents/blob/main/LICENSE (MIT)
- Project security guidance: https://github.com/msitarzewski/agency-agents/blob/main/SECURITY.md
- Example team scenarios: https://github.com/msitarzewski/agency-agents/blob/main/strategy/runbooks.json

The video's **232 agents / 16 divisions** and **119,000 GitHub stars** are time-bound promotional figures, **not current inventory**. A read-only count of the `2026-10-24` upstream commit found **268 Markdown agent definitions with frontmatter in 18 divisions**. GitHub's public page showed roughly **165k stars** when checked. Stars are not proof of safety, effectiveness or production readiness.

## Every current division in the reviewed snapshot

| Division | Agent definitions | Division | Agent definitions |
| --- | ---: | --- | ---: |
| Academic | 6 | Design | 10 |
| Engineering | 66 | Finance | 5 |
| Game Development | 6 | GIS | 13 |
| Healthcare | 3 | Marketing | 37 |
| Paid Media | 7 | Product | 6 |
| Project Management | 7 | Research | 1 |
| Sales | 9 | Security | 12 |
| Spatial Computing | 6 | Specialized | 59 |
| Support | 6 | Testing | 9 |
| **Total** | **268** | **Divisions** | **18** |

Every `.md` under these canonical division folders had YAML frontmatter. `strategy/`, `scripts/` and generated integration outputs are not counted as agent divisions. For the complete names and original definitions, each division folder in the exact pinned source snapshot is the authoritative inventory.

The machine-readable companion `docs/AGENCY-AGENTS-ROLE-INVENTORY-2026-10-28.csv` contains **all 268 exact source paths and pinned file links**, one row per definition, without copying third-party prompt contents.

## All 17 integration targets in upstream `tools.json`

| Kind | Targets | Technical implication |
| --- | --- | --- |
| Per-agent definition files | Claude Code, Codex, Gemini CLI, GitHub Copilot, Qwen Code, Cursor, opencode, Osaurus, Antigravity, Kimi, OpenClaw, Mistral Vibe, ZCode, DeepSeek Harness | Installer/converter renders prompts or agent configuration for each target's format. Support varies by target and client runtime. |
| Combined roster conventions | Aider, Windsurf | Converts source definitions into one combined rules/conventions file. |
| Plugin | Hermes | Builds/install a special router plugin rather than per-agent Markdown files. |

The installation and conversion files are executable shell scripts; they require independent review before execution. Agent files are **prompt/workflow definitions, not 268 independently deployed autonomous runtimes**. They inherit the permissions and tool access of the host platform unless that host enforces explicit limits. The upstream security policy warns about prompt injection, embedded secrets and script review. No script from the upstream project was executed during this audit.

## Fit for I AM MAGNANIMOUS WAY™

The existing platform already has `worker/src/specialist-router.js`, a Magnanimous-owned Capability Mesh, Tool Foundry, agent skills, Dev Agent, God Coding, release gates and evidence-focused QA. Importing all upstream prompts would duplicate large parts of it, enlarge the attack surface and blur identity/ownership. No external agency should become the memory, orchestrator or policy authority.

**Implemented adaptation in this change:**

1. `worker/src/magnanimous-squad-planner.js` selects the minimum relevant set from seven original Magnanimous role profiles and always assigns an independent evidence verifier. This is deterministic local code, without model APIs or upstream prompt imports.
2. The existing owner-only native-first route adds `POST /api/magnanimous/native-first/squad-plan` and `GET /api/magnanimous/native-first/squad-roles`.
3. The private God Coding page adds a **PLAN SPECIALIST SQUAD** control and displays assignments, release evidence and risk boundaries.
4. A no-network QA regression script tests narrow and broad selection, malicious/unsafe-goal cases, rejected invalid input, owner boundary, no execution authority, approval limits and honest `NEEDS_EVIDENCE` status.
5. The CI code-health workflow executes this regression without Cloudflare requests or paid dependencies.

These endpoints plan work only. They **do not spawn agent processes, invoke tools, write customer records, make payments, edit repositories, merge, deploy or mark anything verified**. The existing authenticated Dev Agent and guarded workflows remain the execution path.

### Next safe improvements

- Connect an evidence receipt from existing Work Engine steps to the independent verifier, with strict tenant-scoped access and zero new release privileges.
- Benchmark the seven-role planner against a versioned set of real owner tasks, including prompt-injection and authorization-boundary cases. Avoid deploying every role by default.
- Add optional capability-specific execution adapters only after existing cost, approval and audit gates are proven in staging.

## Evidence and non-claims

- This audit covers the Facebook reel **description and labeled AI-generated summary**, plus official source-code metadata and static files. A full spoken transcript was **not** obtained.
- The source-role count is pinned to the reviewed upstream commit; upstream may evolve afterward.
- The new feature is source-code work. Until PR checks, merge and production revision are observed, do **not** call it live.
- The separate Faction Group assignment scheduled for 5:00 PM on 2026-10-28 recorded a completed run and PR #844; its live Cloudflare deployment was **not** independently verified. See `docs/FACTION-PRODUCTION-RESEARCH-2026-10-28.md` and `docs/FACTION-CI-SECURITY-2026-10-28.md`.
- No Cloudflare paid upgrade, live penetration test, customer-data operation, external paid model request or third-party code copy was performed.
