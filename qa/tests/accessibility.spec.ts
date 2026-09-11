import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const criticalRoutes = [
  '/',
  '/ai-chat',
  '/bible-study',
  '/business',
  '/business-plan',
  '/agents',
  '/assistant-actions',
  '/ai-video',
  '/agent-video',
  '/ai-receptionist',
  '/auto-dialer',
  '/call-center-health',
  '/billing-support',
  '/connections',
  '/support',
  '/pricing',
];

for (const route of criticalRoutes) {
  test(`${route} has no serious or critical accessibility violations`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    if (response!.status() === 404) test.fail(true, `${route} is missing`);
    const results = await new AxeBuilder({ page }).analyze();
    const severe = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact || ''));
    expect(severe, severe.map((v) => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
  });
}
