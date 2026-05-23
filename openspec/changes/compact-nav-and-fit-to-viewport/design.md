## Context

The app today targets six device cells defined by `tests/e2e/responsive/matrix.ts` (iPhone SE portrait, iPhone landscape, iPad mini portrait, iPad Pro portrait, iPad Pro landscape, desktop 1440). Every primary route renders inside `AppShell`, which already handles four navigation variants (bottom-tabs, top-tabs, icon-rail, full-sidebar) and exposes safe-area inset CSS variables.

Two structural problems are visible in the code today (see `app/components/ui/AppShell.tsx` and `app/page.tsx`):

1. `NAV_ITEMS` is a 9-tuple. On phone portrait that overflows the standard one-row bottom tab pattern and is rendered as two rows totalling **136 px** of vertical chrome (72 + 64). Cognitive load is high (kids cannot remember 9 destinations) and vertical real-estate is scarce.
2. The home page composes 7 stacked sections (hero, search, activities, today's review, quests, garden, plus header status strip). At 360×640 px (iPhone SE portrait) only the hero and the top of the search bar are above the fold; the activity grid — the actual product — is below.

The audio engine (`src/lib/audio/AudioEngine.ts`), the canonical breakpoint constants, the `Free HK Kai` font stack, and the storage shape are all in-bounds **untouchable** during this work (per `openspec/project.md` constraints).

## Goals / Non-Goals

**Goals:**
- Reduce cognitive load: a child can name every primary destination after one viewing.
- Every primary route fits its highest-priority controls above the fold on iPhone SE portrait (360×640) and iPhone landscape (568×320), and renders without page-level scrolling on iPad portrait (820×1180), iPad landscape (1180×820), and desktop (1440×900).
- Long lists (favorites, stickers, mastery, due-review chip cloud) become scrollable **regions inside** the page rather than scrolling the page itself, so global chrome (header, nav) never moves.
- All five existing Playwright invariants continue to pass on every (route × viewport) cell. Add a sixth invariant for vertical scroll.
- Deep links (`/learn/<activity>?...`) and existing keyboard / focus / screen-reader semantics continue to work.

**Non-Goals:**
- Redesigning individual learning activities (`StrokeTracing`, `FlashcardRevision`, etc.). Their inner UI is out of scope; we only re-host their entry points.
- Changing the storage schema, audio engine, font stack, breakpoint constants, or character data model.
- Localising into Simplified Chinese or English. Strings stay 繁體中文 (zh-HK).
- Building a generic responsive grid library. We add **one** scaffold component, not a framework.

## Decisions

### D1 — Five-item primary nav

**Decision:** Replace the 9-item `NAV_ITEMS` with a 5-item array:

```
首頁 (/) | 學習 (/learn) | 遊戲 (/play) | 收藏 (/favorites) | 進度 (/progress)
```

The icon-rail, top-tabs, full-sidebar, and bottom-tab variants all render exactly five entries, eliminating the second row in the bottom-tab variant. `aria-current="page"` matches sub-routes by prefix, so `/learn/explore` highlights the `學習` tab.

**Alternatives considered:**
- *Keep 9 items but improve grouping.* Rejected: still hits the 2-row bottom bar problem and still has too many destinations for a primary-school user.
- *4 items (drop `收藏` into `進度`).* Rejected: favorites is a frequently-visited surface, has its own deep-link patterns from games, and merging would sacrifice both discoverability and the "❤️ count" badge as a primary signal.
- *6 items (add `貼紙簿`).* Rejected: stickers is a sub-surface of progress; promoting it crowds the bar again.

### D2 — `/learn` hub instead of nested nav

**Decision:** A new `/learn` page acts as the single landing for the 5 learning activities. Visiting `/learn/<x>` continues to render the activity directly (no redirect, no breaking change). The Hub renders a 6-tile grid: 5 activity tiles + 1 "今日要複習" tile that deep-links the flashcard with the SRS-due character list.

**Alternatives considered:**
- *Hover/long-press menu off the `學習` tab.* Rejected: long-press menus are flaky on mobile Safari and conflict with our "tap once" interaction language for kids.
- *Modal sheet that opens from the `學習` tab.* Rejected: modals are an extra interaction step and break browser back-button intuition.

### D3 — `<PageScaffold>` layout primitive

**Decision:** Introduce one wrapper component used by every primary page, with three well-typed children slots:

```tsx
<PageScaffold
  primary={...}     // always above the fold
  secondary={...}   // optional, rendered as a tab strip / collapsible / horizontally-scrollable region
  aside={...}       // optional, rendered only at lg+ as a right-rail column
/>
```

Implementation:
- The component sets its own root height to `calc(100dvh - var(--chrome-top, 56px) - var(--chrome-bottom, 0px))` and uses `display: grid` with named template areas that change at the canonical breakpoints (`xs/sm` → vertical stack with `secondary` as a tab strip; `md` → 2-column with `aside` hidden; `lg+` → 3-column with `aside`).
- `primary` is always assigned the largest area and `min-height: 0` so flex children can shrink correctly.
- `secondary` is a `<div role="region">` whose vertical overflow is `auto` and which carries `overscroll-behavior: contain` so its scroll never bleeds into the page.
- `aside` (lg+) is a `<aside aria-label="輔助">` with the same internal-scroll contract.

`AppShell` exports `--chrome-top` and `--chrome-bottom` CSS custom properties so `<PageScaffold>` can compute the available height without measuring the DOM. Top-tabs (phone landscape) add 44 px to `--chrome-top`; bottom-tabs (phone portrait) add 72 px to `--chrome-bottom` (one-row, post-D1); icon rail and full sidebar contribute 0 because they are off-axis.

**Alternatives considered:**
- *Per-page bespoke flex layouts.* Rejected: that is what we have today, and what produced the inconsistency we are solving.
- *Adopt a third-party grid lib (e.g. `react-grid-layout`).* Rejected: too heavy for one component; we only need three named regions.

### D4 — Home page section priority

**Decision:** The home page primary zone contains, in order, the welcome line + status pills (one horizontal row), the search bar (with hot-radical chips inline), and the 6-tile activity grid. The secondary zone is a 3-tab strip:

```
[ 📖 今日要複習 (n) ] [ 🎯 今日任務 ] [ 🌱 我的花園 ]
```

On phone portrait the secondary tab strip occupies the lower third of the available height; on iPad portrait it remains a tab strip but the grid expands; on lg+ the `aside` slot hosts the same three panes as a stacked column ("Today's review on top, quests in the middle, garden at the bottom") so all three are visible without tabbing.

**Rationale:** This matches the user's request to prioritize the highest-value action — finding/learning a character — while keeping daily-engagement elements one tap away. The data shows quests and garden are aspirational/secondary; review is daily but small.

### D5 — Settings popover (progress page)

**Decision:** Move 「匯出 / 匯入 / 重設進度」 out of the page footer into a compact 「⚙ 設定」 button anchored top-right of the progress page header. Tapping it opens a popover (`<dialog>` with `role="dialog"`) containing the three actions. This frees ~120 px of vertical space on every viewport.

**Alternatives considered:**
- *Move to a global settings page.* Rejected: the actions are progress-specific (export current progress, reset progress); a global settings page is out of scope for this change.

### D6 — Vertical-scroll invariant + per-route allowlist

**Decision:** Add `assertNoVerticalPageScroll(page)` to `tests/e2e/responsive/invariants.ts`:

```ts
export async function assertNoVerticalPageScroll(page: Page) {
  const probe = await page.evaluate(() => {
    const docH = document.documentElement.scrollHeight;
    const winH = window.innerHeight;
    return { overflow: docH > winH + 1, docH, winH };
  });
  expect(probe.overflow,
    `vertical page scroll detected: docH=${probe.docH} winH=${probe.winH}`).toBe(false);
}
```

Since the layout primitive moves long content into internal-scroll regions, the invariant becomes a hard rule for **every** route in the matrix — no allowlist is required. We will add the invariant as opt-in per route initially (default-on for `/`, `/learn`, `/play`, `/progress`, `/favorites`, `/stickers`) and assert it via the existing `layout.spec.ts` loop. Activity pages (`/learn/<x>`) already rely on `fillHeight` and stay opt-in.

**Trade-off:** if a future page legitimately needs to scroll (e.g., a multi-page article), it can opt out by setting `data-allow-scroll="true"` on the `<body>` and the invariant will skip that page.

### D7 — Active-state inheritance

**Decision:** `isActive(href, pathname)` is updated so `/learn` matches `/learn/*` (already true), `/play` matches `/play/*` (already true), and the **only** time `首頁` is active is when `pathname === '/'`. Status pills in the sidebar/icon-rail/header are computed once, in `AppShell`, and exposed to children — they no longer re-fetch storage on every page mount.

### D8 — Visual continuity

**Decision:** No new colors, fonts, or motion primitives are introduced. The change re-uses the existing palette / mascots / motion system documented in `ux-design`. The `Free HK Kai` font stack invariant continues to be enforced by `assertHKFontFirst`.

## Risks / Trade-offs

- **[R1] Breaking primary nav muscle memory.** Existing users' fingers know the bottom-bar slot positions for `查字`, `字卡`, etc. → **Mitigation:** Keep all five learning-activity URLs unchanged; add a one-time onboarding tooltip on first visit after deploy ("學習活動已搬到「學習」分頁") that auto-dismisses; the `/learn` hub uses the same colors and emojis so visual recognition transfers.
- **[R2] Tab-strip on secondary zone hides content from screen readers.** → **Mitigation:** Use a real ARIA tablist (`role="tablist"`, `role="tab"`, `aria-controls`, `aria-selected`) with arrow-key navigation; non-active tabpanels are `hidden` (not `display:none`-via-class) so AT can tab into them.
- **[R3] Internal-scroll regions can feel "trapped" on iOS without overscroll-behavior support.** → **Mitigation:** Use `overscroll-behavior: contain`; iOS Safari 16+ supports it. Fallback: explicit touch-action and a scroll-fade indicator on the region.
- **[R4] `dvh` viewport units are still wonky on some Android Chromes when the URL bar shrinks.** → **Mitigation:** We already use `min-h-dvh` elsewhere; the scaffold uses `100dvh` for height. Fall back is OK because the page chrome is sticky/fixed and content uses `min-h-0` — content shrinks rather than overflows when viewport changes.
- **[R5] Adding `/learn` route invalidates the existing screenshot baseline matrix.** → **Mitigation:** This is expected; tasks include regenerating the 6-device baselines once UI lands, and the PR description must call out the baseline diff for review.
- **[R6] Aside column at lg+ may feel empty on pages without natural secondary content.** → **Mitigation:** `aside` is optional; pages opt in only when they have something useful (home, progress). Play / favorites / stickers omit it.
- **[R7] iPad portrait icon rail at 64 px wide, with 5 items, may make individual targets larger and the rail look sparse.** → **Mitigation:** Add a single status pill (Lv) under the rail to balance the rail visually; total rail height stays well under 100dvh.
- **[R8] Internal-scroll regions can break the existing `assertNoSafeAreaOverlap` invariant if a region's content sits over the bottom safe area.** → **Mitigation:** The scaffold reserves `--safe-bottom` outside the secondary region; we add a unit test that verifies the scaffold's outer container honours both safe-area insets.

## Migration Plan

1. **Phase 1 — Scaffold + nav (no-op visual change behind a flag).**
   - Add `<PageScaffold>` and unit tests; do not yet wire it into pages.
   - Update `NAV_ITEMS` to 5 items; add `/learn` route as a thin redirect to `/` initially. (Behind `NEXT_PUBLIC_NEW_NAV=1`.)
   - Snapshot regression: confirm existing screenshots unchanged when the flag is off.

2. **Phase 2 — `/learn` hub + home re-flow.**
   - Build `/learn` page using the scaffold.
   - Re-flow `/`.
   - Update Playwright matrix to include `/learn`; regenerate baselines.

3. **Phase 3 — `/play`, `/progress`, `/favorites`, `/stickers` re-flow.**
   - Migrate one page at a time; each PR re-generates that page's screenshot baselines for the 6-device matrix and adds the vertical-scroll invariant for that route.

4. **Phase 4 — Remove flag + cleanup.**
   - Remove old 9-item `NAV_ITEMS` code path; remove flag.
   - Delete the dead bottom-tab "Row 2".
   - Run full Vitest + Playwright matrix; review screenshot diffs as the rollback gate.

**Rollback strategy:** flip `NEXT_PUBLIC_NEW_NAV` back to `0` to restore 9-item nav and old page chrome (Phase 1–2 only). After Phase 4 the rollback is a `git revert` of the cleanup PR.

## Open Questions

- **OQ1:** Should the `/learn` hub host the 8 mini-games as well, making `/play` redundant? **Working answer:** No. Games are a separate emotional context; keeping them on a peer tab keeps the cognitive model "study vs play" clean.
- **OQ2:** Should the home page secondary tab-strip remember the last-selected tab across sessions? **Working answer:** Yes — persist to `localStorage` under `home.secondaryTab`, default to `今日要複習` if there are due cards else `今日任務`.
- **OQ3:** On phones the bottom-tab tap area becomes ~75 px wide per slot (5 slots in 375 px). That clears the 44 px minimum but we want to confirm against the existing soft-warning `assertTouchTargets`. **Working answer:** add an explicit Playwright test that asserts ≥48 px width for primary nav links, since we can guarantee that with 5 items.
- **OQ4:** Does the popover settings dialog need an `inert` polyfill on older Safari? **Working answer:** target Safari 16+; older versions get a normal `<dialog>` with manual focus trap (already present in the project's modal helper).
