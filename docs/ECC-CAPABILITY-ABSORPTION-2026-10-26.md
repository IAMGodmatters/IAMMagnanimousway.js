# ECC engineering capability audit and first-party absorption — 2026-10-26

Source video: https://www.facebook.com/reel/941565618281134 (Mahan Jafari)
Official upstream: https://github.com/affaan-m/ECC
Upstream source revision inspected: `25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b`
Upstream license: MIT, Copyright (c) 2026 Affaan Mustafa; see https://github.com/affaan-m/ECC/blob/main/LICENSE

## Evidence and scope

The Reel shows a table advertising **68 agents, 286 skills and 94 commands**, plus runtime hooks, memory and rules. The current pinned upstream Git tree contains **71 agent Markdown files** and **311 skill directories with SKILL.md**, so the Reel's skill number is an older snapshot rather than the current filesystem count. ECC also contains rules, hook configurations, harness adapters, tests, security scanning, benchmark and learning techniques. The free open-source software is distinct from ECC's commercial GitHub App and hosted service.

All 311 SKILL.md files were retrieved for offline content review. Their combined source text is about 2.9 million characters. Automated flags identified two examples containing fetch-and-execute command patterns, seven mentioning destructive operations or force-push, and 111 mentioning secrets or credentials. These are review signals, not proof of maliciousness or exhaustive security clearance. Upstream content, hook scripts, installers and MCP definitions must **not** be executed or given credentials automatically.

## Magnanimous mapping

| Public ECC technique | Existing Magnanimous component | Integrated first-party improvement |
| --- | --- | --- |
| Specialist agent roles | Agent Mesh | Ten new distinct engineering specialists, existing routing and memory retained |
| SKILL.md reusable workflows | Agent Skills + Capability Mesh | Thirty new independent evidence-driven skill instructions |
| Red/green/refactor and tests | Dev Agent + QA scripts | Test-first, regression-risk and failure-triage workflows |
| Review and threat modeling | Dev Agent security review | Tenant, prompt injection, API, dependency and secrets checks |
| Hooks and memory | Skill/Routine Studio, checkpoints, QA learning | Learning quality and memory minimization workflows; no untrusted hook execution |
| Safe release and observability | Deploy CI, Progress Engine and owner ops | Exact-release, incident and telemetry skills |
| Provider-neutral agent harness | Magnanimous brain and routing | Fallback, cost guard, delegated verification, Flutter/FastAPI contract |
| AgentShield-inspired scanning | Existing security hardening and QA | Read-only adversarial and supply-chain review guidance; no claim to run AgentShield |

The new agent profiles are callable through the existing `/api/agents` catalog and chat route. The new skills are resolved by `skills.catalog` and `skills.resolve`; they are **instruction workflows**, not automatic executors. An actual repository edit, deployment, payment, telecom action or external API call still requires the appropriate configured capability, tenant permission and existing approval. Skill resolution is not proof of external integration readiness.

## Counts after this patch, by source definition

- Core Agent Mesh: **75** named profiles (65 existing + 10 new)
- Other known profiles: 7 video + 4 included voice + 1 developer
- Total identifiable profiles: **87**; active provider readiness requires live verification.
- Built-in Agent Skills registry: **62** (12 existing general + 20 security + 30 new engineering)
- Separate Developer Skill workflows: **18**
- Total first-party defined skills/workflows: **80**. User-created database skills are excluded.
- Upstream ECC reference catalog: **311** skills reviewed, **not** represented as Magnanimous-native operational skills.

These changes improve the platform and exceed ECC's 68 advertised *agent-definition* count (and the current 71-file directory count) when comparing all Magnanimous profiles. They **do not yet meet the request to exceed 286 fully operational native skills**. Count inflation through unverified prompts or unconnected tooling is deliberately avoided.

## Verification and remaining work

The relevant existing QA lock now checks 30 unique registered skills, 10 unique callable profiles, triggering, evidence contracts, original brain identity, and no automatic execution of external scripts. Production deployment, model readiness, individual user-created skills, live provider connections and end-to-end action quality still need exact-commit runtime evidence.

Additional import work should prioritize verified, original Magnanimous implementations where ECC techniques match actual capabilities. Respect upstream MIT notices for any future copied source; do not imitate ECC branding, private hosted features or external credential ownership. Paid or unconfigured tools must remain optional and fail closed.
