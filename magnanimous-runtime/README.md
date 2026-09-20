# Magnanimous Standalone Runtime

This is the first-party, provider-neutral runtime for I AM MAGNANIMOUS WAY™ / Magnanimous AI.

It runs the existing application request chain on standard Node.js and reproduces the software-level cloud contracts the platform actually uses, without requiring Cloudflare packages, Wrangler, Cloudflare MCP, D1, Workers, R2, KV, Queues, Vectorize, Analytics Engine, Browser Rendering, Sandbox, or Images at runtime.

## First-party capability stack

- **Compute / HTTP** — standard Node 24 Request/Response runtime.
- **Relational data** — `MagnanimousSqlBinding` over SQLite with the D1-compatible methods currently used by the app: `prepare`, `bind`, `run`, `first`, `all`, `raw`, `batch`, and `exec`.
- **Migrations** — replays the checked-in application SQL migration set.
- **Static delivery** — serves the exported Next.js frontend from `frontend/out`.
- **Scheduled work / waitUntil** — native scheduler plus execution-context compatibility.
- **AI** — provider-neutral `env.AI.run()` using local Ollama, a Magnanimous/OpenAI-compatible endpoint, or an explicitly configured metered fallback.
- **Image generation** — `MagnanimousImageGenerationBinding` using local Automatic1111/Stable Diffusion or an OpenAI-compatible image endpoint.
- **Object storage** — `MagnanimousObjectStore`.
- **KV / TTL cache** — `MagnanimousKvStore`.
- **Queues / durable workflows** — `MagnanimousDurableWork`.
- **Realtime coordination** — persistent event ledger plus local pub/sub via `MagnanimousEventHub`.
- **Vector retrieval** — `MagnanimousVectorStore`.
- **Analytics** — `MagnanimousAnalyticsEngine` plus Prometheus runtime metrics.
- **Pipelines** — durable NDJSON ingestion backed by object storage, analytics, and queued work.
- **Encrypted secrets** — AES-256-GCM `MagnanimousSecretVault`.
- **Sandbox** — isolated internal container with bounded argv execution and scoped file I/O.
- **Server browser rendering** — Magnanimous safe-egress snapshot fetch plus local Chromium DOM/screenshot/PDF rendering, so SSRF checks and redirect revalidation happen before Chromium receives content.
- **Interactive browser automation** — the existing Magnanimous Native Web + Local Bridge flow remains the full click/fill/select/press path.
- **Browser egress security** — Chromium HTTP(S) is forced through a Magnanimous proxy that blocks private/local/test networks and validates CONNECT destinations; direct hostname resolution, QUIC, and non-proxied WebRTC UDP are disabled.
- **Image transformation** — isolated ImageMagick service.
- **Application security** — native auth controls, request-rate limiting, private service tokens, tenant boundaries, and reverse-proxy security headers.
- **TLS / reverse proxy** — Caddy.
- **Authoritative DNS software** — optional CoreDNS profile with guarded zone generation.
- **Backups / restore / D1 migration** — offline backup, locked restore, D1 SQL import, parity verification, and DNS preparation scripts.

## Run

Copy the standalone environment template and create strong independent secrets:

```bash
cp magnanimous-runtime/.env.example magnanimous-runtime/.env
# Fill MAGNANIMOUS_INTERNAL_SERVICE_TOKEN, MAGNANIMOUS_SECRETS_KEY,
# SESSION_SECRET, INTEGRATION_CREDENTIALS_KEY and required model/provider settings.
```

Verify source/runtime contracts:

```bash
node magnanimous-runtime/scripts/verify-runtime.mjs
node qa/scripts/magnanimous-cloud-independence-readiness.mjs
```

Start the self-hosted stack:

```bash
docker compose -f magnanimous-runtime/docker-compose.yml up -d --build
```

Runtime health:

```text
/__magnanimous_runtime/health
/__magnanimous_runtime/capabilities
/__magnanimous_runtime/services   # private service token required
/__magnanimous_runtime/metrics    # private service token required
```

## Backup and migration

Create a consistent SQLite/object-store backup:

```bash
node magnanimous-runtime/scripts/backup-runtime.mjs
```

Restore is intentionally locked and must be performed offline:

```bash
MAGNANIMOUS_ALLOW_RESTORE=YES_I_UNDERSTAND \
  node magnanimous-runtime/scripts/restore-runtime.mjs <backup-directory>
```

One-time D1 SQL export import:

```bash
MAGNANIMOUS_ALLOW_IMPORT=YES_I_UNDERSTAND \
  node magnanimous-runtime/scripts/import-d1-export.mjs <export.sql> <target.sqlite>
```

Compare source/target SQLite table counts and integrity:

```bash
node magnanimous-runtime/scripts/verify-data-parity.mjs <source.sqlite> <target.sqlite>
```

See [CLOUD-INDEPENDENCE-CUTOVER.md](./CLOUD-INDEPENDENCE-CUTOVER.md) for the production migration/rollback sequence.

## DNS/TLS cutover

The DNS profile is deliberately disabled until real public infrastructure exists. Generate a zone only after you have two independent authoritative DNS hosts and the standalone origin address:

```bash
MAGNANIMOUS_DNS_NS1_IP=<public-ip-1> \
MAGNANIMOUS_DNS_NS2_IP=<public-ip-2> \
MAGNANIMOUS_DNS_ORIGIN_IP=<origin-public-ip> \
MAGNANIMOUS_DNS_EXTRA_RECORDS_FILE=<preserved-mail-and-verification-records> \
node magnanimous-runtime/scripts/prepare-dns-zone.mjs
```

Then run the optional authoritative DNS profile on the real DNS hosts:

```bash
docker compose -f magnanimous-runtime/docker-compose.yml --profile authoritative-dns up -d authoritative-dns
```

## Independence boundary

The **software replacement stack is complete**. Production traffic is not considered cut over merely because the code exists.

No repository code can manufacture public IP space, registrar authority, global anycast, carrier-scale DDoS absorption, BGP transit, multi-region L4 capacity, telecom authority, or payment settlement. Those are real external infrastructure/network/regulated boundaries. They may be supplied by replaceable providers beneath Magnanimous or operated directly, but they never own Magnanimous identity, memory, policy, reasoning, or orchestration.

Cloudflare may remain as a temporary production rollback rail until standalone data parity, live mutation smoke tests, DNS/TLS cutover, mail records, billing, telecom, scheduled work, and rollback drills are verified. After that rollback window, Cloudflare-specific production resources can be retired.
