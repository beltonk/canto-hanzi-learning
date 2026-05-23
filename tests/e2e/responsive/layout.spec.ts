import { test } from '@playwright/test';
import { ROUTES } from './matrix';
import { assertAllInvariants } from './invariants';

/**
 * Responsive layout invariant matrix.
 *
 * Each test navigates to a route and asserts the five layout invariants.
 * Device profiles are defined in playwright.config.ts; this spec runs
 * on all of them automatically.
 *
 * Baseline screenshots are captured per (route × viewport) under:
 *   tests/e2e/responsive/__screenshots__/<project-name>/<route-slug>.png
 *
 * The screenshot is written on every run (not asserted against a baseline)
 * so reviewers can scan visual changes in a PR without flaky diffs blocking
 * CI on intentional UI tweaks. To enforce strict pixel-diffs, swap
 * `page.screenshot` for `expect(page).toHaveScreenshot(...)`.
 */

for (const route of ROUTES) {
  const slug = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');

  test(`${slug} — layout invariants`, async ({ page }, testInfo) => {
    await page.goto(route, { waitUntil: 'networkidle' });

    await page.waitForTimeout(400);

    await assertAllInvariants(page);

    await page.screenshot({
      path: `tests/e2e/responsive/__screenshots__/${testInfo.project.name}/${slug}.png`,
      fullPage: false,
    });
  });
}
