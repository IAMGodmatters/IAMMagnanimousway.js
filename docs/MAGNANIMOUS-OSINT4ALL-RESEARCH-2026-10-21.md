# Magnanimous OSINT research integration — 2026-10-21

## Ownership, source, and scope

Magnanimous AI remains the first-party intelligence brain and authorizer. OSINT4ALL (https://osint4all.com/) is an independent moderated directory of 191 listed tools as observed on 2026-10-21, **not** a single open-source code repository or license grant. Its listings are references, not verified APIs or guaranteed live integrations.

This change adds read-only, authenticated public DNS and email-domain security checks to the existing /intelligence-desk using already implemented Magnanimous /api/magnanimous/dns/lookup and /api/magnanimous/dns/email-security routes. No OSINT4ALL code or data is copied. No new provider key, paid API, scanner, scheduler, subscription, or database is provisioned. Existing site design, session enforcement, owner-only mutation gates and billing remain unchanged.

## Capability and source inventory

| Workflow | Upstream reference | Integration state | Gate |
| --- | --- | --- | --- |
| Public domain/DNS records | Native Magnanimous DNS core | **Executable read-only**, signed-in | Valid public-domain input; existing backend authentication |
| Email-domain signals | Native Magnanimous DNS core | **Executable read-only**, signed-in | Findings are signals, not a security certificate |
| Company identity | Existing GLEIF/Wikidata public-data routes | **Existing**, unchanged | Verify entity identity independently |
| U.S. filings | Existing SEC EDGAR read-only adapter | **Existing**, unchanged | Official records with provenance |
| Regulations | Existing Federal Register adapter | **Existing**, unchanged | Verify date, edition, jurisdiction |
| Web evidence archival | ArchiveBox, https://github.com/ArchiveBox/ArchiveBox | **Candidate; not deployed** | MIT; storage/privacy/retention review |
| Historical web | Internet Archive, https://web.archive.org/ | **Reference; not connected** | Check archive capture completeness |
| Open web crawl | Common Crawl, https://commoncrawl.org/ | **Candidate; not deployed** | Source terms, storage, provenance |
| Passive subdomain leads | Subfinder, https://github.com/projectdiscovery/subfinder | **Candidate; not deployed** | MIT code; independent provider API terms |
| Attack-surface mapping | OWASP Amass, https://github.com/owasp-amass/amass | **Candidate; not deployed** | Apache-2.0 with some separately licensed components; authorization; no active scanning by default |
| Threat intelligence graph | OpenCTI Community, https://github.com/OpenCTI-Platform/opencti | **Candidate; not deployed** | Community Apache-2.0 only; separate Enterprise license; cost review |
| Indicator enrichment | IntelOwl, https://github.com/intelowlproject/IntelOwl | **Candidate; not deployed** | AGPL-3.0 duties; provider sharing, secrets and cost review |
| Research datasets | 4CAT, https://github.com/digitalmethodsinitiative/4cat | **Candidate; not deployed** | Verify license and source platform permissions |
| Username leads | Sherlock, https://github.com/sherlock-project/sherlock | **Excluded from automatic profiling** | Privacy, consent, platform terms |
| Modular passive reconnaissance | Recon-ng, https://github.com/lanmaster53/recon-ng | **Candidate; not deployed** | Module-by-module permission and licensing |
| Archival collection | https://osint4all.com/collection/evidence-preservation-and-historical-web-stack/ | **Reference; not connected** | Public visibility, retention, evidence integrity |

Directory filter totals when reviewed: Domain/DNS 27, Threat triage 27, Company research 18, People/social 19, Maps/geolocation 24, Archives 30, Self-hosted 23. Filters overlap and must not be treated as a count of reusable software modules.

## Safeguards and verification

1. No directory entries, credential sets, people-search automations, or third-party scanners are installed by this change.
2. Frontend forms validate domains, use existing authenticated Magnanimous API paths, show actual returned data/errors, and never show mock results.
3. Requests remain read-only, record types are allowlisted, and server-side authentication remains authoritative. No arbitrary URL fetching, port scanning, or active enumeration is added.
4. Paid services, bulk collection, external API subscriptions, and customer-specific storage require future licensing, security, policy, budget, and tenant review.
5. Outside technology remains externally attributed in engineering/license documentation without replacing Magnanimous AI's identity or making false ownership claims.
6. Repo validation: run node qa/scripts/osint-native-research-lock.mjs plus existing contract tests, frontend typecheck, and build. Authenticated production smoke is a separate step; do not confuse a passing static test with verified live service.

## Sources reviewed 2026-10-21

- https://osint4all.com/ and https://osint4all.com/tool/
- https://osint4all.com/tool/?access_model=self-hosted
- https://github.com/ArchiveBox/ArchiveBox/blob/dev/LICENSE
- https://github.com/projectdiscovery/subfinder/blob/dev/DISCLAIMER.md
- https://github.com/owasp-amass/amass
- https://github.com/OpenCTI-Platform/opencti/blob/master/LICENSE
- https://github.com/intelowlproject/IntelOwl
