# Volunteer QA Tester Guide — I AM MAGNANIMOUS WAY™

Thank you for helping test the platform. The goal is **honest bug finding**, not positive reviews.

## What testers receive

Testing can be volunteer-based. The project may optionally recognize contributors as Founding Testers or provide non-cash platform access where available. No tester is required to publish a positive review or promotion.

## Before testing

1. Use a test account where possible.
2. Do not share passwords, API keys, card numbers, identity documents, or private customer data.
3. For phone/SMS/email tests, use only addresses or numbers you own or have explicit permission to test.
4. Do not make purchases or paid provider actions unless the owner specifically authorizes that test.
5. Read `docs/QA-MASTER-TEST-PLAN.md` and choose one section to test thoroughly.

## Good tester groups

A useful free beta has a mix of:

- Web/TypeScript developer.
- API/backend developer.
- Shopify/e-commerce user.
- iPhone/Safari user.
- Android/Chrome user.
- Accessibility/usability tester.
- VoIP/contact-center tester.
- Ordinary first-time user who has never seen the platform.

## How to report a bug

Open a GitHub issue using **QA Bug Report** and include:

- Exact page/function.
- Browser/device.
- Reproduction steps.
- Expected result.
- Actual result.
- Severity.
- Screenshot or console/network error when useful.

One bug per issue whenever practical. Do not combine unrelated failures into one report.

## Severity

- **Critical:** security/privacy issue, data loss, wrong charge, unintended call/email/SMS, cross-account exposure, or destructive action.
- **High:** major advertised feature cannot be used.
- **Medium:** feature works incorrectly, inconsistently, or has no recovery path.
- **Low:** visual, wording, spacing, minor accessibility/usability problem.

## What not to do

- Do not attack third-party services.
- Do not load-test or flood endpoints.
- Do not attempt to access another user's private information.
- Do not test real payments, outbound calls, email campaigns, or SMS blasts without direct approval.
- Do not post discovered secrets publicly; report suspected credential exposure privately to the owner immediately.

## Suggested volunteer assignment

Give each volunteer one focused lane instead of asking everyone to test everything:

1. Public navigation + mobile.
2. MAGNANIMOUS + AI specialist agents.
3. Business/finance/CRM/email/BPO.
4. Video/media.
5. Contact center/phone/receptionist.
6. Billing/admin/revenue/security.
7. Accessibility and first-time-user experience.

The automated GitHub workflow already covers broad route/browser regression. Human volunteers should spend most of their time on complete workflows, external-provider behavior, confusing UX, and unusual failure/recovery cases.
