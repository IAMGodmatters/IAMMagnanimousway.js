import { test, expect } from '@playwright/test';
import { discoverStaticRoutes, watchRuntime } from './helpers';

const routes = discoverStaticRoutes();

test.describe('all static application routes', () => {
  for (const route of routes) {
    test(`${route} loads without a fatal client/runtime error`, async ({ page }) => {
      const runtimeProblems = watchRuntime(page);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response, `No HTTP response for ${route}`).not.toBeNull();
      const status = response!.status();
      expect(status, `${route} returned HTTP ${status}`).toBeLessThan(500);
      expect(status, `${route} returned 404`).not.toBe(404);

      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
      const bodyText = (await page.locator('body').innerText()).trim();
      expect(bodyText.length, `${route} rendered almost no visible content`).toBeGreaterThan(20);

      expect(runtimeProblems, `${route} emitted fatal browser errors`).toEqual([]);
    });
  }
});
