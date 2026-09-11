import { test, expect } from '@playwright/test';

const videoGateway = process.env.QA_VIDEO_GATEWAY_URL || 'https://iam-magnanimous-video-gateway.iam-magnanimous.workers.dev';

test('video gateway health endpoint is reachable', async ({ request }) => {
  const response = await request.get(`${videoGateway}/health`);
  expect(response.status(), 'Video gateway health endpoint is unavailable').toBe(200);
  const body = await response.json().catch(() => null);
  expect(body).toBeTruthy();
  expect(String(body?.status || '').toLowerCase()).toMatch(/ok|healthy/);
});

test('public platform does not return 5xx for representative API preflight paths', async ({ request }) => {
  const safeChecks = [
    '/api/auth/me',
    '/api/admin/login',
  ];
  for (const route of safeChecks) {
    const response = await request.fetch(route, { method: 'OPTIONS' });
    expect.soft(response.status(), `${route} OPTIONS returned a server error`).toBeLessThan(500);
  }
});
