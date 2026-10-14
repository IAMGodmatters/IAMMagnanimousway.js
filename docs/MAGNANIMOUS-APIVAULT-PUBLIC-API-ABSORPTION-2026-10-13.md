# Magnanimous AI — ApiVault Public API Absorption

Date: 2026-10-13

## Purpose

I AM MAGNANIMOUS WAY™ uses ApiVault.dev as a discovery map for useful public APIs, then independently evaluates and implements only those providers whose official documentation and terms fit a commercial, free-first, security-bounded Magnanimous runtime.

Magnanimous AI remains the identity, reasoning, memory, orchestration, policy, normalization and verification layer. External APIs are replaceable evidence rails.

## ApiVault license boundary

Discovery source:

- https://apivault.dev/
- https://github.com/exa-studio/ApiVault

The observed ApiVault repository license is CC BY-NC-ND 4.0. Because I AM MAGNANIMOUS WAY™ is a commercial platform, Magnanimous does **not** copy, adapt, redistribute, or embed ApiVault source code or its catalog wholesale.

Allowed clean-room workflow:

1. Use ApiVault to discover a candidate API.
2. Visit the provider's official documentation and terms.
3. Independently define a Magnanimous-owned capability contract.
4. Implement a fixed-host, read-only adapter when the provider terms permit it.
5. Normalize output under Magnanimous AI while preserving source attribution.
6. Keep provider restrictions, rate limits, licensing and safety boundaries explicit.

## Activated read-only sources

### Frankfurter

Official documentation: https://frankfurter.dev/

Magnanimous capabilities:

- reference FX lookup
- historical FX research contract

Runtime route:

- `GET /api/public-data/fx?base=USD&quote=PHP`

Guardrail: these are reference rates, not card/payment settlement rates. Store checkout pricing and payment settlement do not depend on this adapter.

### Crossref REST API

Official documentation: https://www.crossref.org/documentation/retrieve-metadata/rest-api/

Magnanimous capabilities:

- scholarly metadata search
- DOI metadata lookup

Runtime route:

- `GET /api/public-data/crossref?q=<query>&rows=5`

Guardrail: Magnanimous normalizes metadata only. The adapter deliberately excludes abstracts and article full text.

### World Bank Indicators API

Official documentation: https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information

Magnanimous capabilities:

- global economic/development indicators
- country indicator time series

Runtime route:

- `GET /api/public-data/world-bank?country=PHL&indicator=SP.POP.TOTL&date=2020:2025`

Guardrail: preserve World Bank attribution and dataset-specific licensing. Values are sourced statistical evidence, not financial advice.

### USGS Earthquake Hazards Program

Official documentation: https://earthquake.usgs.gov/fdsnws/event/1/

Magnanimous capability:

- recent/historical earthquake event search

Runtime route:

- `GET /api/public-data/earthquakes?days=7&min_magnitude=4&limit=20`

Optional local radius parameters:

- `latitude`
- `longitude`
- `radius_km`

Guardrail: this is informational evidence and not an emergency-warning system. Local emergency authorities remain authoritative for safety decisions.

### Bible API

Official documentation: https://bible-api.com/

Magnanimous capability:

- low-volume Scripture passage lookup

Runtime route:

- `GET /api/public-data/scripture?passage=John%203:16&translation=kjv`

The current translation allowlist is KJV, WEB and ASV, with KJV as the default. Magnanimous does not bulk-mirror the service.

## Deliberately not activated

These candidates remain blocked or limited because their current terms do not fit a free commercial production adapter cleanly:

- Open-Meteo — free/public offering is described for non-commercial use.
- Nager.Date — commercial usage requires active sponsorship.
- REST Countries — current free plan is not intended for commercial production.
- URLhaus — commercial/for-profit usage and authentication terms require separate review.
- Arbeitnow — API is easy to access, but commercial reuse terms are not clear enough for automatic production activation.
- Open Library — suitable for low-volume human lookup, not as a high-traffic backend for Magnanimous.

Magnanimous will not bypass those restrictions just to increase capability count.

## Runtime security contract

All activated adapters:

- require a signed-in Magnanimous user;
- accept GET only;
- use fixed provider hosts rather than a user-controlled URL proxy;
- validate and bound parameters;
- enforce a provider timeout;
- bound response size;
- normalize response shape;
- fail safely when a provider is unavailable;
- preserve source attribution;
- do not expose or require provider credentials for these no-key sources.

## Brain / Tool Foundry integration

The public API capability registry is included in the Magnanimous single-brain summary and Magnanimous Research capability summary.

At Worker bootstrap, Magnanimous seeds one low-risk Tool Foundry teaching tool per activated source. These teach the brain:

- when each evidence source is useful;
- which normalized capability to invoke;
- how to preserve source-specific legal/safety boundaries;
- how to validate and verify results;
- that external providers remain replaceable rails rather than separate AI identities.

## Verification

`qa/scripts/magnanimous-public-api-lock.mjs` verifies:

- the ApiVault discovery-only licensing boundary;
- the activated and blocked/reviewed source lists;
- authentication and read-only enforcement;
- fixed provider hosts;
- bounded timeouts/response sizes;
- Crossref metadata-only behavior;
- Scripture translation allowlisting and no bulk mirroring;
- reference-FX and earthquake safety boundaries;
- Worker route mounting;
- capability realization against existing Magnanimous execution surfaces.

The native-first CI workflow runs this verification and syntax-checks the public API registry/runtime on every branch and pull request.
## Wave 2 expansion — 2026-10-14

ApiVault currently exposes 51 discovery categories. Magnanimous does not import that catalog wholesale; it continues the clean-room process above and activates only independently verified provider contracts.

This expansion raises the production-safe public-data fabric to **20 active read-only providers and 27 Magnanimous capability contracts**.

### U.S. National Weather Service API

- Runtime route: `GET /api/public-data/us-weather-alerts?area=CA&limit=20`
- Purpose: official U.S. active weather-alert evidence.
- Boundary: U.S.-focused and informational; Magnanimous does not replace emergency services or local authorities.
- Resilience: fixed host, signed-in access, 60-second cache and a tighter per-user burst limit.

### SEC EDGAR Data APIs

- Runtime route: `GET /api/public-data/sec-edgar?cik=<CIK>&mode=submissions&limit=20`
- XBRL concept route: `GET /api/public-data/sec-edgar?cik=<CIK>&mode=concept&taxonomy=us-gaap&tag=Assets&limit=20`
- Purpose: public-company filing history and bounded company-concept XBRL facts.
- Boundary: no investment/legal-advice claims; material facts should be verified against the source filing.
- Fair-access behavior: fixed `data.sec.gov` host, identifiable Magnanimous User-Agent, bounded cache and per-user burst controls.

### Wikidata

- Runtime route: `GET /api/public-data/wikidata?mode=search&q=<query>&language=en&limit=8`
- Entity route: `GET /api/public-data/wikidata?mode=entity&id=Q42&language=en`
- Purpose: CC0 structured entity discovery and descriptive metadata.
- Boundary: entity lookup is restricted to labels, descriptions, aliases and sitelinks; the adapter does not become an arbitrary SPARQL proxy or bulk claims mirror.

### Art Institute of Chicago API

- Runtime route: `GET /api/public-data/art-institute?q=<query>&limit=6`
- Purpose: museum artwork discovery for education, ministry and creative workflows.
- Boundary: results are filtered to records explicitly marked public domain before an image URL is exposed.

### The Metropolitan Museum of Art Collection API

- Runtime route: `GET /api/public-data/met-art?q=<query>&limit=4`
- Purpose: open-access collection search and artwork metadata.
- Boundary: current paginated search API is used, metadata remains CC0-oriented, and image URLs are exposed only when the API marks the object public domain.

The same authentication, fixed-host, GET-only, timeout, response-size, cache, request-coalescing, source-attribution and fail-safe rules remain in force for every new adapter.

## Wave 3 — B2B, contact center and telecom priority — 2026-10-14

ApiVault's current 51-category discovery surface was reviewed again with Business, Email, Phone, Data Validation, Government, Documents & Productivity, Security and Open Data prioritized for Magnanimous' business platforms.

### Activated: DISIFY email hygiene

- Runtime route: `GET /api/public-data/email-hygiene?email=<address>`
- Provider call: fixed backend-only `POST https://disify.com/api/email`
- Core scope: syntax, mail DNS/MX, disposable signals, role/free-mail indicators and confidence signals.
- Cost/auth: current core checks require no API key, subject to provider limits.
- Boundary: the result does not prove mailbox existence/ownership, consent, DNC compliance, deliverability or permission to contact.

### Activated: native phone normalization

- Runtime route: `GET /api/public-data/phone-validation?phone=<number>&country=PH`
- Runtime: MIT-licensed `libphonenumber-js` in the Worker; no metered validation API is needed for basic parsing and numbering-plan checks.
- Scope: parse, possible/valid numbering-plan checks, E.164, international/national formatting and detected country/calling code.
- Boundary: no claim of assignment, active service, reachability, ownership, carrier authority, consent or DNC status.

### Deferred after current verification

- `domainsdb`: current access documents an API key; stale discovery metadata is not enough for production activation.
- `companies-house`: valuable B2B company data, but the official API requires an owner API key.
- `patentsview`: current access requires an API key and availability of new keys is constrained.
- metered Phone-category validators: not used by default because native libphonenumber-js covers the basic validation/normalization job without recurring API cost.

### Published platform surfaces

The shared contact-validation workflow is linked from Magnanimous B2B, Contact Center and Telecom and remains available to CRM workflows. The free-first software directive is also published in Free Tools and absorbed into the Magnanimous capability brain so tool selection can reuse it across platform workflows.

All existing authentication, fixed-host, GET-only client contract, upstream timeout/size bounds, source attribution, billing, consent, DNC and telecom legal gates remain intact.
