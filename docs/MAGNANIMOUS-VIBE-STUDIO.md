# Magnanimous Vibe Studio — native-first visual app builder

## Audit and scope

The platform already had Magnanimous Dev Agent, God Coding, native white-label app prototypes, GitHub staged repository actions, Tool Foundry, source-reading and exact-head CI. It did **not** have an integrated owner-owned workflow to describe a working app, preview its code visually, iteratively refine it, compare source, save immutable project versions, and export a single-file demo.

This original native Vibe Studio implementation addresses that **single-file prototype** gap. No proprietary app-builder source, logos, private APIs, prompts, or third-party code were copied. Competitive references used for functional benchmarking include the publicly documented experiences at:
- https://v0.app/
- https://lovable.dev/
- https://bolt.new/
- https://replit.com/
- https://docs.github.com/en/codespaces/overview
- https://docs.github.com/en/actions

These links are reference material, not required or automatically connected services.

## Owner experience

- `/vibe-studio` — private, responsive gold-and-blue builder accessible via Owner Center, God Coding and Developer Agent.
- Create a working initial HTML/CSS/JavaScript prototype from a natural-language idea. Automatic template selection recognizes landing pages, dashboards, tasks/checklists, basic calculators, forms, and portfolios.
- Run in a manually started, opaque-origin `iframe sandbox="allow-scripts"` with network-denying Content Security Policy and no same-origin permission.
- Edit the complete source directly; compare AI-suggested code to the current source, accept to the **unsaved editor only**, revalidate and preview.
- Save owner-scoped D1 projects and immutable checkpoints. Compare/restore without deleting previous versions. Optimistic revision checks prevent stale overwrites.
- Export a local single-file HTML prototype. Export is **not** publication and is not guaranteed secure outside the preview.
- AI refinement uses existing owner-only, advisory-only free-first Magnanimous Compute Accelerator; when unavailable, code editing and deterministic scaffolds still work.
- For multi-file code, tests, private GitHub commits, API/database additions or production deployment, use the existing Magnanimous Dev Agent and its separate review, approval, CI and smoke-test gates.
- The separate `vibe-coding-studio` native Agent Skill guides safe use and preserves owner authority.

## Security and privacy boundaries

1. API uses `requirePlatformOwner` plus `currentUser`; all project and revision reads/writes are limited by both tenant and user.
2. The authenticated D1 project list is capped at 25 projects, source at 65,536 characters, and history returns up to 30 revisions per project.
3. The project data remains server-side and is never inserted as trusted HTML into the outer Magnanimous page.
4. Preview code runs only after pressing Run Preview; `allow-same-origin`, top navigation, popups, forms and external network requests are disabled.
5. The Worker never `eval`s or executes prototype source. Single-file source inspection is structural only; an exported HTML file needs additional security validation before any deployment.
6. No live database/API integration, production publishing, repository write, charges, or paid services are invoked by Vibe Studio. An AI suggestion is not itself an approved file mutation.
7. The user must not place credentials or customer private records in a prototype or code prompt. The advisory model receives the current source only when the user explicitly requests a draft.

## Verification

`node qa/scripts/magnanimous-vibe-studio-lock.mjs` exercises source scaffolds, escaping, valid/blocked syntax, owner and tenant-boundary contracts, preview isolation and native routing. The check is included in Full Platform QA and the deployment gate.

A green source-code test is not proof that all buttons work live. Production verification should additionally demonstrate login/authorization denial for an unauthenticated user, project creation, live preview, source edit, checkpoint save, version restore, HTML export, and privacy isolation using **two distinct test identities**.

## Deliberate follow-on scope

This is an MVP that creates real working self-contained prototypes. A fuller multi-file vibe-coding platform additionally requires an authenticated per-project isolated server-side sandbox, application dependency installation, cross-file editing, runtime terminals and logs, automated browser tests, secrets vault, safe preview hosting, database integration, team permissions, storage quotas, rollback and deployment orchestration. Do not advertise those capabilities as live until implemented and independently verified. Never bypass cost, identity, security, CI, or publication gates to imitate another platform.

**Project identity remains Magnanimous AI.**
