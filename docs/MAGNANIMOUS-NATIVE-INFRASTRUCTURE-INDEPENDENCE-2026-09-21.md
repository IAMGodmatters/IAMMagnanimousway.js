# Magnanimous Native Infrastructure Independence — 2026-09-21

## Purpose

Magnanimous AI owns the infrastructure software contracts, orchestration, policy, memory, verification and learning. Cloudflare and Railway are benchmark/reference providers and may be used temporarily as replaceable capacity rails, but neither is required as Magnanimous identity, brain, control plane, plugin, or paid software dependency.

This work is an original provider-neutral implementation based on public capability contracts and open standards. It does not copy proprietary provider source code, hidden prompts, credentials, internal networks, model weights or private implementation details.

## Current public capability research

Cloudflare public Developer Platform documentation currently describes Workers/static assets, D1, KV, R2, Durable Objects, Queues, Workflows, Hyperdrive, Vectorize, Analytics Engine, Pipelines, Browser Run, Images/media, Workers AI, AI Gateway, security controls, DNS/delivery and other platform bindings.

Railway public documentation currently describes projects, services, persistent services, scheduled jobs, functions, environments, variables/secrets, config-as-code, Docker/Railpack builds, GitHub autodeploys, health checks, scaling/regions, volumes/backups/buckets, public/private networking, domains, TCP proxy, egress/static IPs, templates, metrics/logs and agent-assisted infrastructure operations.

Public research sources:
- https://developers.cloudflare.com/workers/
- https://developers.cloudflare.com/workers/platform/storage-options/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/
- https://developers.cloudflare.com/use-cases/ai/build-and-run/
- https://docs.railway.com/overview/the-basics
- https://docs.railway.com/services
- https://docs.railway.com/build-deploy
- https://docs.railway.com/networking
- https://docs.railway.com/templates
- https://docs.railway.com/ai/agent-skills
- https://docs.railway.com/ai/railway-agent

## Magnanimous-owned replacements

Already-native/self-hosted software paths include:

- standard Node HTTP runtime and static asset serving
- SQLite relational compatibility and migration engine
- object storage on persistent local/attached storage
- TTL key/value cache
- durable queues and multi-step workflow ledger
- persistent event coordination and local pub/sub
- vector retrieval and SQLite FTS knowledge search
- analytics/time-series ledger and Prometheus-style metrics
- encrypted secret vault and runtime secret store
- durable ingestion pipelines
- scheduler/system-cron compatibility
- sandbox service for isolated execution
- self-hosted Chromium browser/rendering service
- self-hosted media transformations
- provider-neutral AI binding with local/OpenAI-compatible rails
- service bindings
- application rate limiting
- provider-neutral Magnanimous Cloud desired-state control plane
- CoreDNS/Caddy DNS/TLS software path
- backup, restore, data-parity and cloud-exit tooling
- infrastructure capability realization evidence and regression locks

The control plane now also models workspaces/environments, preview environments, services, deployments, builds, templates, feature flags, secrets, domains, certificates, TCP ingress, egress/cache/rate policies, queues, workflows, schedules, database gateways, AI gateways, access policies, browser sessions and sandbox jobs.

## Physical boundary

“No provider dependency” cannot mean “no physical infrastructure.” Software cannot manufacture CPU, memory, disks, public IPv4/IPv6 allocations, Internet transit, BGP authority, registrar authority, carrier-scale DDoS absorption, data centers, licensed telecom interconnection or payment settlement.

Magnanimous therefore follows this rule:

1. Own the software control plane and capability contract.
2. Prefer local/owner/self-hosted execution when practical.
3. Attach outside capacity only as a replaceable adapter when real physical/network/regulated capacity is required.
4. Never transfer Magnanimous identity, memory, reasoning or orchestration ownership to the capacity provider.
5. Never claim a capability is live merely because its desired-state contract exists; runtime proof remains mandatory.

## Regression protection

`qa/scripts/native-infrastructure-independence-lock.mjs` requires every researched Cloudflare and Railway capability to resolve to a Magnanimous target and forbids provider plugin/purchase/proprietary-code requirements in the Magnanimous software contract.

`qa/scripts/magnanimous-cloud-exit-lock.mjs` runs that lock as part of the cloud-independence gate.
