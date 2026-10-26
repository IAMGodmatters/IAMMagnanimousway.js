import { test, expect } from '@playwright/test';
import { isTransientStatus, requestWithBackoff } from './network-retry';

const videoGateway = process.env.QA_VIDEO_GATEWAY_URL || 'https://iam-magnanimous-video-gateway.iam-magnanimous.workers.dev';

test('video gateway health endpoint is reachable', async ({ request }) => {
  const response = await requestWithBackoff(request, `${videoGateway}/health`, { method: 'GET' });
  if (response.status() === 429) test.skip(true, 'Video gateway is reachable but temporarily rate limited in the broad production sweep.');
  expect(isTransientStatus(response.status()), `Video gateway stayed transiently unavailable after bounded backoff (${response.status()})`).toBe(false);
  expect(response.status(), 'Video gateway health endpoint is unavailable').toBe(200);
  const body = await response.json().catch(() => null);
  expect(body).toBeTruthy();
  expect(String(body?.status || '').toLowerCase()).toMatch(/ok|healthy/);
});

test('public platform does not return 5xx for representative API preflight paths', async ({ request }) => {
  const safeChecks = ['/api/auth/me', '/api/admin/login'];
  for (const route of safeChecks) {
    const response = await requestWithBackoff(request, route, { method: 'OPTIONS' });
    if (response.status() === 429) {
      test.info().annotations.push({ type: 'rate-limit', description: `${route} OPTIONS returned 429 after bounded backoff` });
      continue;
    }
    expect.soft(isTransientStatus(response.status()), `${route} OPTIONS remained temporarily unavailable after bounded backoff (${response.status()})`).toBe(false);
    expect.soft(response.status(), `${route} OPTIONS returned a server error`).toBeLessThan(500);
  }
});
