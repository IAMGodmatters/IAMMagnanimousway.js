# Magnanimous Cloudflare Absorption

## Identity rule

Magnanimous AI remains the brain, memory owner, command layer, reasoning/orchestration layer and public AI identity. Cloudflare is an internal infrastructure and capability provider beneath Magnanimous. Cloudflare credentials, model/provider implementation details and internal account identifiers are not public product identity.

## Current official Cloudflare surface absorbed

The control plane models the current Cloudflare platform across:

- Compute/application runtime: Workers, Static Assets, Pages, Containers, Durable Objects, Workflows, Queues, Cron, Service Bindings, Smart Placement, Workers Builds, Workers for Platforms, Sandbox and Browser Run.
- Data/storage: D1, KV, R2, Hyperdrive, Vectorize, Analytics Engine, Pipelines and Durable Object SQLite.
- AI/agents: Workers AI, AI Gateway, AI Search, Agents SDK, Agent Skills, MCP client/server, Code Mode, Think, AI Chat, Shell, voice, browser agents and x402 patterns.
- Application security: WAF, DDoS, Bot Management, Rate Limiting, API Shield, Page Shield, Turnstile, SSL/TLS, Rulesets, URL Scanner and security analytics.
- Delivery: DNS, DNSSEC, CDN/cache, Cache Rules, Tiered Cache, Argo, Load Balancing, Waiting Room, Spectrum, Registrar and zone management.
- Cloudflare One: Access, Gateway, Tunnel, Cloudflare One Client/WARP, Mesh, Browser Isolation, CASB, DLP, email security, posture/identity and DEX.
- Network services: Cloudflare WAN, Magic Transit, Network Firewall, Network Interconnect, GRE/IPsec, Network Flow/Analytics, packet capture and BGP/routing concepts.
- Media/realtime: Images, Stream, Image Resizing, Realtime/Calls and WebRTC patterns.
- Email: Email Routing, Email Workers, Email Sending and agent email channels.
- Observability: Workers Observability, logs, Tail Workers, Logpush, Log Explorer, GraphQL Analytics, Web Analytics, Radar, tracing and metrics.
- Performance: Core Web Vitals, Zaraz, consent management, Managed Components, compression, HTTP/3 and origin optimization.
- Developer automation: Wrangler, REST/OpenAPI/GraphQL, Terraform patterns, MCP Code Mode, official Cloudflare Skills, local development and bindings.

This is capability absorption, not copying Cloudflare proprietary infrastructure or claiming Cloudflare account authority that has not been granted.

## Official Cloudflare MCP strategy

The preferred broad connector is:

`https://mcp.cloudflare.com/mcp`

Cloudflare currently exposes its large API surface through a compact Code Mode pattern instead of loading thousands of endpoint schemas into the model. Magnanimous follows the same principle: discover the endpoint needed, then execute only the minimum authorized operation.

The registry also tracks official specialized MCP endpoints for documentation, Workers bindings/builds, observability, CASB, Radar and Cloudflare knowledge.

## Official Cloudflare Agent Skills absorbed as operational knowledge

The registry tracks Cloudflare's current skill families including:

- cloudflare
- nextjs-on-cloudflare
- agents-sdk
- durable-objects
- sandbox-next / sandbox-stable / sandbox migration
- wrangler
- workers-best-practices
- cloudflare-email-service
- turnstile-spin
- web-perf
- cloudflare-one
- cloudflare-one-migrations

Magnanimous uses these as provider knowledge/patterns. They do not become the public identity of the platform.

## Action routes

Owner-only routes:

- `GET /api/cloudflare/overview` — complete normalized capability/readiness map.
- `GET /api/cloudflare/mcp` — official managed MCP catalog.
- `GET /api/cloudflare/skills` — official skill catalog.
- `GET /api/cloudflare/token-verify` — verify the configured dedicated platform token.
- `GET /api/cloudflare/account` — read the configured account.
- `GET /api/cloudflare/zones` — list zones visible to the dedicated token.
- `POST /api/cloudflare/read` — execute an owner-authorized Cloudflare API GET against a validated relative API path.
- `GET /api/cloudflare/actions` — inspect the durable action ledger.
- `POST /api/cloudflare/actions` — stage a mutation; does not execute it.
- `POST /api/cloudflare/actions/:id/confirm` — separately approve and execute an unexpired staged action when all hard locks permit it.

Direct outbound requests are pinned to `https://api.cloudflare.com/client/v4`; caller-supplied hosts are never accepted.

## Dedicated credentials

Do not reuse the GitHub deployment token inside the Worker. Configure a separate least-privilege Worker secret/account identifier when direct actions are desired:

- `CLOUDFLARE_PLATFORM_API_TOKEN`
- `CLOUDFLARE_PLATFORM_ACCOUNT_ID`
- `CLOUDFLARE_PLATFORM_ZONE_ID` (optional)

Example setup from the `worker` directory:

```bash
npx wrangler secret put CLOUDFLARE_PLATFORM_API_TOKEN
npx wrangler secret put CLOUDFLARE_PLATFORM_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_PLATFORM_ZONE_ID
```

Grant only the API permissions required for the intended actions.

## Mutation safety

All mutations are disabled by default even when a token exists. The general mutation switch and risk-specific switches are intentionally separate:

- `CLOUDFLARE_MUTATIONS_ENABLED=true`
- `CLOUDFLARE_RESOURCE_CREATION_ENABLED=true`
- `CLOUDFLARE_SPEND_ACTIONS_ENABLED=true`
- `CLOUDFLARE_DESTRUCTIVE_ACTIONS_ENABLED=true`
- `CLOUDFLARE_IDENTITY_SECRET_ACTIONS_ENABLED=true`
- `CLOUDFLARE_NETWORK_CONTROL_ENABLED=true`

A staged action still requires the second confirmation request. Confirmation expires after 15 minutes. The runtime records staging, blocks, completion/failure, actor, tenant and request correlation IDs.

Enterprise/network capabilities such as Magic Transit, Cloudflare WAN, Network Firewall, Network Interconnect and BGP/prefix operations remain gated by real Cloudflare plan/contract/network authority. The registry never treats documentation knowledge as proof that those services are provisioned.

## Source observation date

Capability map reviewed against current Cloudflare developer documentation and official Cloudflare GitHub projects on 2026-09-16. Future releases should refresh this registry rather than assuming the provider surface is static.
