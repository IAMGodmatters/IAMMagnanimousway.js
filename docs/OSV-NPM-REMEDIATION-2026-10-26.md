# NPM vulnerability remediation — 2026-10-26

Evidence: OSV scan run 40351867721 returned actionable security advisories for `next@16.4.0`, `sharp@0.35.4` and `undici@7.29.0 / 7.29.1`.

Implemented as narrowly as practical:
- frontend: `next@16.4.1`
- worker: `undici@7.30.1` via npm override, retaining original Wrangler version
- video-gateway: `sharp@0.35.5`, `undici@7.30.1` via npm overrides, retaining original Wrangler version

The repository's existing Dependency Lockfiles CI regenerated all affected package-lock.json files with `--package-lock-only --ignore-scripts --no-audit --no-fund`. Inspect lockfile package inventories before merging.

Review requirements: all original security and QA gates must run on the **new lockfile commit**; a GitHub Actions `action_required` status is not a passed test. Do not merge on that status. Any production-impacting change needs exact-commit deploy and authenticated smoke verification after merge. No third-party CodeRabbit service, paid scan, billing modification, or license breach was introduced.

Separate Python vulnerability remediation is tracked under PR #808. Passing this npm-only PR does not prove OSV results are zero until the Python service fixes are merged and a new repository-wide scan passes.
