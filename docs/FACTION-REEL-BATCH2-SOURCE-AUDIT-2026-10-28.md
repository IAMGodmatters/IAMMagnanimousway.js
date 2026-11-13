# Faction Group reel/video research — accessible batch 2

**Date:** 2026-10-28 (Asia/Manila)

**Platform:** I AM MAGNANIMOUS WAY™; Magnanimous AI remains the only brain/identity.

**Source page:** https://www.facebook.com/people/The-Faction-Group-LLC/100091065962204/?sk=videos

## Evidence quality and coverage

The authorized Facebook browser exposed ten reel links with **longer author-written captions**, one additional video URL/caption, and the previously audited security reel. Unique identifiable items: **12**. This improves the earlier inventory of ten preview headings plus one security reel. The page did not expose a reliable full spoken-audio transcript for these videos. Captions are evidence of **what the author wrote**, not evidence that every spoken claim was captured, independently tested, or true.

The browser initially loaded a limited set of tiles. No complete page-level total, chronological archive, automated scrolling, downloadable video archive, or permission to access private material was available. **This is not an exhaustive catalog of every video the company has ever published.** Searches for additional original reels did not establish ownership or coverage. Do not label unseen content audited.

## Exact accessible video register

| Video | Caption-supported claim/topic (paraphrased) | Verification boundary / Magnanimous action |
| --- | --- | --- |
| [28753552417604749](https://www.facebook.com/reel/28753552417604749/) | Put changing facts in retrieved documents; tune models for approved behavior. | General RAG-vs-fine-tune advice is useful but not absolute. Preserve Magnanimous-owned retrieval/memory and explicit data-training consent; no bulk document uploads. |
| [2177096433688755](https://www.facebook.com/reel/2177096433688755/) | Paid professional AI training roles, large company workforce changes, and capturing expert judgment. | Rates, rankings, layoffs and profits in the caption were **not independently verified**. Opportunity Vault must link to original jobs and warn about data rights. |
| [1851094802741650](https://www.facebook.com/reel/1851094802741650/) | Size an open-weight model for the task; 7B at fp16 needs roughly 14 GB for weights; 4-bit reduces weight footprint. | Capacity depends on tokenizer, context/KV cache, activation overhead, quantization and hardware; do not promise that model size alone proves fit. Preserve free-first GPU preflight. |
| [1584937932941162](https://www.facebook.com/reel/1584937932941162/) | Renting hardware can separate hosting from model weights and settings. | Provider access/retention, model licenses, egress, cost and tenancy determine actual sovereignty. No rental/paid cloud auto-provisioning. |
| [1665598515092077](https://www.facebook.com/reel/1665598515092077/) | Credential misuse, long-lived keys and unsupervised agents are key security risks. | The caption cites external incidents without primary evidence supplied; do not repeat incidents as established facts. Scope GitHub credentials and label legacy connected-account permissions. |
| [1731054055051523](https://www.facebook.com/reel/1731054055051523/) | Agents need one bounded job and human approval for consequences. | Independent OWASP agent guidance supports least privilege and human-in-the-loop. Preserve separate user approval, 15-minute pending-action TTL and tenant boundaries. |
| [1109234588581666](https://www.facebook.com/reel/1109234588581666/) | Own local GPU clusters only when compliance, utilization, latency or reliability requires it. | No evidence that a specific Mac Studio cluster is optimal. Existing cost shield and optional GPU tier remain; no hardware purchase. |
| [1179905091026727](https://www.facebook.com/reel/1179905091026727/) | Slow voice-agent STT → model → TTS chains can drive hangups; stream stages where supported. | The three-second scenario is illustrative, not a measured Magnanimous SLA. Current Twilio Gather/Say is **not** a streaming full-duplex pipeline; real first-audio latency needs instrumented provider/device tests. |
| [1452937746788882](https://www.facebook.com/reel/1452937746788882/) | Open-model use via a hosted router still creates a provider dependency. | Keep model routing replaceable and show actual egress/probe status. Do not call a hosted model completely local or private. |
| [3017667775244130](https://www.facebook.com/reel/3017667775244130/) | Ads promise very high value for support tickets, emails and operational records. | Ad amounts and alleged purchases/earnings are **unverified**. Never export or monetize client data automatically; owner consent, customer contracts, minimization and auditability are required. |
| [1274175121464493](https://www.facebook.com/100091065962204/videos/1274175121464493) | AI proposes code, AI reviews it, human decides whether it releases. | New video identified in the Videos tab. Adopt independent CI evidence and least-privilege deployment workflow credentials; passing tests does not replace human release authorization. |
| [1873276024056468](https://www.facebook.com/reel/1873276024056468) | Buyer security evidence, audit and penetration-testing process. | Earlier caption/summary only; exact spoken description unverified. Existing 13 security regressions do **not** certify 13 production engineering domains. |

The author captions contain further assertions about companies, pay rates and security incidents. This report deliberately does not present them as independent facts.

## Independently checked primary sources

- Official Faction [Conveyor Belt](https://gofactiongroup.com/conveyor-belt/), [audit description](https://gofactiongroup.com/audit/) and [home](https://gofactiongroup.com/) explain the company's self-described 13 production layers and human signoff. These are *marketing and methodology descriptions*, not Magnanimous test results or public source code.
- [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) separately supports least-privilege tools, scoped agency and approval for high-impact actions.
- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use) and [actions/checkout](https://github.com/actions/checkout) document job-level token permissions and opting out of persistent checkout credentials. Checkout v6 supports the opt-out even though its credential storage is safer than older versions.
- [Hugging Face Transformers quantization](https://huggingface.co/docs/transformers/quantization/bitsandbytes) describes reduced weight memory footprint; it does not guarantee runtime fit on a specific GPU.
- Refer to provider-specific official streaming and speech APIs before implementing live STT/TTS chains. No live Twilio/provider calls were performed in this audit.

**Do not conflate** The Faction Group LLC's gofactiongroup.com with unrelated products/companies named Faction (for example, help.faction.net). No external proprietary code, curriculum, agent keys, private data, images, or model weights were copied.

## Independent Magnanimous implementation — this branch

1. **GitHub deployment credentials:** Both production checkout steps explicitly discard persisted Git credentials. The source-impact job has only read-only GitHub token scope. The actual deploy job keeps its **job-local** OIDC permission because the exact-revision standalone smoke uses GitHub's OIDC request variables; removing that access would break authentication. This was detected and corrected by the security regression before commit.
2. **Agent integration permission provenance:** Existing no-row permission defaults remain compatible, but the agent's context now distinguishes legacy-default-needs-review from explicit-owner-policy. Prompts explicitly state that a connected account is **inventory, not independent execution authority**; consequential actions still require a separate, time-limited confirmation. An owner-facing permissions review UI remains future work.
3. **Regression coverage:** The existing always-on proprietary security lock now enforces credential non-persistence and exact job-local OIDC scope. A new test exercises permission mapping, explicit denial, credential non-disclosure and continuation of separate high-impact approval.

No production deploy, secret rotation, API probing, external connection, payment, credit usage, or auto-agent execution was initiated. This work does not remove or silently change legacy permission grants; it makes their provenance and review need visible.

## Remaining items (not to be reported as complete)

- **Every reel:** Only 12 distinct identifiers verified across this and the earlier audit; no source supports a complete catalog or word-for-word transcripts. Continue by discovery batches, or request original video files/transcripts for exhaustive spoken analysis.
- **Legacy connected-account policy:** Decide on a staged, tenant-scoped migration from permissive defaults to explicit grants. Do not flip production defaults without backfill, owner UI and customer impact testing.
- **Real voice latency:** Measure end-of-speech → first audible output and hangup/timeout outcomes per transport; the current Twilio webhook is not a streaming voice stack.
- **Live release:** Compare production revision, Cloudflare remaining free quota, voice and mobile evidence before merging runtime-affecting PRs. Current source audit explicitly verifies **zero of thirteen domains in production**.
- **Credential inventory:** Audit each third-party credential's actual TTL, revocation and per-run scope. Existing prompt policy is not equivalent to provider-issued short-lived credentials.
- **Security assurance:** Controlled synthetic cross-tenant tests, independent security review and production rollback proof remain outstanding.

See earlier research and implemented work: docs/FACTION-PRODUCTION-RESEARCH-2026-10-28.md, docs/FACTION-CI-SECURITY-2026-10-28.md, and docs/SECURITY-PROCUREMENT-EVIDENCE-2026-10-27.md.

## Two other user-shared Facebook reels — separate publishers

These are **not** additional Faction Group videos. They were already independently audited in earlier branches on this date, making **14 distinct identifiable video links across the three assignments** (12 Faction items + these 2). Neither earlier audit claimed full spoken transcription.

1. [Hyperautomation Labs reel](https://www.facebook.com/reel/945474591835130), originally shared as `https://www.facebook.com/share/v/1ERRMTe7g2/`: discusses *The Agency*, a collection of specialist prompt/workflow profiles by Michael Sitarzewski. The canonical source is [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) under MIT, including [`divisions.json`](https://github.com/msitarzewski/agency-agents/blob/main/divisions.json), [`tools.json`](https://github.com/msitarzewski/agency-agents/blob/main/tools.json), installers, 18 division directories and runbooks. The earlier pinned-source audit identified **268 agent definitions across 18 divisions**, not the older advertised 232/16; these are **not** 268 autonomous production services. Its independently authored, owner-only, non-executing squad planner is in **[PR #845](https://github.com/IAMGodmatters/IAMMagnanimousway.js/pull/845)**, with a full role/source inventory in `docs/AGENCY-REEL-AUDIT-2026-10-28.md` and `docs/AGENCY-AGENTS-ROLE-INVENTORY-2026-10-28.csv` on that PR's branch.
2. [Bennett Spooner reel](https://www.facebook.com/reel/2190871595165340), originally shared as `https://www.facebook.com/share/r/18ePUZJz4k/`: presents the *FounderOS* single-operator AI business command center. The primary [Bennettxai/FounderOS](https://github.com/Bennettxai/FounderOS) MIT-licensed repository exposes its Next.js/SQLite stack, knowledge interface, agent board, **28 connector-status registrations** and registry-generated Blueprint. Demo records are fictional, and connector registrations are **not** proof of authenticated live integrations. A native, read-only Magnanimous ecosystem blueprint with explicit source-vs-live-status labeling is in **[PR #846](https://github.com/IAMGodmatters/IAMMagnanimousway.js/pull/846)**, documented in `docs/FOUNDEROS-REEL-AUDIT-2026-10-28.md` on that PR's branch.

Both PRs remain **unmerged**, pending CI/release gates and the zero-new-spend Cloudflare quota check. Third-party tools and licenses are researched as possible inputs; none replaces Magnanimous's identity, memory or authorization boundaries.
