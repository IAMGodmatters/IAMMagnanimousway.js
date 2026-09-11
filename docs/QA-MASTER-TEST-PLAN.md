# I AM MAGNANIMOUS WAY™ — Master QA Test Plan

This document defines the platform-wide test standard. Use **PASS**, **FAIL**, **BLOCKED**, or **NOT CONFIGURED** for every test. Never mark a function PASS only because its page loads.

## Automated gate

The `Full Platform QA` GitHub Action automatically checks:

- Frontend typecheck, interaction audit, and production build.
- Worker and video-gateway JavaScript syntax.
- Backend and video-renderer Python syntax.
- Every static `frontend/app/**/page.tsx` route discovered from source.
- Internal links for 404/5xx errors.
- Fatal browser/runtime errors.
- Critical functions across Chromium, Firefox, WebKit/Safari, Android Chrome, and iPhone Safari profiles.
- Serious/critical accessibility defects on critical routes.
- Visible forms and controls for basic functional readiness.
- Failure evidence: Playwright trace, screenshot, video, JSON result, HTML report, and Markdown summary.
- Automatic GitHub regression issue creation/update after failed non-PR runs.

A green automated run does **not** replace the protected/manual tests below.

## Test status rules

| Status | Meaning |
| --- | --- |
| PASS | Function completed its intended result and the result was verified. |
| FAIL | Function was attempted and produced the wrong result, error, broken UI, or unsafe state. |
| BLOCKED | Function could not be completed because a required external approval/account/service was unavailable. |
| NOT CONFIGURED | The platform intentionally has no active provider/configuration for the function yet. |

## 1. Public site and navigation

- Home page loads on desktop and mobile.
- Every main navigation item opens the intended page.
- Every footer/help/legal link works.
- Browser back/forward works without corrupting state.
- Direct-link refresh works on every public route.
- No route exposes raw stack traces, secrets, or internal tokens.
- 404 page is understandable and returns the user to a working area.

## 2. Accounts, sessions, login, and owner/admin

- User registration/login path works where enabled.
- Invalid credentials are rejected without leaking account details.
- Logout invalidates the session.
- Owner login works only with valid owner credentials.
- Owner token/session is not visible in page source or URLs.
- Owner-only pages reject ordinary/anonymous access.
- Admin/revenue controls save and reload correctly.
- Sensitive actions require the expected protected confirmation.
- Session expiry returns the user to a safe login/reconnect state.

## 3. MAGNANIMOUS AI and specialist agents

Test MAGNANIMOUS plus every exposed specialist agent/mode, including AI Chat, Research, Bible Study, Writing, Marketing, Business, Coding, Social, Video Script, Travel, Customer Service, and any newly discovered agent route.

For each mode:

- Open page.
- Enter a normal prompt.
- Submit once.
- Verify a meaningful response appears.
- Verify loading state appears and clears.
- Verify duplicate rapid clicks do not create uncontrolled duplicate requests.
- Verify long input is handled or clearly limited.
- Verify empty input is rejected or handled safely.
- Verify provider/network failure gives a useful error and does not erase the user input.
- Verify response copy/save/export controls where present.
- Verify the mode identity/instructions match the selected tool.

### Bible Study

- Verify Bible Study follows its intended scripture/source contract.
- Verify it does not silently switch into another agent mode.
- Test a normal reference, a malformed reference, and a topical request.

## 4. Translator and language tools

- English → Cebuano.
- Cebuano → English.
- English → Tagalog.
- Tagalog → English.
- Empty input.
- Long paragraph.
- Punctuation/numbers/URLs preserved appropriately.
- Unsupported-language behavior is clear.

## 5. Files, uploads, downloads, and exports

- Allowed file upload succeeds.
- Oversized/unsupported files fail clearly.
- Download/export produces the expected file.
- No private upload is exposed by a public predictable URL unless intentionally public.
- Repeated upload does not corrupt the previous item.

## 6. Video and visual functions

Test AI Video, Agent Video, Cinema Engine, video gateway, and renderer paths.

- UI loads and exposes the correct controls.
- Video gateway `/health` reports healthy when configured.
- Submit a controlled short test generation only in an approved test account.
- Verify job state: submitted → processing → completed/failed.
- Failed provider/render job shows a useful error.
- Completed output opens/plays/downloads where supported.
- No paid generation is fired repeatedly by retry/double-click behavior.
- Mux/external video status is labeled correctly when not configured.

## 7. Contact center, phone, receptionist, and auto-dialer

Test Contact Center, AI Receptionist, Auto Dialer, Call Center Health, and phone pages.

### Safe automated/manual checks

- Page and provider status load.
- Microphone permission denial is handled.
- Browser calling controls show correct configured/not-configured state.
- Queue/agent state displays correctly.
- Invalid number is rejected.

### Controlled live-call test

Only use a phone number controlled by the tester/owner.

- Place one outbound call.
- Verify ringing/audio/hangup.
- Verify no second call is placed after one click.
- Test one inbound call if provider supports it.
- Verify call log/state updates.
- Verify failed carrier/provider response is shown clearly.
- Verify PSTN/paid call actions are never run by unattended CI.

## 8. CRM, leads, business email, BPO, and operations

- Create a test CRM contact.
- Edit it.
- Search/filter it.
- Delete/archive it if supported.
- Create/update a test lead.
- Business email status loads.
- Send email only to a tester-controlled address.
- Verify sent/failed status.
- BPO work item create/update/status transition works.
- Multi-client data is isolated correctly.
- One customer/account cannot see another customer's private records.

## 9. Business planner, finance, and professional tools

- Business Plan accepts inputs and produces output.
- Mobile input remains usable with on-screen keyboard.
- Finance/people metrics load without NaN/undefined values.
- Pricing/economics calculations use supplied values and do not promise guaranteed profit.
- Export/copy actions preserve the calculated values.

## 10. Billing, plans, subscriptions, and checkout

Use Stripe/Shopify test/sandbox flows where available. Do not make unattended real-money purchases.

- Pricing page displays current intended plans.
- Checkout button opens the intended provider/plan.
- Cancel/back path returns safely.
- Success path updates entitlement exactly once.
- Duplicate webhook/event does not double-credit or duplicate subscription state.
- Failed payment does not grant paid access.
- Upgrade/downgrade rules work as intended.
- Billing support page explains current state accurately.

## 11. Ads, affiliates, sponsored links, and revenue admin

- Owner can create/edit/disable a test promotional link where enabled.
- Disabled promotions disappear from public surfaces.
- External links open the intended destination.
- No ad/affiliate control exposes owner credentials.
- Revenue dashboard handles zero-data state.
- Numbers never display NaN/Infinity.

## 12. Security and abuse cases

- Invalid/expired auth token.
- Missing auth token on protected endpoint.
- Wrong HTTP method.
- Oversized payload.
- Basic script/HTML injection strings display as text rather than executing.
- URL parameters cannot expose secrets.
- Cross-account access attempt fails.
- Repeated button clicks remain idempotent where required.
- Provider/webhook endpoints reject invalid signatures where signatures are required.

## 13. Mobile and browser matrix

Human smoke test at minimum:

- iPhone Safari.
- Android Chrome.
- Windows Chrome/Edge.
- Desktop Firefox.
- Desktop Safari/WebKit equivalent through automation.

Verify navigation, forms, scrolling, modals, fixed buttons, chat composer, video controls, and phone controls.

## 14. Failure/recovery tests

- Disable network during an in-progress request, then reconnect.
- Refresh during loading.
- Provider returns 401/403/429/500.
- Empty database state.
- Slow response.
- Browser denies microphone/camera/notifications.
- User closes provider OAuth window.

The user must receive a useful state and a recovery path; the app must not claim success.

## 15. Release rule

A release is **READY** only when:

1. Automated Full Platform QA is green, or failures are explicitly accepted/documented.
2. No unresolved critical/security failure exists.
3. Protected external actions required for that release have a current manual PASS or are clearly labeled NOT CONFIGURED/BLOCKED.
4. Mobile smoke testing has passed.
5. Any known limitation is stated accurately in the UI/support documentation.

## Bug evidence

For every FAIL, attach:

- Route/function.
- Browser/device.
- Exact steps.
- Expected result.
- Actual result.
- Screenshot/video if useful.
- Console/network error if available.
- Whether money, email, SMS, phone, customer data, or provider credentials were involved.

Use the repository's **QA Bug Report** issue template for human-reported failures.
