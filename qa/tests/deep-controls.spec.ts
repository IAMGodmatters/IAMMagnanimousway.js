import { test, expect } from '@playwright/test';
import { discoverStaticRoutes, watchRuntime } from './helpers';

const routes = discoverStaticRoutes();
const CONSEQUENCE = /\b(?:delete|remove|pay|buy|checkout|subscribe|purchase|call|dial|send|submit|save|publish|approve|reject|create|start|launch|book|sign\s?up|log\s?in|connect|disconnect|archive|charge|refund|cancel\s+(?:plan|subscription)|top\s?up|place order|withdraw|transfer|invite|upload|apply|activate|deactivate|reset password)\b/i;
const THIRD_PARTY_AI = /\b(?:OpenAI|Anthropic|Claude|Gemini|Groq|Mistral|OpenRouter|Cerebras|Hugging Face|Cloudflare Workers AI|Workers AI)\b/i;

async function safelyClickableControls(page: any) {
  return page.locator('button:visible, [role="button"]:visible').evaluateAll((els: Element[]) => els.map((el, index) => {
    const node = el as HTMLElement;
    const text = (node.innerText || node.getAttribute('aria-label') || node.getAttribute('title') || '').trim();
    const disabled = (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true';
    const form = el.closest('form');
    const type = (el.getAttribute('type') || '').toLowerCase();
    return { index, text, disabled, inForm: Boolean(form), type };
  }));
}

test.describe('deep non-destructive control sweep', () => {
  for (const route of routes) {
    test(`${route} visible controls are usable without fatal errors`, async ({ page }) => {
      const runtimeProblems = watchRuntime(page);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response, `No HTTP response for ${route}`).not.toBeNull();
      expect(response!.status(), `${route} returned a fatal HTTP status`).toBeLessThan(500);
      await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => {});

      const controls = await safelyClickableControls(page);
      for (const control of controls) {
        expect(control.text.length, `${route} has a visible button/role=button with no accessible text`).toBeGreaterThan(0);
      }

      // Exercise only clearly non-destructive controls. Consequential buttons and form submissions
      // are verified by dedicated authenticated/smoke tests rather than being triggered on production.
      const candidates = controls.filter((c: any) => !c.disabled && !c.inForm && c.type !== 'submit' && c.text && !CONSEQUENCE.test(c.text)).slice(0, 12);
      for (const candidate of candidates) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => {});
        const visible = page.locator('button:visible, [role="button"]:visible');
        const count = await visible.count();
        if (candidate.index >= count) continue;
        const target = visible.nth(candidate.index);
        if (!(await target.isVisible().catch(() => false))) continue;
        if (await target.isDisabled().catch(() => true)) continue;
        await target.click({ timeout: 4_000 }).catch(() => {});
        await page.waitForTimeout(120);
        const body = (await page.locator('body').innerText()).trim();
        expect(body.length, `${route} went blank after clicking ${candidate.text}`).toBeGreaterThan(20);
      }

      expect(runtimeProblems, `${route} emitted fatal browser errors while controls were exercised`).toEqual([]);
    });
  }
});

test('standalone Magnanimous completes a real guest Q&A turn without exposing execution providers', async ({ page }) => {
  await page.goto('/magnanimous', { waitUntil: 'domcontentloaded' });
  const composer = page.locator('.mag-compose textarea');
  const send = page.locator('.mag-compose button[type="submit"]');
  await expect(composer).toBeVisible();
  await composer.fill('In one short sentence, tell me the first step for organizing a simple three-item task list.');
  await expect(send).toBeEnabled();
  await send.click();

  await expect(page.locator('.mag-message.user')).toContainText('three-item task list');
  await expect.poll(async () => page.locator('.mag-message.assistant').count(), { timeout: 60_000 }).toBeGreaterThan(1);
  const assistant = page.locator('.mag-message.assistant').last();
  await expect(assistant.locator('p')).not.toHaveText('', { timeout: 60_000 });
  const answer = await assistant.innerText();
  expect(answer).not.toMatch(/I could not complete that request/i);
  expect(answer).not.toMatch(THIRD_PARTY_AI);
  expect(answer).not.toMatch(/execution engine/i);
});
