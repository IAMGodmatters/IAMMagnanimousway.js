# Magnanimous Registrar Ecosystem Absorption — 2026-09-17

## Architecture

Magnanimous AI remains the public identity, reasoning layer, memory owner, authorization layer and action commander. Registrar companies are replaceable execution adapters beneath Magnanimous.

Provider identity must not be exposed in customer-facing responses. Platform-owner screens may identify the connected registrar because the owner must know which account is being administered.

## Safety model

- Read-only domain research, pricing, registration state and portfolio inspection may run when the provider account is actually connected and authorized.
- DNS and nameserver mutations require the existing Magnanimous mutation model: preview/dry-run where supported, durable staging, separate confirmation, idempotent execution where possible, and post-change verification.
- Domain registration, renewal, transfer, restoration, paid owner change, aftermarket purchase and other chargeable operations stay spend-locked. Credentials alone are not authorization to spend money.
- Transfer/EPP/auth codes are security-sensitive secrets and must not be logged or returned to customer-facing clients.
- Magnanimous must never claim a provider action completed until a real provider response confirms success and any asynchronous workflow reaches a successful terminal state.

## Live adapters now

### Porkbun

Existing hardened runtime remains the live adapter for account status, domain portfolio, domain detail, availability, DNS records, nameservers, DNSSEC, glue, dry-run/staging/confirmation and action history.

Official v3 documentation now describes a wider API surface including registration, renewal, transfer-in, DNS/DNSSEC, SSL, email forwarding, hosting, signed webhooks, OpenAPI, MCP and sandbox support. Those capabilities are absorbed into Tool Foundry knowledge, but billable domain lifecycle execution remains locked.

Official source: https://porkbun.com/api/json/v3/documentation

### Cloudflare Registrar

The 2026 Registrar API provides domain search, authoritative availability/pricing checks, registration inventory/detail/status and extension schemas. Magnanimous now exposes these as owner-only live reads using the existing dedicated Cloudflare platform token/account connection.

The owner runtime deliberately does **not** call `POST /registrations`. Instead, `plan-registration` performs a real authoritative check and returns a paid-action boundary. This keeps registration non-refundable/billable execution disabled until a separate paid-action workflow is intentionally implemented and authorized.

Official sources:
- https://developers.cloudflare.com/registrar/registrar-api/
- https://developers.cloudflare.com/api/resources/registrar/

## Knowledge-ready adapters

These providers are now represented in the normalized registrar registry and Tool Foundry recipes. They are not falsely marked connected or executable until a tested adapter and authorized credentials exist.

### GoDaddy

Researched capabilities include availability search, registration quote/execute, domain inventory/detail, DNS records, nameservers, contacts, lock, renewal and transfers. Current v3 is preferred for new integrations; v1/v2 still cover lifecycle surfaces not fully moved.

Official source: https://developer.godaddy.com/en/docs/api-users/domains

### Namecheap

Researched capabilities include domain list/detail, contacts, availability, TLD list, registration, renewal, registrar lock, DNS host records, nameservers/glue and transfer workflows. API calls require the account/API identity plus an allowed client IP.

Official source: https://www.namecheap.com/support/api/methods/

### NameSilo

Researched capabilities include active domain inventory, domain information, registration/transfer availability, DNS/nameservers, registration, renewal and transfer workflows. NameSilo documents a sandbox option.

Official source: https://www.namesilo.com/api-reference

### Dynadot

Dynadot exposes a large API command set for domain portfolio management, pricing, availability, DNS, nameservers, contacts, privacy, folders, aftermarket, registration, renewal and transfer. A sandbox API is documented.

Official source: https://www.dynadot.com/domain/api-commands

### Gandi

Gandi v5 exposes domain management plus LiveDNS, DNSSEC, organization context and ownership-change operations. Personal access tokens are preferred; legacy API key authentication is deprecated. A sandbox API is documented.

Official source: https://api.gandi.net/docs/domains/

### Amazon Route 53 Domains

Route 53 Domains supports availability, suggestions, registration, renewal, transfer, domain detail, contacts/privacy, transfer locks, nameserver management, delegation signer/DNSSEC operations, pricing and async operation tracking. DNS-hosted-zone operations remain a separate Route 53 service surface.

Official source: https://docs.aws.amazon.com/Route53/latest/APIReference/API_Operations_Amazon_Route_53_Domains.html

### OpenSRS

OpenSRS provides reseller-oriented domain lifecycle APIs with domain management, renewal, transfer and event/notification workflows. Account access requires reseller credentials and IP access controls.

Official source: https://domains.opensrs.guide/docs/quickstart

### Name.com

Name.com Core API provides domain inventory/detail, DNS records, nameservers, privacy/lock settings and renewal; sandbox access uses the dev API host and sandbox credentials.

Official source: https://docs.name.com/api/v1/

## Owner endpoints

- `GET /api/magnanimous/registrar/adapters` — normalized adapter catalog and connection readiness.
- `GET /api/magnanimous/registrar/status` — connection state without secret values.
- `/api/magnanimous/registrar/porkbun/*` — delegates to the hardened existing Porkbun DNS/registrar runtime.
- `GET /api/magnanimous/registrar/cloudflare/search?q=...` — live domain discovery.
- `POST /api/magnanimous/registrar/cloudflare/check` — authoritative availability and pricing for up to 20 domains.
- `GET /api/magnanimous/registrar/cloudflare/registrations` — registration inventory.
- `GET /api/magnanimous/registrar/cloudflare/registration?domain=...` — registration detail.
- `GET /api/magnanimous/registrar/cloudflare/registration-status?domain=...` — workflow/status detail.
- `GET /api/magnanimous/registrar/cloudflare/extensions[?extension=...]` — supported extension metadata and registration schema.
- `POST /api/magnanimous/registrar/cloudflare/plan-registration` — authoritative check plus paid-action boundary; does not purchase.

Owner UI: `/owner-registrars`

## Tool Foundry

Startup seeding now creates one approved registrar teaching tool per provider plus a universal registrar-routing recipe. The recipes teach:

- provider discovery and current-doc verification;
- connection requirements;
- read/write/spend classification;
- least-privilege secret handling;
- dry-run/staging/confirmation for domain/DNS mutations;
- non-refundable/paid action boundaries;
- transfer/EPP-code protection;
- real-provider-result verification before success claims.

This is additive to the existing Cloudflare Tool Foundry seed and preserves all existing platform capabilities.
