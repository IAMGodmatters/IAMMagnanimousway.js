# Magnanimous HCTI Capability Absorption — 2026-10-02

## Goal

Reproduce the useful public capability patterns of HTML/CSS to Image (HCTI) inside Magnanimous AI with original Magnanimous-owned code, existing native services, open interfaces, and provider-neutral contracts.

This is a clean-room capability implementation. It does **not** copy HCTI private source code, private APIs, credentials, infrastructure, hidden prompts, trade secrets, or branded implementation details.

## Public research sources reviewed

- HCTI getting started and API docs
- HTML/CSS rendering and URL screenshot docs
- PNG/JPG/WebP/PDF format docs
- template creation, updates, versioning and rendering
- batch image creation and deletion
- signed image/template URL documentation
- MCP integration and MCP tool catalog
- Management API overview
- scoped API key management
- proxy management
- storage destination management
- Open Graph configuration management
- Terraform and Pulumi Infrastructure-as-Code documentation
- current pricing/features page

The authoritative source list is recorded in:
`worker/src/magnanimous-hcti-capability-registry.js`.

## Native Magnanimous implementation

### Rendering engine

Magnanimous already owned the required lower-level services:

- `magnanimous-runtime/services/browser-service.mjs` — hardened self-hosted Chromium with safe-egress URL snapshot rendering, PNG screenshots and PDF printing.
- `magnanimous-runtime/services/media-service.mjs` — ImageMagick transformation for JPG/WebP and bounded resize/crop/quality/watermark operations.
- `magnanimous-runtime/src/object-store.mjs` — first-party object storage for render artifacts.
- Magnanimous Native Web / Local Bridge — Playwright-based interactive browser workflows for cases that need live page behavior, selectors, full-page capture or user-authenticated browser state.

The browser service now also exposes `/render-content` for self-contained HTML/CSS rendering. It strips script and navigation primitives, adds a deny-by-default Content Security Policy, disables browser background networking, and renders a local file snapshot.

### First-party API

`worker/src/magnanimous-native-rendering.js` exposes:

- capability/readiness summary
- direct HTML/CSS render
- public URL render
- PNG/JPG/WebP/PDF output
- bounded viewport sizing, device scale and render delay
- batch rendering (1–25 items)
- tenant-scoped reusable templates
- immutable template version history
- template-variable rendering
- render artifact listing/get/delete
- batch deletion
- usage and stored-byte accounting
- private hosted artifact delivery backed by Magnanimous Object Store

### MCP exposure

The Magnanimous Universal Connector now exposes:

- `magnanimous_render_capabilities`
- `magnanimous_render_html`
- `magnanimous_render_url`
- `magnanimous_render_batch`
- `magnanimous_render_templates`
- `magnanimous_render_template_versions`
- `magnanimous_render_template_create`
- `magnanimous_render_template_update`
- `magnanimous_render_template`
- `magnanimous_render_images`
- `magnanimous_render_usage`

These tools remain under the existing Magnanimous OAuth/scope, audit, session, tenant and security boundaries.

## HCTI-pattern coverage

| Public capability pattern | Magnanimous target | Current status |
| --- | --- | --- |
| HTML/CSS → image | Browser `/render-content` | Implemented |
| Public URL → image | safe-egress Browser `/render` | Implemented |
| PNG | Chromium screenshot | Implemented |
| PDF | Chromium print-to-PDF | Implemented |
| JPG/WebP | Media Transform | Implemented |
| viewport/device scale/delay | Chromium flags | Implemented |
| image list/get/delete | render ledger + Object Store | Implemented |
| batch create/delete | Native Rendering API | Implemented |
| usage accounting | render ledger | Implemented |
| templates | native template table | Implemented |
| template versions | append-only template versions | Implemented |
| template rendering | Native Rendering API | Implemented |
| hosted output | Object Store private file route | Implemented |
| selector/full-page live page capture | Native Web / Local Bridge Playwright | Existing mapped capability |
| cookie-banner/browser interaction | Native Web / Local Bridge | Existing mapped capability |
| signed public render URLs | auth-scoped private delivery is used instead | Deliberately not copied one-for-one |
| API-key management | existing scoped Magnanimous OAuth/connector tokens | Existing equivalent |
| proxy management | controlled Browser Egress / cloud desired-state | Existing mapped capability |
| external S3-compatible destinations | provider-neutral cloud/object-storage adapters | Existing mapped capability |
| OG image configuration | templates + metadata workflow | Mapped; not falsely claimed as a turnkey domain router |
| Terraform/Pulumi patterns | Magnanimous Cloud desired-state/IaC compatibility | Existing mapped capability |
| provider MCP | Magnanimous Universal Connector | Implemented equivalent |

## Security boundaries

1. Public URL rendering keeps the Magnanimous safe-egress SSRF protections and redirect revalidation.
2. HTML/CSS rendering is self-contained by design. It cannot silently fetch arbitrary third-party scripts or network resources.
3. Renderer child processes use `shell:false`.
4. Artifacts and metadata are tenant scoped.
5. Provider credentials are not required for the native path and are never returned by this API.
6. Existing Magnanimous authorization, audit and rate/security postflight paths remain in force.
7. A mapped contract is not reported as a working native feature until the actual execution path exists and is verified.

## Provider independence

HCTI may remain an optional future adapter if the owner deliberately configures it for capacity or a provider-only feature, but no HCTI account or wallet is required for the native rendering path implemented here.

Magnanimous AI remains the brain, owner of workflow state, templates, policies, routing, memory, verification and artifact lifecycle. Chromium, ImageMagick, object storage and any future capacity provider remain replaceable execution infrastructure.
