# Magnanimous Worker Runtime

This directory contains the provider-neutral self-hosted edge entrypoint for I AM MAGNANIMOUS WAY™.

## Identity and architecture

Magnanimous AI remains the public identity, brain, policy layer and orchestrator. The runtime in `server.mjs` is owned by the platform and can run on hardware or a VM controlled by Magnanimous. Cloud edge services, workerd compatibility, CDNs, tunnels, hosting companies and other providers are optional infrastructure adapters rather than the public product identity.

The runtime has two fixed internal origins:

- `MAGNANIMOUS_FRONTEND_ORIGIN` for browser application routes.
- `MAGNANIMOUS_BACKEND_ORIGIN` for `/api/*` and `/health`.

The gateway does not accept arbitrary upstream URLs from callers. This is deliberate SSRF protection.

## Why this exists

A hosted edge can return provider quota errors even when the application itself is healthy. A self-hosted Magnanimous edge gives the platform an escape path from provider request quotas and lets DNS be moved to infrastructure controlled by Magnanimous once an authorized server, public IP address and TLS endpoint exist.

This commit prepares that runtime. It does **not** claim the production domain has already been moved away from its current host. DNS cutover must happen only after a real Magnanimous-controlled origin is provisioned, secured, tested and reachable from the public Internet.

## Run locally

Node.js 22 or newer is required.

```bash
cd sovereign-worker
MAGNANIMOUS_FRONTEND_ORIGIN=http://127.0.0.1:3000 \
MAGNANIMOUS_BACKEND_ORIGIN=http://127.0.0.1:8000 \
MAGNANIMOUS_PUBLIC_ORIGIN=https://iammagnanimousway.com \
node server.mjs
```

Health endpoint:

```bash
curl http://127.0.0.1:8080/__magnanimous/health
```

## Production layout

Recommended minimum layout:

1. A Magnanimous-controlled Linux host or VM with a routable public address.
2. Frontend process bound only to a private/local interface.
3. Backend process bound only to a private/local interface.
4. Magnanimous Worker Runtime bound to the ingress interface.
5. TLS termination on the same controlled host or a second controlled ingress node.
6. Firewall rules allowing only required ingress ports and management access.
7. Systemd (sample unit included) to keep the runtime supervised.
8. Independent backups and a second node before removing the current provider as a failover option.

## Cloudflare-compatible execution

The platform can also use the open-source `workerd` runtime as a compatibility engine for Worker-style code. Treat it as a replaceable execution engine under Magnanimous, not as the product identity. The official workerd project explicitly supports self-hosting applications designed for Workers.

Do not execute untrusted tenant code directly inside an unsandboxed workerd process. Its own documentation warns that the runtime itself is not a hardened sandbox for malicious code. Use a VM/container boundary and least-privilege bindings.

## Cutover safety

Before changing production DNS:

- prove `/__magnanimous/health`, the homepage and representative API routes from an external network;
- prove authentication, logout, session revocation, billing locks and webhook signatures;
- prove video, telecom, DNS and registrar routes do not expose provider identities or secrets;
- issue and validate TLS certificates;
- set monitoring and rollback DNS records;
- lower DNS TTL ahead of migration;
- keep the existing edge as rollback until the new origin has completed soak testing.

Never perform a DNS cutover merely because this code exists. A real public origin is required first.
