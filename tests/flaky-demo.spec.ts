import { test, expect } from './fixtures';

/**
 * Flaky-test teaching file: the same scenario written the WRONG way and the
 * RIGHT way.
 *
 * The wrong variant is marked test.fixme() so CI stays green. To see it flake:
 *   1. change test.fixme(...) to test(...)
 *   2. npm run test:flaky-hunt        (runs this file 10x)
 *   3. open a failure's trace:        npx playwright show-trace test-results/<run>/trace.zip
 *
 * Why the wrong one flakes: a fixed sleep races the UI update — on a fast run
 * the badge is there in 100 ms, on a slow CI runner it isn't. textContent()
 * reads once and the plain expect() never retries, so the test result depends
 * on machine load, not on product behavior.
 */
test.describe('Flaky patterns', () => {
  test.fixme('WRONG: fixed sleep + one-shot read', async ({ page, inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.addToCart('Sauce Labs Backpack');

    await page.waitForTimeout(100); // arbitrary sleep — races the UI update
    const badge = await inventoryPage.cartBadge.textContent(); // one-shot read
    expect(badge).toBe('1'); // non-retrying assertion
  });

  test('RIGHT: web-first assertion auto-retries until the badge appears', async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.addToCart('Sauce Labs Backpack');

    // expect(locator) polls the DOM until it passes or times out —
    // no sleeps, no races, fails only if the product is actually broken.
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });
});
