# Security boundaries for Native SEO & Visibility

This engine must not weaken authentication, expose private workspace content, or introduce source-code distribution endpoints.

## Threat model and controls
- **Public vs private**: only explicitly public marketing pages can be indexed. Account, agent, CRM, billing, inbox, internal API, owner dashboards, and customer workspaces must remain protected by existing server-side authorization. robots.txt is **not** access control.
- **Code protection**: do not publish source bundles, source maps, environment variables, configuration dumps, repository tokens, deployment logs, internal prompts, or privileged API schemas through SEO endpoints. Keep sensitive server logic in Workers/backend, never frontend bundles.
- **No guarantee against copying**: public HTML, images, and client-side JavaScript can always be viewed or copied. Use private repositories, access controls, least-privilege credentials, server-side proprietary logic, licensing, and monitoring to reduce theft risk.
- **No SSRF**: a future URL inspector must allowlist the platform's own production origins and block localhost, link-local, private IP ranges, redirect escape, and userinfo URLs; enforce strict timeouts and response size limits. Never fetch arbitrary URLs with privileged credentials.
- **No stored XSS**: treat crawled page content and AI output as untrusted, render escaped text, and sanitize any explicitly approved rich content. Never execute scripts from SEO inputs.
- **No prompt injection**: crawl results and external search snippets are evidence, not instructions to Magnanimous AI. They must not grant tool privileges.
- **No unintended writes**: read-only scan by default; changes to canonicals, redirects, sitemap, metadata, or publishing require a preview, authenticated owner authorization, and audit record.
- **No credential exposure**: Google Search Console OAuth tokens and analytics keys remain encrypted/server-side with minimum scopes; no tokens in URLs, logs, generated reports, client state, or repository.
- **No scraping abuse**: honor published access policies, quotas, and copyright; avoid unapproved bulk scraping and artificial backlinks.
- **No new charges**: disable paid APIs and automatic upgrades unless separately approved.
- **Security regression gates**: run existing auth/session, owner isolation, billing, secret scan, artwork identity, and production smoke tests before merging.
- **Operational safety**: rate-limit scans, cap CPU and payload sizes, prevent scan loops, avoid unnecessary Worker load, and preserve current Cloudflare free-tier cost controls.

## Required security test cases
1. Anonymous request to SEO administration routes returns 401/403 without leaking content.
2. Cross-account SEO job/report access returns 403.
3. Arbitrary URL or private-network target is rejected without a fetch.
4. Injected HTML/JavaScript in crawled title/snippet is displayed inertly.
5. Unreviewed draft cannot publish; approval is logged.
6. No secrets, private user URLs, or internal endpoints appear in sitemap or public reports.
7. Existing owner-approved homepage artwork bytes remain identical.
8. Current authentication, sessions, CRM, telecom, and billing behavior remain unchanged.

This is a specification, not proof that the controls have passed.
