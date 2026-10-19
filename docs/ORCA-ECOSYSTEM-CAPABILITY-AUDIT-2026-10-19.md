# Orca ecosystem capability audit — 2026-10-19

## Scope and source identity

"Orca" is not one AI product. This is a capability-by-capability evaluation of independent public projects, not a claim that they are connected or owned by Magnanimous AI.

| Project | Public source | Relevant functions | Licensing / dependency |
|---|---|---|---|
| Stably AI Orca | https://github.com/stablyai/orca | Parallel isolated Git worktrees, supervised multi-agent runs, mobile companion, terminals, computer use, design capture, worktree diff review, CLI, remote execution | MIT; GUI/runtime and machine resources needed for live use |
| Nethyric ORCA | https://github.com/Nethyric/orca | 46 desktop-agent tools for shell, Node/Python, file editing, web, browser QA, Office, media, OCR, background processes, task delegation; checkpoints; MCP, model choice | MIT; tool permissions must be evaluated independently |
| Orca Agent Engine | https://github.com/orca-ae/orca-agent-engine | Self-hosted session registry, events, file/skill/memory stores, sandboxes, execution harness, credential-isolating gateway, trace export | Apache-2.0; developer preview 0.5.x; Postgres, event transport and object storage required for advertised stack |
| OrcA MCP | https://github.com/mcp-com-ai/orca | OpenAPI/Arazzo-to-MCP mapping, tool dry-run, JSON-RPC traffic inspection, replay, timing/tokens/cost and prompt-to-tool diagnostics | MIT; HAPI/VS Code workflows; do not auto-publish arbitrary API contracts |
| Orca Security Skills | https://github.com/orcasecurity/orca-skills | 20 incident/cloud posture analysis skills; optional autonomous source remediation plugin | MIT skills; live data needs separate Orca Security connection/credentials |
| Orca Agent Skills | https://github.com/orca-ae/orca-skills | orca-api skill for registry/CLI/SDK, auth, event streaming, memory, vault, environments, triggers | Apache-2.0; engine-specific integrations, not a generic free scan |

## What was researched

### Stably AI Orca
Verified public skills: `orca-cli`, `orchestration`, `computer-use`, `orca-linear`, `orca-emulator`, `orca-emulator-android`, `orca-per-workspace-env`. The public source also contains Jira/Linear and emulator-related skill directories. Skill install/update and `orca skills get` version-matched reference material are documented.
Sources: https://github.com/stablyai/orca ; https://github.com/stablyai/orca/blob/main/docs/site/content/docs/cli/skills.mdx ; https://github.com/stablyai/orca/blob/main/docs/site/content/docs/cli/reference.mdx .

### Nethyric ORCA
**All 46 tool names from the published docs** (not installed as Magnanimous runtime tools):

`run_shell ` · `run_node ` · `run_python ` · `diagnostics ` · `read_file ` · `write_file ` · `edit_file ` · `delete_file ` · `list_files ` · `glob ` · `grep ` · `search_files`

`web_search ` · `fetch_page ` · `http_request ` · `browser_check ` · `screenshot ` · `view_image ` · `ocr_image ` · `todo_write ` · `todo_read ` · `task ` · `ask_user ` · `start_process ` · `process_output ` · `stop_process ` · `list_processes`

`remember ` · `recall ` · `project_init ` · `scaffold_site ` · `write_docx ` · `read_docx ` · `write_xlsx ` · `read_xlsx ` · `write_pptx ` · `read_pdf ` · `media_info ` · `media_edit ` · `media_concat ` · `media_from_images ` · `media_subtitles ` · `generate_image ` · `generate_video ` · `social_download ` · `social_trending`

Its public tools reference includes execution (`run_shell`, `run_node`, `run_python`, `diagnostics`), files/search, web/HTTP, browser/screenshot/OCR, task and memory helpers, long-running processes, media and document generation and editing. The repo explicitly distinguishes risk levels. It describes snapshot/diff checkpoints and MCP schema fingerprinting to detect silent redefinition.
Source: https://github.com/Nethyric/orca/blob/main/docs/tools.md ; https://github.com/Nethyric/orca .

### Orca Security skills
Twenty published skill directories: account-health, admin-access-grouping, alert-triage, asset-profile, cloud-cost-optimizer, compliance-gap, config-origin, custom-framework, cve-blast-radius, data-exposure, exposure-map, identity-review, impact-analysis, inactive-identities-cleanup, investigate, k8s-connector-troubleshoot, mfa-enforcement, morning-briefing, overprivileged-identities-rightsizing, supply-chain-exposure (each prefixed `orca-`).
Source: https://github.com/orcasecurity/orca-skills .

### Managed runtime and API integrations
Agent Engine operates registries, harnesses, sandboxes, egress/gateway, credentials, streaming and stores; it currently labels its API a developer preview. OrcA's API-to-MCP and tool-traffic model is suitable for Magnanimous Tool Foundry design, but cannot justify bypassing external-service access controls or permissions.
Sources: https://github.com/orca-ae/orca-agent-engine ; https://github.com/mcp-com-ai/orca .

## Magnanimous capability comparison

The repo already has a native Capability Mesh, Agent Skills parser/catalog/resolve, Tool Foundry, MCP gateway, secure billing policy, browser tools, development agent, skill statistical quality gate and durable-work receipts/checkpoints. These features should not be replaced simply to resemble Orca.

| Capability | Magnanimous action | Status |
|---|---|---|
| MCP manifest change detection | Normalize and fingerprint schemas/descriptions, quarantine changed/new tools on subsequent refresh | **Implemented on this branch** |
| Manual authorization for changes | Owner/admin list and approve/reject pending manifests | **Implemented on this branch** |
| Preserve disabled tools on refresh | Removed automatic wholesale deletion/re-enablement | **Implemented on this branch** |
| Missing/upstream withdrawn tool handling | Disable missing tools on refresh; audit event | **Implemented on this branch** |
| Regression and CI verification | Dependency-free Node tests and free pull-request workflow | **Implemented on this branch; CI confirmation required** |
| Orca-inspired native skills | MCP manifest integrity, supervised parallel development and cloud-security evidence triage as Magnanimous-owned Agent Skills | **Implemented on this branch; skill resolution tests included** |
| Parallel agent worktree comparisons | Build Magnanimous native supervisor with budget and sandbox isolation, not another agent identity | Future: needs infrastructure and safety evaluation |
| Full model/tool execution traces with cost and scrubbed payloads | Extend existing durable receipts and audit with bounded, redacted spans | Future; avoid storing private prompts or keys |
| Live API-to-MCP generation | Map contract analysis through existing Tool Foundry, stage read-only tools first | Future; require per-operation auth, metering and review |
| Security posture analysis | Turn public Orca Security skill ideas into native read-only checks where telemetry exists | Future; no paid Orca API subscription initiated |
| Mobile steering and design element picking | Extend existing web/desktop bridge; preserve current artwork and mobile UI | Future; test devices and desktop bridge availability |
| Remote sandbox and model routing | Reuse current native runtime, provider abstraction and durable jobs | Future only where operational benefit exceeds complexity/cost |

## Implementation details and usage

Files:
- `worker/src/magnanimous-mcp-manifest-guard.js`: canonical order-insensitive JSON schema normalization and SHA-256 manifest fingerprint, strict length/type checks.
- `worker/src/magnanimous-agent-skills.js`: three new native skills, with no assertion that external security telemetry or agent infrastructure is connected.
- `qa/scripts/magnanimous-agent-skills-lock.mjs`: goal resolution and skill catalog tests.
- `worker/src/magnanimous-tool-gateway.js`: persistent `magnanimous_tool_manifest_reviews` table, drift quarantine, missing-tool disable, review API, tenant-scoped approval and audit.
- `qa/scripts/magnanimous-mcp-manifest-guard-lock.mjs`: deterministic change/validation/regression assertions.
- `.github/workflows/magnanimous-mcp-manifest-guard.yml`: source checks on relevant PRs and main pushes.

After an authorized owner/admin runs existing `POST /api/magnanimous/tools/discover`, changed or newly introduced tools on previously known servers are disabled pending review. To inspect pending changes, authenticate and GET `/api/magnanimous/tools/manifest-reviews`. To approve a reviewed manifest, POST to that URL with `{"server_id": 1, "tool": "tool_name", "decision": "approve"}`; `"reject"` leaves it disabled. These are additive internal APIs; no unreviewed tool call is authorized by this new flow. Normal initial server registration remains a deliberate owner/admin action.

### Boundaries and exclusions
- No Orca vendor credentials, paid API subscription, external server, invasive permissions, or runtime dependency were installed.
- No third-party source code was copied: this is a native implementation of a public integrity technique.
- Existing Magnanimous identity, user interface, all original imagery, payments/Stripe, telecom rules, subscription entitlements and session policy were not modified.
- MCP access and first-time registration still need operational hardening beyond this focused change (e.g. tool-side authorization, DNS resolution controls and confirmation for high-risk calls).
- A code commit/PR does not prove production deployment, customer activation or live end-to-end security.
