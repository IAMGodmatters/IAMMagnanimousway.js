import { test, expect } from '@playwright/test';
import { discoverStaticRoutes, watchRuntime } from './helpers';

const routes = discoverStaticRoutes();
const CONSEQUENCE = /\b(?:delete|remove|pay|buy|checkout|subscribe|purchase|call|dial|send|submit|save|publish|approve|reject|create|start|launch|book|sign\s?up|log\s?in|connect|disconnect|archive|charge|refund|cancel\s+(?:plan|subscription)|top\s?up|place order|withdraw|transfer|invite|upload|apply|activate|deactivate|reset password)\b/i;
const THIRD_PARTY_AI = /\b(?:OpenAI|ChatGPT|Anthropic|Claude|Google Gemini|Gemini|Groq|Mistral|OpenRouter|Cerebras|Hugging Face|Cloudflare(?: Workers AI)?|Workers AI)\b/i;

async function safelyClickableControls(page: any) {
  return page.locator('button:visible, [role="button"]:visible').evaluateAll((els: Element[]) => {
    const seen = new Map<string, number>();
    return els.map((el, index) => {
      const node = el as HTMLElement;
      const text = (node.innerText || node.getAttribute('aria-label') || node.getAttribute('title') || '').trim();
      const disabled = (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true';
      const form = el.closest('form');
      const type = (el.getAttribute('type') || '').toLowerCase();
      const occurrence = seen.get(text) || 0;
      seen.set(text, occurrence + 1);
      return { index, text, disabled, inForm: Boolean(form), type, occurrence };
    });
  });
}

async function loadRoute(page: any, route: string) {
  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  expect(response, `No HTTP response for ${route}`).not.toBeNull();
  expect(response!.status(), `${route} returned a fatal HTTP status`).toBeLessThan(500);
  await page.locator('body').waitFor({ state: 'visible', timeout: 2_000 });
  await page.waitForLoadState('load', { timeout: 1_500 }).catch(() => {});
}

function namedControl(page: any, candidate: any) {
  return page.getByRole('button', { name: candidate.text, exact: true }).nth(candidate.occurrence);
}

async function ensureCandidateReady(page: any, route: string, candidate: any) {
  let target = namedControl(page, candidate);
  if (await target.isVisible().catch(() => false)) return target;

  // A prior safe control may have changed local UI state (dialog/tab/collapse). Only then
  // restore the route. This avoids the old full-page reload before every single button.
  await loadRoute(page, route);
  target = namedControl(page, candidate);
  if (await target.isVisible().catch(() => false)) return target;

  // Final fallback preserves compatibility with unusual role/button implementations.
  const visible = page.locator('button:visible, [role="button"]:visible');
  const count = await visible.count();
  if (candidate.index >= count) return null;
  const fallback = visible.nth(candidate.index);
  return (await fallback.isVisible().catch(() => false)) ? fallback : null;
}

test.describe('deep non-destructive control sweep', () => {
  for (const route of routes) {
    test(`${route} visible controls are usable without fatal errors`, async ({ page }) => {
      const runtimeProblems = watchRuntime(page);
      await loadRoute(page, route);

      const controls = await safelyClickableControls(page);
      for (const control of controls) {
        expect(control.text.length, `${route} has a visible button/role=button with no accessible text`).toBeGreaterThan(0);
      }

      // Exercise only clearly non-destructive controls. Consequential buttons and form submissions
      // are verified by dedicated authenticated/smoke tests rather than being triggered on production.
      const candidates = controls.filter((c: any) => !c.disabled && !c.inForm && c.type !== 'submit' && c.text && !CONSEQUENCE.test(c.text)).slice(0, 12);
      const baselineUrl = new URL(page.url());

      for (const candidate of candidates) {
        let target = await ensureCandidateReady(page, route, candidate);
        if (!target) continue;
        if (await target.isDisabled().catch(() => true)) continue;

        let clicked = true;
        try {
          await target.click({ timeout: 2_500 });
        } catch {
          // A previous click may have left a transient overlay intercepting the next control.
          // Restore once and retry; a second failure is a real sweep failure rather than a silent skip.
          await loadRoute(page, route);
          target = await ensureCandidateReady(page, route, candidate);
          if (!target || await target.isDisabled().catch(() => true)) continue;
          try {
            await target.click({ timeout: 2_500 });
          } catch {
            clicked = false;
          }
        }
        expect(clicked, `${route} control "${candidate.text}" could not be clicked`).toBe(true);

        await page.waitForTimeout(75);
        const body = (await page.locator('body').innerText()).trim();
        expect(body.length, `${route} went blank after clicking ${candidate.text}`).toBeGreaterThan(20);

        const currentUrl = new URL(page.url());
        if (currentUrl.origin !== baselineUrl.origin || currentUrl.pathname !== baselineUrl.pathname) {
          await loadRoute(page, route);
        }
      }

      expect(runtimeProblems, `${route} emitted fatal browser errors while controls were exercised`).toEqual([]);
    });
  }
});

test('standalone Magnanimous requires sign-in and keeps execution providers private for signed-in customers', async ({ page }) => {
  // First lock the customer boundary: an unauthenticated visitor must not receive the standalone composer.
  await page.goto('/magnanimous', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/login\?returnTo=%2Fmagnanimous(?:&|$)/, { timeout: 10_000 });
  await expect(page.locator('.mag-compose textarea')).toHaveCount(0);

  // Establish the same browser-side customer session contract used by the platform guard.
  // The backend chat response remains mocked because this source QA validates the UI/privacy contract;
  // the post-deployment suite separately checks the real production API.
  await page.evaluate(() => {
    localStorage.setItem('iam_account_token', 'qa-customer-session');
    sessionStorage.setItem('iam_session_active', 'user');
  });

  await page.route('**/api/chat', async (route: any) => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ output: 'Start by writing the three tasks down in the order you want to handle them.' }),
    });
  });

  await page.goto('/magnanimous', { waitUntil: 'domcontentloaded' });
  const composer = page.locator('.mag-compose textarea');
  const send = page.locator('.mag-compose button[type="submit"]');
  await expect(composer).toBeVisible();
  await composer.fill('In one short sentence, tell me the first step for organizing a simple three-item task list.');
  await expect(send).toBeEnabled();
  await send.click();

  await expect(page.locator('.mag-message.user')).toContainText('three-item task list');
  await expect.poll(async () => page.locator('.mag-message.assistant').count(), { timeout: 20_000 }).toBeGreaterThan(1);
  const assistant = page.locator('.mag-message.assistant').last();
  await expect(assistant.locator('p')).toContainText('Start by writing the three tasks down');
  const answer = await assistant.innerText();
  expect(answer).not.toMatch(THIRD_PARTY_AI);
  expect(answer).not.toMatch(/execution engine|private routing|daily free allocation|neurons|paid plan/i);
});