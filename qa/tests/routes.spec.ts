import { test, expect } from '@playwright/test';
import { discoverStaticRoutes, watchRuntime } from './helpers';

const routes = discoverStaticRoutes();
const isPullRequest = process.env.GITHUB_EVENT_NAME === 'pull_request';

test.describe('all static application routes', () => {
  for (const route of routes) {
    test(`${route} loads without a fatal client/runtime error`, async ({ page }) => {
      const runtimeProblems = watchRuntime(page);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response, `No HTTP response for ${route}`).not.toBeNull();
      const status = response!.status();

      // Pull-request QA targets the live production origin, not a branch preview.
      // A brand-new route cannot exist there until it is deployed. Skip only that
      // specific PR-only 404; main-branch QA below still requires every route.
      test.skip(isPullRequest && status === 404, `${route} is new on this PR and is not deployed to the live QA target yet.`);

      expect(status, `${route} returned HTTP ${status}`).toBeLessThan(500);
      expect(status, `${route} returned 404`).not.toBe(404);

      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
      const bodyText = (await page.locator('body').innerText()).trim();
      expect(bodyText.length, `${route} rendered almost no visible content`).toBeGreaterThan(20);

      expect(runtimeProblems, `${route} emitted fatal browser errors`).toEqual([]);
    });
  }
});
