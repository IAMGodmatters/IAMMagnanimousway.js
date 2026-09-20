# Magnanimous Cloud Independence Cutover

## Status

The software replacement stack is implemented as Magnanimous-owned, provider-neutral infrastructure. Cloudflare can remain a rollback rail until live production cutover is proven. Software independence does **not** claim ownership of global anycast, carrier-scale DDoS capacity, BGP transit, registrar authority, or public IP space.

## Replacement map

- Workers / Pages runtime → standard Node 24 Magnanimous runtime + Caddy
- D1 → Magnanimous SQL compatibility layer on SQLite
- R2 / object storage → Magnanimous Object Store
- KV → Magnanimous KV/TTL cache
- Queues / Workflows → Magnanimous Durable Work
- Durable coordination → Magnanimous persistent event ledger + local pub/sub
- Vectorize → Magnanimous Vector Store
- Analytics Engine → Magnanimous Analytics Engine + Prometheus metrics
- Pipelines → Magnanimous durable ingestion pipeline
- Secrets Store → AES-256-GCM Magnanimous Secret Vault
- Sandbox → hardened internal Magnanimous Sandbox container
- Browser Rendering → self-hosted Chromium renderer
- Interactive browser automation → existing Magnanimous Native Web + Local Bridge
- Images transformations → self-hosted ImageMagick transform service
- Cron → native scheduler / system cron
- TLS / reverse proxy → Caddy
- Authoritative DNS software → CoreDNS profile
- Logs / metrics → structured JSON logs + Magnanimous Analytics + Prometheus output

## Before production cutover

1. Provision real public compute/storage with backups. Use at least one origin; use multiple independent origins if high availability is required.
2. Generate `MAGNANIMOUS_INTERNAL_SERVICE_TOKEN`, `MAGNANIMOUS_SECRETS_KEY`, `SESSION_SECRET`, and `INTEGRATION_CREDENTIALS_KEY` independently.
3. Build and start the standalone stack:
   `docker compose -f magnanimous-runtime/docker-compose.yml up -d --build`
4. Verify `/__magnanimous_runtime/health`, `/__magnanimous_runtime/capabilities`, and the token-protected `/__magnanimous_runtime/services` + `/__magnanimous_runtime/metrics`.
5. Export the existing D1 database during a controlled maintenance window, import it with `import-d1-export.mjs`, and run `verify-data-parity.mjs`.
6. Run signup/login/logout/session-revocation, billing, telecom, professional workspace, Business AI, queues, scheduled work, object storage, browser, sandbox, and media transformation smoke tests on the standalone origin.
7. Create a backup with `backup-runtime.mjs` and perform an offline restore drill before DNS changes.
8. Preserve all current MX/TXT/SPF/DKIM/DMARC and verification records. Put them in a file referenced by `MAGNANIMOUS_DNS_EXTRA_RECORDS_FILE`.
9. Run `prepare-dns-zone.mjs` with two independent public authoritative-DNS addresses and the standalone origin IP.
10. Deploy the CoreDNS profile on two independent hosts, verify authoritative answers externally, then change registrar nameserver/glue records.
11. Lower DNS TTL before the final switch. Keep the old production rail available for rollback until traffic, mutations, mail, auth, payments, and scheduled work are stable.
12. Only after the rollback period is complete should Cloudflare-specific production credentials/resources be retired.

## One-time D1 extraction

The old provider may still be used **once as the source of truth during migration**. That does not make it a runtime dependency after cutover. Keep the export artifact private and delete it after verified import plus backup retention requirements are satisfied.

## External network boundary

No repository code can manufacture a global carrier network. If you need global anycast, large-scale DDoS absorption, BGP routing, multi-region L4 proxying, or large public egress capacity, use replaceable network providers beneath Magnanimous or operate your own infrastructure. Those providers never own Magnanimous identity, memory, policy, or orchestration.
