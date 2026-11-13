# Faction public-source research and Magnanimous production-evidence wave — 2026-10-28

**Product:** I AM MAGNANIMOUS WAY™. **Baseline:** latest `main` after PR #841 merge (`5ab8652d8db79e4f06b1ccd680d3cc29c45ca343`).  
**Scope:** Public claims and original, zero-paid-dependency source verification. No third-party code was copied. No Faction GitHub App installed, audit purchased, or production penetration scan performed.

## Source inventory and video-batch truth

| Source | Access and observations | Evidence status |
| --- | --- | --- |
| Faction Facebook security reel: https://www.facebook.com/reel/1873276024056468 | Previously accessible caption/visible generated summary promoted procurement questionnaires, an audit followed by penetration testing, and a buyer security page. The spoken audio was not independently transcribed. | **One reel, caption/summary only**; not a complete audiovisual audit. |
| Faction Facebook Reels listing: https://www.facebook.com/people/The-Faction-Group-LLC/100091065962204/?sk=reels_tab | Public web fetch failed, but the authorized signed-in Opera browser displayed **10 reel tiles**, and their opening accessible caption text was inspected. | **10 visible reel URLs indexed**, not the entire catalog or full audiovisual transcripts. |
| Official company site: https://www.gofactiongroup.com/ | Describes audit-in / modular-build / audit-out workflow, AI-directed human-led engineering, and authorization for consequential actions. | **Public website text reviewed**. |
| Official methodology: https://www.gofactiongroup.com/conveyor-belt/ | Details staged finishing, entry and exit discovery, and thirteen named production engineering layers. | **Public website text reviewed**. |
| Official audit description: https://gofactiongroup.com/audit/ | Lists production layers, source review, live probing, risk-based findings and a paid assessment. Marketing claims are not independent assurance. | **Public website text reviewed**. |
| Public educational companion: https://mattmurphy.ai/community/ and https://mattmurphy.ai/vibecoding-diy-kit/ | Describes free engineering curriculum and a production-readiness checklist. The free materials are reference/learning resources, not licensed source code for copying. | **Public website text reviewed**. |
| Company LinkedIn: https://www.linkedin.com/company/the-faction-group-llc | Describes business-process-first AI adoption, measurable workflows, agent governance and operational readiness. Reported performance statistics were not independently validated. | **Public company profile reviewed**. |

### Facebook Reel catalog: first 10 visible tiles, 2026-10-28

**Follow-on evidence:** The later [caption-based batch 2 audit](FACTION-REEL-BATCH2-SOURCE-AUDIT-2026-10-28.md) recovers longer author-written captions for these ten items and an additional video. Together with the original security reel, it records twelve distinct identifiers. Neither batch claims the complete Facebook archive or all spoken dialogue.

The following links and opening captions were read through the authorized browser's accessibility tree. This is **title/topic triage**, not an audit of all spoken content. No automated scrolling, complete video transcripts, or claims beyond these opening lines were available. All proposed techniques are independently designed, not copied from a video.

| Reel URL | Opening topic actually visible | Magnanimous relevance / independent check | Priority and limitation |
| --- | --- | --- | --- |
| https://www.facebook.com/reel/28753552417604749 | Fine-tuning a model on company documents | Data classification, permissions, retention, provider training terms; verify actual provider contracts. | P1 privacy; rest of video not reviewed. |
| https://www.facebook.com/reel/2177096433688755 | Professionals reportedly paid to teach AI | Opportunity Vault could check original job listings and payment legitimacy. | P3; compensation claim **unverified**, no endorsement. |
| https://www.facebook.com/reel/1851094802741650 | Local GPU runs out of memory | Model sizing, capacity probes, smaller quantized-model fallback and budget caps. | P1 compute; hardware claim not independently tested. |
| https://www.facebook.com/reel/1584937932941162 | GPU scarcity and affordability | Free-first inference routing and capacity-aware fallback; compare actual provider pricing. | P2; broad market claims unverified. |
| https://www.facebook.com/reel/1665598515092077 | Public discussion about an “agent outbreak” | Per-agent identity, least privilege, audit trails and kill switches. | P1 security; no inference about unseen remainder. |
| https://www.facebook.com/reel/1731054055051523 | Major AI labs shipping consumer agents | Provider-neutral tool interfaces, approval gates and versioned capability registry. | P1 architecture; vendor claims need official release notes. |
| https://www.facebook.com/reel/1109234588581666 | Large local Mac Studio/GPU clusters | Avoid expensive default hardware; document minimal resource envelopes. | P2 cost; anecdote not benchmark. |
| https://www.facebook.com/reel/1179905091026727 | Voice-agent pauses leading to customer hangups | Instrument speech-to-first-audio latency, barge-in and fallback; test actual contact-center routes. | **P0 voice UX**; no numerical latency claim from partial caption. |
| https://www.facebook.com/reel/1452937746788882 | Open-model use through a routing provider still creates dependency | Native routing, explicit vendor egress and portable model adapters; test failure behavior. | P1 resilience; distinguish open weights from hosted inference. |
| https://www.facebook.com/reel/3017667775244130 | Ads about monetizing support tickets, emails and invoices | Never monetize or export private records without clear customer authorization; data minimization and retention. | **P0 privacy**; advertisement assertions unverified. |

The original security reel https://www.facebook.com/reel/1873276024056468 was also opened in the signed-in browser; its opening accessible text describes a polished product demo before a large meeting. The earlier security caption summary remains the only support for the audit/procurement framing. The browser did not supply a full spoken transcript.

**Official cross-checks:** OWASP ASVS for security requirements, GitHub's secure-use guidance for agent/CI privileges, official model-provider privacy and deployment policies for data retention, and direct service-level measurements for voice latency and cloud usage. A topical opening caption alone is never an implementation specification.

### Important distinction: two different thirteen-part inventories

PR #841 introduced **thirteen original Magnanimous security regression checks**. Faction's public website defines **thirteen broader production-engineering domains** (frontend, backend, database, auth, hosting, compute, CI/CD, security/RLS, rate limits, cache/CDN, scaling, logs, availability). These are **not the same framework**, and 13/13 passing local security checks does **not** mean 13/13 production domains passed. The new `qa/scripts/production-readiness-evidence.mjs` indexes candidate source evidence in each production domain and intentionally reports **zero production domains independently verified**.

### Original implementation in this wave

- Added `qa/scripts/production-readiness-evidence.mjs`, a dependency-free inventory of the 13 publicly named production domains mapped to Magnanimous-owned files and explicit outstanding verification tasks.
- A self-test creates temporary synthetic files, checks all thirteen paths, removes one, and verifies missing evidence is detected; it also verifies no domain is accidentally marked production-verified.
- Added a fail-closed **missing source evidence** step to `.github/workflows/full-platform-qa.yml`. The check makes no network calls, changes no customer records, and uses no Cloudflare quota.
- The inventory's `--json` output is machine-readable for later audit packs. `--strict` fails when a mapped path disappears, not when a production service is offline. This is **source inventory only**, not a deployment gate, penetration test, vulnerability scan, or SOC 2/ISO attestation.
- PR #841, merged at `5ab8652`, already provides source-level security regression evidence and a buyer FAQ; its checks and production readiness are not interchangeable.

## Practical improvement queue, ranked by risk

| Priority | Area | Next concrete evidence/action | Gate |
| --- | --- | --- | --- |
| P0 | Live revision and quotas | Check authorized deployment records and Cloudflare free allowance before any live requests; compare production SHA to merged main. | No paid upgrade, repeated probes, or unfunded consumption. |
| P0 | Cross-tenant security | Stage two isolated test tenants and attempt unauthorized reads/writes, session reuse, and billing escalation with synthetic data. | No intrusive production tests. |
| P0 | GitHub workflow findings | Prior local workflow auditor reported 264 medium findings (no high/critical in that tool's scope). Triage secrets/deploy workflows first; pin verified immutable action commits, use minimal token permissions and disable persisted checkout credentials where safe. | Review each workflow's actual write requirements before edits. |
| P1 | Mobile visual proof | Re-run deterministic phone/desktop captures in a healthy runner; separate Chromium/D-Bus runner failures from changed DOM/image hashes. | Preserve approved homepage and desktop art. |
| P1 | Availability and recovery | Stage rollback, restore, bounded failover and alert tests with recorded timestamps. | Do not claim disaster recovery until proven. |
| P1 | AI-agent governance | Add outcome-based acceptance tests, tool authorization, tenant-scoped agent identity, reversible actions and spending ceilings. | No agent may bypass owner/billing/tenant gates. |
| P2 | Business readiness | Make customer onboarding ask for a measurable workflow outcome and verify savings/reliability with a dated scorecard. | Do not repeat unverified vendor performance percentages. |
| P2 | Procurement evidence | Version questionnaire answers with owner/date/environment, actual logs, limitation, and independent report status. | Never publish secrets or claim certifications not obtained. |
| P2 | Faction reel research | Revisit accessible public reel URLs in batches; record link, date, title, exact claims, independent verification, implementation/license assessment and outcome. | No claim of reviewing inaccessible videos; no proprietary copying. |

## Evidence and standards

- OWASP ASVS 5.0: https://asvs.owasp.org/
- OWASP WSTG: https://owasp.org/www-project-web-security-testing-guide/
- OWASP API Top 10: https://owasp.org/API-Security/
- NIST SP 800-115: https://csrc.nist.gov/pubs/sp/800/115/final
- GitHub Actions secure-use guidance: https://docs.github.com/en/actions/reference/security/secure-use

These standards support the *method* for testing; citing them does not certify the platform.

## Verification record

- PR #841: merged, based on all 27 observed PR-triggered workflow runs concluding success; previous local source checks 13/13, frontend typecheck and build passed.
- New inventory script: self-test and syntax check performed locally on the initial equivalent implementation before GitHub branch changes; GitHub CI on this exact revision is the authoritative next gate.
- Cloudflare quota: owner reported exhausted; no authorized live usage or free allowance read was available in this run. **Unknown, treated as blocked**.
- Live deploy and mobile composition after these changes: **NOT VERIFIED**.
- Independent penetration test and security certification: **NOT VERIFIED**.
- Facebook reel catalog completeness: **NOT VERIFIED**.

The work is intentionally additive. Magnanimous AI remains the orchestrator; outside systems remain replaceable. No Shopify integration, payment activation, pricing, or visual homepage changes are included.
