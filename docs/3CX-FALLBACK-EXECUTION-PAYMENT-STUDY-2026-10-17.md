# 3CX fallback, execution authorization, payment, and source-privacy study

Date: 2026-10-17

## Purpose

This document records the clean-room research and implementation decisions used to strengthen Magnanimous Telecom. Magnanimous AI remains the brain, policy, identity, orchestration, billing, and customer-facing control layer. 3CX is not copied into the codebase and is not a required runtime dependency.

## Current public 3CX facts

Official 3CX public material currently advertises SMB Free for up to 10 users. 3CX also advertises a Basic Free deployment for up to 10 users. The free license does not make PSTN/SIP service free; a compatible trunk or telephone service can still have its own charges.

Official 3CX Basic Free material states that CRM/API integrations and automation are not included in that free tier. Official Call Control documentation states that the Call Control API requires an 8SC-or-higher AI license. Therefore the free 10-user option is useful as a small human/softphone/PBX fallback, but it must not be represented as the programmable API backend for Magnanimous automation.

Public sources reviewed:

- https://www.3cx.com/smb/
- https://www.3cx.com/try/
- https://www.3cx.com/phone-system/free-basic-edition/
- https://www.3cx.com/docs/call-control-api/
- https://www.3cx.com/ordering/pricing/
- https://www.3cx.com/ordering/pricing/faq/
- https://www.3cx.com/company/terms-and-conditions/

## Provider abstraction and branding

Magnanimous may keep backend provider selection out of ordinary customer-facing UI and present the service as Magnanimous Telecom. That is a provider-abstraction design, not permission to falsify software ownership.

Required upstream notices, trademarks, client branding, attribution, disclosures, and contractual terms must be preserved wherever the applicable upstream software or agreement requires them. The platform must never claim that third-party software was authored or owned by Magnanimous when it was not. The implementation therefore keeps provider identities and economics in owner/admin control-plane responses while ordinary customers interact with Magnanimous-branded service surfaces.

## Fallback policy

The implemented routing policy is:

1. Prefer Magnanimous-native or directly contracted routes when they are ready.
2. For non-programmatic small-team fallback at 10 users or fewer, a valid 3CX Free deployment can be selected internally.
3. If programmatic call control is required, do not select the free 3CX fallback. Use a properly licensed 3CX AI/API route when configured, or another contracted programmable SIP/carrier route.
4. Never pretend a provider is configured or licensed when it is not.
5. Never expose protected provider credentials to the browser.

## Why `execution_authorized:false` is valuable

The predictive planner is intentionally a planning function. A plan can calculate a recommended number of dials without possessing authority to place a real call. Keeping planning and execution separate limits accidental or unauthorized calling.

The improvement is a second-stage execution lease rather than deleting the safety boundary. A workspace owner/admin can approve a campaign policy once for a bounded period. The server then issues a short-lived signed lease only when every required gate passes. A dialer can use the lease without asking for a new human click on every call, but the live gates are checked again immediately before execution.

Live gates include:

- campaign enabled;
- consent evidence verified;
- Do Not Call clearance;
- legal/local calling window;
- holiday policy;
- carrier readiness;
- customer-funded billing reserve;
- jurisdiction policy;
- truthful caller identity;
- recording/monitoring policy when recording is enabled.

This converts `execution_authorized:false` from a blocker into a separation-of-duties control: planning stays safe, while approved campaigns can run with low operational friction.

## Compliance research used for the gate design

For U.S. telemarketing, public FTC/FCC guidance includes Do Not Call controls, calling-time restrictions, consent requirements for certain prerecorded/artificial-voice telemarketing, and predictive-dial abandonment safeguards. These requirements differ by call type, technology, consent, jurisdiction, and other facts, so the runtime treats them as configurable jurisdiction policy rather than a universal legal conclusion.

Sources reviewed:

- https://www.ftc.gov/business-guidance/resources/complying-telemarketing-sales-rule
- https://www.ftc.gov/legal-library/browse/rules/telemarketing-sales-rule
- https://www.fcc.gov/document/fcc-strengthens-consumer-protections-against-robocalls-robotexts
- https://privacy.gov.ph/data-privacy-act/

The software is designed to retain evidence and fail closed; it is not a substitute for jurisdiction-specific legal advice.

## Customer-first payment bridge

Magnanimous already requires direct variable provider cost to be customer funded and applies the owner policy of verified origin cost x 1.20. The new telecom fallback quote uses the same pricing function.

Payment flow:

1. Magnanimous verifies which backend route is eligible and whether its upstream origin cost is free or paid.
2. A server-side owner/admin quote records the upstream origin cost and final customer charge.
3. Free/included provider license cost is recorded as $0 and does not trigger a fake charge.
4. For paid direct cost, Magnanimous creates a Stripe Checkout session for the final Magnanimous customer price.
5. The existing verified Stripe webhook remains authoritative. A separate verified observer recognizes telecom-fallback payments by scoped metadata and idempotent event IDs.
6. Only after customer payment succeeds may upstream settlement become eligible.
7. Upstream automatic payment remains disabled unless an actual contracted provider billing endpoint, protected token, explicit owner enable flag, and maximum automatic-payment limit are configured.
8. If no supported upstream purchase API exists, the system records customer payment as upstream-pending instead of falsely claiming the provider was paid.

For the free 10-user 3CX license itself, the upstream license cost is $0, so no 3CX license payment is needed. SIP trunk, DID, carrier, or other usage charges remain separate and can use the same customer-funded pattern when a real provider contract/API is configured.

## Source and provider privacy

Customer-facing provider selection is deliberately minimized. The fallback configuration endpoints are owner/admin only. Ordinary customer traffic receives the Magnanimous Telecom service identity. Provider secrets, raw provider keys, upstream origin cost, and internal markup breakdown remain owner-side information.

This does not override a third party's legal or contractual attribution requirements.

## Repository source protection

Application-level anti-clone locks cannot make a public GitHub repository uncopyable. The only meaningful way to prevent unauthenticated GitHub source cloning is to make the repository private and then enforce repository-level branch/ruleset controls.

As of this study, repository metadata still reports public visibility. The codebase already has proprietary licensing, provenance, anti-clone scans, source-map protection, source-asset locks, and CI guardrails, but those controls do not change the fundamental copyability of public source.

Required repository-level completion steps are:

1. Change `IAMGodmatters/IAMMagnanimousway.js` visibility from Public to Private in GitHub.
2. Confirm production deployment credentials and GitHub Actions still have private-repository access.
3. Enable enforced required status checks/rulesets on `main` rather than relying only on repository-contained workflows.
4. Require owner/code-owner review for sensitive deployment/security paths where practical.
5. Keep public distributable binaries/assets on the official Magnanimous site rather than depending on raw GitHub URLs.

The application must not claim the repository is private until GitHub metadata confirms it.
