# Security-review and enterprise procurement evidence — 2026-10-27

Product: I AM MAGNANIMOUS WAY™ / Magnanimous AI  
Source reviewed: https://www.facebook.com/reel/1873276024056468 (The Faction Group LLC)  
Repository baseline: `IAMGodmatters/IAMMagnanimousway.js`, `main` at `7bb06bb8635147419d3760942dad71bde4e03af8`  
Owner constraints: zero new paid dependencies, no Cloudflare mutation while usage is exhausted, preserve approved homepage and desktop artwork, protect customer isolation, keep outside services subordinate to Magnanimous AI.

## What the reel says and what it does not establish

The accessible caption and Facebook's visible AI-generated summary advocate three steps:

1. Prepare answers and evidence for enterprise security questionnaires before the sales stage.
2. Establish an audit-to-penetration-test sequence, described as a "13-layer production audit" followed by a penetration test.
3. Maintain a buyer-facing security page to address common questions.

The visible material did **not** specify the 13 layers, publish an audit methodology, or supply an independent penetration-test report. The spoken audio was not independently transcribed. The 13 layers below are a **new, original Magnanimous checklist**, not an attributed reproduction of The Faction Group's proprietary method.

## Implemented on this change

- `qa/scripts/security-procurement-evidence.mjs`: executes 13 selected offline application checks, reports each check's result and evidence path, fails closed on any failing check, and distinguishes all local source checks from production assessment or a penetration test.
- `.github/workflows/full-platform-qa.yml`: runs that check in the existing code-health job on branch/PR QA without requiring a Cloudflare request or new paid service.
- `frontend/app/security/page.tsx`: adds buyer security-review FAQ and explicit external-attestation boundaries while preserving existing content, homepage artwork, page routes, and mobile layout.

Initial **local** run: **13/13 local checks passed**. These are regression/invariant checks against the code checkout; this result does not establish that live production is free of vulnerabilities. GitHub CI, deployment, and a live buyer-page smoke test must still pass before calling this published.

## Thirteen areas and evidence scope

| # | Security-review layer | Local evidence script | What a pass supports |
| --- | --- | --- | --- |
| 1 | Password storage | `password-security-lock.mjs` | Password-hashing regression contract |
| 2 | Multi-factor authentication | `totp-auth-lock.mjs` | TOTP implementation contract |
| 3 | Session verification | `opaque-session-downstream-auth-lock.mjs` | Opaque downstream session handling |
| 4 | Tenant/owner boundaries | `white-label-brain-lock.mjs` | Source-level ownership separation |
| 5 | Consequential actions | `consequential-actions-lock.mjs` | Action authorization guard placement |
| 6 | Webhook integrity | `webhook-security-lock.mjs` | Signature, freshness and replay invariants |
| 7 | Provider credentials | `provider-runtime-env-auth-lock.mjs` | Runtime credential contract |
| 8 | Variable-cost protection | `billing-cost-shield-lock.mjs` | Cost gate regression contract |
| 9 | Customer data privacy | `business-ai-history-privacy-lock.mjs` | Historical data-privacy checks |
| 10 | Untrusted tool execution | `magnanimous-orca-execution-security-lock.mjs` | Tool-execution safety contracts |
| 11 | Frontend dependency baseline | `next-security-baseline-lock.mjs` | Committed Next.js security minimum |
| 12 | GitHub CI/repository invariants | `proprietary-security-invariants-lock.mjs` | Repo/workflow guard contract |
| 13 | Security entrypoint & hardening | `full-platform-hardening-lock.mjs` | Central security and release invariants |

Every layer is a separate source check. A complete assessment must also inspect its corresponding deployed control, test negative cases with two distinct tenant accounts, and preserve dated results. No automated source-check score should be represented as an independent auditor opinion, penetration test, or formal certification.

## Procurement questionnaire answer policy

For a legitimate buyer, prepare a versioned answer record with the exact environment, answer owner, answer date, supporting evidence, limitations, and a named follow-up for each question. Never put secrets, raw customer records, detailed security weaknesses, or exploitable diagrams on the public site. At minimum cover:

- Legal entity/contracting party, subprocessor categories, authorized regions, retention/deletion, and incident contacts.
- Authentication, MFA, sessions, least privilege, white-label tenant separation, account deprovisioning, and audit trails.
- Encryption and key handling, backups and restore exercises, vulnerability response, secure development and dependency checks.
- Payment handling, Stripe webhook verification, metering and variable-cost ceilings; accurately distinguish card processor controls from platform controls.
- Subcontracted AI/model use, prompt/content retention by downstream services, and customer control boundaries.
- Penetration-test date/scope/report owner, remediation evidence, any actual certifications and attestation periods.

If evidence does not exist, answer "not independently verified" or "not available" and give a correction plan. Do not answer "yes" from an architecture diagram alone.

## Authorized penetration-test sequence (not yet completed)

1. Obtain a named testing owner, written scope and rules of engagement for each domain/API and staging tenant; specify rate, time, prohibited destructive operations, rollback and reporting contacts.
2. Map the application to OWASP ASVS 5.0 control objectives and use OWASP WSTG/APITop10 scenarios for manual and tool-assisted coverage. Follow NIST SP 800-115 for planning and evidence discipline.
3. Start with safe staging verification of auth bypass, tenant ID swapping, horizontal/vertical permission escalation, webhook spoof/replay, IDOR/BOLA, input/output injection, CSRF/CORS and AI tool-call authorization.
4. Test browser/egress and sandbox isolation, model/provider routing and limits, Stripe activation after confirmed payment, and cross-tenant data exposure with test data only.
5. Record severity, affected revision/endpoint, reproduction evidence, owner, fix, and independent retest. Do not run aggressive DAST against production or Cloudflare-limited systems without an approved window.
6. Obtain a dated independent report when a qualified assessor is available; only then consider a precise statement about assessed scope and remaining findings.

Standards and methodology (official sources):

- OWASP ASVS 5.0: https://asvs.owasp.org/
- OWASP WSTG: https://wstg.owasp.org/
- OWASP API Security Top 10 (2023): https://api-security.owasp.org/editions/2023/en/0x11-t10/
- NIST SP 800-115: https://csrc.nist.gov/pubs/sp/800/115/final

## Repository workflow audit (independent local tool)

The offline maintainer-workflow auditor identified **264 medium** findings and **zero high/critical** findings in the inspected repository checkout. Dominant patterns: action tags not pinned to immutable commits (`MD-WF-003`), checkout credentials allowed to persist (`MD-WF-006`), and some missing explicit top-level workflow permissions (`MD-WF-001`). Example locations: `.github/workflows/audit-live-qa-backlog.yml` and `.github/workflows/webhook-security-check.yml`. The auditor's safe-only patch generator emitted an empty patch, meaning these remediations need human-reviewed workflow changes, not that findings are harmless.

Priority: review workflows that handle deployment or secrets first. Confirm each action's upstream commit before pinning, add `persist-credentials: false` where subsequent Git authentication is unnecessary, restrict `GITHUB_TOKEN` permissions, and retest workflow dependencies. Do not mechanically edit all 264 sites without verifying required write scopes and actions; not all findings have equivalent exposure.

Repository metadata at review time still described the repository as **public**. Making it private requires validating production deploy access and repository automation permissions first. The workflow audit did not inspect live GitHub rulesets, installed Apps, branch protection or connected infrastructure accounts.

## Tomorrow's gated queue — 2026-10-28, Asia/Manila

1. Recheck the Cloudflare usage/allowance and free-plan limits first; if still exhausted, stop Cloudflare-dependent tests and do not upgrade or spend.
2. Inspect the new security-review pull request and current main; verify the 13 offline checks and frontend typecheck/build via CI. Fix any failures rather than waive gates.
3. Merge only after review and green required checks; verify the actual deployment revision through the existing release pipeline, without duplicate/repeated requests during a quota outage.
4. Verify `https://iammagnanimousway.com/security/` on phone and desktop after a confirmed deploy, including truthful FAQ, navigation and accessibility; do not change approved homepage artwork.
5. Validate production health, request/response controls and security metadata with low-volume smoke checks only once quota allows; do not call a source check a production assessment.
6. Triage the 264 workflow findings by real secret/deploy exposure, beginning with token scoping and trusted action versions; implement staged changes with review.
7. Prepare a scoped, non-destructive staging penetration-test plan and procurement evidence tracker. An independent report remains outstanding.
8. Preserve all billing gates, tenant authorization, logging privacy and no-paid-service defaults; report actual evidence, remaining blockers and next actions.

This queue is a plan, not an assertion that any future system work has already executed.
