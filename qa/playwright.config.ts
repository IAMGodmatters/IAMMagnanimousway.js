import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.QA_BASE_URL || 'https://iammagnanimousway.com';
const isCI = Boolean(process.env.CI);
const criticalMatrix = '**/cross-browser.spec.ts';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 6 : undefined,
  outputDir: 'test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'qa-results.json' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 12_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: false,
  },
  projects: [
    // Chromium performs the exhaustive route/function/security/accessibility sweep.
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    // Other engines/devices focus on critical user-facing surfaces. This keeps free CI fast while preserving cross-browser coverage.
    { name: 'firefox-desktop', testMatch: criticalMatrix, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-desktop', testMatch: criticalMatrix, use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', testMatch: criticalMatrix, use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', testMatch: criticalMatrix, use: { ...devices['iPhone 14'] } },
  ],
});
