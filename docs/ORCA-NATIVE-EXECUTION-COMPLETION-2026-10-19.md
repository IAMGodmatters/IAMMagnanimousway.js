# Orca-inspired native completion — 2026-10-19

## Owner decision and scope

Continue merged PR #716 without replacing Magnanimous AI. Add useful agent work coordination, execution observability, and safe OpenAPI-to-MCP transformation **inside Magnanimous**. No Orca runtime, provider identity, proprietary dependency, paid service, customer-visible redesign, or uncontrolled external request is introduced.

## Implemented feature 1 — supervised parallel development

Native module: `worker/src/magnanimous-parallel-supervisor.js`.
Owner-only API: `POST /api/magnanimous/dev-agent/parallel/plan`.

Input:
```json
{
 "repo":"IAMGodmatters/IAMMagnanimousway.js",
 "base_ref":"main",
 "max_concurrency":2,
 "budget_usd":0,
 "tasks":[
  {"id":"fix-mobile","title":"Improve mobile navigation","files":["frontend/app/page.tsx"],"depends_on":[],"maximum_cost_usd":0},
  {"id":"test-mobile","title":"Add mobile QA","files":["qa/tests/mobile.spec.ts"],"depends_on":["fix-mobile"],"maximum_cost_usd":0}
 ]
}
```

Returns deterministic dependency waves, conflicting file detection, per-task proposed namespaced branches and explicit budget bounds. Work is **not executed** by the planning API. GitHub branches, writes, pull requests and merges remain on the existing owner-only, staged-and-confirmed Magnanimous Dev Agent action path. Execution of parallel workers requires an authorized local/remote sandbox harness. This design prevents a planning endpoint from becoming an unrestricted cloud spending or arbitrary shell API. Approval for repository writes remains in force.

## Implemented feature 2 — OpenAPI to MCP contract generation

Native module: `worker/src/magnanimous-openapi-mcp.js`.
Owner-only API:
- `POST /api/magnanimous/api-contract/mcp-preview` with `{"material":<OpenAPI 3 JSON object>}`
- `POST /api/magnanimous/api-contract/mcp-stage` with `{"material":<OpenAPI 3 JSON object>,"acknowledge_draft_only":true}`
- `GET /api/magnanimous/api-contract/mcp-drafts` lists owner-owned drafts

Generates MCP `tools/list`-compatible `name`, `description`, `inputSchema` from OpenAPI 3.0/3.1 contract documents. Query/path params and JSON body schemas are handled with bounded sizes; unresolved references and unsupported composition are rejected instead of guessed. Methods are classified read or external-write, with all drafts `enabled:false`, `approved:false`, `executable:false`, and `cost_estimate_usd:null`.

A bounded database registry preserves staged drafts within the owner tenant. Draft generation makes **zero API calls**. Publishing or invoking tools requires a separate vetted adapter, provider identity, customer authorization, consent, payment and cost coverage. This is real offline transformation and persistence, **not** an already-connected live upstream service.

## Implemented feature 3 — MCP execution diagnostics

Native module: `worker/src/magnanimous-tool-traces.js`.
Owner/admin API: `GET /api/magnanimous/tools/traces`.

Actual MCP tool calls now emit bounded metadata-only event spans: tenant and user IDs, server/tool names, success/failure, latency in milliseconds, response size in bytes, sanitized error category and timestamp. The dashboard API provides recent spans, count, success count, mean latency and worst latency grouped by tool. The retention period is 30 days. Raw prompts, tool input values, result bodies, bearer secrets and untrusted provider error strings are not written to the trace ledger. Cost is explicitly `null` when provider billing cannot be verified. Existing Magnanimous audit events remain; errors in the trace write are reported as `trace_recorded:false` without blocking the user tool response.

## Security and limitations

- All functionality remains provider-neutral and subordinate to Magnanimous AI.
- Stage/preview and parallel planning are guarded by existing platform owner authentication. Trace dashboards require owner/admin.
- No automatic purchases, API execution, repo writes or paid compute in these new endpoints.
- Isolation is **planned** for parallel workers; an actual provisioned parallel coding sandbox/worker is not claimed.
- OpenAPI draft is **not** a live generated connector; credentials, executable adapters and high-risk write consent remain separate.
- Standard MCP tool execution is still delegated to the existing registered server capability gateway; it has not been replaced.
- No existing user-facing images, Stripe pricing, billing/telecom regulatory gates or Shopify boundaries were changed.
- CI passing establishes source/regression proof; production requires successful post-merge deploy and smoke evidence.

## Verification

`node qa/scripts/magnanimous-orca-completion-lock.mjs` checks safe parallel waves, overlaps, cycles, unsafe paths, cost caps, OpenAPI schema/refs/method classifications, no auto execution, privacy metadata, owner authorization and route wiring. Existing MCP schema-drift, API contract intelligence and developer-agent regression locks remain in CI.

Sources and capability catalog: `docs/ORCA-ECOSYSTEM-CAPABILITY-AUDIT-2026-10-19.md`. No third-party Orca source was copied.
