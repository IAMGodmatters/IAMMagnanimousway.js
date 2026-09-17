# Magnanimous Telecom Regulatory Authority Roadmap

Status: implementation and filing-preparation roadmap. Nothing in this document represents an authority already granted.

## Architecture rule

Magnanimous Telecom remains the customer-facing provider and Magnanimous AI remains the control/orchestration layer. Wholesale carriers, SIP trunks, numbering hosts and interconnection partners remain replaceable gateways until Magnanimous Telecom receives the applicable government authority and direct interconnection/numbering arrangements.

Regulatory authority must never be inferred from software readiness. Production flags such as `TELECOM_CARRIER_AUTHORIZED` and `TELECOM_DIRECT_NUMBERING_AUTHORIZED` must remain false until documentary approval is verified.

## Track A — California operating authority

Current CPUC guidance (reviewed 2026-09-17) provides a CPCN process under California Public Utilities Code §1001 for telephone corporations providing full/limited facilities-based competitive local exchange, interexchange and/or fixed interconnected VoIP services. Non-facilities-based/resold service can fall under §1013 registration instead. The final classification must match the facilities Magnanimous Telecom actually owns or controls at filing time.

### Filing-preparation gates

1. Confirm the exact legal applicant entity and California qualification/registration needed for that entity.
2. Determine and document facilities classification from the deployed Magnanimous network, not from marketing language.
3. Complete the current CPUC CPCN application package and appendices.
4. Prepare management/ownership disclosures and sworn-affidavit answers from verified facts.
5. Prepare technical service description, service territory, network diagram and expected service-start information.
6. Prepare financial qualification evidence and an acceptable financial instrument/performance bond under current CPUC rules.
7. Determine CEQA treatment from the actual construction/facilities plan.
8. Pay the then-current filing fee and submit through CPUC e-file only after owner review/signature of all sworn statements.
9. After approval, maintain continuous performance-bond and applicable annual reporting/compliance obligations.
10. Do not offer California regulated service before the required operating authority is effective.

### Interconnection after authority

Treat direct PSTN interconnection as a separate workstream. After Magnanimous has the required status and network facts, prepare interconnection requests/agreements under the applicable federal and California framework. A CPCN by itself is not a completed physical interconnection.

Official source: https://www.cpuc.ca.gov/industries-and-topics/internet-and-phone/information-for-telecommunications-applicants-and-registrants-in-california

## Track B — United States direct numbering

Keep this independent from the California CPCN state. Direct NANP numbering authority, state operating authority and actual PSTN interconnection are separate milestones.

Required work includes the applicable FCC/USAC registrations, direct-numbering authorization, OCN/numbering administration prerequisites, 911/E911 and other applicable voice-provider compliance, followed by actual numbering-resource requests. Do not mark direct numbering active merely because an upstream carrier can supply DIDs.

## Track C — Philippines public telecommunications authority

NTC Region VII states that a CPCN or authorization predicated on a valid congressional franchise is required before an entity may install, operate and maintain public telecommunications facilities and services in the Philippines.

Current NTC CPCN information requirements include, among other items, a congressional/local franchise where applicable, SEC registration/articles, a feasibility study and financial information. The final filing package must use the then-current NTC forms and requirements.

### Franchise/CPCN preparation gates

1. Establish/verify a Philippine applicant entity that can lawfully hold the contemplated franchise and authority, including constitutional/foreign-ownership analysis by Philippine counsel before filing.
2. Define the franchise scope: telecommunications systems/services, geographic scope, facilities and technologies sought.
3. Prepare a legislative-franchise briefing package for sponsorship/referral to the House Committee on Legislative Franchises and the corresponding Senate process.
4. Do not represent a proposed franchise bill as granted authority. Track bill number, Congress, committee status, approvals and enactment separately.
5. After a valid franchise is enacted, prepare the NTC CPCN case with the franchise, SEC records, feasibility study, audited/required financial evidence, technical plans and other current NTC information requirements.
6. Track hearing, case number, provisional authority if any, CPCN issuance, permits and conditions as separate evidence-backed milestones.
7. Pursue NTC numbering/identifier resources and carrier interconnection only under the authority actually granted.
8. Maintain replaceable authorized gateways until direct Philippine interconnection and numbering are operational and verified.

Official NTC Region VII FAQ: https://region7.ntc.gov.ph/faqs/
Official NTC CPCN information requirements: https://region7.ntc.gov.ph/wp-content/uploads/2024/01/Intro_rules.pdf
Official House of Representatives: https://www.congress.gov.ph/

## Evidence policy

Every authority milestone in the Magnanimous Telecom dashboard should have:

- jurisdiction
- authority type
- status
- application/case/bill reference
- filing or decision date
- evidence URL/document reference
- conditions/expiration if any
- last verification date

Only `approved` or `verified` status backed by official documentary evidence may unlock a regulated production capability. Application preparation, filing, payment, a pending case, a bill introduction, or a provider contract must not be treated as regulatory approval.
