# Magnanimous Vibe Studio Phase 2 — multi-file static projects

**Implementation branch:** `feature/vibe-studio-multifile-static-20261123`  
**Base:** `main` at `5abe2daa750a206986f117e1187811962db483f3`  
**Scope:** first Phase 2 slice; multi-file static projects, not a server-side full-stack runner.

## What this slice adds

- A separate `/vibe-studio/files` owner workspace, linked from the existing single-file builder.
- A virtual `index.html` backed by the existing project row, preserving every Phase 1 project and revision.
- Tenant- and user-scoped auxiliary files: CSS, JavaScript, JSON fixtures and Markdown.
- Independent immutable per-file revisions and optimistic revision checks.
- A local ZIP export using the ZIP Store format; no server-side archive service or paid dependency.
- Preview assembly that injects local CSS and JavaScript and exposes valid JSON fixtures as `window.MAGNANIMOUS_FIXTURES`.
- An opaque-origin iframe with `sandbox="allow-scripts"`, restrictive CSP, no same-origin permission, no form submission, and no network connections.
- D1 limits: 20 files including `index.html`, 65,536 UTF-8 bytes per auxiliary file, and 262,144 UTF-8 bytes for the complete project.
- Path validation that rejects traversal, absolute paths, hidden files, unsupported extensions, dependency manifests and attempts to overwrite `index.html` through the auxiliary-file API.
- No file-delete endpoint in this first slice; existing checkpoints are preserved.

## API contract

All routes require the existing owner authentication and current-user resolution. The customer Code Studio alias retains its existing paid-plan check and uses the same tenant/user scoping.

- `GET /api/magnanimous/vibe-studio/projects/:id/files` — list bounded auxiliary files.
- `POST /api/magnanimous/vibe-studio/projects/:id/files` — create one supported text file and its first checkpoint.
- `PUT /api/magnanimous/vibe-studio/projects/:id/files/:path` — update one file with its expected revision.
- `GET /api/magnanimous/vibe-studio/projects/:id/files/:path/versions` — list file checkpoints.
- `GET /api/magnanimous/vibe-studio/projects/:id/files/:path/versions/:revision` — read a specific checkpoint.

The project and file records are always filtered by project ID, tenant ID and user ID. The new migration is `0113_magnanimous_vibe_multifile.sql`.

## Preview and fixture behavior

- `index.html` remains the entry document.
- All stored `.css` files are injected as inline styles in stable path order.
- All stored `.js` files are injected after the document body in stable path order.
- Valid `.json` files are exposed by relative path in `window.MAGNANIMOUS_FIXTURES`.
- The preview CSP denies connections and external resource loading. It is a browser preview, not a VM, production host or security certification for exported files.
- CSS and JavaScript are inserted through DOM `textContent` after safe JSON serialization, not concatenated into raw HTML tags; JSON fixtures round-trip without parser-visible `</script>` sequences.
- File create/update requests are streamed through a 512 KiB transport cap, decoded as fatal UTF-8 JSON, and reject non-string content and unsupported control characters before D1 writes.
- JavaScript is classic browser script only; module imports and Node `require` are rejected. It may use only browser-local behavior that works in the opaque sandbox; server APIs, credentials and production data are not provided.

## Verification added

The existing `magnanimous-vibe-studio-lock.mjs` now checks:
- supported and rejected file paths;
- UTF-8 byte limits and JSON validity;
- CSS/JS preview-breakout protections;
- new D1 tables and revision keys;
- tenant/user-scoped runtime queries;
- optimistic file revision conflict handling;
- UI authentication, iframe restrictions, fixture wiring and ZIP generation;
- mobile workspace layout and route linkage.

The lock remains in the existing Full Platform QA and production-deploy verification chain. The feature branch still requires exact-head CI and review before merge. No production deployment or D1 migration has been applied by this change.

## Deliberate limitations

This slice does **not** add arbitrary package installation, shell/terminal access, server-side code execution, React/Next.js/FastAPI/Flutter builds, database provisioning, per-project secrets, public preview URLs, browser automation, app-store packaging, GitHub writes or production deployment. Those require a separate isolated runner with hard CPU/memory/disk/time limits, network-deny-by-default, signed artifacts, tenant-bound previews, explicit approval and rollback.

The editor remains an accessible plain-text fallback in this slice; syntax highlighting and richer multi-file refactoring remain follow-up work. No proprietary app-builder source, paid sandbox, commercial WebContainer API or new paid dependency was introduced.

**Magnanimous AI remains the project brain.** The workspace is a native extension of Vibe Studio, not a separate provider identity.
