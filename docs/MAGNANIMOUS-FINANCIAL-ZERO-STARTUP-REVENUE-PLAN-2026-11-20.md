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

There is no verified zero-cost route to operate an ongoing Philippine online services business while ignoring registration and tax obligations. BIR guidance covers self-employed professionals, freelancers, online sellers, and digital services. Register the actual owner/operator and business form correctly before commencing taxable business activity. DTI business-name registration is required when operating under a name other than the owner's true name; local permits may also apply. Foreign-national eligibility for sole-proprietor registration is conditional and must be checked before choosing that structure.

Use an already approved merchant account belonging to the actual seller, or apply to a regulated provider after the seller's registration documents are ready. Never borrow another person's payment account, misstate the merchant, or route customer proceeds through a personal account not approved for that activity.

### Provider candidate

PayMongo is the leading Philippines-first candidate to evaluate because its hosted checkout and payment links advertise no setup fee or monthly subscription, with transaction fees charged only on successful payments. It supports cards and local payment methods. This is not a guarantee of approval or zero cost: transaction fees apply, KYC is required, and live API keys require a registered business type. Its published onboarding rules say Philippine individual accounts are time-limited and must upgrade to a registered business type within 30 days; those rules take effect 27 November 2026.

Stripe is already wired into the current repository, but Stripe's current global availability page does not list the Philippines as a directly supported country. Do not assume existing Stripe payment links are an approved payment route for a Philippines-based merchant. Confirm the legal account holder, country, live-mode status, and settlement eligibility before relying on them.

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

The current main branch already has Stripe subscriptions, hosted payment links, consent recording, tenant-linked checkout references, a Stripe signature verifier, subscription refresh, and billing QA locks. The checkout preview is deliberately presentation-only and does not collect card credentials.

Important hardening items to verify/fix before calling the existing billing production-ready:

- The subscription checkout webhook currently handles `checkout.session.completed` by setting a subscription status to `active` before checking the checkout session's payment status or retrieving the subscription's authoritative status. Confirm the resulting subscription status before entitlement activation; add the relevant asynchronous payment-success/failure handling if those methods are enabled.
- The webhook deduplication flow reads for an event ID, processes the event, then inserts the event ID. Concurrent duplicate deliveries can race. Use an atomic event claim/state transition and recoverable processing status.
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
- PayMongo hosted checkout: https://docs.paymongo.com/docs/payment-channels-hosted-checkout
- PayMongo webhook security and best practices: https://docs.paymongo.com/docs/payment-acceptance-best-practices and https://docs.paymongo.com/docs/developer-tools-best-practices
- PayMongo Philippine business onboarding: https://docs.paymongo.com/docs/account-settings-doing-business-in-the-philippines
- Stripe country availability: https://stripe.com/global

## Release gate

No live payment launch until all are true: the merchant is properly registered; the payment provider has approved the actual merchant and settlement account; live credentials are configured as secrets; signed webhook and reconciliation tests pass; terms/refund/privacy/contact pages are public and accurate; the exact customer-facing price is approved; and the end-to-end live smoke test is performed with a small payment and refund. No startup spending is authorized by this document.
