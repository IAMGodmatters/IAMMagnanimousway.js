# Private-repository cutover: verified readiness and owner controls

Status, 2026-10-24: **NOT PRIVATE**. The live GitHub metadata for
`IAMGodmatters/IAMMagnanimousway.js` reported `private:false` during this
review. Track the outstanding action in issue #695. Do not treat source
obfuscation, anti-clone code, license notices, or a private UI route as a
substitute for GitHub's actual repository visibility control.

## Safe source delivery implemented

- The OCI Telecom guest does **not** pull from GitHub or receive a GitHub token,
  deploy key, repository URL, or branch in cloud-init/instance metadata.
- Oracle Cloud Shell keeps Git authentication locally. Its existing plan-only
  and `--apply` safeguards remain.
- After reviewing a successful Always Free apply, the owner verifies the OCI
  SSH host key and runs `telecom-core/oci/publish-source.sh PUBLIC_IP`.
- That utility uploads **only committed `telecom-core/` files**, without the
  application frontend, AI worker, Git history, or untracked local secrets.
  It requires strict SSH host-key checking, refuses an existing remote source,
  and executes the established OCI preflight after installation.
- `telecom-core/oci/cloud-init.yaml.tftpl` now deliberately waits for this
  authenticated delivery. Existing live instances must not be blindly
  reprovisioned; review Terraform plan/drift and host contents first.

## Owner-only account settings that still need verification

1. **Costs:** the repository has 115 workflows as of this checkpoint. Public
   standard GitHub-hosted Actions usage is free; in private repositories,
   standard runners draw from the owner's included plan allowance and can
   accrue charges beyond it. Do not assume today's usage fits the free quota.
   Inspect **Settings → Billing & licensing → Usage**, review monthly minutes,
   and set an Actions budget with **Stop usage when budget limit is reached**
   before changing visibility. Confirm the applicable GitHub plan and current
   limits at that time. Do not authorize billing or upgrades implicitly.
2. **Enforced checks:** on GitHub Free, official GitHub branch protection and
   rulesets are offered for public repositories; private-repository enforcement
   is documented for Pro, Team, or Enterprise. **Changing to private on Free
   may remove enforceable `main` protection.** Source-code CI checks and
   CODEOWNERS files are not a substitute for server-enforced merge policies.
   Verify the account plan and desired protection availability first.
3. **Deployment:** verify the connected GitHub App and every Cloudflare/other
   deploy integration retains explicit read permissions for private repos.
   Confirm branch secrets, Actions permissions, publishing and production
   smoke checks after cutover; never publish private code as an artifact.
4. **Existing exposure:** GitHub warns public forks remain public and detach
   when a repository is made private. Changing visibility cannot erase copies
   already obtained when source was public.
5. **GitHub Pages:** verify whether Pages is being used; on GitHub Free,
   converting a public repo to private can unpublish a Pages site.

## Release gate

- [ ] Owner has reviewed billing usage and applied a no-spend Actions budget.
- [ ] Owner accepts the native branch-protection tradeoff, or verifies an
      eligible plan without new unapproved charges.
- [ ] GitHub settings changed by an authorized owner; metadata says `private:true`.
- [ ] GitHub App and deployment scopes verified after change.
- [ ] `Private Repository Readiness`, `Anti-Clone Hardening`,
      `Proprietary Security Invariants`, `Clone Exposure Watch`, full platform
      QA, code-owner checks, and production smoke all pass after the change.
- [ ] Issue #695 closes only after the above have evidence.

Primary references:

- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility
- https://docs.github.com/en/actions/concepts/billing-and-usage
- https://docs.github.com/en/billing/how-tos/set-up-budgets
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets
