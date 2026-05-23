## ADDED Requirements

### Requirement: Canonical Breakpoint Contract
The system SHALL expose a single canonical breakpoint contract used by every page and component. The contract MUST be defined in code (`src/lib/viewport/breakpoints.ts`) and mirrored 1:1 by the Tailwind utility prefixes. Tokens:
- `xs` (0 px and up) — phone portrait
- `sm` (480 px and up) — phone landscape
- `md` (768 px and up) — iPad portrait, iPad split-view
- `lg` (1024 px and up) — iPad landscape, small laptop
- `xl` (1280 px and up) — desktop
- `2xl` (1536 px and up) — large desktop

#### Scenario: Single source of truth
- **WHEN** any page or component needs a breakpoint value (in CSS via `@media`, in Tailwind via `md:`, or in JS via `useViewport()`)
- **THEN** the same numeric thresholds defined in `breakpoints.ts` apply, and no module hard-codes a divergent width

#### Scenario: Orientation tokens
- **WHEN** a layout decision depends on orientation
- **THEN** it uses the `portrait:` / `landscape:` Tailwind variants or the `useOrientation()` hook, never `window.innerWidth > window.innerHeight` directly

### Requirement: Viewport And Orientation Hooks
The system SHALL provide three SSR-safe React hooks under `src/lib/viewport/`:
- `useViewport()` returning `{ width: number, height: number, breakpoint: 'xs'|'sm'|'md'|'lg'|'xl'|'2xl' }`
- `useOrientation()` returning `'portrait' | 'landscape'`
- `useElementSize(ref)` returning `{ width: number, height: number }` derived from a `ResizeObserver`

All three MUST use `useSyncExternalStore` to avoid React hydration mismatches and MUST debounce `resize`/`orientationchange` events by at least 100 ms.

#### Scenario: SSR safety
- **WHEN** a component using `useViewport()` is rendered on the server (no `window`)
- **THEN** the hook returns a deterministic default (`breakpoint: 'lg'`, width/height 0) and on the client first commit the values update to the real measurement without an interleaved warning

#### Scenario: Element resize tracking
- **WHEN** a parent of an element observed by `useElementSize(ref)` changes size (window resize, sidebar collapse, orientation flip)
- **THEN** the hook fires within one animation frame with the new dimensions, and the consumer (e.g. a canvas) can resize accordingly without page reflow jank

### Requirement: Fluid Chinese Typography
The system SHALL replace fixed pixel font-sizes in the Chinese display classes (`.hanzi-display`, `.hanzi-medium`, `.hanzi-sentence`, `.jyutping`) with viewport-responsive `clamp()` values, while keeping the `font-family` declaration byte-for-byte identical to the existing stack (`'Free HK Kai', 'LXGW WenKai TC', var(--font-serif-tc), var(--font-sans-tc), 'Noto Serif TC', 'PMingLiU', serif`).

#### Scenario: Scaling on small viewports
- **WHEN** an element with class `hanzi-medium` is rendered at a 360 px viewport width
- **THEN** its computed `font-size` is at least 56 px and the `font-family` chain begins with `Free HK Kai`

#### Scenario: Scaling on large viewports
- **WHEN** an element with class `hanzi-medium` is rendered at a 1440 px viewport width
- **THEN** its computed `font-size` is at most 96 px and the `font-family` chain still begins with `Free HK Kai`

#### Scenario: Font stack preservation
- **WHEN** an automated check inspects the computed `font-family` of any `.font-chinese`, `.hanzi-display`, `.hanzi-medium`, or `.hanzi-sentence` element
- **THEN** the first family is `'Free HK Kai'` and the full chain matches the documented Hong Kong stroke stack

### Requirement: Safe-Area Inset Utilities
The system SHALL expose CSS variables (`--safe-top`, `--safe-bottom`, `--safe-left`, `--safe-right`) derived from `env(safe-area-inset-*, 0px)` and Tailwind-style utility classes (`.pt-safe`, `.pb-safe`, `.pl-safe`, `.pr-safe`, `.px-safe`, `.py-safe`) for any component that touches the viewport edge (sticky headers, bottom tab bars, full-screen overlays, game canvases). `app/layout.tsx` MUST keep `viewport: { viewportFit: "cover" }` so iOS resolves these env vars to non-zero on notched devices.

#### Scenario: Bottom tab bar on iPhone with home indicator
- **WHEN** the mobile bottom tab bar is rendered on an iPhone with a home indicator
- **THEN** the tab labels and active dot sit above the home indicator and the bar's background still fills the safe-area area beneath them

#### Scenario: Top header on iPhone with notch in landscape
- **WHEN** the sticky header is rendered in iPhone landscape with the notch on the left
- **THEN** the back button, title, and status pills clear the notch on both sides

### Requirement: Adaptive Spacing and Container Tokens
The system SHALL define a small set of adaptive spacing tokens (`--space-edge`, `--space-section`, `--space-card`, `--space-stack`) and a `--content-max` container width token. Pages and sections MUST consume these tokens instead of hard-coded `px-*`/`py-*` magic numbers when expressing edge gutters, section gaps, intra-card padding, and the maximum content width.

#### Scenario: Consistent edge gutter across pages
- **WHEN** any page renders its main content area
- **THEN** the left/right gutter equals `--space-edge` at the current breakpoint, producing visually consistent horizontal alignment across the home page, learning pages, and game host

#### Scenario: Maximum content width
- **WHEN** a long-form page is rendered on a viewport wider than the `--content-max` token
- **THEN** the content is centered with auto margins and never stretches edge-to-edge, preserving readability on ultra-wide displays
