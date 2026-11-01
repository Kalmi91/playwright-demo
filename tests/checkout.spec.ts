import { test, expect } from './fixtures';
import { formatCents } from '../pages/CheckoutPage';

const BACKPACK = 'Sauce Labs Backpack';
const BIKE_LIGHT = 'Sauce Labs Bike Light';
const CUSTOMER = { firstName: 'Ada', lastName: 'Lovelace', postalCode: '1051' };

test.describe('Checkout: full flow', () => {
  // Start logged out, so the flow really begins at the login screen.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('standard user buys two products end to end', async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    // Login
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL(/inventory\.html/);

    // Two products into the cart
    const expectedSubtotal =
      (await inventoryPage.priceInCents(BACKPACK)) + (await inventoryPage.priceInCents(BIKE_LIGHT));
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.addToCart(BIKE_LIGHT);
    await expect(inventoryPage.cartBadge).toHaveText('2');

    // Cart holds exactly those two
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/cart\.html/);
    await expect(cartPage.items).toHaveCount(2);
    await expect(cartPage.itemNames).toContainText([BACKPACK, BIKE_LIGHT]);
    await cartPage.checkout();

    // Customer information
    await expect(page).toHaveURL(/checkout-step-one\.html/);
    await checkoutPage.fillCustomerInfo(CUSTOMER);
    await checkoutPage.continue();

    // Overview: item total = sum of the card prices, total = item total + tax
    await expect(page).toHaveURL(/checkout-step-two\.html/);
    await expect(checkoutPage.subtotalLabel).toHaveText(`Item total: $${formatCents(expectedSubtotal)}`);
    const tax = await checkoutPage.amountInCents(checkoutPage.taxLabel);
    await expect(checkoutPage.totalLabel).toHaveText(`Total: $${formatCents(expectedSubtotal + tax)}`);

    // Finish: confirmation shown, cart emptied
    await checkoutPage.finish();
    await expect(page).toHaveURL(/checkout-complete\.html/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(inventoryPage.cartBadge).toHaveCount(0);
  });
});

// Pre-authenticated (storageState from auth.setup.ts), one product in the cart.
test.describe('Checkout: validation and cart edge cases', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.openCart();
  });

  const missingField = [
    { missing: 'first name', info: { lastName: 'Lovelace', postalCode: '1051' }, error: 'First Name is required' },
    { missing: 'last name', info: { firstName: 'Ada', postalCode: '1051' }, error: 'Last Name is required' },
    { missing: 'postal code', info: { firstName: 'Ada', lastName: 'Lovelace' }, error: 'Postal Code is required' },
    { missing: 'every field', info: {}, error: 'First Name is required' },
  ];

  for (const { missing, info, error } of missingField) {
    test(`checkout without ${missing} shows an error and stays on step one`, async ({
      page,
      cartPage,
      checkoutPage,
    }) => {
      await cartPage.checkout();
      await checkoutPage.fillCustomerInfo(info);
      await checkoutPage.continue();

      await expect(checkoutPage.errorMessage).toContainText(error);
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });
  }

  test('removing the only item empties the cart and clears the badge', async ({ cartPage, inventoryPage }) => {
    await expect(cartPage.items).toHaveCount(1);

    await cartPage.remove(BACKPACK);

    await expect(cartPage.items).toHaveCount(0);
    await expect(inventoryPage.cartBadge).toHaveCount(0);
  });
});
