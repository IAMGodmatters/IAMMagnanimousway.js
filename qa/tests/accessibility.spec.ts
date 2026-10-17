import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { discoverStaticRoutes, discoverStaticRoutesFromGitRef } from './helpers';
import { gotoWithBackoff, isTransientStatus } from './network-retry';

const allRoutes = discoverStaticRoutes();
const deployedRef = String(process.env.QA_PRODUCTION_BASE_REF || '').trim();
const deployedRoutes = deployedRef ? discoverStaticRoutesFromGitRef(deployedRef) : null;
const deployedRouteSet = deployedRoutes ? new Set(deployedRoutes) : null;
const priorityPattern = /ai|magnanimous|bible|business|agent|video|dial|call|phone|reception|billing|connection|support|pricing|owner|admin/i;
const criticalRoutes = [...new Set(['/', ...allRoutes.filter((route) => priorityPattern.test(route)).slice(0, 30)])];

for (const route of criticalRoutes) {
  test(`${route} has no serious or critical accessibility violations`, async ({ page }) => {
    const response = await gotoWithBackoff(page, route);
    expect(response, `${route} produced no response`).not.toBeNull();
    const status = response!.status();

    // A real 429 proves the production edge protection is active, but its error page is
    // not the application document and must never be graded by Axe as if it were our UI.
    if (status === 429) {
      test.skip(true, `${route} is temporarily protected by production rate limiting after bounded backoff.`);
    }
    expect(isTransientStatus(status), `${route} remained temporarily unavailable after bounded backoff (${status})`).toBe(false);
    expect(status, `${route} returned a server error`).toBeLessThan(500);

    if (status === 404 && deployedRouteSet && !deployedRouteSet.has(route)) {
      test.skip(true, `${route} is new in this pull request and cannot be accessibility-tested against production until deployment.`);
    }
    expect(status, `${route} is missing from the deployed site`).not.toBe(404);

    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact || ''));
    expect(severe, severe.map((v) => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
  });
}
