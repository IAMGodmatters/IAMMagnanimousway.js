import { test, expect } from '@playwright/test';

test('Magnanimous Training Center is deployed as a platform route', async ({ request }) => {
  const response = await request.get('/magnanimous-training');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('Magnanimous Training Center');
  expect(html).toContain('24/7 CONTINUOUS LEARNING');
});

test('continuous-learning status is private to authenticated users', async ({ request }) => {
  const response = await request.get('/api/magnanimous/training/status');
  expect([401, 403]).toContain(response.status());
  const text = await response.text();
  expect(text).not.toMatch(/ideal_response|access_token|client_secret|api[_ -]?key/i);
});

test('anonymous callers cannot add training examples or change settings', async ({ request }) => {
  const teach = await request.post('/api/magnanimous/training/teach', {
    data: { domain: 'qa', prompt: 'qa-only', ideal_response: 'qa-only' },
  });
  expect([401, 403]).toContain(teach.status());

  const settings = await request.post('/api/magnanimous/training/settings', {
    data: { enabled: false },
  });
  expect([401, 403]).toContain(settings.status());
});

test('anonymous callers cannot trigger a learning cycle or export training data', async ({ request }) => {
  const run = await request.post('/api/magnanimous/training/run');
  expect([401, 403]).toContain(run.status());

  const exported = await request.get('/api/magnanimous/training/export');
  expect([401, 403]).toContain(exported.status());
});
