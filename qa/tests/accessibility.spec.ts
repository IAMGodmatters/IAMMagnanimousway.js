import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { discoverStaticRoutes } from './helpers';

const allRoutes = discoverStaticRoutes();
const priorityPattern = /ai|magnanimous|bible|business|agent|video|dial|call|phone|reception|billing|connection|support|pricing|owner|admin/i;
const criticalRoutes = [...new Set(['/', ...allRoutes.filter((route) => priorityPattern.test(route)).slice(0, 30)])];
const isPullRequest = process.env.GITHUB_EVENT_NAME === 'pull_request';

for (const route of criticalRoutes) {
  test(`${route} has no serious or critical accessibility violations`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `${route} produced no response`).not.toBeNull();

    const status = response!.status();
    test.skip(isPullRequest && status === 404, `${route} is new on this PR and is not deployed to the live QA target yet.`);

    expect(status, `${route} is missing from the deployed site`).not.toBe(404);
    expect(status, `${route} returned a server error`).toBeLessThan(500);
    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact || ''));
    expect(severe, severe.map((v) => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
  });
}
