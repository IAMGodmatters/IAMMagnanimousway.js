import { test, expect } from '@playwright/test';
import { requestWithBackoff } from './network-retry';

function assertNoSensitiveMaterial(text: string) {
  expect(text).not.toMatch(/"token"\s*:\s*"[^\"]+"/i);
  expect(text).not.toMatch(/secret|api[_ -]?key|password_hash|bearer\s+[a-z0-9._-]{20,}/i);
}

test('owner authentication rejects invalid credentials without issuing a token', async ({ request }) => {
  const response = await requestWithBackoff(request, '/api/admin/login', {
    method: 'POST',
    data: {
      email: 'qa-invalid-owner@example.invalid',
      password: 'not-a-real-password-qa-only',
    },
  });
  const text = await response.text();
  assertNoSensitiveMaterial(text);
  // 429 is also a secure rejection: production rate limiting denied the invalid login.
  expect([400, 401, 403, 422, 429]).toContain(response.status());
});

test('protected current-user endpoint does not authenticate anonymous callers', async ({ request }) => {
  const response = await requestWithBackoff(request, '/api/auth/me', { method: 'GET' });
  const text = await response.text();
  assertNoSensitiveMaterial(text);
  // A throttled anonymous request remains unauthenticated and leaks no protected data.
  expect([401, 403, 429]).toContain(response.status());
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
