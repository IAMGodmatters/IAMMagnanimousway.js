# Business Cost Basis — 2026-09-26

This file is a planning source ledger, not an invoice. Published government/provider schedules are separated from **quote required**, **usage variable**, **optional** and **contingent** costs.

## Published / formula-based costs

### SEC — Philippine stock corporation
Official SEC Registration Calculator:
- Filing fee: **0.2% (1/5 of 1%)** of authorized capital stock or subscription price of subscribed capital stock, whichever is higher, **minimum ₱2,000**.
- Legal Research Fee: **1% of filing fee**, minimum ₱10.
- Approximate Stock & Transfer Book: **₱470**, including registration.
- SEC primary-registration page lists By-Laws registration fee for a stock corporation at **₱1,010**.
- The final eSPARC/SEC ZERO assessment controls; do not pay from this estimate alone.

Sources:
- https://appointment.sec.gov.ph/online-services/registration-calculator/
- https://appointment.sec.gov.ph/company/primary-registration-2/primary-registration-of-stock-corporations/

### BIR
BIR Revenue Memorandum Circular No. 14-2024 states that, effective 22 January 2024, BIR ceased collecting the **₱500 annual registration fee** from business taxpayers under the Ease of Paying Taxes Act.

Source:
- https://bir-cdn.bir.gov.ph/local/pdf/RMC%20No.%2014-2024.pdf

Planning line:
- annual BIR registration fee: **₱0**
- books/invoicing/accounting/notarial/printing/professional assistance: **actual/quote required**

### National Privacy Commission / NPCRS
Current NPC schedule:
- Initial public/private organization — Multinational/National/Foreign Branch: **₱2,500**
- Initial — Regional/Provincial/Metro Manila Areas/Cities: **₱1,000**
- Initial — Municipalities: **₱500**
- Renewal — National: **₱1,000**
- Renewal — Regional/Provincial/Cities: **₱500**
- Renewal — Municipalities: **₱350**
- Major amendment: same category-based schedule as initial
- Certified/validated/authenticated copy: **₱100**
- Recovery of inaccessible DPO account: **₱5,000**

Magnanimous may ultimately operate nationally/global, so budget both the city/local and national classifications until NPCRS confirms the corporation's applicable category.

Sources:
- https://privacy.gov.ph/npc-implements-registration-fees-and-charges-and-submission-of-sworn-declaration-and-undertaking-for-exemption-from-data-processing-system-registration/
- https://privacy.gov.ph/pips-and-pics/register/

### NTC — VoIP Reseller fallback
NTC's published VoIP Reseller requirements include a **₱1,000,000 performance bond** from a reputable insurance/surety company registered with the SEC and accredited by the Insurance Commission, preferably GSIS.

This is a **bond face amount / contingent surety instrument**, not an assumed cash premium. The actual premium, collateral, indemnity and issuance terms are **quote required**.

Source:
- https://ntc.gov.ph/wp-content/uploads/2023/citizens_charter/9-29-23/6-05%20SID%20CCT%2009282023.pdf

### QBO / Startup Philippines
Current public QBO Accelerator listing:
- 12-week program
- early-stage Philippine tech startup
- MVP stage or beyond
- SEC or DTI registered
- Filipino-owned or at least one Filipino co-founder
- up to **₱1,000,000 pre-seed funding**
- legal/accounting support

This is possible funding, **not guaranteed income** and not a substitute for having cash available for costs the program does not approve.

Source:
- https://startup.gov.ph/programs/view/?id=1

## Infrastructure / software planning costs

### ChatGPT temporary productivity backup
User-required budget line:
- **US$20/month**
- **US$240/year**
- Keep until Magnanimous reaches verified parity for the user's remaining required workflows.
- Target later state: optional **$0/month** if the user no longer needs the external subscription.

### Cloudflare
Current architecture uses the free-first Worker/D1 path, but the deployment has encountered the D1 Free daily write cap.

Published:
- Workers Free: $0 base
- D1 Free: 5M rows read/day, 100,000 rows written/day, 5 GB total storage
- Workers Paid: **minimum $5/month**
- Paid D1 includes first 25B rows read/month, first 50M rows written/month and first 5 GB storage; excess is usage-priced.

Sources:
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/

Planning rule:
- remain Free while safe and operational;
- if the write cap remains a production blocker, controlled Workers Paid baseline = **$5/month** plus verified excess usage, not an automatic upgrade.

### Railway
Published plan baselines:
- Free: $0 subscription path; current pricing page describes post-trial $1/month credit behavior
- Hobby: **$5 minimum usage/month**, includes $5 monthly usage
- Pro: **$20 minimum usage/month**, includes $20 monthly usage
- actual CPU/RAM/disk/network usage can exceed included usage.

Sources:
- https://railway.com/pricing
- https://docs.railway.com/pricing/understanding-your-bill

The connected Railway API verifies the running project/deployments but does not expose this workspace's billing plan/invoice here. Therefore the business model must show Railway as **actual invoice required**, with $5/$20 scenarios rather than pretending the present bill is known.

### DigitalOcean optional Telecom Core
Published Basic Droplet examples:
- 512 MiB / 1 vCPU: $4/month
- 1 GiB / 1 vCPU: $6/month
- **2 GiB / 1 vCPU / 50 GiB / 2 TB transfer: $12/month**
- 2 GiB / 2 vCPU: $18/month

Source:
- https://www.digitalocean.com/pricing/droplets

For a real Asterisk/Kamailio Telecom Core, use the **$12/month 2 GiB option only as a planning candidate**, not as a purchase or proof that it is sufficient. Real SIP/RTP performance must be load/media-tested before production.

### GitHub
Current public repository can use GitHub Free:
- $0/month plan
- standard GitHub Actions are free for public repositories
- GitHub Free includes 2,000 Actions minutes/month for private-repository allowance, while public standard runners are free under GitHub's Actions billing rules.

Sources:
- https://github.com/pricing
- https://docs.github.com/en/billing/concepts/product-billing/github-actions

Security/business decision:
- current repository visibility is public.
- if the codebase should become private, recalculate Actions/storage billing and access control before changing visibility.

## Costs that must remain quote/actual-based

Do not invent amounts for:
- Bayawan business-permit assessment and local clearances
- barangay, occupancy, sanitary, zoning/locational, fire and medical requirements
- lease/security deposit/property-tax clearance where applicable
- insurance: CGL, E&O/professional, cyber/privacy, property/equipment
- NTC surety premium/collateral/indemnity
- NTC application/certificate fees until the regulator classifies the exact phases
- Philippine host-carrier/reseller/MVNO/VNO agreement
- SIP/PSTN wholesale routes, phone numbers, porting, SMS, DID and toll-free
- SIM/eSIM profiles, mobile data, KYC/SIM registration operations
- backup carrier/network
- payroll, SSS, PhilHealth, Pag-IBIG and DOLE/OSH costs until headcount/payroll is set
- accountant/bookkeeper, legal/notarial and audit fees
- electricity, backup power, UPS/generator/solar
- internet connections and redundant ISP
- workstations/headsets/network gear
- banking/foreign exchange/payment processing
- optional GPU/media rendering
- paid AI/provider usage above free/native paths
- travel, courier, certified copies and physical filing expenses

## Cost-control rules

1. Free/native first.
2. No provider purchase without a written price or official checkout total.
3. Variable provider usage must be prepaid/capped where practical.
4. Premium customer pricing must cover origin cost plus the configured business margin.
5. Telecom/carrier/GPU capacity cannot run unfunded.
6. Unknown provider pricing fails closed.
7. A bond face amount is not booked as a premium.
8. A grant maximum is not booked as awarded revenue.
9. Taxes are modeled from real taxable activity and current tax advice, not added blindly as a flat startup fee.
10. Every published fee should be refreshed immediately before filing/payment.
