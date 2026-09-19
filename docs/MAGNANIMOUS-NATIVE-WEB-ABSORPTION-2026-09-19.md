# Magnanimous Native Web Absorption — 2026-09-19

## Purpose

Magnanimous AI now owns a native-first web execution contract so routine browser/search/extraction work does not require TinyFish. This is an original Magnanimous implementation built from public/observable capability patterns. It does not copy TinyFish source code, hidden prompts, proprietary browser infrastructure, model weights, credentials, or anti-bot internals.

Magnanimous remains the brain, memory, policy, task queue, verification layer, and owner of the native browser contract. The execution surface is a paired Magnanimous Local Bridge running local Chromium through Playwright.

## Capability replacement matrix

| Observable web-agent capability | Magnanimous-owned implementation | Current status |
| --- | --- | --- |
| Fresh web search | `browser_search` via local Chromium with structured results | Implemented; evidence-gated by Local Bridge heartbeat |
| Rendered page fetch | `browser_fetch` after JavaScript page load | Implemented |
| Clean text / link extraction | rendered body/selector text + bounded link extraction | Implemented |
| Structured extraction | CSS field map + element extraction in browser flows | Implemented |
| Multi-step browsing | `browser_read_flow` and `browser_action_flow` | Implemented |
| Natural-language web-agent goal | Workers AI planning department converts the goal to a bounded native browser plan | Implemented; interactive plans remain confirmation-gated |
| Click / fill / select / press | confirmed interactive browser flow | Implemented with exact-task confirmation |
| Screenshots | bounded JPEG screenshot capture | Implemented |
| Page snapshots / elements | snapshot, text, links, element metadata | Implemented |
| Persistent browser sessions | local Chromium user-data profiles | Implemented |
| Credential-assisted session reuse | manual local profile setup; credentials stay local | Implemented without server-side password transport |
| Run creation | `POST /api/magnanimous/native-web/runs` | Implemented |
| Goal run creation | `POST /api/magnanimous/native-web/goals` | Implemented |
| Run listing | `GET /api/magnanimous/native-web/runs` | Implemented |
| Run status/result | `GET /api/magnanimous/native-web/runs/:id` | Implemented |
| Run cancellation | `POST /api/magnanimous/native-web/runs/:id/cancel` | Implemented for queued/confirmation-waiting runs |
| Consequential action approval | `POST /api/magnanimous/native-web/runs/:id/confirm` | Implemented |
| Wait/poll lifecycle | owner UI auto-poll + status endpoint | Implemented without holding a serverless request open |
| Scheduled monitoring | D1 monitor records + existing 15-minute Cloudflare cron | Implemented for read-only search/fetch |
| Proxy support | optional proxy configured locally on the bridge | Implemented as local configuration |
| Browser engine | local Chromium installed with Playwright | Implemented |
| Provider independence | native APIs report `tinyfish_required:false` | Implemented |
| Owner control UI | `/owner-web-agent` | Implemented |

## Security boundaries

- No generic remote shell is added.
- No arbitrary process-run API is added.
- The Local Bridge remains outbound-only over HTTPS.
- Browser actions are page-scoped rather than raw operating-system keyboard/mouse control.
- Remote tasks cannot carry a password/secret field value.
- Authentication is performed through a visible local browser and retained only in a local browser profile.
- Browser navigation is restricted to public HTTP(S) targets; localhost, private, link-local, reserved, and multicast targets are rejected.
- Read-only search/fetch/read flows can be queued automatically.
- Interactive click/fill/select/press workflows are high-risk and require confirmation for the exact queued task.
- Result sizes and browser-flow step counts are bounded.
- Device revocation still invalidates the Local Bridge token.

## Free-first architecture

Playwright and Chromium are installed on the paired owner computer. The native search/fetch/browser path does not require a per-run TinyFish payment. Cloudflare remains the control plane and task queue; the browser itself runs locally.

Existing Local Bridge installations require one deliberate activation rerun after this release so the local agent and Chromium dependency are upgraded. The installer reuses a valid existing pairing instead of creating another device unnecessarily.

## Truth boundary: what is not cloned

Magnanimous does **not** claim ownership of or equivalence to TinyFish proprietary internals. The following remain external/provider-specific capabilities unless Magnanimous independently builds and verifies an equivalent later:

- TinyFish's proprietary agent/model internals.
- Its managed anti-bot or stealth infrastructure.
- Its managed residential/proxy fleet and provider-specific geo routing.
- Any private CAPTCHA-solving arrangement or site-specific bypass.
- Any proprietary browser observability implementation not exposed through public contracts.

Magnanimous can use a locally configured proxy when the owner chooses, but that is not represented as a managed proxy network.

## Native-first routing rule

For supported browser work:

1. Magnanimous plans and applies policy.
2. Prefer native Local Bridge + Chromium when the required capability is heartbeat-verified.
3. Keep account credentials in local browser profiles.
4. Require exact confirmation for interactive/consequential actions.
5. Verify the returned evidence/result.
6. Record reusable lessons and monitor state in Magnanimous.
7. Use an outside browser agent only as an optional fallback when a needed capability is not yet available natively.

This turns TinyFish from a dependency into an optional execution fallback while keeping Magnanimous AI as the identity and control layer.
