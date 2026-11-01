import { type Locator, type Page } from '@playwright/test';

export type CustomerInfo = {
  firstName: string;
  lastName: string;
  postalCode: string;
};

/** "Item total: $39.98" → 3998. Integer cents avoid float rounding in totals. */
export function parseCents(text: string): number {
  return Math.round(parseFloat(text.replace(/[^0-9.]/g, '')) * 100);
}

/** 3998 → "39.98" */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Page Object for the three saucedemo checkout screens: customer information
 * (step one), order overview (step two) and the confirmation page.
 */
export class CheckoutPage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly errorMessage: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly completeHeader: Locator;

  constructor(private readonly page: Page) {
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.postalCodeInput = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.finishButton = page.getByRole('button', { name: 'Finish' });
    this.errorMessage = page.locator('[data-test="error"]');
    this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
    this.completeHeader = page.locator('[data-test="complete-header"]');
  }

  /** Fills only the fields that are passed in, so tests can leave one blank. */
  async fillCustomerInfo(info: Partial<CustomerInfo>) {
    if (info.firstName !== undefined) await this.firstNameInput.fill(info.firstName);
    if (info.lastName !== undefined) await this.lastNameInput.fill(info.lastName);
    if (info.postalCode !== undefined) await this.postalCodeInput.fill(info.postalCode);
  }

  async continue() {
    await this.continueButton.click();
  }

  async finish() {
    await this.finishButton.click();
  }

  async amountInCents(label: Locator): Promise<number> {
    return parseCents(await label.innerText());
  }
}
