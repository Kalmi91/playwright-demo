import { type Locator, type Page } from '@playwright/test';

/** Page Object for the saucedemo cart ("Your Cart"). */
export class CartPage {
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.items = page.locator('[data-test="inventory-item"]');
    this.itemNames = page.locator('[data-test="inventory-item-name"]');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async goto() {
    await this.page.goto('/cart.html');
  }

  /** Scopes the click to the cart row, so other rows' buttons can't match. */
  async remove(productName: string) {
    const row = this.items.filter({ hasText: productName });
    await row.getByRole('button', { name: 'Remove' }).click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
