## Why

Today the app is functional on desktop and large iPad-landscape, but breaks down on the two most-used form factors for HK primary-school students: **mobile phones** (portrait and landscape) and **iPad in portrait or split-screen**. Concrete gaps: the side navigation only appears at the Tailwind `lg` breakpoint (≥1024 px), so iPad portrait (≈820 px) and split-view iPad fall back to the mobile bottom-tab UI with cramped content; mini-games and the stroke-tracing canvas use fixed pixel sizes that overflow narrow viewports and waste space on wide ones; phone landscape (≈667 × 375 px) is essentially unusable because the bottom tab bar plus header eat the visible area; iPhone notch / Android gesture insets are ignored; flashcards, dictation, and decomposition lay out as fixed grids that wrap awkwardly; and several modals (LevelUp, EndOfSessionSummary, ResultScreen) assume desktop widths. We need a deliberate, codified responsive-design system — verified on every page in every orientation — without changing the Hong Kong–tailored Chinese font stack (`Free HK Kai` → `LXGW WenKai TC` → Noto fallbacks) that students rely on for correct strokes.

## What Changes

- Introduce a project-wide **responsive design system**: documented breakpoints (`xs` mobile portrait, `sm` mobile landscape, `md` iPad portrait, `lg` iPad landscape, `xl` desktop), orientation-aware tokens, safe-area-inset utilities, fluid type scale, and adaptive spacing tokens. All pages and components MUST consume these tokens.
- Rebuild `AppShell` so navigation adapts by *form factor and orientation*, not just width: rail (icon-only sidebar) on iPad portrait, full sidebar on iPad landscape and desktop, top tabs on phone landscape (to free vertical space), bottom tabs on phone portrait. Maintain the existing nav items, labels, and colour scheme.
- Add `useViewport()` / `useOrientation()` hooks (SSR-safe, resize/orientationchange-debounced) so components can switch layouts when CSS alone is insufficient (e.g., canvases, grids that flip from columns to rows).
- Make every learning page (`/`, `/learn/explore`, `/learn/flashcard`, `/learn/decompose`, `/learn/dictation`, `/learn/trace`) and every mini-game (`/play/*`: WhackAHanzi, MatchUp, CharacterRain, WordBuilder, ToneBingo, RadicalDetective, StrokeRacer, SentenceGarden) layout-correct in **four orientations** × **three form factors** (phone, iPad, desktop). For interactive canvases (StrokeTracing, HandwritingPane, games), sizing becomes a function of the available container, with a guaranteed minimum hit target (≥44 px) and maximum aspect-ratio cap.
- Replace fixed pixel font sizes for Chinese display (`hanzi-medium { font-size: 80px }`, `hanzi-sentence { font-size: 18px }`) with `clamp()`-based fluid sizes that scale per viewport while **keeping the existing font stack and brush rendering** byte-for-byte identical.
- Add `env(safe-area-inset-*)` padding so the bottom tab bar, sticky header, and full-screen game canvases respect iPhone notch / home indicator and Android navigation bars.
- Rework modals (`LevelUpModal`, `EndOfSessionSummary`, `ResultScreen`, `ConfettiBurst` overlay, `XpToast`) so they have a phone-fullscreen layout, a tablet-sheet layout, and a desktop-card layout, with focus trap and Esc-to-close on all of them.
- Add an automated, repeatable verification harness: a Playwright-based viewport matrix that loads every route at 6 viewport+orientation combos (`iPhone SE portrait`, `iPhone 14 Pro landscape`, `iPad mini portrait`, `iPad Pro 11 portrait`, `iPad Pro 11 landscape`, `MacBook 1440`), asserts no horizontal scroll, no content clipping, no overlap with safe areas, and captures a screenshot for visual review. CI fails on overflow or invariant violation.
- Accessibility hardening that ships with the responsive work: focus rings on every interactive element, `aria-label`s on icon-only buttons, semantic landmarks (`<nav>`, `<main>`, `<aside>`) per page, colour-contrast audit, `prefers-reduced-motion` honored (it already is in `globals.css` — extend it to JS-driven animations like confetti and games), keyboard nav for sidebar, and `aria-current="page"` on active nav items.
- **NOT changing**: Chinese font stack, Cantonese voice selection, learning content, gamification math, audio engine behaviour, character database, or any of the recently archived UX behaviour beyond layout/sizing.

## Capabilities

### New Capabilities
- `responsive-design-system`: Project-wide breakpoint contract, orientation tokens, safe-area utilities, fluid type scale, adaptive container/spacing tokens, and hooks (`useViewport`, `useOrientation`) that every page/component consumes.
- `viewport-verification`: Automated cross-viewport visual + invariant tests (Playwright matrix) that gate merges; documents the verification protocol and the route × viewport × orientation matrix.

### Modified Capabilities
- `ux-design`: Add responsive-layout requirements covering iPad portrait, phone landscape, safe-area insets, and orientation-adaptive navigation. The existing colour/Material/animation requirements stay intact.
- `mini-games`: Each game's canvas/board MUST be container-sized (not pixel-pinned) and remain playable in portrait and landscape on phone and iPad, with hit targets ≥44 px.
- `stroke-tracing`: The tracing canvas MUST size to its available container, preserve square 1:1 aspect ratio, and maintain stroke recognition accuracy across viewport sizes; brush sound and audio engine integration unchanged.
- `flashcard-revision`: Card flip layout MUST adapt to phone portrait (stacked), phone landscape (side-by-side), and iPad/desktop (centered max-width); swipe/keyboard nav unchanged.
- `decomposition-play`: Component palette and assembly area MUST reflow to vertical-stack on phone portrait and horizontal-split on landscape/iPad; existing game logic unchanged.
- `dictation`: Handwriting pane sizing MUST adapt to the largest square that fits the available area on each form-factor/orientation; existing dictation logic, voice playback, and validation unchanged.
- `character-exploration`: Search result grid and character detail panel MUST switch between single-column (phone) and dual-pane (iPad landscape / desktop) layouts; data model and search behaviour unchanged.
- `learning-progress`: Progress/sticker/garden views MUST reflow on small viewports; tracking data unchanged.

## Impact

- **Affected code**:
  - `app/layout.tsx`, `app/globals.css` — fluid type, safe-area utilities, expanded `@media` rules, no font-stack change.
  - `app/components/ui/AppShell.tsx` — orientation-aware nav variants, safe-area padding, focus management.
  - All `app/**/page.tsx` (10 routes) — adopt responsive tokens, remove fixed widths, add landscape-friendly layouts.
  - All `app/components/learning/*.tsx` (`StrokeTracing`, `HandwritingPane`, `FlashcardRevision`, `DecompositionPlay`, `DictationExercise`, `CharacterExploration`, `RelatedWords`, `StrokeAnimation`) — container-sized canvases, reflowing grids.
  - All `app/components/games/*.tsx` (8 games + `GameHost`, `ResultScreen`) — container-sized boards, orientation-aware piece sizing, safe-area-respecting overlays.
  - All `app/components/ui/*.tsx` modals/overlays (`LevelUpModal`, `EndOfSessionSummary`, `ConfettiBurst`, `XpToast`, `CorrectBurst`) — multi-form-factor sizing and focus trap.
  - New: `src/lib/viewport/` (`useViewport.ts`, `useOrientation.ts`, `breakpoints.ts`).
  - New: `tests/e2e/responsive/` (Playwright config + viewport matrix runner + per-route specs).
- **Dependencies**: Add `@playwright/test` as a dev dependency (CI-time only; no production bundle impact). No new runtime dependencies.
- **Browser support**: No change — already targets modern Chromium/WebKit; safe-area-inset and `dvh`/`svh`/`lvh` are already supported on iOS 15+ and current Chrome.
- **Risks**: Layout regressions on the seven existing learning routes and eight games — mitigated by the Playwright matrix being part of the acceptance gate. Font rendering risk is contained: we touch CSS sizing only, never the font-family stack.
- **Out of scope**: Dark-mode visual polish, new content, new games, audio changes, i18n string additions, performance/bundle optimization beyond what naturally falls out of removing dead size constants.
