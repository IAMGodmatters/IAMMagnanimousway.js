# Magnanimous Platform Continuity Checkpoint

**Reviewed:** 2026-11-23 (Asia/Manila)  
**Repository:** `IAMGodmatters/IAMMagnanimousway.js`  
**Production:** https://iammagnanimousway.com/  
**Authoritative branch:** `main`  
**Verified main SHA:** `5abe2daa750a206986f117e1187811962db483f3`

This checkpoint preserves verified state and the next safe actions across chat or automation interruptions. It is an evidence ledger, not a claim that every platform capability is complete.

## 1. Current source and production evidence

- Current `main` points to `5abe2daa750a206986f117e1187811962db483f3`, whose merge commit includes PR #991 (Magnanimous-native marketing department skills, resources and chat integration).
- Production deployment [#44955867893](https://github.com/IAMGodmatters/IAMMagnanimousway.js/actions/runs/44955867893) completed successfully on 2026-11-21.
- The production deployment's Worker deployment and production smoke jobs succeeded. The same main revision has successful mobile visual, Business Operations, voice, Telecom, SEO, full-platform surface audit and standalone offline-bundle verification evidence.
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

[PR #992](https://github.com/IAMGodmatters/IAMMagnanimousway.js/pull/992) is a draft against the current main. Its latest reviewed head at this checkpoint is `7f6f82849874787c5b9ffa022ad15f563acb3d4f`.

It adds effective-rule inspection, approval/check requirements, strict up-to-date enforcement, bypass validation, and a fail-closed production build gate. A further hardening change binds both required contexts to GitHub Actions integration ID `15368`; a same-named check from another app or an unbound “any source” check is rejected.

At the time of this checkpoint, 27 check runs had succeeded, 2 were still running, and none had failed. The standalone bundle build and exact-head Full Platform QA were among the running checks. There were no submitted human reviews. Keep this PR in draft until exact-head checks finish and independent review is completed.

**Important deployment consequence:** after PR #992 is merged, the next main production build will intentionally fail closed until the real GitHub ruleset meets the requirements and the workflow has a least-privilege read-only token able to inspect effective rules and bypass actors. Do not merge it before the owner has configured those settings and the audit token if required.

Required owner configuration:
1. Require at least one pull-request approval.
2. Require `Code health and builds` and `verify-command-architecture`, each bound to GitHub Actions app ID `15368`.
3. Require the branch to be up to date.
4. Remove unrestricted `always` / `exempt` bypass modes; retain only narrow PR-scoped exceptions if needed.
5. Configure a least-privilege read-only `RULESET_AUDIT_TOKEN` only if the Actions token cannot read the required ruleset data.

Repository privacy is a separate owner action. Before switching to private, verify GitHub Apps, Actions permissions and included minutes, release artifacts, deployment integrations and any unauthenticated source fetch. Keep Actions spending capped at zero; do not enable paid overage.

## 5. Open engineering work and truthful boundaries

| Area | Current boundary | Tracking |
|---|---|---|
| Vibe Studio | Phase 1 is a native, owner/customer-scoped single-file HTML prototype builder with D1 checkpoints and an opaque-origin client preview. It does not run arbitrary server code. | [#790](https://github.com/IAMGodmatters/IAMMagnanimousway.js/issues/790), [#791](https://github.com/IAMGodmatters/IAMMagnanimousway.js/issues/791) |
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
2. Start Vibe Studio Phase 2 with bounded multi-file static projects and per-file checkpoints, then design the isolated full-stack runner separately. Never execute arbitrary customer code inside the production Worker.
3. Complete genuine C2PA signing/verification.
4. Verify actual Telecom public-host and carrier paths, keeping regulatory authority gated.
5. Prove TV/Kids playback and authenticated actions.
6. Recover Reels and Railway only through verified no-spend paths; preserve customer data and volumes.
7. Continue Social Studio analytics/recurring campaigns and the internal 3-D rollout.
8. Investigate Cloudflare CPU with per-Worker telemetry before changing limits.

## 8. Historical review limitation

This checkpoint reconciles retained project-history summaries, current GitHub source, issues, pull requests, Actions evidence and the latest available deployment/hosting observations. It does not claim that every raw historical ChatGPT transcript has been individually re-read. Continue to reconcile future chat interruptions against repository state and exact deployment evidence before changing anything.
