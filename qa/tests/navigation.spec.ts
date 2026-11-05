import { test, expect } from '@playwright/test';
import { discoverStaticRoutes, normalizeInternalPath } from './helpers';
import { gotoWithBackoff, isTransientStatus, requestWithBackoff } from './network-retry';

const routes = discoverStaticRoutes();

test('homepage internal links do not resolve to 404/5xx', async ({ page, request, baseURL }) => {
  const homeResponse = await gotoWithBackoff(page, '/');
  expect(homeResponse, 'Homepage produced no response').not.toBeNull();
  if (homeResponse!.status() === 429) {
    test.skip(true, 'Homepage is temporarily protected by production rate limiting after bounded backoff.');
  }
  expect(isTransientStatus(homeResponse!.status()), `Homepage remained temporarily unavailable after bounded backoff (${homeResponse!.status()})`).toBe(false);
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
    anchors.map((a) => (a as HTMLAnchorElement).href).filter(Boolean),
  );
  const paths = [...new Set(hrefs.map((href) => normalizeInternalPath(href, baseURL!)).filter(Boolean))] as string[];
  expect(paths.length, 'Homepage exposes no testable internal links').toBeGreaterThan(0);

  // Representative production link sampling catches broken navigation without turning
  // the QA runner into a synthetic traffic flood. Full route coverage lives in routes.spec.
  for (const path of paths.slice(0, 40)) {
    const response = await requestWithBackoff(request, path, { method: 'GET', maxRedirects: 5 });
    if (response.status() === 429) {
      test.info().annotations.push({ type: 'rate-limit', description: `${path} returned 429 after bounded backoff` });
      continue;
    }
    expect.soft(isTransientStatus(response.status()), `${path} remained temporarily unavailable after bounded backoff (${response.status()})`).toBe(false);
    expect.soft(response.status(), `${path} returned ${response.status()}`).not.toBe(404);
    expect.soft(response.status(), `${path} returned ${response.status()}`).toBeLessThan(500);
  }
});

test('legacy persistent route redirects to Work Engine instead of a dead end', async ({ page }) => {
  const response = await gotoWithBackoff(page, '/persistent');
  expect(response, '/persistent produced no response').not.toBeNull();
  if (response!.status() === 429) test.skip(true, '/persistent is temporarily protected by production rate limiting.');
  expect(isTransientStatus(response!.status()), `/persistent remained temporarily unavailable after bounded backoff (${response!.status()})`).toBe(false);
  await page.waitForURL((url) => url.pathname.replace(/\/+$/, '') === '/login' && url.searchParams.get('returnTo') === '/work-engine', { timeout: 12_000 });
  await expect(page.locator('body')).not.toContainText('404 • ROUTE NOT FOUND');
  await expect(page.locator('body')).not.toContainText('continue a persistent Magnanimous job');
});

test('unknown browser routes recover automatically instead of stranding the user by preserving destination through sign-in', async ({ page }) => {
  const unknownPath = '/this-route-should-never-exist-qa';
  const response = await gotoWithBackoff(page, unknownPath);
  expect(response, `${unknownPath} produced no response`).not.toBeNull();
  if (response!.status() === 429) test.skip(true, `${unknownPath} is temporarily protected by production rate limiting.`);
  expect(isTransientStatus(response!.status()), `${unknownPath} remained temporarily unavailable after bounded backoff (${response!.status()})`).toBe(false);
  await page.waitForURL((url) => url.pathname.replace(/\/+$/, '') === '/login' && url.searchParams.get('returnTo') === unknownPath, { timeout: 12_000 });
  await expect(page.locator('body')).not.toContainText('404 • ROUTE NOT FOUND');
  await expect(page.locator('body')).not.toContainText('continue a persistent Magnanimous job');
});

test('interactive controls have an accessible identity', async ({ page }) => {
  const sample = routes.length <= 24 ? routes : ['/', ...routes.filter((r) => /ai|business|video|call|admin|billing|translator|support|pricing|agents/i.test(r)).slice(0, 23)];
  for (const route of [...new Set(sample)]) {
    const response = await gotoWithBackoff(page, route);
    if (!response || isTransientStatus(response.status()) || response.status() >= 500 || response.status() === 404) continue;

    const unnamedButtons = await page.locator('button:visible').evaluateAll((buttons) =>
      buttons.filter((button) => {
        const el = button as HTMLButtonElement;
        const text = (el.innerText || '').trim();
        const aria = (el.getAttribute('aria-label') || '').trim();
        const title = (el.getAttribute('title') || '').trim();
        return !text && !aria && !title;
      }).length,
    );
    expect.soft(unnamedButtons, `${route} has visible unnamed buttons`).toBe(0);

    const unsafeLinks = await page.locator('a[href^="javascript:"]').count();
    expect.soft(unsafeLinks, `${route} contains javascript: links`).toBe(0);
  }
});
