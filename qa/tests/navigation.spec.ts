import { test, expect } from '@playwright/test';
import { discoverStaticRoutes, normalizeInternalPath } from './helpers';

const routes = discoverStaticRoutes();

test('homepage internal links do not resolve to 404/5xx', async ({ page, request, baseURL }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
    anchors.map((a) => (a as HTMLAnchorElement).href).filter(Boolean),
  );
  const paths = [...new Set(hrefs.map((href) => normalizeInternalPath(href, baseURL!)).filter(Boolean))] as string[];
  expect(paths.length, 'Homepage exposes no testable internal links').toBeGreaterThan(0);

  for (const path of paths.slice(0, 150)) {
    const response = await request.get(path, { maxRedirects: 5 });
    expect.soft(response.status(), `${path} returned ${response.status()}`).not.toBe(404);
    expect.soft(response.status(), `${path} returned ${response.status()}`).toBeLessThan(500);
  }
});

test('interactive controls have an accessible identity', async ({ page }) => {
  const sample = routes.length <= 24 ? routes : ['/', ...routes.filter((r) => /ai|business|video|call|admin|billing|translator|support|pricing|agents/i.test(r)).slice(0, 23)];
  for (const route of [...new Set(sample)]) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    if (!response || response.status() >= 500 || response.status() === 404) continue;

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
