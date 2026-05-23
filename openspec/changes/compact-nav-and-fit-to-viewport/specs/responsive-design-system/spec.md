## ADDED Requirements

### Requirement: Page-Fit Layout Primitive
The system SHALL provide a single shared layout primitive — `<PageScaffold>` — used by every primary page (`/`, `/learn`, `/play`, `/progress`, `/favorites`, `/stickers`) to guarantee the page fits its viewport without document-level scrolling. The primitive accepts three slot props:

- `primary` (required): the always-visible content region.
- `secondary` (optional): a secondary content region rendered as a horizontal-tab strip on xs/sm/md and as a vertical-stack panel inside the `aside` slot on lg+. The secondary region MUST allow vertical internal scrolling with `overscroll-behavior: contain`.
- `aside` (optional): a right-rail column rendered only at lg+ (≥1024 px). The aside region MUST allow vertical internal scrolling with `overscroll-behavior: contain`.

The primitive MUST set its outer container height to `calc(100dvh - var(--chrome-top, 56px) - var(--chrome-bottom, 0px))`, where `--chrome-top` and `--chrome-bottom` are CSS custom properties exposed by `AppShell` and reflect the height of the active nav variant. Children MUST be allowed to use `min-height: 0` so flex/grid children shrink instead of overflow.

#### Scenario: Default zone allocation on phone portrait
- **WHEN** a page renders `<PageScaffold primary={...} secondary={...} />` at 360×640 px
- **THEN** the primary zone occupies the top portion of the available area, the secondary zone renders as a horizontal-tab strip with one visible tabpanel below it, the page document does not scroll, and the secondary tabpanel scrolls internally if its content exceeds its allocated height

#### Scenario: Default zone allocation on iPad landscape
- **WHEN** a page renders `<PageScaffold primary={...} secondary={...} aside={...} />` at 1180×820 px
- **THEN** the primary zone occupies the centre column, the aside zone occupies a right rail of `min(360px, 30%)` width with all secondary panels stacked vertically inside it, the secondary slot is hidden because its content has been absorbed by the aside, and the page document does not scroll

#### Scenario: Chrome height awareness
- **WHEN** the active nav variant is the phone-portrait bottom-tab bar (single row, ~72 px + safe-area)
- **THEN** `--chrome-bottom` is set to `calc(72px + var(--safe-bottom))`, the primitive's outer height is `calc(100dvh - var(--chrome-top) - var(--chrome-bottom))`, and content never sits beneath the tab bar

#### Scenario: Internal scroll containment
- **WHEN** the secondary or aside region content overflows its allocated height
- **THEN** that region scrolls within itself with `overflow-y: auto` and `overscroll-behavior: contain`, and a scroll gesture inside the region never propagates to scroll the page document

### Requirement: Tabbed Secondary Region Semantics
When `<PageScaffold>` renders the `secondary` region as a tab strip (xs/sm/md), the strip MUST be a fully accessible ARIA tablist. Each tab MUST be a `role="tab"` with `aria-selected`, `aria-controls`, and a unique `id`; each panel MUST be a `role="tabpanel"` with `aria-labelledby` and `tabindex="0"`. Non-active panels MUST be hidden via `hidden` (not `display: none` style) so they remain reachable to assistive tech traversal of all panels. Arrow-key navigation between tabs MUST work (`ArrowLeft` / `ArrowRight`) with `Home`/`End` jumping to first/last tab. The selected tab on initial render MUST be the one with prop `defaultSelected`, and selection MAY be persisted by the consumer via a `localStorage` key passed as `persistKey`.

#### Scenario: Keyboard navigation between tabs
- **WHEN** a tab is focused and the user presses `ArrowRight`
- **THEN** focus moves to the next tab in source order, `aria-selected` updates, and the corresponding tabpanel becomes visible

#### Scenario: Persistence across reloads
- **WHEN** a `<PageScaffold secondary={...} persistKey="home.secondaryTab" />` selection is changed and the page is reloaded
- **THEN** the same tab is selected on first paint, before any user interaction

### Requirement: Chrome Height CSS Custom Properties
`AppShell` SHALL set `--chrome-top` and `--chrome-bottom` CSS custom properties on the root layout element to reflect the height occupied by the active nav variant plus its safe-area inset:
- Phone portrait: `--chrome-top = 56 px (sticky header) + var(--safe-top)`; `--chrome-bottom = 72 px (single-row bottom tab bar) + var(--safe-bottom)`.
- Phone landscape: `--chrome-top = 44 px (top tabs) + 56 px (sticky header) + var(--safe-top)`; `--chrome-bottom = var(--safe-bottom)`.
- iPad portrait / split-view (icon rail): `--chrome-top = 56 px + var(--safe-top)`; `--chrome-bottom = var(--safe-bottom)`. (Icon rail is off-axis.)
- iPad landscape / desktop (full sidebar): same as iPad portrait. (Full sidebar is off-axis.)

#### Scenario: Variable updates on orientation change
- **WHEN** the device rotates from phone portrait to phone landscape
- **THEN** within one animation frame `--chrome-top` increases (top-tabs bar appears) and `--chrome-bottom` collapses to `var(--safe-bottom)` (bottom bar disappears), and any `<PageScaffold>` re-fits its content height accordingly without manual JS measurement
