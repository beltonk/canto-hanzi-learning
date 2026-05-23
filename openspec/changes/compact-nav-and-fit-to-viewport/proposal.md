## Why

The current product surfaces nine first-class destinations in the primary navigation (`首頁 / 查字 / 字卡 / 拆字 / 默書 / 筆順 / 遊戲 / 收藏 / 進度`). That overflow forces a two-row bottom tab bar on phones, an over-tall icon rail on iPad portrait, and an information-dense sidebar on desktop — yet beginners still report it is hard to know where to go first. At the same time every primary page (`/`, `/play`, `/progress`, `/favorites`, `/stickers`, `/learn/*`) ships content that exceeds one viewport height in every form factor we ship, so the most important controls (search, activity cards, due-review CTA, game grid, settings) are routinely below the fold on phones and on iPad landscape.

The two problems compound: kids and parents miss the search bar, miss "今日要複習", and miss the quests because they are pushed below the fold by the hero band, while the bottom nav simultaneously eats vertical space with nine targets. We need to (a) collapse the primary nav into a small, predictable set of destinations and (b) re-flow every primary page so the highest-priority actions live above the fold on every supported (form factor × orientation) cell defined in our canonical breakpoint contract.

## What Changes

- **BREAKING — Primary nav is reduced from 9 items to 5**: `首頁 / 學習 / 遊戲 / 收藏 / 進度`. The five learning activities (`查字, 字卡, 拆字, 默書, 筆順`) move from being top-level nav entries to being **children of a new `學習` hub**. All four nav variants (bottom-tabs, top-tabs, icon-rail, full-sidebar) collapse to a single row / single column, eliminating the phone-portrait two-row bottom bar entirely.
- **NEW `/learn` hub page** — dedicated landing for the five learning activities (查字 · 字卡 · 拆字 · 默書 · 筆順) rendered as a one-screen 2×3 (phone) / 3×2 (tablet) / 5-up (desktop) tile grid with the daily-review CTA pinned to the bottom of the visible region.
- **NEW page-fit layout primitive** (`AppShell` + a `<PageScaffold>` wrapper). Pages opt into a "fit-to-viewport" layout where the page is a fixed-height grid (`100dvh` minus chrome) with named zones: `primary` (always above the fold), `secondary` (tabs / collapsible / horizontally-scrollable), and an optional `aside` for desktop/iPad-landscape. Vertical page scrolling is replaced by region-internal scrolling for intrinsically long lists (favorites grid, sticker grid, mastery grid).
- **Home page (`/`) re-flow** — primary zone shows the welcome hero (single compact row), the search bar, and the 6-activity grid. Secondary zone (tab strip below the fold of the *grid*, but still inside the same 100dvh region) hosts 「今日要複習」, 「今日任務」, and 「花園」; the tab strip swaps content without scrolling the page. Status pills (Lv / XP / 🔥 / ❤️) collapse into the top header to remove the duplicated phone status strip.
- **`/play` re-flow** — game grid sized so all 8 games are visible above the fold at every supported viewport (3×3 with the stars-summary card occupying one cell on phone portrait; 4×2 on iPad landscape; 4×2 on desktop). Stars summary becomes a compact corner pill, not a hero band.
- **`/progress` re-flow** — top zone shows level/XP/streak summary + 7-day bar chart + due-review CTA in a 3-column dashboard layout (1-column on phone portrait with the bar chart below the headline tiles); secondary zone holds stickers + mastery grid in a tabbed region with internal scrolling. Settings (export/import/reset) move into a 「⚙ 設定」 popover anchored on the page header, not a footer card.
- **`/favorites`, `/stickers` re-flow** — hero band shrinks to a single status row; the grid becomes the page's primary scroll surface (only the grid scrolls, page chrome stays put).
- **Active-state inheritance** — `學習` tab is `aria-current="page"` for any `/learn/*` route; `遊戲` is current for any `/play/*` route. Deep links to `/learn/explore?...` continue to work.
- **Tests** — add a Playwright invariant `assertNoVerticalPageScroll` that fails if `document.documentElement.scrollHeight > window.innerHeight + 1` on every (route × viewport) cell of the existing 6-device matrix, with a per-route allowlist for routes whose content is intrinsically a long list (the `secondary` zone is allowed to scroll, but the page document is not). Add Vitest unit tests for the new `<PageScaffold>` zone allocator.
- **No regressions** — every existing `tests/e2e/responsive/layout.spec.ts` invariant (no horizontal scroll, safe-area, touch targets ≥44 px, HK font first, no inline overflow) continues to pass on every cell.

## Capabilities

### New Capabilities
- `learn-hub`: A dedicated `/learn` landing page that groups the five learning activities, surfaces the daily-review CTA, and renders within a single viewport on every supported device.

### Modified Capabilities
- `ux-design`: Add the 5-item primary navigation requirement (replacing the 9-item structure) with the `學習` aggregator and active-state inheritance rules; require the page-fit grid primitive on every primary route; tighten the home-page playground-map requirement so its primary zone (search + 6 activity cards) fits above the fold at the smallest supported viewport.
- `viewport-verification`: Add the `assertNoVerticalPageScroll` invariant alongside the existing five invariants; specify the per-route allowlist mechanism for intrinsically-long content; require the new home, learn-hub, play, progress, favorites, and stickers screenshots to be regenerated for the 6-device matrix.
- `responsive-design-system`: Document the `<PageScaffold>` layout primitive (primary / secondary / aside zones with internal scrolling for `secondary` and `aside`) and the `100dvh - chrome` height contract that all primary pages must use.
- `learning-progress`: Restructure progress page presentation (3-column dashboard at md+, settings move to header popover, stickers and mastery move into a tabbed secondary region with internal scroll) — capability behaviour unchanged, but the rendering requirements change.
- `mini-games`: Adjust the `/play` hub layout requirement (no hero band; compact stars pill; 8-tile grid fits above the fold at every supported viewport).

## Impact

- **Affected code**:
  - `app/components/ui/AppShell.tsx` — collapse 9-item nav to 5 items across all four variants; active-state inheritance helper.
  - `app/page.tsx` — re-flow into `<PageScaffold>` with primary/secondary tab strip.
  - `app/play/page.tsx` — drop hero band, switch to compact corner pill + fit-to-viewport tile grid.
  - `app/progress/page.tsx` — 3-column dashboard, header-anchored settings popover, tabbed stickers/mastery region.
  - `app/favorites/page.tsx`, `app/stickers/page.tsx` — shrink hero, scope scroll to grid.
  - `app/learn/page.tsx` — **NEW** learn hub page.
  - `app/components/ui/PageScaffold.tsx` — **NEW** layout primitive.
  - `app/globals.css` — `--chrome-top` / `--chrome-bottom` CSS vars exposed for child pages.
- **Tests**:
  - `tests/e2e/responsive/invariants.ts` — add `assertNoVerticalPageScroll`.
  - `tests/e2e/responsive/layout.spec.ts` — wire new invariant; add `/learn` route to the matrix; refresh baselines.
  - `src/__tests__/PageScaffold.test.tsx` — **NEW** unit tests for zone allocation and chrome-height calculation.
- **Specs**: New `learn-hub` spec; deltas to `ux-design`, `viewport-verification`, `responsive-design-system`, `learning-progress`, and `mini-games`.
- **No backend/data impact**: this is a presentation-layer change. Storage shape, audio engine, font stack, breakpoint constants, and game registry are untouched.
- **Migration / deep-link safety**: existing URLs continue to resolve. The five `/learn/<activity>` routes remain at the same paths and continue to be deep-linkable from quests, due-review CTAs, favorites, and external bookmarks. The new `/learn` hub is purely additive.
