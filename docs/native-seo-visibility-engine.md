# Magnanimous AI Native SEO & Visibility Engine

Status: first-party foundation and implementation contract. No paid third-party SEO dependency.

## Guardrails
- Magnanimous AI owns orchestration, authorization, review, memory, and publication policy.
- Preserve current design, routes, robots.txt, existing sitemap, authentication, billing, and Cloudflare Worker behavior.
- Never publish AI-generated articles or create backlinks without explicit owner review and approval.
- Never use third-party brand names, code, logos, or copyrighted content as native assets.
- Free-first: use existing site metadata, public sitemap, Search Console export when owner-authorized, and server-side analytics.
- Respect robots.txt, search engine policies, rate limits, and source licensing.
- Keep tokens and Search Console credentials server-side only; fail closed if unavailable.

## Implementation phases
1. **Technical SEO baseline**: inventory public canonical URLs, robots exclusions, sitemap response, HTTP status, canonical tags, title, description, and structured data. Do not index private app screens.
2. **Canonical issue remediation**: identify duplicate URL clusters from Search Console evidence. Choose one canonical URL per content cluster; redirect only when equivalent and approved. Preserve public routes and user query semantics.
3. **Content workspace**: topic/keyword research, evidence references, original draft generation, human review, explicit publish action, and audit trail.
4. **AI visibility**: optional user-approved manual query sampling across search engines/AI tools. Record source, date, exact query, citation evidence, and uncertainty. Never claim guaranteed AI recommendations.
5. **Reporting**: weekly index coverage, impressions, clicks, CTR, pages reviewed, draft status, and errors. Separate observed data from estimates.

## Acceptance checks
- Existing routes, design, robots exclusions, sitemap and metadata remain unchanged until audited.
- No secret is exposed to client-side code or committed to GitHub.
- No automated publication, unsolicited outreach, paid subscription, or backlink scheme.
- Only canonical URLs supported by inspected live pages and Search Console evidence are changed.
- Typecheck/build, Worker tests, and public-route smoke tests pass before merge.
- Production deployment and search indexing are independently verified after merge; PR creation alone is not deployment.

## Owner dashboard UX contract
Add a first-party "SEO & Visibility" workspace to the existing navigation only after verifying route conventions. Show: technical health, canonical review queue, content drafts, AI visibility evidence, and performance trend. Any publishing or canonical edit requires an explicit confirmation with a preview of affected URLs.

## Current blocking inputs
- Verified Search Console affected URL list (duplicate without user-selected canonical).
- Existing frontend navigation/route patterns and metadata implementation.
- Read-only site analytics credentials or export, if connected.

No proprietary HeyVisibly code or assets are required.
