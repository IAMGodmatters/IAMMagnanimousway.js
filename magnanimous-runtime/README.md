# Magnanimous Standalone Runtime

This is the first production-capable cloud-vendor exit runtime for I AM MAGNANIMOUS WAY™.

It runs the existing checked-in Magnanimous request chain on standard Node.js and provides:

- a first-party `MagnanimousSqlBinding` compatible with the D1 methods currently used by the application: `prepare`, `bind`, `run`, `first`, `all`, `raw`, `batch`, and `exec`;
- standard SQLite persistence through Node's built-in `node:sqlite` module;
- automatic application of the existing SQL migration set;
- static Next.js export serving from `frontend/out`;
- the existing `security-entrypoint.js` API/runtime chain;
- standard scheduled execution without vendor cron bindings;
- a provider-neutral `env.AI.run()` compatibility surface using local Ollama, an OpenAI-compatible endpoint, or an explicitly configured metered fallback;
- `MagnanimousObjectStore` for persistent local-volume object/blob storage with metadata, hashing, list/get/put/delete contracts;
- `MagnanimousKvStore` for SQLite-backed key/value data, TTL expiration, metadata and typed reads;
- `MagnanimousDurableWork` for idempotent durable queues, leasing, retry state and checkpointed workflows;
- `MagnanimousEventHub` for persistent event history plus live in-process publish/subscribe coordination;
- `MagnanimousRateLimiter` for application-layer API and authentication abuse controls;
- `MagnanimousVectorStore` for local vector persistence and cosine-similarity retrieval;
- `MagnanimousAnalyticsEngine` for indexed event/metric data points and local aggregation;
- `MagnanimousSecretVault` for AES-256-GCM encrypted runtime secrets when `MAGNANIMOUS_SECRETS_KEY` is configured;
- `MagnanimousPipeline` for durable NDJSON ingestion into the object store with analytics and queued processing.

No Cloudflare package is required by this runtime.

## Run

```bash
node magnanimous-runtime/scripts/verify-runtime.mjs
node magnanimous-runtime/src/server.mjs
```

Or:

```bash
docker compose -f magnanimous-runtime/docker-compose.yml up --build
```

Runtime health:

```text
/__magnanimous_runtime/health
/__magnanimous_runtime/capabilities
```

## Cutover rule

Do not move production traffic until database export/import, authentication, mutation smoke tests, scheduled work, static routes, AI fallback behavior, TLS, backup/restore, and rollback have all been verified against a production data copy.


## Independence boundary

These first-party primitives replace application dependencies on vendor-specific SQL, object storage, key/value, queue/workflow, event coordination, vector storage/query, analytics events, durable ingestion, encrypted secrets and basic request-rate contracts. Global anycast delivery, carrier-grade DDoS absorption, public authoritative DNS, regulated telecom, and payment settlement still require real external network/infrastructure capacity. Those rails remain replaceable and must never own Magnanimous identity, memory, policy or orchestration.
