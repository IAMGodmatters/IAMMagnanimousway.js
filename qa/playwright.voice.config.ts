import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './postdeploy',
  timeout: 35_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  outputDir: 'voice-test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'voice-playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.QA_BASE_URL || 'https://iammagnanimousway.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 25_000,
  },
  projects: [
    { name: 'chromium-voice', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit-voice', use: { ...devices['iPhone 14'] } },
  ],
});
