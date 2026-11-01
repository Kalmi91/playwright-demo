# playwright-demo

[![Playwright Tests](https://github.com/Kalmi91/playwright-demo/actions/workflows/playwright.yml/badge.svg)](https://github.com/Kalmi91/playwright-demo/actions/workflows/playwright.yml)

Playwright E2E test automation demo in TypeScript: Page Object Model, custom
fixtures, one-time auth via `storageState`, flaky-test patterns (wrong vs right),
and GitHub Actions CI (typecheck, push/PR/weekly runs, HTML report artifact).

Target app: [saucedemo.com](https://www.saucedemo.com) — Sauce Labs' public demo
shop. The credentials used (`standard_user` / `secret_sauce`) are printed on its
login page; they are not secrets.

## Architecture

```
playwright.config.ts        retries/trace/reporter config + 2 projects:
                            "setup" (login once) → "chromium" (all tests, pre-authenticated)
pages/
  LoginPage.ts              Page Objects: user-facing locators (getByRole/getByPlaceholder),
  InventoryPage.ts          intent-level methods (login(), addToCart(), sortBy(), openCart(),
  CartPage.ts               remove(), fillCustomerInfo(), finish())
  CheckoutPage.ts
tests/
  fixtures.ts               test.extend() — injects ready-made page objects into every test
  auth.setup.ts             logs in via UI once, saves session to .auth/user.json
  login.spec.ts             tests the login flow itself (opts out of saved session)
  inventory.spec.ts         product list: count, sort by price (both directions), cart badge
  checkout.spec.ts          full flow login → 2 products → checkout → totals → confirmation,
                            plus required-field errors and removing an item from the cart
  flaky-demo.spec.ts        same scenario written flaky (fixed sleep + one-shot read)
                            and stable (web-first assertion) — teaching file
.github/workflows/          CI: npm ci → typecheck → install chromium → test → upload HTML report
                            (runs on push/PR to main and weekly, Mondays 05:23 UTC)
```

## Key decisions

- **User-facing locators** (`getByRole`, `getByPlaceholder`, `data-test`) instead of
  CSS/XPath chains — they survive markup refactors and double as a cheap
  accessibility smoke check.
- **No manual waits anywhere.** Playwright auto-waits on actions and `expect(locator)`
  assertions poll until pass/timeout. The one `waitForTimeout` in the repo lives in
  the *deliberately wrong* flaky demo.
- **Auth once, reuse everywhere.** `auth.setup.ts` logs in through the UI a single
  time and saves `storageState`; every test then starts in a fresh, already
  authenticated browser context. Faster suite, no login-flake multiplication, and
  full test isolation (cart state can't leak between tests).
- **Trace on first retry** + screenshot on failure: a CI failure ships a
  `trace.zip` you can replay locally with `npx playwright show-trace` —
  time-travel DOM snapshots, network, console.

## Run it

```bash
npm install
npx playwright install chromium

npm test               # full suite, headless
npm run test:ui        # UI mode — watch, time-travel debugging
npm run test:headed    # watch the browser do the work
npm run report         # open the last local HTML report (playwright-report/)
npm run typecheck      # tsc --noEmit
```

### Opening the report from CI

Every CI run uploads the HTML report as the `playwright-report` artifact (kept 14 days).
Download it from the run's page, unzip it, and open it with
`npx playwright show-report <unzipped-folder>`.

## Flaky-test exercise

`tests/flaky-demo.spec.ts` contains the same scenario twice:

| Variant | Pattern | Result |
|---|---|---|
| `WRONG` (marked `fixme`) | `waitForTimeout(100)` + one-shot `textContent()` + non-retrying assert | passes or fails depending on machine load |
| `RIGHT` | `await expect(badge).toHaveText('1')` | deterministic |

To watch it flake: change `test.fixme(` to `test(` and run

```bash
npm run test:flaky-hunt -- --trace=retain-on-failure   # --repeat-each=10
npx playwright show-trace test-results/<failing-run>/trace.zip
```

The extra `--trace` flag is needed locally: the config records traces only `on-first-retry`,
and local runs have `retries: 0`, so without it a failure would leave no `trace.zip`.
