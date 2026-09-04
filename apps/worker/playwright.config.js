import { defineConfig } from '@playwright/test';

/**
 * Playwright Test Configuration for TestForge Execution Worker.
 * Explicitly targets Chromium browser in headless mode by default.
 */
export default defineConfig({
  testDir: '.',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    headless: process.env.HEADLESS !== 'false',
    actionTimeout: 10000,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: process.env.HEADLESS !== 'false',
      },
    },
  ],
});
