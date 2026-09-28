# Magnanimous AI — ChatGPT Plugin + Native Web Completion

Date: 2026-09-28

## Objective

Expose I AM MAGNANIMOUS WAY™ / Magnanimous AI as a remote MCP-backed ChatGPT plugin and make the supported browser/search/research workflows independent of TinyFish per-run wallet charges.

This implementation is clean-room. It does **not** copy TinyFish proprietary source code, hidden prompts, model weights, private anti-bot systems, managed proxy infrastructure, credentials, or trade secrets. It maps public/observable browser-agent capabilities onto Magnanimous-owned code and open standards.

## Native replacement already owned by Magnanimous

The existing Local Bridge + Native Web runtime provides:

- live web search;
- JavaScript-rendered page fetch;
- 1–10 URL batch fetch;
- source-backed research;
- deterministic read-only browser flows;
- confirmation-gated click/fill/select/press flows;
- screenshots and snapshots;
- persistent local Chromium profiles;
- manual local sign-in without transmitting passwords through the platform;
- persistent browser sessions;
- run queue/status/cancel/confirm;
- completion webhooks;
- recurring search/fetch monitors;
- native run usage reporting;
- local/per-run proxy support where the operator supplies it.

The native execution path has no TinyFish wallet requirement. It still depends on the operator's computer/host, Internet connection, and any separately selected infrastructure.

## ChatGPT / MCP exposure added

The universal connector now exposes Native Web through the production `/mcp` endpoint.

Standard tools:

- `search`
- `fetch`

Magnanimous-native tools:

- `magnanimous_web_capabilities`
- `magnanimous_web_parity`
- `magnanimous_web_usage`
- `magnanimous_web_research`
- `magnanimous_web_fetch_batch`
- `magnanimous_web_read_flow`
- `magnanimous_web_runs`
- `magnanimous_web_run_get`
- `magnanimous_web_wait_for_run`
- `magnanimous_web_goal`
- `magnanimous_web_action_flow`
- `magnanimous_web_run_confirm`
- `magnanimous_web_run_cancel`
- browser profile list/create/setup/delete;
- persistent browser session start/read/action/end;
- monitor list/get/create/update/run/delete.

Tool annotations declare read-only, destructive, and open-world behavior so ChatGPT can apply the correct approval policy.

## MCP Skills extension

The connector advertises `io.modelcontextprotocol/skills` and exposes:

- `skills/list`
- `skills/get`
- `resources/list`
- `resources/read`

Static skill:

`skill://i-am-magnanimous-way/magnanimous-native-web/SKILL.md`

The skill teaches clients to prefer native search/fetch/research, preserve action confirmations, keep credentials in local browser profiles, and never claim unsupported proprietary TinyFish infrastructure.

## OAuth 2.1 / ChatGPT authentication

A first-party OAuth 2.1 authorization-code + PKCE S256 layer is included so authenticated MCP use does not depend on custom API-key support in ChatGPT.

Discovery:

- `GET /.well-known/oauth-protected-resource`
- `GET /.well-known/oauth-authorization-server`

OAuth:

- `POST /oauth/register` — Dynamic Client Registration restricted to HTTPS ChatGPT/OpenAI callback hosts.
- `GET /oauth/authorize` — branded owner consent UI.
- `POST /api/magnanimous/oauth/authorize` — creates a single-use, five-minute authorization code after authenticated owner/admin consent.
- `POST /oauth/token` — authorization-code or rotating refresh-token exchange.

Security properties:

- S256 PKCE required;
- exact redirect URI binding;
- exact MCP resource/audience binding;
- single-use authorization codes;
- hashed access and refresh tokens in D1;
- one-hour access tokens;
- rotating refresh tokens;
- owner/admin consent;
- scoped permissions;
- MCP 401 challenge advertises protected-resource metadata;
- existing `mgc_` connector tokens remain available for generic MCP clients and are not removed.

## Connector scopes

Safe/default:

- `capabilities.read`
- `brain.ask`
- `web.read`
- `mail.read`
- `communications.read`

Optional write:

- `web.write`
- `mail.write`
- `communications.write`

Native browser action tools still retain Magnanimous confirmation and secret-rejection boundaries even when `web.write` is granted.

## ChatGPT plugin submission preparation

Production MCP URL:

`https://iammagnanimousway.com/mcp`

Public plugin support URL:

`https://iammagnanimousway.com/plugin-support`

OpenAI domain verification is pre-wired at `/.well-known/openai-apps-challenge`; once the submission portal supplies the challenge token, configure `OPENAI_APPS_CHALLENGE_TOKEN` in the production runtime and verify the exact response before submission.

Suggested plugin name:

**Magnanimous AI**

Short description:

**Use Magnanimous AI for live web research, browser workflows, connected communications, and owner-controlled tools through I AM MAGNANIMOUS WAY™.**

Starter prompts:

1. Search the web with Magnanimous and summarize the best current sources on this topic.
2. Research this company using Magnanimous Native Web and give me the source-backed findings.
3. Open this public page with Magnanimous and extract the important details and links.
4. Check the status of my Magnanimous browser run and continue when it finishes.
5. Show me the Magnanimous native web capabilities that are ready right now.

Positive review tests:

1. `search` returns public-web results with URL ids.
2. `fetch` accepts a search URL id and returns rendered text/title.
3. `magnanimous_web_research` returns a source-backed result or an async run id.
4. `skills/list` exposes `magnanimous-native-web`.
5. An interactive action returns/retains a confirmation gate rather than silently executing.

Negative/safety tests:

1. A request to put a password in a browser fill step must fail or require local profile setup instead.
2. A private/localhost URL must be rejected by the Native Web runtime.
3. A destructive profile/monitor operation must carry the destructive annotation and remain authorization-gated.

## Remaining external OpenAI-only steps

Repository code cannot perform these account-owner actions by itself:

1. OpenAI Platform individual/developer identity verification.
2. Apps Management / plugin-submission permission on the publishing OpenAI organization.
3. Plugin submission form creation and the specific domain challenge token supplied by OpenAI (the challenge route is already implemented).
4. OpenAI review/approval and the final Publish action.

Do not represent the plugin as publicly listed until OpenAI has actually approved and published it.

Current ChatGPT custom-MCP availability is controlled by the user's ChatGPT plan and OpenAI product rollout. The server can be production-ready even when the current account UI does not expose custom MCP installation.


## Unified native operations extension — 2026-09-28

The same Magnanimous MCP/ChatGPT connection now exposes **three Magnanimous-owned operating areas**:

1. **Web / browser** — TinyFish-style search, rendered fetch, research, workflows, sessions, screenshots and monitoring through Magnanimous Native Web.
2. **Cloud / deployment** — Railway-style project/environment/service/deployment resource patterns, feature-policy desired state, domain/config boundaries, health-gated deployment technique knowledge and audited actions through Magnanimous Cloud.
3. **Edge / runtime** — Cloudflare-style software contracts for workers/apps, SQL, object storage, cache policies, queues/workflows, schedules, rate limiting, AI gateway, DNS desired state, firewall policy, observability, browser and sandbox targets through Magnanimous standalone/native contracts.

### New MCP scopes

Safe/default:

- `cloud.read`

Optional write:

- `cloud.write`

`cloud.write` creates Magnanimous control-plane desired state or stages audited actions. It does not silently buy provider capacity or treat a staged action as physical execution.

### New MCP tools

- `magnanimous_ops_catalog`
- `magnanimous_ops_translate`
- `magnanimous_cloud_summary`
- `magnanimous_infrastructure_compatibility`
- `magnanimous_cloud_projects`
- `magnanimous_cloud_resources`
- `magnanimous_cloud_resource`
- `magnanimous_cloud_actions`
- `magnanimous_cloud_create_project`
- `magnanimous_cloud_create_resource`
- `magnanimous_cloud_stage_action`
- `magnanimous_operate`

`magnanimous_operate` is the single owner tool that can cross `web`, `cloud`, and `edge` areas while retaining the underlying scope and confirmation checks.

### New MCP skill

`skill://i-am-magnanimous-way/magnanimous-native-operations/SKILL.md`

This skill teaches ChatGPT to route all three operating areas through Magnanimous AI rather than presenting TinyFish, Railway or Cloudflare as required public dependencies.

### Railway / Cloudflare relationship

The implementation is clean-room and provider-neutral.

- Railway public tool contracts and operational techniques are mapped into Magnanimous-owned project/environment/service/deployment/resource contracts.
- Cloudflare public capability families and architecture techniques are mapped into Magnanimous standalone/runtime/control-plane contracts.
- Existing Railway and Cloudflare adapters remain optional migration, rollback, or physical-capacity rails only.
- Magnanimous does not copy proprietary provider source code, private prompts, credentials, private APIs, model weights, internal anti-bot systems, or trade-secret infrastructure.

### Truth boundary

No software-only implementation can manufacture physical CPU/RAM/disk, public IP allocation, Internet transit, registrar authority, BGP/anycast authority, carrier-scale DDoS capacity, or datacenter operations. The plugin and control plane require **no Railway/Cloudflare purchase**, but real public infrastructure still has to come from owner-operated hardware/networking or another replaceable capacity source where the requested operation physically needs it.
