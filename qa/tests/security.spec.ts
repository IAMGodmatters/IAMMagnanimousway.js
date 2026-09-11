import { test, expect } from '@playwright/test';

test('owner authentication rejects invalid credentials without issuing a token', async ({ request }) => {
  const response = await request.post('/api/admin/login', {
    data: {
      email: 'qa-invalid-owner@example.invalid',
      password: 'not-a-real-password-qa-only',
    },
  });
  expect([400, 401, 403, 422]).toContain(response.status());
  const text = await response.text();
  expect(text).not.toMatch(/"token"\s*:\s*"[^\"]+"/i);
  expect(text).not.toMatch(/secret|api[_ -]?key|bearer\s+[a-z0-9._-]{20,}/i);
});

test('protected current-user endpoint does not authenticate anonymous callers', async ({ request }) => {
  const response = await request.get('/api/auth/me');
  expect([401, 403]).toContain(response.status());
  const text = await response.text();
  expect(text).not.toMatch(/secret|api[_ -]?key|password_hash/i);
});

test('common injection payload renders as text on public query-string navigation', async ({ page }) => {
  const marker = 'qa-xss-marker-7f12';
  await page.goto(`/?qa=${encodeURIComponent(`<img src=x onerror=alert('${marker}')>`)}`, { waitUntil: 'domcontentloaded' });
  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.waitForTimeout(500);
  expect(dialogs.join(' ')).not.toContain(marker);
});
