import { type Locator, type Page } from '@playwright/test';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/** Page Object for the saucedemo product list ("Products" page). */
export class InventoryPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly itemPriceLabels: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly sortSelect: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('[data-test="title"]');
    this.items = page.locator('[data-test="inventory-item"]');
    this.itemPriceLabels = page.locator('[data-test="inventory-item-price"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.cartLink = page.locator('[data-test="shopping-cart-link"]');
    this.sortSelect = page.locator('[data-test="product-sort-container"]');
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  /** Scopes the click to the product card, so other cards' buttons can't match. */
  async addToCart(productName: string) {
    const card = this.items.filter({ hasText: productName });
    await card.getByRole('button', { name: 'Add to cart' }).click();
  }

  async openCart() {
    await this.cartLink.click();
  }

  async sortBy(option: SortOption) {
    await this.sortSelect.selectOption(option);
  }

  async prices(): Promise<number[]> {
    const texts = await this.itemPriceLabels.allTextContents();
    return texts.map((t) => parseFloat(t.replace('$', '')));
  }

  /** Price of one product card in integer cents ("$29.99" -> 2999). */
  async priceInCents(productName: string): Promise<number> {
    const text = await this.items
      .filter({ hasText: productName })
      .locator('[data-test="inventory-item-price"]')
      .innerText();
    return Math.round(parseFloat(text.replace('$', '')) * 100);
  }
}
