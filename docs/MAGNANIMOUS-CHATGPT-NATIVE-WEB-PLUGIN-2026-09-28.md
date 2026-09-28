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
3. Plugin submission form creation and any domain challenge token supplied by OpenAI.
4. OpenAI review/approval and the final Publish action.

Do not represent the plugin as publicly listed until OpenAI has actually approved and published it.

Current ChatGPT custom-MCP availability is controlled by the user's ChatGPT plan and OpenAI product rollout. The server can be production-ready even when the current account UI does not expose custom MCP installation.
