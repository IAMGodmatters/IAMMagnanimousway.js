# Magnanimous Platform Continuity Checkpoint

**Reviewed:** 2026-11-24 (Asia/Manila)  
**Repository:** `IAMGodmatters/IAMMagnanimousway.js`  
**Production:** https://iammagnanimousway.com/  
**Authoritative branch:** `main`  
**Verified main SHA:** `5abe2daa750a206986f117e1187811962db483f3`

This checkpoint preserves verified state and the next safe actions across chat or automation interruptions. It is an evidence ledger, not a claim that every platform capability is complete.

## 0. Continuation update — 2026-11-24

- The authoritative `main` still resolves to `5abe2daa750a206986f117e1187811962db483f3`; the latest merged change is PR #991, which registers the native Magnanimous Marketing Department skills/resources in chat and the Capability Mesh.
- PR #998 is open and **ready for review**, not merged. Its exact head is `5dd234c5915574159200c6212e581b2d3e268f73` (36 commits, 11 changed files); **28/28 workflow runs succeeded**. Full Platform QA code health/builds passed; the local Playwright suite reports **17/17 journeys passed**, including save/preview/add/export; the SQLite-backed D1 handler test passed; Full Platform Surface Audit, independent change review, Cloud Exit Lock and standalone offline release-bundle verification passed. The runtime test covers migrations, owner authentication, paid-customer tenant isolation, nested paths, immutable revisions, stale-write conflicts, duplicate paths, UTF-8 byte limits, request/file/project/count limits and no-publication/deletion safeguards. The PR-triggered Browser and functional QA job remains skipped by the quota-conscious policy, so the local journey is not live production browser proof. No PR #998 migration or code has been deployed. It is held from merge until the live main ruleset is configured to require reviews and exact-head checks; no bypass was used.
- PR #992 remains open and unmerged at `43819b9efc9bac0be81366ba991757bd12eb9c75`; all 31 associated workflow runs succeeded. No human review has been submitted, and no GitHub ruleset or repository-visibility settings were changed by this continuation.
- Code-editor research for the next Vibe Studio slice: official CodeMirror describes its current editor as MIT-licensed, accessible and mobile-supported, while a 2026 iOS Safari discussion reports missing text-selection drag handles. Keep the existing textarea fallback and test real iOS touch selection before replacing it: https://codemirror.net/ and https://discuss.codemirror.net/t/ios-safari-missing-selection-drag-handles/9679 .
- Media-provenance research for issue #787: the C2PA specification binds a signed manifest to the asset and bases trust on the signer's credential; the official c2pa-rs SDK is dual MIT/Apache but beta 0.x and requires Rust 1.96+, while the official Node binding requires Node 22+ and native binaries. Keep it out of the Cloudflare Worker runtime; use an isolated media execution service only when available, require an authorized signer, and mark unsupported/missing-signer outputs unverified: https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification and https://github.com/contentauth/c2pa-rs and https://github.com/contentauth/c2pa-js/tree/main/packages/c2pa-node .
- BasicDeploy fresh read: authenticated Free account is **over quota but not suspended**; disk usage is 2,592,528,856 bytes (~2.41 GiB) against 2,147,483,648 bytes (2.00 GiB), database 7,602,703 bytes, container filesystem 1,282,883,584 bytes; all 3 containers are sleeping. No container was woken and no files, databases or S3 objects were inspected/deleted.
- Railway fresh read: all 5 Magnanimous Standalone services remain offline, with no active deployments or staged changes; the 500 MB `magnanimous-persist` volume remains attached. Historical logs show the old Reels no-handler audit and wrong browser Dockerfile path; current main Reels shell and all five Dockerfiles/config paths are now correct, but no redeployment was attempted because no funded/authorized no-cost Railway deployment path is confirmed. Preserve the volume and custom domain binding.
- GitHub repository metadata still reports visibility `public`. The current GitHub connector exposes repository metadata and source/PR operations but not a ruleset or visibility mutation operation. The Opera browser connector did not respond during a read-only connection check.


## 1. Current source and production evidence

- Current `main` points to `5abe2daa750a206986f117e1187811962db483f3`, whose merge commit includes PR #991 (Magnanimous-native marketing department skills, resources and chat integration).
- Production deployment [#44955867893](https://github.com/IAMGodmatters/IAMMagnanimousway.js/actions/runs/44955867893) completed on 2026-11-21 for this main SHA. Wrangler uploaded Worker `iam-magnanimous`; Cloudflare reported Version ID `d753e443-640e-473f-b989-a693399c3532`.
- The Worker-only production smoke passed (health, connector, public API fallback, auth status and owner-only Capability Mesh routing). Native Store API verification passed with 8 visible products, 0 checkout-ready, 8 availability-pending, 4 categories and delivery countries PH/US. Reels verification passed only for the branded HTTP 503 outage fallback and alternatives; the underlying Reels service remains unavailable.
- Precision: the full production smoke step was **skipped** because this commit had no Worker-native session-plane-sensitive changes. Do not describe this as a full-platform production smoke. The same main revision has successful mobile visual, Business Operations, voice, Telecom, SEO, full-platform surface audit and standalone offline-bundle verification evidence.
- On the same main commit, browser/functional QA later completed successfully in [run #45009142757](https://github.com/IAMGodmatters/IAMMagnanimousway.js/actions/runs/45009142757). The standalone *deployment* job was skipped; an offline bundle build is not proof that the Railway services are online.
- The two required check contexts were observed on main as `Code health and builds` and `verify-command-architecture`. Both current check runs came from the GitHub Actions integration, app ID `15368`.

## 2. Merged capabilities to preserve

- **Native Social Publishing Calendar — PR #989:** merged. First milestone supports one-time scheduling for YouTube, TikTok and LinkedIn through the existing 15-minute Worker cron. Draft-first, exact-content/account/time approval, tenant quotas, media preflight, idempotent claims, cancellation and uncertain-outcome reconciliation are part of the implementation. No provider accounts were activated and no posts were published by the engineering work.
- **Magnanimous-native Marketing Department — PR #991:** merged. Native marketing skills/resources are registered in Magnanimous chat and the Capability Mesh; marketing remains a department under the Magnanimous brain.
- **Native Store control board — PR #983:** merged. Owner status distinguishes mapped/connected products from products that are not ready to purchase.
- **Virtual Assistant palace and approved internal artwork corrections — PRs #959 and #960:** merged. Preserve the approved gold-and-blue homepage artwork and the exact brand treatment. Do not add a trademark to God Matters artwork; use the requested Magnanimous wording on Magnanimous artwork.

## 3. Native Store — last verified production state

Last verified on 2026-11-19:
- 8 visible products.
- 0 checkout-ready products.
- 8 shown as Coming Soon / availability pending.
- 4 categories.
- Public API checks found no Shopify checkout destination and no exposed private supplier IDs/costs.
- Supplier-backed purchasing remains disabled until exact supplier product/variant mapping, authentication, balance and shipping checks succeed.

Do not represent the store as ready for purchases until a live supplier-backed test passes. No supplier purchase or paid activation is authorized.

## 4. Critical GitHub security state

The repository remains **public**.

Read-only inspection on 2026-11-23 found:
- Active repository ruleset ID `23050541`, name `Protect main`, targeting the default branch.
- Its only configured rules are `deletion` and `non_fast_forward`.
- It has no pull-request approval rule and no required-status-check rule.
- Bypass actors RepositoryRole ID `5` and Integration ID `1144995` both use unrestricted `always` bypass.
- The branch object reports `protected: true`, but its legacy protection details show `enabled: false` and required checks `off` with no contexts. The `protected` flag alone is not sufficient proof of enforcement.
- The connected GitHub read-only path cannot read the legacy branch-protection endpoint (HTTP 403); the repository ruleset detail endpoint did return the configuration above.

### PR #992 — fail-closed main-ruleset audit

[PR #992](https://github.com/IAMGodmatters/IAMMagnanimousway.js/pull/992) is open and ready for independent review against the current main. Its latest head at this checkpoint is `43819b9efc9bac0be81366ba991757bd12eb9c75`.

It adds effective-rule inspection, approval/check requirements, strict up-to-date enforcement, bypass validation, and a fail-closed production build gate. A further hardening change binds both required contexts to GitHub Actions integration ID `15368`; a same-named check from another app or an unbound “any source” check is rejected.

Subsequent hardening added explicit bypass-actor permission diagnostics, moved the audit into a separate short-lived GitHub App job, isolated the token from all build dependencies, and rejected manual deployment dispatches from non-main refs. On the latest head (`43819b9efc9bac0be81366ba991757bd12eb9c75`), **31/31 associated workflow runs completed successfully, zero failed, and zero remain pending**. This includes Full Platform QA, the standalone offline-bundle build and the automated independent-change-review workflow. There are still no submitted human pull-request reviews; automated checks do not replace independent approval. PR #992 remains open and unmerged until the owner configures the real ruleset and safely installs the dedicated audit app described below.

**Important deployment consequence:** after PR #992 is merged, the next main production deployment will intentionally fail closed until the real GitHub ruleset meets the requirements and the audit app is installed. GitHub omits `bypass_actors` unless the API caller has write access to the ruleset. The separate audit job therefore mints a short-lived GitHub App installation token with repository `Administration: write`, scoped to this repository only. It uses the token only for GET requests and the token is revoked when the audit job ends; the deployment job and npm build never receive it.

Required owner configuration:
1. Require at least one pull-request approval.
2. Require `Code health and builds` and `verify-command-architecture`, each bound to GitHub Actions app ID `15368`.
3. Require the branch to be up to date.
4. Remove unrestricted `always` / `exempt` bypass modes; retain only narrow PR-scoped exceptions if needed.
5. GitHub omits `bypass_actors` unless the API caller has write access to the ruleset. The current Actions token cannot read this bypass list. After main protections are enforced, create a dedicated GitHub App installed on this repository only with repository `Administration: write`. Store its Client ID as the Actions variable `RULESET_AUDIT_APP_CLIENT_ID` and its private key as the Actions secret `RULESET_AUDIT_APP_PRIVATE_KEY`. The workflow requests only that permission for a short-lived installation token, uses it for GET requests in the isolated audit job, and revokes it when the job ends. Do not create/install the app or add its private-key secret before unreviewed workflow edits are blocked.

Repository privacy is a separate owner action. Before switching to private, verify GitHub Apps, Actions permissions and included minutes, release artifacts, deployment integrations and any unauthenticated source fetch. Keep Actions spending capped at zero; do not enable paid overage.

## 5. Open engineering work and truthful boundaries

| Area | Current boundary | Tracking |
|---|---|---|
| Vibe Studio | Phase 1 is a native single-file HTML prototype builder. Draft PR [#998](https://github.com/IAMGodmatters/IAMMagnanimousway.js/pull/998) stages the first Phase 2 slice: tenant/user-scoped CSS/JS/JSON/Markdown files, per-file checkpoints, local ZIP export and isolated static preview. Latest head `dc238d4` adds a local Playwright journey and a SQLite-backed D1 runtime test; exact-head CI is running. No production migration has been applied. No arbitrary server execution or package installation. | [#790](https://github.com/IAMGodmatters/IAMMagnanimousway.js/issues/790), [#791](https://github.com/IAMGodmatters/IAMMagnanimousway.js/issues/791) |
| Media provenance | C2PA signing and verification through actual exports remains unfinished. A JSON sidecar alone is not sufficient proof. | [#787](https://github.com/IAMGodmatters/IAMMagnanimousway.js/issues/787) |
| Telecom / Contact Center | Code and CI contracts do not prove a public carrier route. Public-host TLS, trusted certificate, real carrier agreements, regulatory authority and two-way media must be independently verified. Never claim NTC authority or live calling without evidence. | Active telecom and carrier readiness records |
| TV / Kids | Authenticated actions and actual Kids playback need browser and production verification; a loading page or route 200 is not playback proof. | [#738](https://github.com/IAMGodmatters/IAMMagnanimousway.js/issues/738) |
| Internal 3-D | Continue route-by-route rollout while preserving the approved homepage artwork and desktop/mobile separation. | [#741](https://github.com/IAMGodmatters/IAMMagnanimousway.js/issues/741) |
| Cloudflare CPU | Historical CPU-limit exceedances need worker-level telemetry and a bounded reproduction; do not buy a higher plan as a substitute for root-cause analysis. | [#743](https://github.com/IAMGodmatters/IAMMagnanimousway.js/issues/743) |
| Reels / BasicDeploy | Last inspected 2026-11-22: reported storage was about 2.41 GiB against a 2.00 GiB free allowance; three containers were asleep and read-only filesystem inspection returned HTTP 402. Recheck before acting. Do not delete customer media or upgrade without approval. | [#944](https://github.com/IAMGodmatters/IAMMagnanimousway.js/issues/944) |
| Railway standalone services | Last inspected 2026-11-22: five services were offline. Do not assume a successful offline bundle build means deployed services are live. Preserve persistent volumes; no paid activation without authorization. | [#828](https://github.com/IAMGodmatters/IAMMagnanimousway.js/issues/828) |
| Social Studio | First one-time scheduling milestone is merged. Month/week views, recurring/bulk campaigns, analytics and additional providers remain. | [#878](https://github.com/IAMGodmatters/IAMMagnanimousway.js/issues/878) |

## 6. Permanent architecture and operating rules

- Magnanimous AI remains the platform's identity, memory owner, reasoning, policy, orchestration, verification and decision layer.
- Specialist agents and departments operate beneath that brain; providers are replaceable infrastructure.
- Prefer native/free-first capabilities. Do not silently create subscriptions, overages, paid API use, GPU use, carrier spend or supplier purchases.
- Preserve working functionality; improve by additive changes and regression tests.
- Payment activation requires confirmed Stripe state and idempotent webhook handling. Show terms, recurring billing and affirmative acceptance before charging.
- Enforce tenant isolation, least privilege, consent, DNC/opt-outs, quiet hours, audit trails and data minimization.
- Keep Shopify separate from the native Magnanimous Store.
- Never claim a feature is deployed, connected, production-ready or legally authorized without evidence.
- Do not use an old ZIP, stale branch or outdated commit over current `main`.

## 7. Next execution order

1. Finish exact-head CI and independent review of PR #992; coordinate owner ruleset configuration before merging because its deployment gate is intentionally fail-closed.
2. Finish review and exact-head CI for Vibe Studio Phase 2 first slice in draft PR #998; then continue syntax-aware editing, multi-file browser QA and a separately isolated full-stack runner. Never execute arbitrary customer code inside the production Worker.
3. Complete genuine C2PA signing/verification.
4. Verify actual Telecom public-host and carrier paths, keeping regulatory authority gated.
5. Prove TV/Kids playback and authenticated actions.
6. Recover Reels and Railway only through verified no-spend paths; preserve customer data and volumes.
7. Continue Social Studio analytics/recurring campaigns and the internal 3-D rollout.
8. Investigate Cloudflare CPU with per-Worker telemetry before changing limits.

## 8. Historical review limitation

This checkpoint reconciles retained project-history summaries, current GitHub source, issues, pull requests, Actions evidence and the latest available deployment/hosting observations. It does not claim that every raw historical ChatGPT transcript has been individually re-read. Continue to reconcile future chat interruptions against repository state and exact deployment evidence before changing anything.
