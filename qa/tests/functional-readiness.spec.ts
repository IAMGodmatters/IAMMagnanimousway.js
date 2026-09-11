import { test, expect } from '@playwright/test';
import { discoverStaticRoutes, watchRuntime } from './helpers';

const allRoutes = discoverStaticRoutes();
const criticalPattern = /ai|magnanimous|bible|business|agent|video|cinema|dial|call|phone|reception|email|crm|bpo|finance|connection|billing|pricing|support|security|solution|start|owner|admin|tool/i;
const criticalTools = [...new Set(['/', ...allRoutes.filter((route) => criticalPattern.test(route))])];

for (const route of criticalTools) {
  test(`${route} is functionally reachable`, async ({ page }) => {
    const runtimeProblems = watchRuntime(page);
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `${route} produced no response`).not.toBeNull();
    expect(response!.status(), `${route} has a server error`).toBeLessThan(500);
    expect(response!.status(), `${route} is missing from the deployed site`).not.toBe(404);

    const visibleText = (await page.locator('body').innerText()).trim();
    expect(visibleText.length, `${route} rendered no meaningful UI`).toBeGreaterThan(30);

    const interactive = page.locator('a[href]:visible, button:visible, input:visible, textarea:visible, select:visible');
    expect(await interactive.count(), `${route} exposes no usable interactive element`).toBeGreaterThan(0);
    expect(runtimeProblems, `${route} emitted fatal browser errors`).toEqual([]);
  });
}

test('visible forms expose a submit path instead of trapping user input', async ({ page }) => {
  const formRoutes = criticalTools.filter((route) => /login|support|email|crm|ai|magnanimous|business|contact|phone|billing/i.test(route));
  for (const route of formRoutes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    if (!response || response.status() === 404 || response.status() >= 500) continue;
    const forms = page.locator('form:visible');
    for (let i = 0; i < await forms.count(); i++) {
      const form = forms.nth(i);
      const submitters = form.locator('button[type="submit"], input[type="submit"], button:not([type])');
      expect.soft(await submitters.count(), `${route} has a visible form with no submit control`).toBeGreaterThan(0);
    }
  }
});
