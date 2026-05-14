// @ts-check
require('dotenv/config');
const { defineConfig, devices } = require('@playwright/test');

const WEB_URL = process.env.WEB_URL || 'http://localhost:8080';
// Slow every Playwright action (click, fill, goto, ...) by this many ms so
// a human can follow the test in headed mode.  Override via STEP_SLOWMO_MS.
const STEP_SLOWMO_MS = Number(process.env.STEP_SLOWMO_MS || '300');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: WEB_URL,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: { slowMo: STEP_SLOWMO_MS },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
