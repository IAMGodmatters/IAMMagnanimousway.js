import { test, expect } from '@playwright/test';
import { discoverStaticRoutes, normalizeInternalPath } from './helpers';

const routes = discoverStaticRoutes();

test('homepage internal links do not resolve to 404/5xx', async ({ page, request, baseURL }) => {
  test.setTimeout(120_000);
  await page.goto('/', { waitUntil: 'commit' });
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
    anchors.map((a) => (a as HTMLAnchorElement).href).filter(Boolean),
  );
  const paths = [...new Set(hrefs.map((href) => normalizeInternalPath(href, baseURL!)).filter(Boolean))] as string[];
  expect(paths.length, 'Homepage exposes no testable internal links').toBeGreaterThan(0);

  const selected = paths.slice(0, 150);
  for (let i = 0; i < selected.length; i += 10) {
    const batch = await Promise.all(selected.slice(i, i + 10).map(async (path) => {
      try {
        const response = await request.get(path, { maxRedirects: 5, timeout: 12_000 });
        return { path, status: response.status() };
      } catch {
        return { path, status: 0 };
      }
    }));
    for (const { path, status } of batch) {
      expect.soft(status, `${path} returned ${status || 'no response'}`).not.toBe(0);
      expect.soft(status, `${path} returned ${status}`).not.toBe(404);
      expect.soft(status, `${path} returned ${status}`).toBeLessThan(500);
    }
  }
});

test('legacy persistent route redirects to Work Engine instead of a dead end', async ({ page }) => {
  await page.goto('/persistent', { waitUntil: 'commit' });
  await page.waitForURL((url) => url.pathname.replace(/\/+$/, '') === '/login' && url.searchParams.get('returnTo') === '/work-engine', { timeout: 20_000 });
  await expect(page.locator('body')).not.toContainText('404 • ROUTE NOT FOUND');
  await expect(page.locator('body')).not.toContainText('continue a persistent Magnanimous job');
});

test('unknown browser routes recover automatically instead of stranding the user by preserving destination through sign-in', async ({ page }) => {
  const unknownPath = '/this-route-should-never-exist-qa';
  await page.goto(unknownPath, { waitUntil: 'commit' });
  await page.waitForURL((url) => url.pathname.replace(/\/+$/, '') === '/login' && url.searchParams.get('returnTo') === unknownPath, { timeout: 20_000 });
  await expect(page.locator('body')).not.toContainText('404 • ROUTE NOT FOUND');
  await expect(page.locator('body')).not.toContainText('continue a persistent Magnanimous job');
});

test('interactive controls have an accessible identity', async ({ page }) => {
  test.setTimeout(180_000);
  const sample = ['/', '/login', '/pricing', '/ai-chat', '/business-ai', '/crm', '/video-stack', '/movie-maker', '/studio-tools', '/connections', '/owner-center', '/magnanimous'];
  for (const route of [...new Set(sample)]) {
    const response = await page.goto(route, { waitUntil: 'commit' });
    if (!response || response.status() >= 500 || response.status() === 404) continue;
    await page.waitForLoadState('domcontentloaded', { timeout: 12_000 }).catch(() => {});

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
