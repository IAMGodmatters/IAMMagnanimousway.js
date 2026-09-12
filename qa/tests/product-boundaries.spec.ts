import { test, expect } from '@playwright/test';

const THIRD_PARTY_AI = /\b(?:OpenAI|Anthropic|Claude|Gemini|Groq|Mistral|OpenRouter|Cerebras|Hugging Face|Cloudflare Workers AI)\b/i;

test('standalone Magnanimous AI remains isolated, public, voice-enabled, autosaving, and Magnanimous-branded', async ({ page }) => {
  await page.goto('/magnanimous', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('main.mag-standalone')).toBeVisible();
  await expect(page.getByText('MAGNANIMOUS AI™').first()).toBeVisible();
  await expect(page.getByText('STANDALONE INTELLIGENCE')).toBeVisible();
  await expect(page.getByText('Guest session')).toBeVisible();
  await expect(page.locator('.iam-shop-link')).toBeHidden();
  await expect(page.locator('.iam-global-tools')).toBeHidden();

  // Voice and autosave are standalone product capabilities, not platform chrome.
  const voicePanel = page.locator('.iam-voice-panel');
  await expect(voicePanel).toBeVisible();
  await expect(voicePanel).toContainText(/Magnanimous AI/i);
  await expect(voicePanel.getByRole('button', { name: /Talk to Magnanimous AI/i })).toBeVisible();
  await expect(voicePanel.locator('button.voice-sound[title*="spoken replies"]')).toBeVisible();
  await expect(voicePanel.getByRole('button', { name: 'VOICE' })).toBeVisible();
  await expect(page.locator('.iam-progress-save')).toBeVisible();

  const composer = page.locator('.mag-compose textarea');
  const autosaveDraft = 'QA autosave recovery draft — do not send';
  await composer.fill(autosaveDraft);
  await expect.poll(async () => page.evaluate((needle) => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (!key.startsWith('iam_progress_draft:/magnanimous:')) continue;
      if ((localStorage.getItem(key) || '').includes(String(needle))) return true;
    }
    return false;
  }, autosaveDraft)).toBe(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.mag-compose textarea')).toHaveValue(autosaveDraft);

  const standaloneFlag = await page.evaluate(() => document.documentElement.getAttribute('data-iam-standalone'));
  expect(standaloneFlag).toBe('true');

  const visibleText = await page.locator('body').innerText();
  expect(visibleText).not.toMatch(THIRD_PARTY_AI);
  expect(visibleText).not.toMatch(/execution engine/i);
});

test('main platform remains separate from the standalone AI shell', async ({ page }) => {
  await page.goto('/solutions', { waitUntil: 'domcontentloaded' });

  const standaloneFlag = await page.evaluate(() => document.documentElement.getAttribute('data-iam-standalone'));
  expect(standaloneFlag).toBeNull();
  await expect(page.locator('main.mag-standalone')).toHaveCount(0);
  await expect(page.locator('.iam-shop-link')).toBeVisible();
  await expect(page.locator('.iam-shop-link')).toHaveAttribute('href', '/shop');
});

test('God Matters marketplace remains wired to the locked Shopify store', async ({ page }) => {
  await page.goto('/shop', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('GOD MATTERS MARKETPLACE', { exact: true })).toBeVisible();
  const storeLinks = page.locator('a[href^="https://puso-iam.myshopify.com"]');
  expect(await storeLinks.count()).toBeGreaterThan(0);
  await expect(storeLinks.first()).toHaveAttribute('rel', /noopener/);
  await expect(storeLinks.first()).toHaveAttribute('rel', /noreferrer/);

  const body = await page.locator('body').innerText();
  expect(body).toContain('God Matters');
});
