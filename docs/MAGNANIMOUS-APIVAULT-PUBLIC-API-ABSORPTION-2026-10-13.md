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
