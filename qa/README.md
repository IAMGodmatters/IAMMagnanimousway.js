# Full Platform QA

Automated browser/regression tests for **I AM MAGNANIMOUS WAY™**.

## Run locally

```bash
cd qa
npm install
npx playwright install chromium firefox webkit
npm test
```

By default the suite tests:

`https://iammagnanimousway.com`

Override the target with:

```bash
QA_BASE_URL=https://example.test npm test
```

Optional video gateway override:

```bash
QA_VIDEO_GATEWAY_URL=https://example-video-gateway.test npm test
```

## What gets tested

- Every static Next.js page discovered from `frontend/app/**/page.tsx`.
- Critical platform routes and visible controls/forms.
- Internal-link integrity.
- Serious/critical accessibility violations on critical routes.
- Owner-auth rejection and anonymous-protected endpoint behavior.
- Basic XSS regression probe.
- Video gateway health.
- Chrome, Firefox, Safari/WebKit, Android Chrome, and iPhone Safari profiles.

## What CI deliberately does not do

Unattended CI must not place real paid calls, send campaigns, make purchases, approve billing, transfer ownership, or perform identity verification. Those tests are in `docs/QA-MASTER-TEST-PLAN.md` and must be performed with controlled authorized test accounts.

## Evidence

Failed GitHub Actions runs upload:

- Playwright HTML report.
- JSON results.
- Markdown summary.
- Screenshots.
- Video for failures.
- Playwright traces.

A failed non-PR run also creates or updates one automated QA regression issue.
