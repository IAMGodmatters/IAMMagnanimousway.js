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


## Continuation — extended first-party evidence workflow (2026-10-21)

The existing authenticated Intelligence Desk is expanded beyond simple DNS and email indicators:

- **RDAP registration context**: calls the already deployed Magnanimous native POST /api/magnanimous/dns/rdap. Its backend sanitizes registrar data and intentionally excludes registrant contact details. Registration does not establish current ownership or legal authority.
- **Full DNS health review**: calls the existing POST /api/magnanimous/dns/diagnose. Shows resolver comparison for A/AAAA/MX/NS, cautious DNSSEC indicators, and email/security findings. No active port scan or exploits.
- **Local evidence export**: after a successful live request, the user's browser can save a JSON research packet containing queried domain, task, UTC time, native origin, raw response, and epistemic limitations. Export is opt-in and local; this page does not persist evidence or publish it.
- **Historical web and certificate records**: read-only outbound links to Wayback Machine and crt.sh are constructed only for a syntactically valid domain. The user initiates the link; no API integration, remote storage, or claims of verified archive presence. Clicking discloses the domain to that separate site.
- **Stale-result controls**: changing domain, mode, or record type clears prior results. Failed requests never produce an evidence packet.

These features build on the first-party DNS, validation, and Intelligence Desk service paths already in the authoritative main; no new paid infrastructure and no UI design replacement.

### Research candidates not integrated

- **Gitleaks** for a reviewed code-secret scan in a future authorized repository workflow; review official upstream license, false positives, and GitHub Actions build effects first. Do not presume there are zero historical leaks or publish scan hits.
- **ExifTool** for authorized owner-uploaded media forensic metadata; no uploaded files processed in this change.
- **SingleFile or Browsertrix** for controlled capture of browser-rendered sources; no external crawling provisioned.
- **ThreatFox and URLhaus** for conservative public reputation lookups; no paid keys, bulk automated submissions, or sensitive URLs sent to community services.
- **Open Supply Hub** for supplier identity and facility data; source matching is not verified here.

Research references: https://osint4all.com/collection/a-lightweight-verification-stack-for-newsrooms/ ; https://osint4all.com/collection/evidence-preservation-and-historical-web-stack/ ; https://osint4all.com/pricing-model/free/ ; https://osint4all.com/tool/crt-sh/

Deployment caveat: Main-branch merge is a code change. GitHub pipeline completion and authenticated production smoke must be checked separately; never describe queued workflows as deployed.


### Unrelated but release-blocking production smoke recovery

Prior main deployment run https://github.com/IAMGodmatters/IAMMagnanimousway.js/actions/runs/39616213974 failed at the negative UserInfo auth check: a GET to /oauth/userinfo timed out (curl exit 28, HTTP 000), preventing the expected 401 assertion. The deployed service's authorization behavior was **not verified by that request**. We switched the standalone one-shot smoke check to the workflow's pre-existing bounded safe_expected_status helper. It retries only transient 000/502/503/504 failures and **still strictly requires final HTTP 401**; it does not skip, fake, or downgrade the auth/security requirement. This is a smoke reliability improvement, not evidence that the production endpoint is live. New CI/deploy runs must validate it.
