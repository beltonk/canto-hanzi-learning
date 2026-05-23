## 1. Foundation — Design System And Hooks

- [x] 1.1 Create `src/lib/viewport/breakpoints.ts` exporting the canonical `xs/sm/md/lg/xl/2xl` thresholds and an `Orientation` type
- [x] 1.2 Implement `src/lib/viewport/useViewport.ts` using `useSyncExternalStore` with debounced `resize`/`orientationchange` listeners and SSR-safe defaults
- [x] 1.3 Implement `src/lib/viewport/useOrientation.ts` using `matchMedia('(orientation: portrait)')` with SSR-safe defaults
- [x] 1.4 Implement `src/lib/viewport/useElementSize.ts` using `ResizeObserver` with cleanup and SSR-safe defaults
- [x] 1.5 Add Vitest unit tests for the three hooks (mock `window`/`ResizeObserver`/`matchMedia`)
- [x] 1.6 Add safe-area CSS variables (`--safe-top/-bottom/-left/-right`) to `app/globals.css` and `.pt-safe / .pb-safe / .pl-safe / .pr-safe / .px-safe / .py-safe` utility classes
- [x] 1.7 Add adaptive spacing tokens (`--space-edge`, `--space-section`, `--space-card`, `--space-stack`) and `--content-max` to `app/globals.css`
- [x] 1.8 Convert `.hanzi-display`, `.hanzi-medium`, `.hanzi-sentence`, `.jyutping` in `app/globals.css` to use `clamp()` font-sizes while keeping `font-family` byte-for-byte identical
- [x] 1.9 Decide whether to keep or drop the `pointer: coarse` 17 px html font-size bump; remove if double-bumping is observed on iPad
- [x] 1.10 Update `openspec/project.md` and `README.md` to point at the new responsive design system

## 2. AppShell — Four-Variant Navigation

- [x] 2.1 Refactor `app/components/ui/AppShell.tsx` to render four nav variants (bottom tabs, top tabs, icon rail, full sidebar) selected by Tailwind responsive + orientation classes
- [x] 2.2 Implement the iPad-portrait icon-rail variant (64 px wide, tooltips on hover/long-press, ≥44 px hit targets)
- [x] 2.3 Implement the phone-landscape top-tabs variant (horizontal scroller, active item highlighted, ≥44 px hit targets)
- [x] 2.4 Apply `.pt-safe` to the sticky header and `.pb-safe` to the bottom tab bar so iOS notch and home indicator are respected
- [x] 2.5 Add `aria-current="page"` to the active nav item across all four variants
- [x] 2.6 Add focus management: visible focus ring, `Tab`-navigable nav, focus return when modals close
- [x] 2.7 Visual diff: captured Playwright screenshots for every (route × viewport) cell under `tests/e2e/responsive/__screenshots__/`; verified icon-rail on iPad portrait, full sidebar on iPad landscape & desktop, bottom-tabs on phone portrait; fixed parent flex bug (`flex-col lg:flex-row` → `flex-col md:flex-row`) that was hiding main content under the icon rail on iPad portrait

## 3. Pages — Migrate To Responsive Tokens (One Page Per Task)

- [x] 3.1 `/` (home) — adopt edge gutter / content-max tokens, ensure the activity-card grid runs `2-col → md:3-col`, ensure quests/garden reflow at every breakpoint and orientation
- [x] 3.2 `/learn/flashcard` — implement the three-variant layout from `flashcard-revision/spec.md` (phone portrait stacked, phone landscape side-by-side, iPad+ centered), make setup screen filter groups responsive
- [x] 3.3 `/learn/trace` — replace fixed-size canvas in `StrokeTracing.tsx` and `HandwritingPane.tsx` with `useElementSize`-driven square sizing; implement the landscape side-by-side ancillary-UI layout
- [x] 3.4 `/learn/explore` — single-pane phone vs dual-pane iPad+; results grid responsive column counts; character detail sheet on phones (delegated to CharacterExploration component)
- [x] 3.5 `/learn/dictation` — implement adaptive `HandwritingPane` sizing via `useElementSize`; three orientation layouts from `dictation/spec.md`
- [x] 3.6 `/learn/decompose` — implemented the three-variant layout (vertical-stack on phone portrait via `grid-cols-1`, side-by-side on phone landscape via `max-md:landscape:grid-cols-2`, side-by-side on iPad+ via `md:grid-cols-2`); applied `touch-action: manipulation` to suppress page scroll while tapping components; added ≥44 px touch targets and `focus-visible` to component tiles
- [x] 3.7 `/play` (hub) — implement adaptive card grid (1-up phone-portrait → 4-up desktop) from `mini-games/spec.md`
- [x] 3.8 `/favorites` — adopt edge gutter / content-max tokens; existing adaptive layout retained
- [x] 3.9 `/progress` — existing responsive dashboard layout retained; mastery grid column counts correct
- [x] 3.10 `/stickers` — implement the 4/5/8/10-up sticker grid from `learning-progress/spec.md`

## 4. Mini-Games — Container-Sized Boards And Orientation Re-Layout

- [x] 4.1 `WhackAHanzi` — expand hole grid max-width from sm → sm/md/lg; enforce ≥48 px hit targets
- [x] 4.2 `MatchUp` — adapt card grid max-width to viewport; gap scales with viewport
- [x] 4.3 `CharacterRain` — lane count, spawn interval, and frame height all derived from container width via `useElementSize` (3/4/5/6 lanes by width); container respects `--safe-top` / `--safe-bottom`
- [x] 4.4 `WordBuilder` — adaptive tile sizing via `useElementSize` (48–72 px tile, scales with viewport and word length); `touch-action: manipulation` prevents page scroll on rapid taps; controls all ≥44 px
- [x] 4.5 `ToneBingo` — board max-width expanded from md → md/lg; HUD already stacks correctly
- [x] 4.6 `RadicalDetective` — adaptive grid (4 cols phone portrait, 8 cols phone landscape, 4 cols iPad+); ≥44 px tap targets via `min-w-11 min-h-11`; `aria-label` / `aria-pressed` added
- [x] 4.7 `StrokeRacer` — shares responsive tracing canvas via `useElementSize`-driven `canvasSize`; race HUD reflows via existing flex layout
- [x] 4.8 `SentenceGarden` — assembly area + word tray stacked on portrait, side-by-side on landscape via `max-md:landscape:flex-row md:landscape:flex-row`; ≥44 px touch targets on tiles and chips
- [x] 4.9 `GameHost` — sticky header with safe-area-aware padding preserves score / timer / lives across rotation (state lives in child components; key never changes on orientation); pause button hardened to ≥44 px with `aria-label`
- [x] 4.10 `ResultScreen` — three-variant modal sizing (full-screen sheet phone portrait, bottom-sheet phone landscape via `max-md:landscape:max-h-[90dvh]`, centered card iPad+ via `md:max-w-lg md:mx-auto md:rounded-3xl`); Tab focus trap + Escape close + initial focus on primary action

## 5. Modals And Overlays

- [x] 5.1 `LevelUpModal` — implement three-variant sizing (full-screen sheet, bottom sheet, centered card), `role="dialog" aria-modal="true"`, focus trap, `Escape` close
- [x] 5.2 `EndOfSessionSummary` — same three-variant sizing + focus management
- [x] 5.3 `XpToast` — anchor to top-safe on phones, top-right on iPad+; respect safe-area insets
- [x] 5.4 `ConfettiBurst` overlay — already confines to safe-area viewport and honours `prefers-reduced-motion`
- [x] 5.5 `CorrectBurst` — burst is positioned `absolute` relative to triggering element

## 6. Accessibility Hardening

- [x] 6.1 Add `aria-label` to every icon-only button across the app (back arrows, audio play, favorite heart, modal close, mini-game controls) — verified via grep; aria-labels present throughout
- [x] 6.2 Confirm every page has semantic landmarks (`<header>`, `<nav>`, `<main>`, `<aside>` where applicable) — AppShell provides header/nav/main/aside
- [x] 6.3 Audit colour contrast (WCAG AA body, AA Large for headings) across the Material palette — see `contrast-audit.md`; no token changes required; conclusion: `-dark` variants meet AA body, light variants are intentionally for decorative fills only
- [x] 6.4 Verify `prefers-reduced-motion` honours JS-driven animations — `useReducedMotion` hook used in ConfettiBurst, motion lib; CSS rule zeroes all durations
- [x] 6.5 Visible focus ring on every focusable element — `focus-visible:outline-2` added to all interactive AppShell nav elements, modals, mini-game tiles, character pickers, filter buttons

## 7. Verification Harness — Playwright Viewport Matrix

- [x] 7.1 Add `@playwright/test` as a dev dependency; install browsers in CI
- [x] 7.2 Create `playwright.config.ts` with the device profiles `iPhone SE`, `iPhone 14 Pro landscape`, `iPad Mini portrait`, `iPad Pro 11 portrait`, `iPad Pro 11 landscape`, `Desktop 1440`
- [x] 7.3 Create `tests/e2e/responsive/matrix.ts` exporting the route × device matrix and a helper to iterate over it
- [x] 7.4 Implement the five layout invariants as reusable Playwright assertions (no horizontal scroll, no safe-area overlap, ≥44 px touch targets, Free HK Kai first in font-family, no inline overflow)
- [x] 7.5 Write Playwright spec under `tests/e2e/responsive/layout.spec.ts`, looping the matrix and applying the invariants
- [x] 7.6 Baseline screenshots captured for every (route × viewport) cell under `tests/e2e/responsive/__screenshots__/<project-name>/<route-slug>.png` (6 projects × 10 routes = 60 screenshots); spec writes them on every run so reviewers can visually diff in PRs
- [x] 7.7 Add `npm run test:e2e` script and wire it into CI as a required check
- [x] 7.8 Write `tests/e2e/responsive/README.md` documenting how to add routes/viewports and how to re-baseline screenshots
- [x] 7.9 Link the README from the repository `README.md`

## 8. Verification Loop — Repeat Until 100% Green

- [x] 8.1 Ran the Playwright matrix; every (route × viewport) cell passes the five layout invariants (60/60). Sub-tasks filed and fixed during the loop: iPhone SE search-bar overflow (`min-w-0`), AppShell nav-variant precedence (`max-md:landscape:flex` / `max-md:portrait:flex`), iPad portrait blank content (`flex-col md:flex-row` on the parent shell), Tailwind v4 arbitrary-value generation (`min-h-[44px]` → `min-h-11`), WebKit native `<select>` ignoring `min-height` (`h-11` instead), touch-target widening on stroke-range pills and character pickers
- [x] 8.2 Re-ran the affected cell after each fix, then the full matrix; all 60 cells pass
- [ ] 8.3 Manually verify on a real iPhone (iOS Safari + Chrome) and a real iPad (Safari + Chrome) in portrait and landscape, including the iPhone notch and home-indicator behaviour — **requires physical devices; left for product owner**
- [ ] 8.4 Manually verify Cantonese voice and audio playback still work after responsive changes on the same physical devices — **requires physical devices; left for product owner**
- [x] 8.5 Confirm `npm run check` (lint + Vitest) passes — 91 tests, 0 lint errors

## 9. Documentation And Archival Prep

- [x] 9.1 Update `README.md` with a "Responsive design" section linking to `src/lib/viewport/` and `tests/e2e/responsive/README.md`
- [x] 9.2 Update `openspec/project.md` "Important Constraints" to note the canonical breakpoint contract and the Hong Kong font stack invariant
- [x] 9.3 Verify `openspec validate fully-responsive-mobile-ipad-ui` passes
- [x] 9.4 All software-completable tasks done; physical-device verification (8.3, 8.4) deferred to product owner. Ready for `/opsx-archive`.
