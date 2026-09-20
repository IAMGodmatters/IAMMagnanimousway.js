# Magnanimous Standalone Runtime

This is the first production-capable cloud-vendor exit runtime for I AM MAGNANIMOUS WAY™.

It runs the existing checked-in Magnanimous request chain on standard Node.js and provides:

- a first-party `MagnanimousSqlBinding` compatible with the D1 methods currently used by the application: `prepare`, `bind`, `run`, `first`, `all`, `raw`, `batch`, and `exec`;
- standard SQLite persistence through Node's built-in `node:sqlite` module;
- automatic application of the existing SQL migration set;
- static Next.js export serving from `frontend/out`;
- the existing `security-entrypoint.js` API/runtime chain;
- standard scheduled execution without vendor cron bindings;
- a provider-neutral `env.AI.run()` compatibility surface using local Ollama, an OpenAI-compatible endpoint, or an explicitly configured metered fallback.

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
```

## Cutover rule

Do not move production traffic until database export/import, authentication, mutation smoke tests, scheduled work, static routes, AI fallback behavior, TLS, backup/restore, and rollback have all been verified against a production data copy.
