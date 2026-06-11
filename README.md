# playwright-demo

Playwright E2E test automation demo in TypeScript: Page Object Model, custom
fixtures, one-time auth via `storageState`, flaky-test patterns (wrong vs right),
and GitHub Actions CI with trace/report artifacts.

Target app: [saucedemo.com](https://www.saucedemo.com) — Sauce Labs' public demo
shop. The credentials used (`standard_user` / `secret_sauce`) are printed on its
login page; they are not secrets.

## Architecture

```
playwright.config.ts        retries/trace/reporter config + 2 projects:
                            "setup" (login once) → "chromium" (all tests, pre-authenticated)
pages/
  LoginPage.ts              Page Objects: user-facing locators (getByRole/getByPlaceholder),
  InventoryPage.ts          intent-level methods (login(), addToCart(), sortBy())
tests/
  fixtures.ts               test.extend() — injects ready-made page objects into every test
  auth.setup.ts             logs in via UI once, saves session to .auth/user.json
  login.spec.ts             tests the login flow itself (opts out of saved session)
  inventory.spec.ts         runs pre-authenticated from storageState
  flaky-demo.spec.ts        same scenario written flaky (fixed sleep + one-shot read)
                            and stable (web-first assertion) — teaching file
.github/workflows/          CI: npm ci → install chromium → test → upload HTML report
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
npm run report         # open the last HTML report
npm run typecheck      # tsc --noEmit
```

## Flaky-test exercise

`tests/flaky-demo.spec.ts` contains the same scenario twice:

| Variant | Pattern | Result |
|---|---|---|
| `WRONG` (marked `fixme`) | `waitForTimeout(100)` + one-shot `textContent()` + non-retrying assert | passes or fails depending on machine load |
| `RIGHT` | `await expect(badge).toHaveText('1')` | deterministic |

To watch it flake: change `test.fixme(` to `test(` and run

```bash
npm run test:flaky-hunt   # --repeat-each=10
npx playwright show-trace test-results/<failing-run>/trace.zip
```
