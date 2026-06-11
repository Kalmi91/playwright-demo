import { defineConfig, devices } from '@playwright/test';

/**
 * Target app: https://www.saucedemo.com — Sauce Labs' public demo shop.
 * Demo credentials are printed on its login page; they are not secrets.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Logs in once and saves the session to .auth/user.json (storageState).
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Every test starts already authenticated; login.spec.ts opts out
        // with test.use({ storageState: { cookies: [], origins: [] } }).
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
