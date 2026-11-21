import { test, expect, type Page } from '@playwright/test';

const LOCAL_ORIGIN = 'http://127.0.0.1:4173';
const MOCK_TOKEN = 'qa-social-calendar-session-not-valid-on-any-server';
const SCHEDULER = {
  enabled: true,
  interval_minutes: 15,
  max_new_posts_per_run: 1,
  theoretical_max_new_posts_per_day: 96,
  tenant_due_count: 0,
  tenant_oldest_due_at: null,
  tenant_queue_lag_seconds: 0,
};

const readyYouTube = {
  id: 'youtube',
  name: 'YouTube',
  connected: true,
  configured: true,
  write_scope: true,
  display_name: 'QA Channel',
  external_id: 'qa-channel-1',
};

async function isolateNetwork(page: Page) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== LOCAL_ORIGIN) return route.abort();
    return route.continue();
  });
}

async function useSyntheticSession(page: Page) {
  await page.addInitScript((token) => {
    localStorage.setItem('iam_account_token', token);
    sessionStorage.setItem('iam_session_active', 'user');
  }, MOCK_TOKEN);
}

async function mockConnections(page: Page, connections: unknown[]) {
  await page.route('**/api/social-connect/connections', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ connections }),
  }));
}

async function mockRole(page: Page, role: string) {
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { role } }),
  }));
}

function emptySchedule(items: unknown[] = []) {
  return { items, scheduler: SCHEDULER };
}

function draftItem(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    provider: 'youtube',
    external_id: 'qa-channel-1',
    scheduled_at: Math.floor(Date.now() / 1000) + 3600,
    timezone: 'UTC',
    status: 'draft',
    payload: {
      title: 'Magnanimous QA draft',
      description: 'A private QA-only draft.',
      video_url: 'https://cdn.example.com/qa-video.mp4',
      privacy_status: 'private',
    },
    created_at: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

test('unauthenticated visitors are sent to sign-in before social API reads', async ({ page }) => {
  await isolateNetwork(page);
  let socialApiRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/social-')) socialApiRequests += 1;
  });

  await page.goto('/social-calendar/', { waitUntil: 'load' });
  await page.waitForURL((url) => url.pathname.replace(/\/+$/, '') === '/login');

  expect(socialApiRequests, 'A signed-out visitor must not read tenant social connections or schedules').toBe(0);
});

test('a connected but unconfigured account cannot displace a publish-ready provider', async ({ page }) => {
  await isolateNetwork(page);
  await useSyntheticSession(page);
  await mockConnections(page, [
    { id: 'linkedin', name: 'LinkedIn', connected: true, configured: false, write_scope: true, display_name: 'Unconfigured LinkedIn', external_id: 'linkedin-1' },
    { id: 'tiktok', name: 'TikTok', connected: true, configured: true, write_scope: false, display_name: 'TikTok without write scope', external_id: 'tiktok-1' },
    readyYouTube,
  ]);
  await page.route('**/api/social-schedule**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(emptySchedule()),
  }));
  await mockRole(page, 'owner');

  await page.goto('/social-calendar/', { waitUntil: 'load' });

  const account = page.getByLabel('Social account');
  await expect(account).toHaveValue('youtube');
  await expect(account.locator('option')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Save draft for approval' })).toBeEnabled();
});

test('saving a social post creates a draft only and never calls a provider publish endpoint', async ({ page }) => {
  await isolateNetwork(page);
  await useSyntheticSession(page);
  await mockConnections(page, [readyYouTube]);
  await mockRole(page, 'owner');

  let saved: ReturnType<typeof draftItem> | null = null;
  let submitted: Record<string, unknown> | null = null;
  let directPublishRequests = 0;

  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/api/social-connect/youtube/publish')) directPublishRequests += 1;
  });

  await page.route('**/api/social-schedule**', async (route) => {
    if (route.request().method() === 'POST') {
      submitted = route.request().postDataJSON() as Record<string, unknown>;
      const instant = new Date(String(submitted.scheduled_at));
      saved = draftItem({
        scheduled_at: Math.floor(instant.getTime() / 1000),
        timezone: String(submitted.timezone),
        payload: {
          title: String(submitted.title),
          description: String(submitted.description || ''),
          video_url: String(submitted.video_url),
          privacy_status: String(submitted.privacy_status),
        },
      });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ item: saved, approval_required: true }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(emptySchedule(saved ? [saved] : [])),
    });
  });

  await page.goto('/social-calendar/', { waitUntil: 'load' });
  await page.getByLabel('Public video URL').fill('https://cdn.example.com/qa-video.mp4');
  await page.getByLabel('Video title').fill('Magnanimous QA draft');
  await page.getByRole('button', { name: 'Save draft for approval' }).click();

  await expect(page.getByText('Draft saved. Review its account, content and time below, then approve it to schedule publishing.')).toBeVisible();
  await expect(page.locator('.item .status')).toHaveText('draft');
  expect(submitted).toMatchObject({ provider: 'youtube' });
  expect(String(submitted?.idempotency_key || '').length).toBeGreaterThan(0);
  expect(String(submitted?.timezone || '').length).toBeGreaterThan(0);
  expect(String(submitted?.scheduled_at || '')).toMatch(/(?:Z|[+-]\d{2}:\d{2})$/);
  expect(directPublishRequests, 'Saving a draft must not publish to YouTube').toBe(0);
});

test('only an owner can approve a draft, and approval does not itself call the provider', async ({ page }) => {
  await isolateNetwork(page);
  await useSyntheticSession(page);
  await mockConnections(page, [readyYouTube]);
  await mockRole(page, 'member');
  const saved = draftItem();

  await page.route('**/api/social-schedule**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(emptySchedule([saved])),
  }));

  await page.goto('/social-calendar/', { waitUntil: 'load' });

  await expect(page.getByText('Draft saved. The workspace owner or administrator must review and approve this exact post before automatic publishing.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve and schedule' })).toHaveCount(0);
  await expect(page.getByLabel(/I approve this exact content, connected account and publishing time/)).toHaveCount(0);
});
