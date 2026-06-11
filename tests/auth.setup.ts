import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const AUTH_FILE = '.auth/user.json';

/**
 * Runs once before the chromium project (see playwright.config.ts dependencies).
 * Logs in through the UI and saves cookies + localStorage to .auth/user.json,
 * so every other test starts already authenticated — no repeated login flakiness.
 *
 * standard_user / secret_sauce are saucedemo's public demo credentials,
 * printed on the login page itself.
 */
setup('authenticate as standard_user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('standard_user', 'secret_sauce');
  await expect(page).toHaveURL(/inventory\.html/);
  await page.context().storageState({ path: AUTH_FILE });
});
