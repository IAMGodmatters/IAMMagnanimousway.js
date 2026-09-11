import { test, expect } from '@playwright/test';
import { watchRuntime } from './helpers';

const criticalTools = [
  '/',
  '/magnanimous',
  '/ai-chat',
  '/research',
  '/bible-study',
  '/writing',
  '/marketing',
  '/business',
  '/business-plan',
  '/coding',
  '/social',
  '/video-script',
  '/travel',
  '/customer-service',
  '/agents',
  '/assistant-actions',
  '/tool-foundry',
  '/ai-video',
  '/agent-video',
  '/cinema-engine',
  '/ai-receptionist',
  '/auto-dialer',
  '/contact-center',
  '/call-center-health',
  '/phone',
  '/business-email',
  '/crm',
  '/bpo-operations',
  '/finance-people',
  '/connections',
  '/billing-support',
  '/pricing',
  '/support',
  '/security',
  '/solutions',
  '/start',
  '/owner-login',
];

for (const route of criticalTools) {
  test(`${route} is present and functionally reachable`, async ({ page }) => {
    const runtimeProblems = watchRuntime(page);
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `${route} produced no response`).not.toBeNull();
    expect(response!.status(), `${route} is missing`).not.toBe(404);
    expect(response!.status(), `${route} has a server error`).toBeLessThan(500);

    const visibleText = (await page.locator('body').innerText()).trim();
    expect(visibleText.length, `${route} rendered no meaningful UI`).toBeGreaterThan(30);

    const interactive = page.locator('a[href]:visible, button:visible, input:visible, textarea:visible, select:visible');
    expect(await interactive.count(), `${route} exposes no usable interactive element`).toBeGreaterThan(0);
    expect(runtimeProblems, `${route} emitted fatal browser errors`).toEqual([]);
  });
}

test('forms expose a submit path instead of trapping user input', async ({ page }) => {
  const formRoutes = ['/owner-login', '/support', '/business-email', '/crm', '/ai-chat', '/magnanimous'];
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
