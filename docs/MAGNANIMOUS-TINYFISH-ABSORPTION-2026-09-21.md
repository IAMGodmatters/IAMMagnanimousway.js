# Magnanimous TinyFish Capability Absorption — 2026-09-21

## Scope and legal boundary

This release turns TinyFish from a required web-agent service into an optional fallback for the capabilities Magnanimous has independently implemented.

The implementation is clean-room: it uses TinyFish's public documentation and observable API contracts as a capability checklist. It does **not** copy TinyFish source code, hidden prompts, proprietary model weights, credentials, private infrastructure, anti-bot internals, residential proxy network, or restricted data.

Magnanimous AI remains the identity, planner, memory owner, policy layer, verifier, and orchestration brain. Browser execution is performed by the Magnanimous Local Bridge with local Chromium/Playwright.

## Public capability map

| TinyFish public surface | Magnanimous-owned equivalent | Status / truth boundary |
| --- | --- | --- |
| Search API | `browser_search` | Native local Chromium search; no TinyFish runtime |
| Fetch API | `browser_fetch` | JavaScript-rendered text, links, optional HTML and structured CSS fields |
| Fetch batch (up to 10 URLs) | `browser_fetch_batch` | Implemented with per-URL result/error collection |
| Agent async run | Native Web run queue | Implemented with durable Local Bridge task lifecycle |
| Agent run listing/get/cancel | Native Web run APIs | Implemented |
| Agent batch runs | `POST /api/magnanimous/native-web/runs/batch` | Up to 100 queued native runs |
| SSE progress/status | `GET /api/magnanimous/native-web/runs/:id/stream` | Status/heartbeat/final-result stream; not a claim of per-browser-step video streaming |
| Natural-language goal | `/api/magnanimous/native-web/goals` | Magnanimous planner creates bounded browser steps |
| Structured output | CSS extraction + research `output_schema` synthesis | Implemented; schema synthesis depends on configured Magnanimous AI execution engine |
| Research API | `browser_research` + Magnanimous synthesis | Search, fetch evidence, source-backed report |
| Saved research/run retrieval | Native task persistence in platform DB | Implemented for task/run results |
| Completion webhooks | Public HTTPS `webhook_url` | Best-effort native delivery from Local Bridge result completion |
| Browser profiles | Local Chromium profiles | Create/list/manual-login/delete supported; secrets stay local |
| Vault/password-manager behavior | Local browser profile authentication | No password-manager dependency; remote secret values are rejected |
| Browser session create/read/action/end | Local persistent browser sessions | Implemented in the Local Bridge process; no public remote CDP tunnel |
| Browser screenshot | JPEG screenshot operation | Implemented with size limits |
| HTML/page snapshots | Native snapshot/extraction | Implemented |
| Live preview | On-demand session screenshot/status | No managed live video stream claimed |
| Page monitor | Native fetch monitor | Implemented |
| Topic monitor | Native search monitor | Implemented |
| Monitor pause/resume/delete | Native monitor lifecycle | Implemented |
| Monitor run-now | `POST /api/magnanimous/native-web/monitors/:id/runs` | Implemented |
| Usage reporting | `GET /api/magnanimous/native-web/usage` | Native task counts; no third-party wallet required |
| Proxy support | Local authenticated proxy or per-run unauthenticated proxy | Implemented; no owned residential/geo fleet claimed |
| Stealth / managed anti-bot network | No false equivalent claimed | Provider-specific proprietary infrastructure remains optional/external |
| Remote Browser API / CDP tunnel | No public tunnel claimed | Local outbound task control is the Magnanimous design |
| CLI | Existing Local Bridge CLI + provider-neutral HTTP contract | No dedicated TinyFish-compatible CLI claimed in this release |
| MCP / integrations | Magnanimous universal connector/tool layer | Provider-neutral routing; no TinyFish dependency |
| Wallet / metered browser credits | Not required for native path | Native path runs on owner-controlled compute/Internet |

## Native endpoints added or expanded

- `GET /api/magnanimous/native-web/capabilities`
- `GET /api/magnanimous/native-web/parity`
- `GET /api/magnanimous/native-web/usage`
- `POST /api/magnanimous/native-web/research`
- `POST /api/magnanimous/native-web/fetch-batch`
- `POST /api/magnanimous/native-web/runs`
- `POST /api/magnanimous/native-web/runs/batch`
- `GET /api/magnanimous/native-web/runs/:id`
- `GET /api/magnanimous/native-web/runs/:id/stream`
- `POST /api/magnanimous/native-web/runs/:id/confirm`
- `POST /api/magnanimous/native-web/runs/:id/cancel`
- `POST /api/magnanimous/native-web/profiles`
- `DELETE /api/magnanimous/native-web/profiles/:profile`
- `POST /api/magnanimous/native-web/sessions`
- `POST /api/magnanimous/native-web/sessions/:id/read`
- `POST /api/magnanimous/native-web/sessions/:id/actions`
- `DELETE /api/magnanimous/native-web/sessions/:id`
- `GET /api/magnanimous/native-web/monitors/:id`
- `POST /api/magnanimous/native-web/monitors/:id/runs`

## Safety and ownership rules

1. Browser navigation is public-web only. Localhost, private-network, link-local and reserved targets remain blocked.
2. Remote tasks cannot carry password/secret field values.
3. Authenticated proxy credentials stay on the Local Bridge.
4. Interactive click/fill/select/press work remains exact-confirmation gated.
5. Non-default profile deletion remains confirmation gated.
6. Browser sessions are process-local and are truthfully reported unavailable after bridge/session loss.
7. No generic shell or arbitrary process execution is introduced.
8. TinyFish is not imported or required by the Native Web runtime.
9. External websites, Internet connectivity and hardware capacity remain real physical dependencies.
10. A capability is only reported ready when the paired Local Bridge actually advertises the required action.

## Result

Magnanimous now owns the reusable software contract for search, rendered fetch, batch fetch, research evidence collection/synthesis, browser workflows, profiles, sessions, monitoring, run lifecycle, webhooks and usage accounting.

TinyFish may still be used as an optional fallback if the owner chooses, but the supported native path does not require TinyFish credits, a TinyFish wallet, or TinyFish runtime access.
