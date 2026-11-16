import { test, expect } from '@playwright/test';
import { discoverStaticRoutes, discoverStaticRoutesFromGitRef, watchRuntime } from './helpers';

const allRoutes = discoverStaticRoutes();
const deployedRef = String(process.env.QA_PRODUCTION_BASE_REF || '').trim();
const deployedRoutes = deployedRef ? discoverStaticRoutesFromGitRef(deployedRef) : null;
const deployedRouteSet = deployedRoutes ? new Set(deployedRoutes) : null;
const criticalPattern = /ai|magnanimous|bible|business|agent|video|cinema|dial|call|phone|reception|email|crm|bpo|finance|connection|billing|pricing|support|security|solution|start|owner|admin|tool/i;
const criticalTools = [...new Set(['/', ...allRoutes.filter((route) => criticalPattern.test(route))])];

for (const route of criticalTools) {
  test(`${route} is functionally reachable`, async ({ page }) => {
    const runtimeProblems = watchRuntime(page);
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `${route} produced no response`).not.toBeNull();
    const status = response!.status();
    expect(status, `${route} has a server error`).toBeLessThan(500);

    if (status === 404 && deployedRouteSet && !deployedRouteSet.has(route)) {
      test.skip(true, `${route} is new in this pull request and cannot be production-reachability-tested until deployment.`);
    }
    expect(status, `${route} is missing from the deployed site`).not.toBe(404);

    const visibleText = (await page.locator('body').innerText()).trim();
    expect(visibleText.length, `${route} rendered no meaningful UI`).toBeGreaterThan(30);

    const interactive = page.locator('a[href]:visible, button:visible, input:visible, textarea:visible, select:visible');
    expect(await interactive.count(), `${route} exposes no usable interactive element`).toBeGreaterThan(0);
    expect(runtimeProblems, `${route} emitted fatal browser errors`).toEqual([]);
  });
}

const formRoutes = criticalTools.filter((route) => /login|support|email|crm|ai|magnanimous|business|contact|phone|billing/i.test(route));
for (let offset = 0; offset < formRoutes.length; offset += 3) {
  const batch = formRoutes.slice(offset, offset + 3);
  test(`visible forms expose a submit path (${batch.join(', ')})`, async ({ page }) => {
    test.setTimeout(60_000);
    for (const route of batch) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 12_000 });
      if (!response || response.status() === 404 || response.status() >= 500) continue;
      const forms = page.locator('form:visible');
      const formCount = await forms.count();
      for (let i = 0; i < formCount; i++) {
        const form = forms.nth(i);
        const submitters = form.locator('button[type="submit"], input[type="submit"], button:not([type])');
        expect.soft(await submitters.count(), `${route} has a visible form with no submit control`).toBeGreaterThan(0);
      }
    }
  });
}
