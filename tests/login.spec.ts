import { test, expect } from './fixtures';

// This suite tests the login flow itself, so opt out of the saved session
// and start every test logged-out.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test('valid user reaches the inventory page', async ({ loginPage, page }) => {
    await loginPage.login('standard_user', 'secret_sauce');

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('wrong password shows an error message', async ({ loginPage }) => {
    await loginPage.login('standard_user', 'definitely_wrong');

    await expect(loginPage.errorMessage).toContainText(
      'Username and password do not match',
    );
  });

  test('locked out user is rejected', async ({ loginPage }) => {
    await loginPage.login('locked_out_user', 'secret_sauce');

    await expect(loginPage.errorMessage).toContainText('locked out');
  });
});
