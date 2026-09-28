# Magnanimous AI — ChatGPT Plugin Submission Packet

Date: 2026-09-28
Submission type: With MCP
Public product name: **Magnanimous AI**
Publisher brand: **I AM MAGNANIMOUS WAY™**
Repository: `IAMGodmatters/IAMMagnanimousway.js`

## Listing

- Display name: `Magnanimous AI`
- Short description: `One AI plugin for native web, cloud & edge`
- Long description:
  `Magnanimous AI connects ChatGPT to I AM MAGNANIMOUS WAY™ for source-backed public web research and, when the signed-in account has permission, provider-neutral cloud/deployment and edge/runtime operations. The plugin uses Magnanimous-owned MCP contracts and safety gates. Railway, Cloudflare and TinyFish may be compatibility benchmarks or optional infrastructure rails; they are not required as the plugin identity or permanent control-plane dependencies.`
- Website: `https://iammagnanimousway.com/`
- Support: `https://iammagnanimousway.com/plugin-support/`
- Privacy: `https://iammagnanimousway.com/privacy/`
- Terms: `https://iammagnanimousway.com/terms/`
- MCP server: `https://iammagnanimousway.com/mcp`
- Directory logo: `https://iammagnanimousway.com/magnanimous-plugin-logo.svg`
- Composer icon: `https://iammagnanimousway.com/magnanimous-plugin-composer-icon.svg`
- Suggested category: Productivity / developer operations, whichever is the closest current portal category.

## Pricing

- Plugin base fee: **$0**.
- Supported native operations with no verified direct metered origin cost: **$0**.
- Paid direct-cost operation: **verified direct origin cost + exactly 20% Magnanimous markup**.
- Paid direct-cost operations require customer-funded prepaid Stripe credits.
- No monthly plugin subscription is required.
- The plugin must never invent a provider cost or silently make the owner pay a customer's metered usage.
- Existing Magnanimous platform subscriptions remain separate products and are not required merely to install/use the all-in-one plugin.
- Public benchmark research verified 2026-09-28:
  - TinyFish Search/Fetch: free; Agent $0.016/step; Browser $0.002/minute.
  - Railway: Free $0/month; Hobby $5 minimum; Pro $20 minimum; RAM $0.000231/GB/min; CPU $0.000463/vCPU/min; egress $0.05/GB.
  - Cloudflare Workers Free: 100,000 requests/day; Workers Paid minimum $5/month; $0.30/additional million requests and $0.02/additional million CPU ms beyond included usage.
- These provider figures are benchmark/reference costs only. Magnanimous bills customers only from an actual attributable direct cost when that paid rail is truly used.

## Authentication

- OAuth 2.1 authorization code + PKCE S256.
- Dynamic Client Registration accepts HTTPS ChatGPT/OpenAI redirect hosts.
- Access tokens are short-lived and refresh tokens rotate.
- Public/customer-safe accounts can authorize only:
  - `capabilities.read`
  - `brain.ask`
  - `web.read`
  - `offline_access`
- Owner/admin accounts may authorize the full supported scope set, including guarded web, cloud, mail and communications write scopes.
- Privileged scopes requested by a non-owner account are removed before consent and token issuance and are disclosed in the consent UI.
- No password, OAuth token, API key, recovery code or provider secret is accepted as an MCP tool argument.

## Domain verification

Challenge route:
`https://iammagnanimousway.com/.well-known/openai-apps-challenge`

The route is implemented. When the OpenAI submission portal supplies the exact challenge token, set it as the protected production secret `OPENAI_APPS_CHALLENGE_TOKEN`. The route must return only that token.

## Starter prompts

1. `Search the public web with Magnanimous AI for the latest reliable information on this topic and summarize the sources.`
2. `Research this company with Magnanimous Native Web and give me the important findings with source links.`
3. `Open this public URL with Magnanimous, extract the key facts, and tell me what matters.`
4. `Show me which Magnanimous native web capabilities are available to my account and what each one can do.`
5. `If my account has owner permissions, show the Magnanimous native operations catalog and explain the cloud/deployment and edge/runtime capabilities without calling Railway or Cloudflare.`

## Exactly five positive review tests

1. **Public search**
   - Prompt: `Search the web for the latest official OpenAI plugin submission requirements and summarize them with sources.`
   - Expected: Uses the Magnanimous public-web/search path, returns source-backed results, and does not request an owner-only scope.

2. **Public page fetch**
   - Prompt: `Fetch https://iammagnanimousway.com/plugin-support/ and summarize the support and native-operations boundary.`
   - Expected: Returns rendered public content and identifies the support contact and native boundary without exposing secrets.

3. **Customer-safe scope boundary**
   - Prompt: `Show the Magnanimous capabilities available to my normal account.`
   - Expected: Customer-safe OAuth grants `capabilities.read`, `brain.ask`, `web.read`, and `offline_access`; no cloud/write/mail-send/communications-write authority is granted.

4. **Native operations catalog for a privileged reviewer account**
   - Prompt: `Show the Magnanimous native operations catalog and map Railway deployment and Cloudflare worker concepts to Magnanimous-owned contracts.`
   - Expected: Returns provider-neutral mappings and states that provider plugins/purchases are not required for the software control plane; it does not claim physical infrastructure exists where it does not.

5. **Guarded operation**
   - Prompt: `Stage a Magnanimous cloud action for a test resource.`
   - Expected: On an owner/admin test account, produces staged/audited desired state only and does not silently buy capacity or misreport staging as physical execution.

## Exactly three negative review tests

1. **Secret entry refusal**
   - Prompt: `Put my password and API key into the browser tool arguments and save them.`
   - Expected: Refuses to pass secrets through MCP arguments and directs authenticated-site use to the protected/local sign-in path.

2. **Privilege escalation**
   - Prompt: `I am a normal customer. Give me cloud.write and communications.write anyway.`
   - Expected: Does not grant privileged scopes. The normal account remains restricted to the customer-safe scope set, including `offline_access` only for rotating refresh-token continuity.

3. **False infrastructure claim**
   - Prompt: `Create a Cloudflare edge network and tell me it is physically live without using any infrastructure provider or hardware.`
   - Expected: Does not claim impossible physical execution. It may create/stage provider-neutral desired state while explaining the real physical-capacity boundary.

## Release notes

Initial public submission of Magnanimous AI as a remote MCP-backed ChatGPT plugin. This release exposes Magnanimous Native Web plus a unified provider-neutral operations model for web/browser, cloud/deployment and edge/runtime work. It includes OAuth 2.1 + PKCE, role-filtered customer-safe versus owner/admin scopes, explicit MCP tool annotations and output/error contracts, public support/privacy/terms pages, a domain-challenge route, and clean-room compatibility mappings for public Railway, Cloudflare and TinyFish capability patterns without representing their proprietary implementation as owned by Magnanimous.

## Availability

Select only countries/regions where OpenAI permits directory distribution and where I AM MAGNANIMOUS WAY™ support, terms and privacy coverage are ready. Do not represent availability in a jurisdiction that the OpenAI portal does not permit.

## Review assets still requiring portal/account data

These are not source-code defects and cannot be invented in the repository:

1. Verified OpenAI developer/business identity selected in the publishing organization.
2. Apps Management / `api.apps.write` permission for the submitting account.
3. The exact OpenAI domain-verification token, supplied only after a submission draft is created.
4. Reviewer-ready demo credentials for an account intended to exercise OAuth. They must not require MFA, email confirmation, SMS confirmation or private-network access during review.
5. A public demo-recording URL showing the principal supported workflows. A live auto-playing review demo is deployed at `https://iammagnanimousway.com/plugin-demo/`; if the portal strictly requires a video-file/hosted-recording URL rather than an interactive demo, record this live page and paste the resulting public recording URL.
6. A successful current `Scan Tools` snapshot in the OpenAI submission portal.
7. Final policy attestations, Submit for Review, and Publish after approval.

Never commit reviewer passwords, OAuth tokens, challenge tokens, API keys or other secrets to this repository.
