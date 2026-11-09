import { test, expect, type Page } from '@playwright/test';

const LOCAL_ORIGIN = 'http://127.0.0.1:4173';
const MOCK_TOKEN = 'qa-synthetic-session-not-valid-on-any-server';
const CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/qa-only-no-charge';

const plusPlan = {
  id: 'plus',
  name: 'Magnanimous Unlimited Fair-Use',
  price_usd: 19.99,
  cadence: 'month',
  description: 'QA plan fixture. This plan is never purchased.',
  features: ['Core platform access'],
  checkout_configured: true,
};

async function useOnlyLocalAndMockedNetwork(page: Page) {
  // Prevent accidental network calls to production or any third-party service.
  // Specific API and hosted-checkout routes below are handled by local fixtures.
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== LOCAL_ORIGIN) return route.abort();
    return route.continue();
  });
}

async function mockPricingReads(page: Page, authenticated = true) {
  await useOnlyLocalAndMockedNetwork(page);
  if (authenticated) {
    await page.addInitScript((token) => {
      localStorage.setItem('iam_account_token', token);
      sessionStorage.setItem('iam_session_active', 'user');
    }, MOCK_TOKEN);
  }

  await page.route('**/api/plans', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ plans: [plusPlan] }),
  }));
  await page.route('**/api/billing/status', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ plan: 'free', portal_configured: false, premium_usage_allowed: false }),
  }));
  await page.route('**/api/enterprise/usage-wallet', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: { prepaid_balance_usd: 0, prepaid_total_funded_usd: 0, prepaid_total_consumed_usd: 0 } }),
  }));
}

function plusCard(page: Page) {
  return page.locator('.plans article').filter({ hasText: 'Magnanimous Unlimited Fair-Use' });
}

test('checkout is blocked until affirmative plan-specific terms consent is recorded in the browser', async ({ page }) => {
  await mockPricingReads(page, true);
  let checkoutRequests = 0;
  await page.route('**/api/billing/checkout', async (route) => {
    checkoutRequests += 1;
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Unexpected checkout request in the consent-block test.' }),
    });
  });

  await page.goto('/pricing/?plan=plus', { waitUntil: 'load' });
  const card = plusCard(page);
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('button', { name: 'Accept terms, then continue' })).toBeVisible();

  await card.getByRole('button', { name: 'Accept terms, then continue' }).click();
  await expect(page.getByRole('status')).toContainText('Please agree to the selected Premium Services Agreement');
  expect(checkoutRequests, 'Checkout API must not be called before the checkbox is affirmatively selected').toBe(0);

  await expect(page.getByRole('checkbox', { name: /I agree to the Unlimited Fair-Use Terms for this purchase/i })).not.toBeChecked();
});

test('authenticated customer journey reaches only a mocked hosted-checkout page and submits exact recurring consent', async ({ page }) => {
  await mockPricingReads(page, true);
  let checkoutPayload: Record<string, unknown> | null = null;
  let checkoutAuthorization = '';
  let hostedCheckoutRequests = 0;
  let confirmationRequests = 0;

  await page.route('**/api/billing/confirm', async (route) => {
    confirmationRequests += 1;
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Confirmation must not run before a payment.' }) });
  });
  await page.route('**/api/billing/checkout', async (route) => {
    checkoutPayload = route.request().postDataJSON() as Record<string, unknown>;
    checkoutAuthorization = route.request().headers()['authorization'] || '';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: CHECKOUT_URL, plan: 'plus', mode: 'qa-mock' }),
    });
  });
  await page.route('https://checkout.stripe.com/**', async (route) => {
    hostedCheckoutRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      headers: { 'cache-control': 'no-store' },
      body: '<!doctype html><html><head><title>Magnanimous QA Checkout</title></head><body><main><h1>CHECKOUT SIMULATION</h1><p>No payment was processed. This is a local QA-only fixture.</p></main></body></html>',
    });
  });

  await page.goto('/pricing/?plan=plus', { waitUntil: 'load' });
  const card = plusCard(page);
  await expect(card).toHaveCount(1);
  await page.getByRole('checkbox', { name: /I agree to the Unlimited Fair-Use Terms for this purchase/i }).check();

  const startedAt = Date.now();
  await card.getByRole('button', { name: 'Choose Magnanimous Unlimited Fair-Use' }).click();
  await expect(page).toHaveURL(CHECKOUT_URL);
  const checkoutRedirectMs = Date.now() - startedAt;

  await expect(page.getByRole('heading', { name: 'CHECKOUT SIMULATION' })).toBeVisible();
  await expect(page.getByText('No payment was processed. This is a local QA-only fixture.')).toBeVisible();
  expect(checkoutRedirectMs, 'Mocked checkout initiation/redirect should remain responsive').toBeLessThan(3_000);
  expect(checkoutPayload).toMatchObject({
    plan: 'plus',
    termsAccepted: true,
    termsVersion: 'unlimited-2026-09-18.1',
    recurringDisclosureAccepted: true,
  });
  expect(checkoutAuthorization).toBe('Bearer ' + MOCK_TOKEN);
  expect(hostedCheckoutRequests).toBe(1);
  expect(confirmationRequests, 'A checkout redirect alone must never activate a subscription').toBe(0);
});

test('existing active subscription is not sent through a second checkout', async ({ page }) => {
  await mockPricingReads(page, true);
  let checkoutRequests = 0;
  let hostedCheckoutRequests = 0;
  await page.route('**/api/billing/checkout', async (route) => {
    checkoutRequests += 1;
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'ACTIVE_SUBSCRIPTION_EXISTS',
        detail: 'You already have an active subscription. Use Manage subscription to change it.',
      }),
    });
  });
  await page.route('https://checkout.stripe.com/**', async (route) => {
    hostedCheckoutRequests += 1;
    await route.fulfill({ status: 500, contentType: 'text/plain', body: 'Must not navigate to hosted checkout.' });
  });

  await page.goto('/pricing/?plan=plus', { waitUntil: 'load' });
  await page.getByRole('checkbox', { name: /I agree to the Unlimited Fair-Use Terms for this purchase/i }).check();
  await plusCard(page).getByRole('button', { name: 'Choose Magnanimous Unlimited Fair-Use' }).click();

  await expect(page.getByRole('status')).toContainText('You already have an active subscription');
  await expect(page).toHaveURL(/\/pricing\//);
  expect(checkoutRequests).toBe(1);
  expect(hostedCheckoutRequests, 'An active subscription conflict must not redirect to a second payment').toBe(0);
});

test('unauthenticated customer is returned to sign-in without creating a checkout session', async ({ page }) => {
  await mockPricingReads(page, false);
  let checkoutRequests = 0;
  await page.route('**/api/billing/checkout', async (route) => {
    checkoutRequests += 1;
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/pricing/?plan=plus', { waitUntil: 'load' });
  await page.getByRole('checkbox', { name: /I agree to the Unlimited Fair-Use Terms for this purchase/i }).check();
  await plusCard(page).getByRole('button', { name: 'Choose Magnanimous Unlimited Fair-Use' }).click();

  await page.waitForURL((url) => url.pathname.replace(/\/+$/, '') === '/login' && url.searchParams.get('returnTo') === '/pricing');
  expect(checkoutRequests, 'Unauthenticated users must never create a checkout session').toBe(0);
});

test('cancelled checkout leaves the existing plan unchanged and does not confirm payment', async ({ page }) => {
  await mockPricingReads(page, true);
  let confirmationRequests = 0;
  let checkoutRequests = 0;
  await page.route('**/api/billing/confirm', async (route) => {
    confirmationRequests += 1;
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/billing/checkout', async (route) => {
    checkoutRequests += 1;
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/pricing/?checkout=cancelled', { waitUntil: 'load' });
  await expect(page.getByRole('status')).toContainText('Checkout was cancelled. Your current access is unchanged.');
  expect(checkoutRequests).toBe(0);
  expect(confirmationRequests).toBe(0);
});

test('pricing entry remains inside conservative navigation and asset budgets', async ({ page }) => {
  await mockPricingReads(page, false);
  await page.goto('/pricing/', { waitUntil: 'load' });
  await expect(page.locator('main[data-pricing-catalog] h1')).toBeVisible();

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    if (!nav) throw new Error('Navigation timing entry was not available.');
    return {
      ttfbMs: Math.round(nav.responseStart - nav.requestStart),
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      loadMs: Math.round(nav.loadEventEnd - nav.startTime),
      resourceCount: resources.length,
      transferBytes: resources.reduce((total, resource) => total + resource.transferSize, 0),
    };
  });

  console.info('Pricing page performance budget evidence:', JSON.stringify(metrics));
  expect(metrics.ttfbMs, JSON.stringify(metrics)).toBeLessThan(3_000);
  expect(metrics.domContentLoadedMs, JSON.stringify(metrics)).toBeLessThan(10_000);
  expect(metrics.loadMs, JSON.stringify(metrics)).toBeLessThan(15_000);
  expect(metrics.resourceCount, JSON.stringify(metrics)).toBeLessThan(200);
  expect(metrics.transferBytes, JSON.stringify(metrics)).toBeLessThan(30 * 1024 * 1024);
});

test('mobile pricing page exposes purchase terms and controls without horizontal overflow', async ({ page }) => {
  await mockPricingReads(page, false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pricing/?plan=plus', { waitUntil: 'load' });
  await expect(page.getByRole('checkbox', { name: /I agree to the Unlimited Fair-Use Terms for this purchase/i })).toBeVisible();
  await expect(plusCard(page).getByRole('button')).toBeVisible();

  const width = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(width.content - width.viewport, JSON.stringify(width)).toBeLessThanOrEqual(8);
});
