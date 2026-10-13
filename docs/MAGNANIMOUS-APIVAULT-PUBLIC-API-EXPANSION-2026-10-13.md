# Magnanimous API Vault public-API expansion — 2026-10-13

API Vault remains a discovery directory only. Magnanimous does not copy its catalog, source, or proprietary implementation. Every adapter below is independently implemented against the official provider contract and remains behind Magnanimous authentication.

## Activated additions

- **MDN HTTP Observatory** — owned-domain HTTP security-header scanning for `iammagnanimousway.com` and its subdomains only. Provider scans are public observations and a good grade is not a complete vulnerability assessment.
- **NIST NVD 2.0** — bounded CVE lookup and keyword vulnerability search. Anonymous allowance works without a key; an owner NVD key may be configured later for a higher provider allowance.
- **USAJOBS** — no-key official codelists are live. Federal job search is implemented but intentionally reports setup-required until the owner supplies a USAJOBS API key and the matching registered email.
- **Openverse** — bounded image discovery restricted by default to CC0, Public Domain Mark, CC BY, and CC BY-SA. Every returned work retains attribution/license metadata and a mandatory verify-before-publish warning because Openverse does not guarantee license accuracy.
- **Free Dictionary API** — English definition, pronunciation, synonym, antonym and example lookup for Magnanimous Learning/Kids/writing.
- **Datamuse** — means-like, sounds-like, spelled-like and suggestion workflows. The adapter records Datamuse's announced API-key transition for 2027-02-01 so future credential migration does not require product redesign.
- **NHTSA vPIC** — bounded VIN/partial-VIN decoding for vehicle and transportation research.

## Product routing

- Magnanimous Attention/Security Watch → MDN Observatory + NVD.
- Opportunity Vault → USAJOBS.
- Media Library / Kids / Ministry / social creative workflows → Openverse.
- Magnanimous Kids / writing / learning → Free Dictionary + Datamuse.
- Vehicle / transportation research → NHTSA vPIC.

## Guardrails

- Read-only Magnanimous routes.
- Signed-in users only.
- Fixed provider hosts; no arbitrary URL proxy.
- 9-second upstream timeout and 1.5 MB streamed response cap.
- No paid API was added.
- No provider credential is exposed to customers.
- No claim that USAJOBS job search is connected before owner credentials exist.
- Security scanning is restricted to owned Magnanimous domains.
- Openverse license data must be verified before publication.
- NVD evidence must be checked against the actual dependency/product/version before remediation.
