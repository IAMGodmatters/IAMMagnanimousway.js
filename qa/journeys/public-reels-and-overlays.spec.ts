import { test, expect } from '@playwright/test';

const LOCAL_ORIGIN = 'http://127.0.0.1:4173';

async function keepTrafficLocal(page: import('@playwright/test').Page) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== LOCAL_ORIGIN) return route.abort();
    return route.continue();
  });
}

test.beforeEach(async ({ page }) => {
  await keepTrafficLocal(page);
});

test('public Reels has no authenticated shell or floating overlays and its install label stays accessible', async ({ page }) => {
  await page.route('**/reels-proxy/**', (route) => route.fulfill({
    status: 503,
    contentType: 'text/html; charset=utf-8',
    headers: { 'cache-control': 'no-store' },
    body: '<!doctype html><html><body><main><h1>Magnanimous Reels is temporarily unavailable</h1></main></body></html>',
  }));

  await page.goto('/reels/', { waitUntil: 'load' });
  await expect(page.getByText('Magnanimous Reels', { exact: true })).toBeVisible();
  await expect(page.locator('.iam-shell-topbar')).toHaveCount(0);
  await expect(page.locator('.iam-shell-sidebar')).toHaveCount(0);
  await expect(page.locator('.iam-global-tools')).toHaveCount(0);
  await expect(page.locator('.iam-tour-launch')).toHaveCount(0);
  await expect(page.locator('.iam-help-link')).toHaveCount(0);

  const install = page.getByRole('button', { name: 'Install', exact: true });
  await expect(install).toBeVisible();
  await install.click({ position: { x: 10, y: 10 } });
  await expect(page.getByRole('button', { name: 'Use browser Install menu', exact: true })).toBeVisible();
  await expect(page.locator('iframe[title="Magnanimous Reels public player"]')).toHaveAttribute('src', '/reels-proxy/');
});

test('White Label preview dialogs close cleanly so the next app card remains usable', async ({ page }) => {
  await page.route('**/api/plans', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ plans: [] }),
  }));
  await page.route('**/api/billing/status', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ plan: 'free' }),
  }));

  await page.goto('/white-label/', { waitUntil: 'load' });
  const cards = page.locator('.apps .grid button.app');
  await expect(cards).toHaveCount(18);
  await expect(cards.first()).toHaveAttribute('aria-label', /^See how it works: Funnel Builder\./);

  const dialog = page.getByRole('dialog');
  await cards.nth(0).click({ position: { x: 12, y: 12 } });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Keep looking', exact: true }).click();
  await expect(dialog).toBeHidden();

  await cards.nth(1).click({ position: { x: 12, y: 12 } });
  await expect(dialog).toBeVisible();
});

test('the last Platform Guide card can be opened and exposes its updated accessible name', async ({ page }) => {
  await page.goto('/guide/', { waitUntil: 'load' });
  const lastCard = page.locator('.guide .grid article button').last();
  await expect(lastCard).toBeVisible();
  await expect(lastCard).toHaveAttribute('aria-label', /^Show instructions for /);
  await lastCard.click({ position: { x: 12, y: 12 } });
  await expect(page).toHaveURL(/\/guide\?topic=/);
  await expect(lastCard).toHaveAttribute('aria-expanded', 'true');
  await expect(lastCard).toHaveAttribute('aria-label', /^Instructions open for /);
  await expect(page.locator('.guide h1')).toBeVisible();
});
