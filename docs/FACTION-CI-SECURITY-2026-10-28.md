# Faction-informed CI supply-chain hardening — 2026-10-28

**Scope:** I AM MAGNANIMOUS WAY™; incremental, free-first security hardening based on latest `main` commit `2f286b36bf588b270bf93e1ba6da1e7ab10a707d`. This is original Magnanimous engineering, not Faction software or a purchased Faction audit.

## Public research and evidence boundaries

- Faction's public Conveyor Belt page (https://www.gofactiongroup.com/conveyor-belt/) lists CI/CD and version control among 13 production engineering domains and describes entry review, remediation, staging and exit review. Those are **marketing/methodology descriptions**, not an independent validation of Magnanimous.
- Faction's Facebook security reel (https://www.facebook.com/reel/1873276024056468) was previously reviewed through visible caption/summary only; no complete audio transcript was verified.
- The public Reel inventory and first 10 opening-caption triages are in `docs/FACTION-PRODUCTION-RESEARCH-2026-10-28.md`. This change does **not** claim any additional full video viewing or the entire catalog.
- Official GitHub Actions documentation (https://docs.github.com/en/actions/reference/security/secure-use) recommends minimizing token exposure and managing action/dependency trust. These recommendations are independent of Faction's claims.

## Implemented in this branch

In `.github/workflows/full-platform-qa.yml`:

1. Disable persisted checkout credentials for the **code-health** job, which does not require post-checkout Git authentication.
2. Replace three `npm install --no-audit --no-fund` calls with `npm ci --no-audit --no-fund` for frontend, worker and QA, using committed lockfiles. This makes dependency resolution fail closed if manifests and lockfiles disagree.
3. Point Node setup caches to the actual committed package-lock files for frontend, worker, video-gateway and QA.
4. **Preserve** the browser-QA checkout's authenticated Git read capability: its later `git fetch` retrieves the exact successful deployed commit. Removing credentials there would break that fetch after the repository is made private. This is a documented exception to revisit with a narrowly scoped ephemeral fetch credential.

No homepage, billing, customer, Cloudflare, production, or database file is changed.

## Test and release evidence

- Source-transform invariants checked before GitHub write: two original checkout blocks, three original npm installs, four expected lockfile cache references, and existing 13-layer security / production inventory steps present.
- Post-edit static assertions: code-health checkout credential persistence disabled; browser-QA baseline-fetch exception retained; three `npm ci` installs present; no `npm install --no-audit --no-fund` remains.
- **Not yet verified:** complete GitHub CI on this branch, production typecheck/build, live deployed revision, independent penetration testing, Cloudflare quota.
- Before merge, require green source/build/security CI and inspect any failed job. Do not bypass required checks. After merge, check the production deployment result; documentation/workflow-only changes may legitimately skip runtime deployment.

## Risk and next backlog

- An earlier offline workflow review reported 264 medium findings, chiefly mutable action tags, persisted checkout credentials and permission scopes. This PR remediates a **small subset**, not all findings.
- Review `.github/workflows/audit-live-qa-backlog.yml` separately before running: it accesses Cloudflare D1 remotely and uploads training backlog data. Confirm data classification, artifact access and quota first; do not trigger it automatically while the allowance is unknown.
- Review `.github/workflows/deep-qa-training-content-audit.yml`: it can push generated changes to main. Confirm exact dependencies and change controls before modifying it.
- Pin trusted third-party actions to verified immutable commits incrementally; avoid guessing SHA values or changing all workflows blindly.
- Test cross-tenant isolation, mobile visual composition, release rollback and production smoke only with authorized resources and documented evidence.

**Assurance limit:** source/CI improvements are not an external security certification, an independent penetration test or proof that the deployed service is healthy.
