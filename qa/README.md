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

## No-charge customer journey and checkout performance suite

The production frontend bundle has a separate Chromium suite:

```bash
cd frontend
npm ci --no-audit --no-fund
npm run build

cd ../qa
npm ci --no-audit --no-fund
npx playwright install chromium
npm run test:journeys
```

The suite serves `frontend/out` locally and blocks every external browser request except the explicitly mocked hosted-checkout fixture. It tests:

- Premium terms consent blocks checkout until the customer affirmatively checks the plan-specific box.
- The exact plan, terms version, and recurring-billing disclosure reach the checkout request.
- An unauthenticated buyer returns to sign-in without creating a checkout session.
- A simulated Stripe-hosted checkout page is reached without contacting Stripe or processing a payment.
- A checkout redirect does not activate a subscription or call payment confirmation.
- Cancelled checkout leaves the current plan unchanged.
- Pricing-page TTFB, DOM-ready, load, resource-count, transferred-byte, and mobile-overflow budgets.

The hosted-checkout fixture is deliberately synthetic. The test cannot charge a card, create a live Stripe session, mutate D1, send communications, or access production data. These are static-bundle regression budgets, not a substitute for real-user field Web Vitals.

The production deployment workflow separately performs its existing post-deployment health, revision, authentication/session, billing, webhook-signature, product-route, and controlled test-tenant smoke checks. Its checkout probe creates a hosted checkout session only; it does not complete payment or activate a subscription.

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
