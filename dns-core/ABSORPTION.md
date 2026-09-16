# Magnanimous DNS Intelligence Absorption

Magnanimous AI owns the DNS/domain intelligence workflow. Public resolvers, RDAP services, registrars, DNS hosts, and Cloudflare are replaceable execution/data providers beneath the Magnanimous identity and policy layer.

## Active capability surface

- DNS-over-HTTPS lookup for A, AAAA, CNAME, MX, NS, TXT, SOA, SRV, CAA, PTR, DS, DNSKEY, TLSA, SVCB, HTTPS, and NAPTR.
- Multi-resolver comparison using Cloudflare 1.1.1.1 and Google Public DNS.
- DNSSEC visibility using DS, DNSKEY, and authenticated-data flags.
- Email-domain diagnostics for MX, SPF, DMARC, and user-supplied DKIM selectors.
- Reverse DNS for IPv4 and IPv6.
- RDAP registration context without returning registrant contact details.
- Combined domain diagnosis with observable findings instead of unsupported guesses.
- Owner-only Cloudflare DNS record inventory through the existing encrypted platform credential vault.
- DNS create/update/delete requests delegate to the existing Cloudflare staged-action system and require a separate confirmation request before execution.

## Safety and identity rules

1. Never expose provider credentials, API tokens, model names, or infrastructure secrets to customers.
2. Never reuse the broad deployment `CLOUDFLARE_API_TOKEN` inside the product runtime.
3. Cloudflare DNS changes use the dedicated `CLOUDFLARE_PLATFORM_API_TOKEN` path and the existing platform-owner gate.
4. DNS mutations are staged first with status `needs_confirmation`; destructive deletes retain the existing destructive-action lock.
5. Public DNS and RDAP are data sources only. Magnanimous remains the public identity and reasoning layer.
6. RDAP registrant contact fields are intentionally omitted from Magnanimous responses.

## Endpoints

- `GET /api/magnanimous/dns/capabilities`
- `POST /api/magnanimous/dns/lookup`
- `POST /api/magnanimous/dns/propagation`
- `POST /api/magnanimous/dns/email-security`
- `POST /api/magnanimous/dns/reverse`
- `POST /api/magnanimous/dns/rdap`
- `POST /api/magnanimous/dns/diagnose`
- `GET /api/magnanimous/dns/cloudflare/records`
- `POST /api/magnanimous/dns/cloudflare/stage`

## Primary references reviewed for this absorption

- Cloudflare DNS-over-HTTPS JSON API: https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/dns-json/
- Cloudflare DNS-over-HTTPS request guide: https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/
- Cloudflare DNS Records API: https://developers.cloudflare.com/api/resources/dns/subresources/records/
- Cloudflare API token guidance: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/

The public resolver layer deliberately uses fixed HTTPS origins rather than user-provided URLs, preventing this capability from becoming a generic server-side request proxy.
