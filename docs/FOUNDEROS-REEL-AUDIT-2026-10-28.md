# FounderOS reel: evidence-led Magnanimous platform audit

**Audit date:** 2026-10-28 (Asia/Manila)

**Submitted reel:** https://www.facebook.com/share/r/18ePUZJz4k/?mibextid=wwXIfr

**Resolved reel:** https://www.facebook.com/reel/2190871595165340
**Attribution:** Bennett Spooner; visible caption: “2 months and over 100 hours building this. Comment ‘Founder’ if you want me to send you the free repo.”

## Evidence boundary

The public Facebook page was inspected in a browser. The ~90-second vertical reel visually showed an AI-run business/“Optimal Engine” dashboard. The page did not expose a usable speech transcript, subtitle track, or complete written list of what was said. **This document is an audit of the identifiable product and its published source, not a claim to have transcribed every spoken word or recovered undisclosed source code.** The author's own GitHub project is a substantially better reproducible source for identifying the components and limitations of the demonstration.

Primary repository: https://github.com/Bennettxai/FounderOS

Examined source revision: `fb974bfcdf529cb6c8faeb1473d561d26e3d103a` (2026-10-20)

License: MIT, see https://github.com/Bennettxai/FounderOS/blob/main/LICENSE

Related fork: https://github.com/Bennettxai/OptimalEngine (upstream `Miosa-osa/OptimalEngine`)

Independent knowledge CLI referenced by the repo: https://github.com/garrytan/gbrain
Project/creator descriptions: https://founderos.sh and https://www.linkedin.com/posts/bennett-spooner_i-built-the-most-powerful-founder-os-using-activity-7473095322664308736-QCNM

## Exact source/tool inventory available publicly

| Layer | Source of truth | What it does / what it does not prove |
| --- | --- | --- |
| Web shell | `README.md`, `app/`, `package.json` | v3 uses Next.js 14, local SQLite and GladOS; previous v2 is Go/SvelteKit, v1 Next.js, each tagged separately. |
| One-person AI business control | `founderos/`, `lib/agents/` | Agents board, departmental tasks, chat, Conductor, run history; integrations and state depend on local configuration. |
| Agent execution | `lib/agents/runtime.ts`, `lib/agents/conductor.ts`, `lib/agents/real.ts` | Runtime and orchestration code, not a blanket guarantee that each demo agent completes production work. |
| System graph | `lib/blueprint/compile.ts`, `lib/blueprint/graph.ts`, `lib/blueprint/hierarchy.ts` | Builds a graph from actual agent, connector, skill and store registries; high-value pattern for evidence-driven system maps. |
| Knowledge | `lib/brain.ts`, `lib/connectors/gbrain.ts`, `lib/connectors/obsidian.ts` | Searches Markdown via optional `gbrain`, with plain-text fallback. `gbrain` is external, not the identity of FounderOS. |
| Connector status | `lib/connectors/index.ts`, `lib/connectors/types.ts`, `lib/swr.ts` | 28 registered status checks; demo-mode statuses are scripted, while actual statuses are cached with freshness windows and depend on setup. |
| Business records | `lib/db-ext/`, `lib/demo/`, `demo-data/` | Local database and demo fixtures. The sample company, 22 demo agents, 24 funnel journeys and 180 knowledge pages are fictional. |
| Settings/security | `middleware.ts`, `lib/creds.ts`, `README.md` | Single-operator password, local-only default before password setup, server-side secret handling; **not a multi-tenant production access model**. |
| Tests | `tests/`, `package.json` | Automated tests cover many features, but do not establish real connection to an unspecified user's accounts. |

### The 28 connector status registrations, exactly as declared

Source: https://github.com/Bennettxai/FounderOS/blob/main/lib/connectors/index.ts

| Category | Registry IDs | Count |
| --- | --- | ---: |
| Brain | `gbrain` | 1 |
| Orchestration | `llm`, `superset` | 2 |
| Social | `whatsapp`, `zernio`, `beehiiv`, `manychat`, `apify` | 5 |
| CRM | `attio`, `webinarjam`, `trakyo`, `ghl`, `fathom` | 5 |
| Ads | `meta-ads` | 1 |
| Creative | `foreplay`, `arcads`, `miro` | 3 |
| Local | `wispr`, `local-stack` | 2 |
| Knowledge | `obsidian`, `plaud` | 2 |
| Email | `email` | 1 |
| Calendar | `calendar` | 1 |
| Communications | `slack` | 1 |
| Payments/financial | `payments`, `robinhood`, `phantom` | 3 |
| Other | `notion` | 1 |
| **Total** | | **28** |

The source also contains supporting `openai-stt.ts`, `whatsapp-send.ts` and `manychat-webhook.ts`; these are **supporting source modules, not three additional entries** in the 28-check registry. `payments` may include Stripe/PayPal; `calendar` uses `gcal.ts`. An advertised connector, status-check function, or a logo in a video is not evidence that the operator connected, paid for, or used it successfully.

### Product areas actually represented in the project

- **Command:** home, wizard, inbox/communications.
- **Revenue:** client funnel, brand deals, clients, finances, trading.
- **Growth:** social, AdPilot, creative engine, analytics, content lab, lead magnets.
- **Workforce:** agents, chats, tasks, workflows, skills, compute, org chart.
- **Knowledge:** brain/Optimal Engine, database, knowledge, drift.
- **System:** settings, integrations, usage, blueprint and roadmap.

See the [project README](https://github.com/Bennettxai/FounderOS#whats-inside) for the maintained route list. Claims in promotional material about number of agents, revenue, or business results should be treated as marketing unless independently corroborated by production records. Current README expressly calls the preloaded organization fictional.

## Platform fit and action ranking

| Candidate | Decision | Magnanimous-specific reason |
| --- | --- | --- |
| Registry-compiled, source-truth ecosystem blueprint | **Implement** | Turns existing Magnanimous provider/capability declarations into a trustworthy owner-visible system graph, with no invented dependencies or fake connection successes. |
| More visible evidence/freshness status | **Follow-on** | Add authenticated, opt-in zero-cost probes later only for supported providers; separate configured, authenticated, functional and executing states. |
| Unified departmental command center | **Reuse existing, deepen selectively** | Magnanimous already has owner operations, capability mesh, agency command, CRM, social, funnels and specialist orchestration; avoid duplicate dashboards. |
| Markdown/`gbrain` knowledge importer | **Optional later** | Could enhance native memory intake, but external CLI remains replaceable and cannot own Magnanimous memory or identity. Prefer local import boundary and author-controlled provenance. |
| Copy the fictional sample company or '37 active agents' promotion | **Reject** | A visually impressive demo must not be confused with connected real-world operation. |
| Auto-connect all 28 external tools / auto-purchase usage | **Reject** | Would require credentials, spending authority, consent and security review; several connectors can be paid or financially sensitive. |
| Adopt the entire MIT repo wholesale | **Reject** | Would conflict with Magnanimous identity, existing production stack, isolation, owner controls and upgrade path. License permits reuse, but technical fit and attribution remain important. |

## Implemented, independently authored improvement

This branch adds `worker/src/magnanimous-ecosystem-blueprint.js`, which derives a graph from the **existing Magnanimous ecosystem registry**, not from FounderOS and not from video screenshots. The owner-only read endpoint `GET /api/ecosystem/blueprint` is protected by the existing authentication and GET-only gates in `magnanimous-ecosystem-runtime.js`. The existing Owner Capability Mesh adds an on-demand button to inspect grouped providers, declared capabilities, dependencies and graph integrity; it is explicitly labeled **source-mapped, not live-verified**.

Properties:

1. Preserves Magnanimous as the sole brain/identity; external providers remain replaceable tools.
2. Rejects duplicate IDs, invalid IDs, mismatched registry counts, missing capability coverage and dangling graph edges.
3. Omits missing dependency relationships with an integrity warning instead of inventing an endpoint.
4. Exposes no credential values, starts no new paid probes or provider writes, and makes no deployment.
5. Adds a deterministic security/contract test in `qa/scripts/magnanimous-ecosystem-blueprint-lock.mjs`, wired into the existing ecosystem CI workflow.

## Verification and release boundary

Verified locally: blueprint contract test, existing ecosystem identity/safety lock, Node syntax checks, frontend TypeScript/production build, Wrangler **dry-run only**, and `git diff --check`. The dry-run compiled the Worker and frontend assets without deploying them.

**Deployment remains intentionally separate.** Merging to `main` could start an automatic paid Cloudflare deployment. Do not merge or deploy until the user/platform confirms available Cloudflare quota and desired release timing. No Facebook comments, payments, account provisioning, credentials, private-source extraction or external provider writes were performed.
