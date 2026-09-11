import { test, expect } from '@playwright/test';
import { discoverStaticRoutes, watchRuntime } from './helpers';

const routes = discoverStaticRoutes();
const priorities = [
  '/',
  '/ai-chat',
  '/bible-study',
  '/agents',
  '/agent-video',
  '/ai-receptionist',
  '/auto-dialer',
  '/phone',
  '/crm',
  '/business-email',
  '/pricing',
  '/support',
  '/login',
  '/signup',
  '/start',
];
const criticalRoutes = priorities.filter((route) => route === '/' || routes.includes(route));

test.describe('critical cross-browser and mobile matrix', () => {
  for (const route of criticalRoutes) {
    test(`${route} renders and remains usable`, async ({ page }) => {
      const runtimeProblems = watchRuntime(page);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

      // Protected routes can immediately client-redirect anonymous users to /login,
      // and Firefox may report a null navigation response for that interrupted
      // document. Judge HTTP status when Playwright has a response, then verify
      // the final rendered document below in every browser.
      if (response) {
        expect(response.status(), `${route} returned 404`).not.toBe(404);
        expect(response.status(), `${route} returned a server error`).toBeLessThan(500);
      }
      expect(page.url(), `${route} never loaded a document`).not.toBe('about:blank');

      const body = page.locator('body');
      await expect(body).toBeVisible();
      expect((await body.innerText()).trim().length, `${route} rendered no meaningful content`).toBeGreaterThan(30);

      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect.soft(dimensions.scroll - dimensions.viewport, `${route} has major horizontal overflow`).toBeLessThanOrEqual(40);

      const interactive = page.locator('a[href]:visible, button:visible, input:visible, textarea:visible, select:visible');
      expect(await interactive.count(), `${route} has no visible interaction path`).toBeGreaterThan(0);
      expect(runtimeProblems, `${route} emitted fatal browser errors`).toEqual([]);
    });
  }
});