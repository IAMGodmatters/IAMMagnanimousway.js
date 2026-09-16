import { test, expect } from '@playwright/test';
import { isTransientStatus, requestWithBackoff } from './network-retry';

test('owner authentication rejects invalid credentials without issuing a token', async ({ request }) => {
  const response = await requestWithBackoff(request, '/api/admin/login', {
    method: 'POST',
    data: {
      email: 'qa-invalid-owner@example.invalid',
      password: 'not-a-real-password-qa-only',
    },
  });
  expect(isTransientStatus(response.status()), `Owner login remained throttled after bounded backoff (${response.status()})`).toBe(false);
  expect([400, 401, 403, 422]).toContain(response.status());
  const text = await response.text();
  expect(text).not.toMatch(/"token"\s*:\s*"[^\"]+"/i);
  expect(text).not.toMatch(/secret|api[_ -]?key|bearer\s+[a-z0-9._-]{20,}/i);
});

test('protected current-user endpoint does not authenticate anonymous callers', async ({ request }) => {
  const response = await requestWithBackoff(request, '/api/auth/me', { method: 'GET' });
  expect(isTransientStatus(response.status()), `Current-user endpoint remained throttled after bounded backoff (${response.status()})`).toBe(false);
  expect([401, 403]).toContain(response.status());
  const text = await response.text();
  expect(text).not.toMatch(/secret|api[_ -]?key|password_hash/i);
});

test('common injection payload does not execute from public query-string navigation', async ({ page }) => {
  const marker = 'qa-xss-marker-7f12';
  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.goto(`/?qa=${encodeURIComponent(`<img src=x onerror=alert('${marker}')>`)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  expect(dialogs.join(' ')).not.toContain(marker);
});
