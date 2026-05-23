## Context

The app is a Next.js 16 App-Router PWA-style learning tool for HK P1–P6 students. Its current responsive story is mobile-first Tailwind utilities plus a single `lg:` (≥1024 px) sidebar break. That covers desktop and iPad landscape, but two large user segments are not handled well:

- **Phones (~360–430 px portrait, ~667–932 px landscape)**: bottom tab bar collapses to a 5+4 grid; landscape mode is unusable because the header (56 px) + bottom tab bar (~140 px) consume nearly half of a 375 px landscape height. Games with fixed pixel canvases (e.g. WhackAHanzi grid, tracing 320 px square) either overflow or shrink illegibly.
- **iPad in portrait or split-view (~768–1024 px)**: falls into the mobile branch because `lg:` is 1024 px. The whole page renders with the bottom tab bar instead of the sidebar even though there is ample horizontal space, and learning canvases stay small.

The Chinese font stack (`Free HK Kai` for HK EDB chars, `LXGW WenKai TC` for full-coverage Kaiti fallback, Noto Serif/Sans TC, PMingLiU) is non-negotiable: it is tuned specifically to render the Hong Kong stroke conventions students are tested on. Any change MUST preserve this stack and the existing per-utility classes (`font-chinese`, `hanzi-display`, `hanzi-medium`, `hanzi-sentence`).

Stack: Next.js 16, React 19, Tailwind CSS 4 (CSS-variables-based, no `tailwind.config.js`), TypeScript strict. Tests today are Vitest + Testing Library; there is no E2E harness.

## Goals / Non-Goals

**Goals:**
- A single shared breakpoint vocabulary used by every page and component, mapped 1:1 to Tailwind's `sm/md/lg/xl/2xl` plus orientation tokens.
- Every page and every mini-game renders correctly (no overflow, no clipping, no overlap, ≥44 px tap targets, content within safe areas) in **portrait and landscape** on:
  - Phone (~360–430 px)
  - iPad mini / iPad portrait (~744–820 px)
  - iPad landscape / iPad Pro (~1024–1366 px)
  - Desktop (≥1280 px)
- Navigation chrome that *adapts to form factor and orientation*, not just width.
- Fluid Chinese typography sized with `clamp()` while keeping the existing font stack intact.
- Safe-area-inset awareness on iOS (notch / home indicator) and Android (gesture bar).
- Automated viewport-matrix verification gating merges (Playwright) so regressions are caught and the requirement to "verify every page in every orientation" is enforced by CI, not by human memory.
- Preserve existing learning logic, audio engine, gamification, SRS, content, and font stack.

**Non-Goals:**
- New learning features, new games, new content.
- New audio behaviour (the recently-fixed iPad audio path stays unchanged).
- Switching CSS frameworks or migrating away from Tailwind.
- Adding a tailwind.config.js file (Tailwind 4's CSS-variable theme is the project convention; we extend tokens via `@theme inline`).
- Dark-mode visual polish (tokens stay defined; we don't re-design dark mode here).
- Server-side responsive rendering / SSR viewport detection — we use CSS first, JS hooks only where layout cannot be expressed in CSS alone.

## Decisions

### 1. Breakpoint contract

Adopt this canonical contract and document it once in `src/lib/viewport/breakpoints.ts`:

| Token | Min width | Typical device                  | Tailwind synonym |
|-------|-----------|---------------------------------|------------------|
| `xs`  | 0         | Phone portrait                  | (default)        |
| `sm`  | 480 px    | Phone landscape                 | `sm:`            |
| `md`  | 768 px    | iPad portrait, iPad split-view  | `md:`            |
| `lg`  | 1024 px   | iPad landscape, small laptop    | `lg:`            |
| `xl`  | 1280 px   | Desktop                         | `xl:`            |
| `2xl` | 1536 px   | Large desktop                   | `2xl:`           |

Plus orientation utilities `portrait:` and `landscape:` (Tailwind built-ins, just enforced as part of the contract).

**Why these values**: They line up with Tailwind defaults so existing utility classes keep working, and they put iPad-portrait inside `md` (where it gets *some* tablet treatment) rather than the mobile default it falls into today.

**Alternatives considered**: Custom breakpoints (e.g., 360/740/1100). Rejected because they break every existing `sm:`/`md:`/`lg:` usage in the codebase and add cognitive overhead.

### 2. Navigation as a function of (form factor, orientation), not just width

`AppShell` will render one of four nav variants, chosen by a CSS-first decision tree with one JS-driven fallback:

| Variant       | Rendered when                              | Why                                                                |
|---------------|--------------------------------------------|--------------------------------------------------------------------|
| Bottom tabs   | `xs` portrait (phones)                     | Familiar mobile pattern; thumb-reachable.                          |
| Top tabs      | `xs/sm` landscape (phones in landscape)    | Reclaims vertical pixels for the canvas/game area.                 |
| Icon rail     | `md` portrait (iPad portrait, split-view)  | 64-px-wide sidebar; saves horizontal space vs full sidebar.        |
| Full sidebar  | `lg+` (iPad landscape, desktop)            | Existing behaviour; full labels + status pills.                    |

Decision is expressed via Tailwind responsive classes (`hidden md:portrait:flex lg:hidden`, etc.); no JS resize listeners required for the nav itself.

**Alternative**: Persistent bottom tabs everywhere. Rejected — wastes 140 px on iPad portrait where students need that space for hanzi canvases.

### 3. Container-sized canvases (no fixed pixels)

For `StrokeTracing`, `HandwritingPane`, and every mini-game board, the canvas size becomes:

```
side = clamp(MIN, min(containerWidth, containerHeight - chromeOffset), MAX)
```

Implemented with a `useElementSize()` hook (ResizeObserver-based, SSR-safe) instead of `window.innerWidth`. Aspect ratio held square via `aspect-square` + `max-h-full` in a flex parent. Pen/touch coords scale with the canvas via existing `getBoundingClientRect()` math.

**Alternative**: CSS-only sizing via `aspect-ratio`. Works for visual size but doesn't propagate to the WebGL/Canvas2D drawing buffer; we need the JS hook so the bitmap matches CSS pixels at the device's DPR.

### 4. Fluid Chinese type via `clamp()` — font-family unchanged

Replace pixel-pinned classes with `clamp()`:

```css
.hanzi-medium {
  font-family: 'Free HK Kai', 'LXGW WenKai TC', var(--font-serif-tc), var(--font-sans-tc), 'Noto Serif TC', 'PMingLiU', serif !important;
  font-size: clamp(56px, 8vw, 96px);
  line-height: 1.2;
}
```

Same for `hanzi-display`, `hanzi-sentence`, `jyutping`. **The `font-family` property is byte-for-byte identical to today's CSS**, guaranteeing stroke rendering parity. The Free HK Kai TTF + LXGW WenKai webfont are not touched.

**Alternative**: Tailwind utility classes per breakpoint (`text-5xl md:text-6xl lg:text-7xl`). Rejected — produces stair-step jumps between breakpoints, looks worse on intermediate viewports (iPad mini), and requires touching every component.

### 5. Safe-area insets via Tailwind plugin-free CSS variables

Add CSS:

```css
:root {
  --safe-top:    env(safe-area-inset-top,    0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left:   env(safe-area-inset-left,   0px);
  --safe-right:  env(safe-area-inset-right,  0px);
}
```

Plus `@layer utilities` shims `.pt-safe`, `.pb-safe`, `.pl-safe`, `.pr-safe`, `.px-safe`, `.py-safe`. The sticky header, bottom tab bar, and full-screen game canvases consume these. Already-set `viewport-fit: cover` in `app/layout.tsx` is what lets these env vars resolve to non-zero on iOS — no change required there.

### 6. Hooks: `useViewport`, `useOrientation`, `useElementSize`

Three small SSR-safe hooks under `src/lib/viewport/`:

- `useViewport()` → `{ width, height, breakpoint: 'xs'|'sm'|'md'|'lg'|'xl'|'2xl' }`, debounced 120 ms.
- `useOrientation()` → `'portrait' | 'landscape'`, driven by `matchMedia('(orientation: portrait)')`.
- `useElementSize(ref)` → `{ width, height }` from a `ResizeObserver`.

All three return `null`/sensible defaults on the server and use `useSyncExternalStore` to avoid hydration mismatches.

**Why hooks at all when CSS exists**: Some decisions cannot be made in CSS — e.g., WhackAHanzi computes the number of holes per row, CharacterRain computes spawn rate, StrokeTracing sets the drawing buffer's pixel size. These need numbers, not media queries.

### 7. Automated verification: Playwright viewport matrix

Add `@playwright/test` as dev dependency, plus `tests/e2e/responsive/`:

- One spec per top-level route (`/`, `/learn/explore`, `/learn/flashcard`, `/learn/decompose`, `/learn/dictation`, `/learn/trace`, `/play`, each game id, `/favorites`, `/progress`, `/stickers`).
- A viewport matrix runner iterates 6 device profiles:
  - `iPhone SE` portrait + landscape
  - `iPad Mini` portrait
  - `iPad Pro 11` portrait + landscape
  - `Desktop 1440`
- Per (route × viewport) it asserts these invariants:
  1. `document.documentElement.scrollWidth === window.innerWidth` (no horizontal scroll).
  2. No element overlaps the safe-area or the bottom tab bar.
  3. Every interactive element has `getBoundingClientRect()` ≥44×44 px after layout.
  4. The Chinese display element's computed `font-family` starts with `Free HK Kai`.
  5. Screenshot diff against a baseline (visual regression).
- CI: `npm run test:e2e` runs the matrix headlessly; failures block merge. Baseline screenshots checked into `tests/e2e/responsive/__screenshots__/`.

**Alternative**: Manual QA checklist. Rejected — the spec explicitly says "repeat verification test, and stop only when it is 100% done"; only an automated matrix gives that loop teeth.

### 8. Modal sizing strategy

`LevelUpModal`, `EndOfSessionSummary`, `ResultScreen`, `ConfettiBurst` overlay, `XpToast` adopt the pattern:

- `xs` (phone portrait): full-screen sheet, takes safe-area into account.
- `sm` portrait + landscape: sheet from bottom, max-height `min(90dvh, 600px)`.
- `md+`: centered card, `max-w-md lg:max-w-lg`, backdrop blur, focus trap with `inert` on the rest of the page.

All modals gain `role="dialog" aria-modal="true"`, keyboard `Esc` close, and focus return to invoking element.

## Risks / Trade-offs

- **[Risk] Layout regressions across 10 routes + 8 games.** → Mitigation: the Playwright matrix is part of the merge gate (`npm run check` chained or a separate `test:e2e`); baselines reviewed page-by-page in the implementation tasks.
- **[Risk] Font rendering regressions if Chinese type classes change.** → Mitigation: we touch only `font-size` and `line-height`; `font-family` strings stay byte-for-byte identical and are asserted by a Playwright invariant.
- **[Risk] Performance hit from JS-driven sizing in games.** → Mitigation: `useElementSize` uses `ResizeObserver` (not polling) and games already redraw at `requestAnimationFrame`; the additional cost is one observer per canvas.
- **[Risk] iOS Safari `dvh`/`svh` edge cases (URL bar collapse).** → Mitigation: use `min-h-dvh` only where needed; default to `min-h-screen` and let safe-area-inset handle the chrome.
- **[Risk] Playwright bloats CI time.** → Mitigation: shard the matrix per browser; only run on PR + `main`; skip Firefox/WebKit on draft PRs.
- **[Trade-off] We keep Tailwind defaults instead of custom-tuned breakpoints.** Slightly less perfect for iPad mini portrait (which sits in `md` not its own tier), but massively safer for existing utility classes across the codebase.

## Migration Plan

1. Ship the design system (`src/lib/viewport/`, `globals.css` additions, fluid Chinese type) as a foundation PR — no page changes yet. CSS additions are purely additive; existing pages remain visually identical.
2. Migrate `AppShell` to the four-variant nav. Visual diff per viewport reviewed.
3. Migrate one page at a time, in order of student traffic: `/` → `/learn/flashcard` → `/learn/trace` → `/learn/explore` → `/learn/dictation` → `/learn/decompose` → `/play` (+ each game) → `/favorites` → `/progress` → `/stickers`. Each page lands with its slice of the Playwright matrix passing.
4. Final hardening pass: modals, focus trap, safe-area-inset audit, reduced-motion audit, screenshot baseline freeze.

**Rollback strategy**: All changes are CSS + a new `src/lib/viewport/` module + per-page tweaks. There is no data migration, no API change, no dependency upgrade. Reverting any task is a clean Git revert; the existing storage schema and audio engine remain untouched.

## Open Questions

- Do we want a `prefers-reduced-data` opt-out that skips the LXGW WenKai webfont on small viewports? (Out of scope unless we hit measurable bandwidth issues; revisit after.)
- Should the Playwright matrix include Android Chrome user agent? (Probably yes for `xs` profile; can be added cheaply once Playwright is in place.)
- Do we keep the `pointer: coarse` 17 px font bump in `globals.css` now that we have fluid Chinese type? (Likely remove it to avoid double-bumping; decide during implementation after measuring on an iPad.)
