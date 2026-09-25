import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.QA_BASE_URL || 'https://iammagnanimousway.com';
const isCI = Boolean(process.env.CI);
const isPullRequest = process.env.GITHUB_EVENT_NAME === 'pull_request';
const criticalMatrix = '**/cross-browser.spec.ts';
const chromium = { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } };
const crossBrowserProjects = [
  { name: 'firefox-desktop', testMatch: criticalMatrix, use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit-desktop', testMatch: criticalMatrix, use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-chrome', testMatch: criticalMatrix, use: { ...devices['Pixel 7'] } },
  { name: 'mobile-safari', testMatch: criticalMatrix, use: { ...devices['iPhone 14'] } },
];

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Pull-request QA targets an already-deployed production baseline, not the branch preview.
  // Run it serially and in Chromium so the harness cannot manufacture a rate-limit storm.
  // Full deployed/main and scheduled QA still retains the cross-browser/mobile matrix.
  workers: isCI ? 1 : undefined,
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
  projects: isPullRequest ? [chromium] : [chromium, ...crossBrowserProjects],
});
