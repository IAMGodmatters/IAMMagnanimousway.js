# Magnanimous DNS / Registrar Live Verification

This checklist defines the production verification contract for the native Magnanimous DNS/domain layer.

## Automatic production-safe checks

After deployment, verify with an authenticated non-owner test account:

1. `GET /api/magnanimous/dns/capabilities` returns `identity: Magnanimous AI`, `capability: dns-domain-intelligence`, and `provider_identity_public: false`.
2. `POST /api/magnanimous/dns/lookup` resolves `iammagnanimousway.com` through the built-in multi-resolver path and returns at least one usable result.
3. `GET /api/magnanimous/dns/domain-pricing` returns non-empty provider-neutral pricing without exposing the execution-provider identity.
4. `GET /api/magnanimous/dns/porkbun/status` is rejected for a non-owner account with HTTP 403.

## Owner/provider verification when credentials are configured

Use a dedicated domain-scoped or sandbox registrar key when possible. Confirm that owner-only reads can list domain metadata, DNS records, nameservers, DNSSEC, and glue records.

For a DNS write, use the safe sequence only:

1. Call `/api/magnanimous/dns/porkbun/dry-run`.
2. If the provider reports the operation would succeed, call `/api/magnanimous/dns/porkbun/stage`.
3. Review the durable `needs_confirmation` action.
4. Confirm using `/api/magnanimous/dns/porkbun/actions/{id}/confirm` before the 15-minute confirmation window expires.
5. Verify the result through a fresh read and through public DNS when applicable.

Domain registration, renewal, and transfer are not executed by this adapter because those operations can spend money.
