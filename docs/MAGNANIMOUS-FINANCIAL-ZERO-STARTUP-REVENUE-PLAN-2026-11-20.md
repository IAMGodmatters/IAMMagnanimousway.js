# Magnanimous Financial and Revenue Launch — Zero-Startup-Cost Path

**Research date:** 20 November 2026  
**Decision:** Launch as a software/services merchant first. Do not launch as a bank, EMI, wallet, lender, payment facilitator, or card issuer.

## Executive decision

The safest low-capital route is to monetize services Magnanimous already delivers. Magnanimous remains the platform brain and system of record for customer identity, entitlements, service delivery, and audit history. A regulated payment provider is only a replaceable payment rail; it receives and processes the customer's payment and settles to the correctly onboarded merchant.

Do not accept, pool, store, transfer, or represent customer funds as Magnanimous balances. Do not create spendable wallet balances, deposit accounts, credit lines, card numbers, or bank statements. A software ledger may record the status of invoices and purchases, but it must never be presented as a deposit or e-money account.

## Phase 1 — validate revenue without spending

Offer only services that can be delivered using already available, free/native platform capabilities and customer-funded resources:

1. AI-assisted business workflow setup and CRM onboarding.
2. Website, content, and customer-support workflow packages.
3. Lead intake, follow-up, and sales pipeline configuration.
4. Digital content and document production.
5. Call-center workflow design and browser-to-browser calling where the existing free capability is suitable.

Before accepting a paid order, define the exact deliverable, scope, completion criteria, revision limit, delivery date, cancellation/refund terms, and customer support contact. Do not sell a feature as live until it has passed its end-to-end test.

Use direct proposals and unpaid organic outreach. Do not buy ads, leads, domains, APIs, AI credits, telecom minutes, hosting upgrades, or subscriptions to acquire the first customers. Do not promise unlimited human work or uncapped variable-cost services.

## Phase 2 — compliant registration and payment collection

There is no verified zero-cost route to operate an ongoing Philippine online services business while ignoring registration and tax obligations. BIR Revenue Regulations No. 15-2024 expressly cover online businesses, digital content, income-generating creators, freelance/professional services supplied over the internet, and digital platforms. Covered persons must register with the BIR and display proof of registration conspicuously and accessibly online. BIR Revenue Memorandum Circular No. 38-2026 clarifies that an issued BIR Registration Seal Badge may be displayed in lieu of exposing the full COR/eCOR; do not display a mock or unissued badge. Register the actual owner/operator and business form correctly before commencing taxable business activity. DTI business-name registration and local permits may also apply; confirm current BNRS eligibility and requirements for the exact owner and structure. Foreign-national eligibility for sole-proprietor registration is conditional and must be checked before choosing that structure.

Use an already approved merchant account belonging to the actual seller, or apply to a regulated provider after the seller's registration documents are ready. Never borrow another person's payment account, misstate the merchant, or route customer proceeds through a personal account not approved for that activity.

### Provider candidate

PayMongo is the leading Philippines-first candidate to evaluate, not yet an approved or selected provider. Its current Hosted Checkout documentation recommends API v2 for new integrations and shows card, GCash, and QR Ph methods. PayMongo says fees vary by payment method; `pass_on_fees` can add the selected method's fee to the customer's displayed total. The current pricing page and any setup, monthly, settlement, or other fixed charges were not independently verified in this review, so do not claim zero setup or monthly cost; obtain current written pricing before committing.

PayMongo's Philippine onboarding documentation says an Individual account can start with KYC and no business documents, but an Individual account must upgrade to a registered business type within 30 days or PayMongo disables it. Its rules section says the 30-day window applies to Philippine merchant accounts activated on or after 27 November 2026; those accounts must complete basic Business Information and have a compliant business website before activation. A directly registered Individual account is closed-loop: it can receive payments but cannot send money out. A sole-proprietor upgrade requires a DTI Business Name Registration certificate, the registered owner's ID, and BIR Form 2303. This is not a permanent registration or payout workaround.

Stripe is already wired into the current repository, but its current global availability page does not list the Philippines and says payment processing is not yet supported outside the listed countries. A historical Stripe Services Agreement for the Philippines still exists, but it was last updated in 2017 and is not sufficient evidence of current new-account onboarding. Treat direct Philippines eligibility as unresolved until Stripe confirms it in writing; do not create or activate an account based on the old agreement alone. For an account opened in another country, Stripe's current help guidance requires a legal entity, tax ID, physical location, phone, government-issued ID, working website, and physical bank account in that country. Stripe also says an activated account's country cannot be changed. Confirm the actual legal account holder, account country, live-mode eligibility, settlement currency, payout bank requirements, and tax obligations before relying on or changing the payment path.

## Phase 3 — payment architecture inside Magnanimous

Build a provider-neutral payment adapter with one provider at a time enabled by explicit owner configuration. The first supported production provider should be selected only after the merchant's account is approved.

Required lifecycle:

1. Authenticated customer selects a published service and accepts readable terms.
2. Server loads the authoritative price and service definition; never trust a client-supplied amount.
3. Server creates a unique order bound to the authenticated tenant and user.
4. Server requests a hosted checkout session from the approved provider using an idempotency key and the internal order reference.
5. Browser is redirected only to the provider-returned HTTPS checkout URL.
6. Return URL displays pending status only; it never activates paid access.
7. Provider webhook signature is verified against the raw request body, with timestamp/replay controls where supported.
8. Webhook event ID is deduplicated atomically; duplicate and out-of-order deliveries are safe.
9. The server verifies the provider-side session/payment status and exact currency/amount/order reference before recording payment.
10. Only a verified paid event grants the purchased entitlement or creates the fulfilment work item.
11. Refund, dispute, chargeback, cancellation, subscription renewal, and payment-failure events update the order and entitlement state through an auditable state machine.
12. Reconciliation compares internal orders and payment events against provider settlement records.

Store provider customer/session/payment identifiers, status, amount, currency, event IDs, and timestamps only as needed. Never store PAN, CVV, PIN, magnetic-stripe data, or online-banking credentials. Never log secrets or full payment payloads.

Use a double-entry accounting ledger only for the merchant's own receivables, fees, refunds, and payouts. It is not a customer wallet. Keep the ledger append-only and correct errors with reversing entries rather than editing historical transactions.

## Current repository audit observations

The current main branch has Stripe subscriptions, hosted payment links, consent recording, tenant-linked checkout references, a central Stripe signature verifier, subscription refresh, and billing QA locks. The checkout preview is deliberately presentation-only and does not collect card credentials.

The current main-branch billing webhook does check the Checkout Session `payment_status`, but it does not require `mode='subscription'` or retrieve the authoritative Stripe Subscription before granting a recurring plan. It also falls back to the Plus plan when a valid plan cannot be resolved. The separate music webhook did not enforce Stripe's timestamp replay window. Agency entitlement activation was deferred to post-response background work rather than completed before acknowledging the webhook.

**PR #987** ([atomic Stripe webhook hardening](https://github.com/IAMGodmatters/IAMMagnanimousway.js/pull/987)) now proposes a shared atomic claim ledger with legacy-event backfill, recoverable failures/leases, authoritative subscription retrieval, synchronous agency processing, and five-minute music signature replay protection. It is still a draft and has not been merged or deployed. Do not treat the new controls as live until CI, independent review, merge, deployment, and production smoke tests all pass.

Additional billing lifecycle work remains before calling billing production-ready:
- Expand and test handling for invoice payment success/failure, subscription past-due/canceled states, refunds, disputes, and chargebacks before treating the billing lifecycle as complete.
- Test that the exact provider amount/currency, tenant, plan, terms version, and checkout reference match before granting entitlements.
- Keep provider-neutral customer-facing UI; provider branding belongs only in the relevant consent/legal disclosures where required.
- Test duplicate delivery, out-of-order delivery, timeout/retry, invalid signature, wrong tenant, wrong amount, wrong currency, refund, cancellation, and webhook downtime.
- The existing full frontend build previously compiled and passed TypeScript/static generation but failed during Windows export cleanup with an EBUSY locked-output-folder error. That run is not a complete successful build. Resolve the file lock and rerun; do not delete the output folder while a process is using it.

## Profit protection rules

- Free tier must remain within free/native quotas.
- Any metered external service must be prepaid by the customer or funded by a confirmed subscription before usage starts.
- Enforce per-tenant quotas, fair-use caps, and a hard stop before unfunded provider consumption.
- Calculate prices from direct variable cost, delivery labor, taxes, payment fees, refunds/chargeback reserve, and target margin. Keep internal cost and margin calculations owner-only.
- Do not silently create paid subscriptions or provider commitments.
- Never activate a paid plan from a browser redirect or customer screenshot.
- Keep recurring billing terms, cancellation method, renewal cadence, and total price visible before affirmative acceptance.

## Banking and cards — later, partner-led only

A Philippine digital-bank application is not a practical launch path: BSP Memorandum M-2025-032 closed the new digital-bank application window effective 1 December 2025. E-money issuance, merchant acquisition, and payment-system operations are regulated activities requiring the applicable authority. BSP's 2026 reminder also says a licensed e-money issuer's authority cannot be used to make an unlicensed partner appear to conduct regulated e-money activities.

If the business later has recurring revenue and compliance funding, investigate a bank/BIN-sponsor and issuer-processor program for prepaid/debit cards. Credit cards are a later-stage product requiring an authorized issuer, underwriting, risk capital, servicing, collections, disclosures, and dispute operations. Magnanimous may own the customer experience and orchestration but must not represent itself as the issuer or bank unless it actually obtains the required authorization.

## External references

- BSP Circular 1198 and FAQ — merchant payment acceptance and merchant-acquisition licensing: https://www.bsp.gov.ph/Regulations/Issuances/2024/1198.pdf and https://www.bsp.gov.ph/Regulations/Issuances/2024/1198%20-%20FAQ.pdf
- BSP Memorandum M-2025-002 — merchant-acquisition license application requirements: https://www.bsp.gov.ph/Regulations/Issuances/2025/M-2025-002.pdf
- BSP Memorandum M-2025-032 — digital-bank application window closure: https://www.bsp.gov.ph/Regulations/Issuances/2025/M-2025-032.pdf
- BSP Memorandum M-2026-030 — regulated e-money activity arrangements (24 June 2026): verify the signed primary issuance with BSP before relying on an interpretation.
- BIR RR 15-2024 — mandatory registration for persons engaged in business, including online and freelance services: https://bir-cdn.bir.gov.ph/BIR/pdf/RR%2015-2024%282%29.pdf
- BIR NewBizReg: https://web-services.bir.gov.ph/newbizreg/
- DTI business-name FAQs and eligibility/fees: https://bnrs.dti.gov.ph/faq
- PayMongo Hosted Checkout (API v2, local methods, fee pass-through): https://docs.paymongo.com/docs/payment-channels-hosted-checkout
- PayMongo webhook security and best practices: https://docs.paymongo.com/docs/payment-acceptance-best-practices and https://docs.paymongo.com/docs/developer-tools-best-practices
- PayMongo Philippine business onboarding and 27 November 2026 rules: https://docs.paymongo.com/docs/account-settings-doing-business-in-the-philippines
- Stripe current global availability: https://stripe.com/global
- Historical Philippines Services Agreement (last updated 2017): https://stripe.com/legal/ssa/ph
- Requirements to open a Stripe account in another country: https://support.stripe.com/questions/requirements-to-open-a-stripe-account-in-another-country
- Stripe account country cannot be changed after activation: https://support.stripe.com/questions/stripe-account-registered-in-the-wrong-country

## Release gate

No live payment launch until all are true: the merchant is properly registered; the payment provider has approved the actual merchant and settlement account; live credentials are configured as secrets; signed webhook and reconciliation tests pass; terms/refund/privacy/contact pages are public and accurate; the exact customer-facing price is approved; and the end-to-end live smoke test is performed with a small payment and refund. No startup spending is authorized by this document.

## 2026-11-21 source refresh — BIR Registration Seal and PayMongo merchant readiness

This refresh checks the primary BIR and PayMongo pages as they stood on 21 November 2026. It corrects the earlier shorthand that an online business must publish the full COR/eCOR.

### BIR Registration Seal Badge — RMC No. 38-2026

The BIR issued Revenue Memorandum Circular No. 38-2026 on 29 April 2026. It applies the online-proof-of-registration requirement in RR 7-2024 and RR 15-2024 to online sellers, service providers and income-generating digital creators.

Important implementation points:

- The BIR Registration Seal Badge is issued together with the COR/eCOR and may be displayed **in lieu of publishing the full COR/eCOR**. This avoids exposing the entire registration document online.
- The badge is intended for the taxpayer's official website, online store/platform, mobile application or social business page. The BIR identifies an About, Company, Government Compliance or Business Permits page as suitable website locations.
- The badge must remain clear, readable and unaltered. Do not redraw it, invent a badge, alter its QR code or display a sample badge as if it belonged to the merchant.
- The badge and COR/eCOR carry a QR code. Verify the destination is the official BIR verification domain: https://verify.bir.gov.ph/correspondence/ before relying on the result.
- The circular says the badge is issued free manually or electronically through ORUS. It separately states that taxpayers updating registration information through ORUS to secure the badge pay a ₱30.00 Loose Documentary Stamp Tax. Do not describe every ORUS route as entirely free.
- The circular lists relevant activity classifications including PSOC 5990 (online content creator), PSIC 47913 (retail sale via internet), 47911 (mail order), 47912 (telephone order), and 85593 (online tutorial services). These are examples, not a substitute for the BIR assigning the correct classification to the actual business activities.

**Magnanimous implementation gate:** add a real, owner-managed BIR Registration Seal slot to the public business/compliance surface only after the actual merchant supplies its issued badge. Store the asset and verification evidence privately, publish only the badge image, and preserve its original design/QR. If no badge has been issued, show no badge and do not claim BIR registration or payment-provider compliance. The platform must not expose the full COR/eCOR by default.

Primary source: BIR RMC No. 38-2026, issued 29 April 2026: https://bir-cdn.bir.gov.ph/BIR/pdf/RMC%20NO.%2038-2026.pdf

### PayMongo website and account rules — refreshed 21 November 2026

PayMongo's current Philippine onboarding documentation confirms the following:

- The new sign-up rules take effect **27 November 2026** for Philippine merchant accounts (or accounts with country not set) activated on or after that date. They require basic Business Information and a compliant public online presence before activation. Accounts activated before that date are not asked the new sign-up questions.
- The website must be public and functional, not a placeholder or work in progress. It must show a PHP price range, a physical Philippine business address matching the business documents, Terms & Conditions, Privacy Policy, Return & Refund Policy, and customer-service contact information.
- A publicly accessible Facebook Business Page is an accepted online-presence option. A LinkedIn profile is accepted only for certain e-wallets and should be confirmed with PayMongo; it is not a general substitute for a compliant website.
- Under the new rules, a Philippine Individual account has a 30-day registration window to upgrade to a registered business type. A directly registered Individual wallet is closed-loop and cannot send funds out. Fully managed linked accounts and some sales-endorsed accounts have specific exemptions. Do not use an Individual account as a permanent business or payout workaround.
- A Philippine sole-proprietor upgrade requires the DTI Business Name Registration certificate, the registered owner's ID, and BIR Form 2303. Other entity types have different requirements.
- A business registered outside the Philippines must follow PayMongo's foreign-entity documentation route, including authenticated/apostilled or consularized documents unless PayMongo approves an alternative, certified English translations where needed, a working website, and ownership/authorization evidence. A Philippine payout destination is required before payout release. Confirm the exact entity and documents with PayMongo before applying.
- PayMongo's Website Guidelines page separately lists public access, functionality, PHP price range, matching Philippine address, Terms, Privacy, Refund/Return, and contact details. Its API/checkout documentation does not establish that a specific merchant is approved or that any payment method is enabled.
- Payment method eligibility is account-specific. An enabled API integration or a published provider capability list does not mean cards, e-wallets, QR Ph, wallet payouts or subscriptions are approved for this merchant.
- Current complete setup, monthly, transaction, settlement and refund pricing remains unverified. Obtain the actual account-specific fee schedule in writing before selecting PayMongo or enabling any fee pass-through.

Primary PayMongo sources:
- Philippine business onboarding and 27 November rules: https://docs.paymongo.com/docs/account-settings-doing-business-in-the-philippines
- Website guidelines: https://docs.paymongo.com/docs/account-settings-website-guidelines
- Account setup: https://docs.paymongo.com/docs/account-settings-account-setup
- Account capabilities and payment-method approval: https://docs.paymongo.com/docs/account-settings-account-capabilities
- Hosted Checkout: https://docs.paymongo.com/docs/payment-channels-hosted-checkout

### Payment-provider selection remains unresolved

Stripe's live global availability page lists the United States and several other supported countries but does not list the Philippines. That page is not evidence that a person living in the Philippines may open a Philippine Stripe merchant account. A foreign-incorporated merchant may be considered only if the actual legal entity, beneficial owners, tax records, physical operating presence, bank account and Stripe country-specific onboarding all satisfy current Stripe requirements. A historical Philippines Services Agreement is not a substitute for current onboarding confirmation.

Do not change or activate the existing Stripe integration, create a new Stripe account, switch merchant of record, or enable PayMongo based only on this research. First establish the exact legal seller and country of registration, obtain the relevant registration documents and BIR Registration Seal, verify the public website checklist, obtain written provider eligibility and complete fees, and confirm the payout destination. Keep the provider adapter replaceable and keep the platform's internal order/entitlement ledger provider-neutral.

Primary Stripe source: https://stripe.com/global

### Public-site readiness checklist to verify before merchant onboarding

The public website must be checked against the exact merchant's legal details, not merely against whether pages exist in source code:

- [ ] Publicly accessible, working website (not a placeholder or unfinished checkout).
- [ ] PHP price range for the actual Philippine merchant offering.
- [ ] Physical Philippine business address that matches its registration documents.
- [ ] Visible Terms & Conditions.
- [ ] Visible Privacy Policy.
- [ ] Visible Return & Refund Policy.
- [ ] Customer-service email/contact method.
- [ ] Actual BIR Registration Seal Badge, clear, unaltered, QR-verifiable, displayed on a public About/Company/Government Compliance/Business Permits page.
- [ ] Correct legal merchant name, owner/authorized representative, registration type and tax details.
- [ ] Provider's written approval for the merchant, intended payment methods, payout account and complete fee schedule.

Items that require an actual government-issued badge, legal entity document, physical address, bank/payout account or provider approval remain owner-supplied evidence. Do not fill those fields with invented details or represent the site as merchant-ready before verification.
