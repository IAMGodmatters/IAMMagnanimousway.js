import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './journeys',
  timeout: 35_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  outputDir: 'journey-test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'journey-playwright-report', open: 'never' }],
    ['json', { outputFile: 'journey-qa-results.json' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    ignoreHTTPSErrors: false,
  },
  projects: [
    { name: 'chromium-customer-journeys', use: { ...devices['Desktop Chrome'] } },
  ],
  // Serve the exact static export produced by the frontend build.
  // No Worker, database, Stripe account, or external provider is required.
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory ../frontend/out',
    url: 'http://127.0.0.1:4173/pricing/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
