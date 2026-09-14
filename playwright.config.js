import { defineConfig, devices } from '@playwright/test'

// Set PLAYWRIGHT_CHROMIUM_PATH when Chromium is already on the machine and you
// would rather not download Playwright's own copy. Otherwise run
// `npx playwright install chromium` once and leave it unset.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined

// The end-to-end suite runs against the real build served with the production
// security headers, so the Content-Security-Policy is genuinely under test.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: executablePath ? { executablePath } : {} },
    },
  ],
  webServer: {
    command: 'node scripts/serve-dist.mjs',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
