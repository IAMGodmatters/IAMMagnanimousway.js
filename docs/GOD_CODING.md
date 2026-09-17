# God Coding

God Coding is a private owner-facing software-engineering mode inside I AM MAGNANIMOUS WAY™ / Magnanimous AI.

It is not a separate AI identity and does not depend on Codex. Magnanimous AI remains the planner and orchestrator. God Coding reuses the existing Magnanimous Dev Agent repository, CI, verification, Tool Foundry, and staged-action architecture.

## Purpose

God Coding is designed for high-discipline engineering work where Magnanimous should combine repository evidence, implementation planning, security review, regression protection, CI evidence, and release verification before calling work complete.

## Owner workflow

1. Open `/god-coding` while signed in as the platform owner.
2. Enter the repository, branch/ref, and engineering goal.
3. Optionally point Magnanimous at one exact file for deeper inspection.
4. Run God Coding.
5. Review the grounded engineering analysis and evidence summary.
6. Open Magnanimous Dev Agent for repository inspection, staging, CI dispatch, PR workflow, and separately approved repository writes.

## Engineering standard

God Coding instructs Magnanimous to:

- preserve unrelated working functionality;
- inspect repository evidence before proposing changes;
- identify root causes rather than patch symptoms;
- prefer the smallest coherent safe change;
- evaluate correctness, security, privacy, accessibility, performance, and regression impact;
- name exact files and verification requirements;
- distinguish evidence from assumptions;
- avoid claiming tests, commits, deployments, or external mutations without real tool evidence;
- keep consequential repository writes behind the existing separate owner-approval boundary.

## Security and privacy

The God Coding page is owner-authenticated through the same account token boundary used by the existing Developer Agent APIs. Repository credentials stay server-side. The route is excluded from crawler indexing in `frontend/public/robots.txt`.

God Coding does not weaken the Dev Agent write gate, merge lock, repository allowlist, audit ledger, or deployment verification controls.
