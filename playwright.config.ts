import { defineConfig, devices } from '@playwright/test';
import { config } from './config/env';

const desktopChrome = devices['Desktop Chrome'] ?? {
  viewport: { width: 1280, height: 720 },
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

/**
 * Playwright configuration stub providing defaults for CLI tooling (codegen, inspector)
 * and standalone verification runs. Cucumber features consume config from config/env.ts.
 */
export default defineConfig({
  testDir: './features',
  timeout: config.DEFAULT_TIMEOUT_MS,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false, // Low concurrency for polite live site interaction
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: config.UI_PARALLEL,
  use: {
    baseURL: config.EMI_BASE_URL,
    headless: config.HEADLESS,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...desktopChrome },
    },
  ],
});
