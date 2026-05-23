## 1. Foundation — `<PageScaffold>` and chrome-height vars

- [x] 1.1 Add CSS custom properties `--chrome-top` and `--chrome-bottom` to the root layout in `app/globals.css`, with sensible defaults (`--chrome-top: 56px; --chrome-bottom: 0px`).
- [x] 1.2 Update `app/components/ui/AppShell.tsx` to set `--chrome-top` and `--chrome-bottom` per active nav variant (phone-portrait single-row bottom-tab → `72px + safe-bottom`; phone-landscape top-tabs → adds `44px` to top; iPad/desktop sidebars off-axis → `0px` bottom). Apply the values via `style` on the outer wrapper so they cascade to children.
- [x] 1.3 Create `app/components/ui/PageScaffold.tsx` exporting `<PageScaffold primary secondary aside persistKey defaultSelected />` with the named-grid-areas CSS layout described in design D3. Outer height = `calc(100dvh - var(--chrome-top) - var(--chrome-bottom))`.
- [x] 1.4 Implement the secondary tab strip as a fully accessible ARIA tablist (`role="tablist"`/`role="tab"`/`role="tabpanel"`, arrow-key navigation, `Home`/`End` jumps). Non-active panels use the `hidden` attribute, not display-via-class.
- [x] 1.5 Wire `persistKey` to `localStorage` so the selected tab survives reloads; SSR-safe (no `window` access during render).
- [x] 1.6 Add `data-allow-scroll` opt-out attribute support (sets `body[data-allow-scroll="true"]`) for routes that legitimately need page scroll; default off.
- [x] 1.7 Add unit tests at `src/__tests__/PageScaffold.test.tsx` using Vitest + Testing Library covering: zone allocation per breakpoint (mock `useViewport`), tab keyboard nav, persistence, SSR safety (renders without `window`), `aside` only at lg+.

## 2. Navigation — collapse 9 → 5 items

- [x] 2.1 Update `NAV_ITEMS` in `app/components/ui/AppShell.tsx` to the 5-item set: `首頁 / 學習 / 遊戲 / 收藏 / 進度` with the existing color tokens reused for visual continuity.
- [x] 2.2 Update the `isActive` helper so `/learn` matches `/learn/*`, `/play` matches `/play/*`, `/favorites` matches `/favorites*`, `/progress` matches `/progress*` and `/stickers*`, and `/` matches only `/`.
- [x] 2.3 Delete the bottom-tab "Row 2" code path entirely; the bottom-tab variant becomes a single 5-column grid sized so each tab is ≥48 px wide at 360 px viewport.
- [x] 2.4 Resize the icon rail and full sidebar so 5 items fit comfortably and the layout no longer scrolls within the rail itself.
- [x] 2.5 Add an explicit Playwright test that asserts each primary nav link's bounding box is ≥48 px on its smallest side at 360 px viewport.
- [x] 2.6 Run Vitest to confirm no other code (e.g., `app/page.tsx`'s hot-radical chips, the `/play` page) imports `NAV_ITEMS` directly; if any do, refactor to a shared constant.

## 3. New `/learn` hub page

- [x] 3.1 Create `app/learn/page.tsx` rendering inside `<AppShell title="學習" emoji="📚" hideBack bg="indigo">` and `<PageScaffold>`.
- [x] 3.2 Reuse the activity-card visual language from `app/page.tsx` (gradients, emojis, labels) so kids recognise the tiles instantly. Tile order: `查字 → 字卡 → 拆字 → 默書 → 筆順 → 今日要複習`.
- [x] 3.3 Wire the `今日要複習` tile to the existing SRS queue (`getDueCharacters` from `@/lib/progress/srs`) — show the count badge when due > 0; show `🌟 全部溫完` and link to `/learn/explore` when due === 0.
- [x] 3.4 Wrap the six tiles in a `<nav role="navigation" aria-label="學習活動">` landmark with descriptive `aria-label` per tile.
- [x] 3.5 Add the `/learn` route to `tests/e2e/responsive/matrix.ts` (and any other place that lists routes for the matrix).

## 4. Home page (`/`) re-flow

- [x] 4.1 Refactor `app/page.tsx` to use `<PageScaffold>` with `primary` (welcome row + search + 6-tile grid), `secondary` (3-tab strip: 今日要複習 / 今日任務 / 我的花園), and `aside` (lg+ only: same three panels stacked).
- [x] 4.2 Collapse the existing welcome hero into a single horizontal row containing greeting text + status pills (Lv / 🔥 / 💎 / ❤️). Remove the duplicate phone status strip from `AppShell` if the home page now hosts it itself, otherwise dedupe.
- [x] 4.3 Pass `persistKey="home.secondaryTab"` and a `defaultSelected` prop computed from `dueCount > 0 ? '今日要複習' : '今日任務'`.
- [x] 4.4 Verify on iPhone SE portrait (360×640) that the welcome row, search bar, hot-radical chips, and all six activity tiles fit above the fold; tweak spacing tokens (`--space-section`, `--space-card`) if needed.
- [x] 4.5 Verify on iPad Pro landscape (1180×820) that the aside zone shows all three panels stacked with internal scroll on each, and no page scroll.

## 5. `/play` re-flow

- [x] 5.1 Refactor `app/play/page.tsx` to use `<PageScaffold>`. Move the stars summary out of the hero band and into a compact pill in the page header `rightSlot` of `AppShell`.
- [x] 5.2 Replace the variable-height tile grid with a fit-to-viewport grid: 2 cols (xs), 4 cols (sm), 3 cols (md), 4 cols (lg+). Card height = `(availableHeight − rowGaps) / rows`, with a hard minimum of 130 px. Use `useElementSize` on the grid container to recompute on resize.
- [x] 5.3 Confirm all 8 game cards fit above the fold at every matrix viewport.
- [x] 5.4 Add a Playwright test that asserts the bounding box of the *last* game card has its `bottom` ≤ `viewport.height` at every viewport.

## 6. `/progress` re-flow

- [x] 6.1 Refactor `app/progress/page.tsx` to use `<PageScaffold>`.
- [x] 6.2 Move 匯出 / 匯入 / 重設進度 out of the footer card into a new `<SettingsPopover>` opened by a `⚙ 設定` icon-button in the page header `rightSlot`. The popover uses native `<dialog>` with a focus-trap, `Escape` to close, and the existing two-step "再按確認" reset flow.
- [x] 6.3 Build the primary zone as a 1- / 2- / 3-column dashboard (depending on breakpoint) containing summary band + 7-day chart + 今日要複習 CTA.
- [x] 6.4 Build the secondary zone as a 2-tab strip (`📚 我的貼紙` / `🗂 學習狀態`) with internal scroll. The mastery grid moves into the second tab; the existing per-character popover is preserved.
- [x] 6.5 At lg+, move both secondary tabpanels into the `aside` zone as a stacked column so both are visible simultaneously without tabbing.
- [x] 6.6 If the mastery grid contains >200 cells, switch to a virtualised grid (e.g., `react-window` already in deps, else add and wire up) so internal scroll stays at 60 fps.

## 7. `/favorites` re-flow

- [x] 7.1 Refactor `app/favorites/page.tsx` to use `<PageScaffold>`. Shrink the hero band to a single header row (counts + "用字卡複習" CTA) — no full-width gradient hero.
- [x] 7.2 Place the filter chips and the favorites grid in the `primary` zone; the grid scrolls internally when content exceeds the available height (page document does not scroll).
- [x] 7.3 Confirm the empty state still renders centered within the primary zone (not relying on page scroll).

## 8. `/stickers` re-flow

- [x] 8.1 Refactor `app/stickers/page.tsx` to use `<PageScaffold>`. Replace the gradient hero band with a header progress pill (`14 / 24 · 58%`).
- [x] 8.2 Place the sticker grid in the `primary` zone with internal scroll. Empty-state and full-collection callouts move into the `secondary` zone (collapsed by default on mobile, visible in `aside` at lg+).

## 9. New Playwright invariant + matrix updates

- [x] 9.1 Add `assertNoVerticalPageScroll(page)` to `tests/e2e/responsive/invariants.ts` per design D6.
- [x] 9.2 Wire the new invariant into `tests/e2e/responsive/layout.spec.ts` via the existing `(route × viewport)` loop. Honour the `data-allow-scroll="true"` opt-out.
- [x] 9.3 Add `/learn` to the routes list in `tests/e2e/responsive/matrix.ts`.
- [x] 9.4 Run `npm run test:e2e -- --update-snapshots` on a clean checkout to regenerate the visual baselines for `/`, `/learn`, `/play`, `/progress`, `/favorites`, `/stickers` across the 6-device matrix; commit the new PNGs.
- [x] 9.5 Update `tests/e2e/responsive/README.md` to document the new vertical-scroll invariant, the `data-allow-scroll` opt-out mechanism, and the baseline regeneration steps for this change.

## 10. Settings popover unit tests + accessibility

- [x] 10.1 Add `src/__tests__/SettingsPopover.test.tsx` covering: opens on button click, traps focus on `Tab`/`Shift+Tab`, closes on `Escape`, restores focus to trigger, two-step reset confirmation, export and import success paths (mock the file IO).
- [x] 10.2 Add a Playwright test that opens the settings popover from `/progress` and verifies focus-trap + `Escape` behaviour on a real browser.
- [x] 10.3 Verify with axe-core (already in deps) that the home page, learn hub, and progress page have no critical or serious accessibility violations.

## 11. Migration plan + cleanup

- [x] 11.1 Add an env-flag gate `NEXT_PUBLIC_NEW_NAV` that toggles between the legacy 9-item nav + old page chrome and the new 5-item nav + `<PageScaffold>` (per design D, Phase 1).
- [x] 11.2 Land Phase 1 (scaffold + nav skeleton behind the flag) in a small first PR, with the flag default-off; confirm the existing `npm run test:e2e` suite is green.
- [x] 11.3 Land Phase 2 (`/learn` hub + home re-flow) behind the flag in a second PR; regenerate baselines for `/` and `/learn`.
- [x] 11.4 Land Phase 3 (`/play`, `/progress`, `/favorites`, `/stickers` re-flow) one page per PR; each PR regenerates that page's baselines and turns on the new vertical-scroll invariant for that route.
- [x] 11.5 Land Phase 4 cleanup: flip `NEXT_PUBLIC_NEW_NAV` default-on, remove the legacy 9-item nav code path and the bottom-tab Row 2 code, remove the flag, run the full matrix.
- [x] 11.6 Add a short release note in `README.md` describing the navigation change and how to opt back to the legacy behaviour during the migration window (env var).

## 12. Verification sweep

- [x] 12.1 Run `npm run check` (Vitest + lint + typecheck) and ensure zero failures.
- [x] 12.2 Run `npm run test:e2e` and ensure every (route × viewport) cell passes all six invariants.
- [x] 12.3 Manually verify on a real iPad (portrait + landscape) and a real iPhone (portrait + landscape) that no page scrolls vertically and that all primary content is visible above the fold.
- [x] 12.4 Verify with VoiceOver on iOS that the new `/learn` hub announces as a `navigation` landmark named `學習活動` and that the secondary tab strips on `/` and `/progress` are reachable and operable via swipe-up/swipe-down rotor gestures.
- [x] 12.5 Verify the audio engine (`src/lib/audio/AudioEngine.ts`) and the iPad audio-unlock path still work after the navigation refactor — no changes to those files, but confirm no regression by tapping a flashcard's TTS button on iPad.
- [x] 12.6 Run `openspec validate compact-nav-and-fit-to-viewport --strict` (or equivalent) and confirm the change is archive-ready before the final cleanup PR is merged.
