# Magnanimous Vibe Studio — Native, Free-First Visual App Building

**Reviewed:** 2026-10-25  
**Identity:** Magnanimous AI / I AM MAGNANIMOUS WAY™  
**Source:** Original Magnanimous code. External products are capability benchmarks, not copied dependencies.

## What already existed

Before this release, God Coding could perform native development planning and optional advisory compute. Magnanimous Dev Agent could read/search authorized GitHub repositories and stage separately approved branches, file writes, pull requests and workflows. The white-label product contained a client-specific, draft-only app prototype builder.

**Missing:** a usable single-workspace natural-language-to-interactive-prototype workflow with code editing, isolated preview, editable revisions and direct export.

## What this release implements

Route: **/vibe-studio** (owner-authenticated). Link from Owner Center, God Coding and Dev Agent.

- **Deterministic original scaffolder** recognizes landing pages, analytics dashboards, task managers, basic calculators, validated demo forms and personal portfolios. It generates working single-file HTML/CSS/JavaScript even when no outside model is configured.
- **Visual feedback loop:** manually editable source with explicit Run Preview. The preview uses an iframe sandbox without same-origin, popups or top-navigation permission, combined with a restrictive preview CSP. An iframe is not an impenetrable VM: do not process private data or untrusted secrets in preview.
- **Optional natural-language AI refinement** via the platform's existing owner-only advisory/compute accelerator. This path is free-first and cannot call tools, write repository code, approve, merge, deploy, or silently charge. Inaccessible accelerator => manual/deterministic workflow remains available.
- **Review before accept:** AI output becomes a proposed unsaved draft, with a source comparison. The owner must explicitly accept and save.
- **Tenant-scoped D1 project persistence** via migration 0109: source and immutable revision checkpoints, optimistic concurrency checks, current-owner authentication, limits on code size and project count. The server does not execute arbitrary project HTML or JavaScript.
- **Free export** of one standalone HTML prototype. Export is not production publication or app-store registration.
- **Native Agent Skills:** original Vibe Coding Studio and four Dev Agent recipes for scaffold, iterative preview, AI review and the separately approved repository handoff.
- **Regression test:** qa/scripts/magnanimous-vibe-studio-lock.mjs, included in Full Platform QA and production deployment lock chain.

## Scope, evidence and security

The actual execution capabilities are deliberately bounded. The current studio does **not** pretend to offer a production full-stack database per customer, cloud server shell, external package installation, full Git sync, one-click public hosting or ready-made Android/iOS binaries. Those require a genuinely isolated per-project build runner, quotas, protected secrets, deployment authorization and rollback mechanisms. Preview data is only demo data; forms do not email customers and dashboard metrics are examples.

All source code and project checkpoints remain private to an authenticated owner/tenant in the platform database. The frontend never uses dangerouslySetInnerHTML for project source. CSS and HTML execution is isolated inside a constrained browser frame; generated code is untrusted and must be reviewed. Do not place tokens, financial data, private documents, or real customer details in prompts or source. Third-party models never become the Magnanimous brand or policy authority.

Developer Agent continues to enforce repository allowlists, owner authorization, staged write approvals, CI and production verification. Vibe Studio does not bypass those gates. Repository privacy, security, payment and homepage artwork remain unchanged.

## Benchmark sources and inspiration

Original implementations based on publicly documented classes of capability:
- [v0 official documentation](https://v0.app/docs/faqs): natural-language ideas, code editor, previews, Git integration and deployment workflow.
- [OpenHands](https://docs.all-hands.dev/): agentic software development tasks.
- [Aider](https://aider.chat/): repository-aware AI pair programming.
- [Continue](https://docs.continue.dev/): developer-controlled open coding assistant.
- [OWASP Secure Coding with AI](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html): sandbox and approval best practices.

These links are research references only. No proprietary source, paid tools, external credentials or provider features were cloned or automatically installed.

## Remaining expansion gates

1. **Real isolated full-stack build runner:** ephemeral Linux containers/VMs, network-deny by default, time/CPU/memory/disk quota, signed artifact, no production credentials.
2. **Structured multi-file project representation and dependency allowlists:** React/Next.js/FastAPI/Flutter generators, library licenses, version pinning, vulnerability scanning and deterministic build logs.
3. **Browser functional QA:** screenshot comparison, keyboard/mobile/device preview, test creation and genuine interaction runs against isolated build artifacts.
4. **Cloud preview URLs:** authenticated temporary preview links, explicit publication consent, reverse proxy tenant isolation and abuse controls.
5. **Promotion/deploy:** explicit approved GitHub PR, passing exact-head tests, production deployment status, release history and rollback.
6. **User-grade tiers:** only after verifying cost and billing contracts; no new charges in this release.

**Acceptance for this PR:** verify deploy checks, source tests and frontend build, confirm owner route behavior, and a production health/API smoke after deployment. Do not call full-stack hosting live until it is actually implemented and verified.
