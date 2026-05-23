## MODIFIED Requirements

### Requirement: iPad-First Layout Defaults
The system SHALL be designed to render correctly across **every supported form factor and orientation**, not only iPad landscape. Layouts and component sizing MUST be tuned so that:
- Phone portrait (≥360 px wide) renders all primary content above the fold with the bottom-tab navigation and a 1-column grid.
- Phone landscape (≥568 px wide, height ≤500 px) renders with a top-tab navigation to reclaim vertical space and a 2-column or row-oriented layout where appropriate.
- iPad portrait and iPad split-view (≥768 px wide) renders with an icon rail (compact sidebar) instead of the mobile bottom tab bar, and a 2- or 3-column grid where content allows.
- iPad landscape and desktop (≥1024 px) renders with the full labelled sidebar and a 3- or 4-column grid.

Every page MUST avoid horizontal scrolling in every (form factor × orientation) combination defined by the canonical breakpoint contract.

#### Scenario: Phone portrait rendering
- **WHEN** the app is viewed at 360–430 px width in portrait
- **THEN** the playground map, every learning page, and every mini-game render with no horizontal scroll, the bottom-tab nav visible, touch targets ≥48 px, and all chrome respecting the bottom safe-area inset

#### Scenario: Phone landscape rendering
- **WHEN** the app is viewed at a phone landscape viewport (width ≥568 px, height ≤500 px)
- **THEN** the navigation moves to the top of the screen (top-tabs), the main content area uses the freed vertical space, and no element overlaps the iOS notch in landscape

#### Scenario: iPad portrait / split-view rendering
- **WHEN** the app is viewed at 768–1023 px width
- **THEN** an icon rail (compact sidebar) is shown instead of the bottom tab bar, learning canvases and game boards expand to fill the freed horizontal space, and the page renders with no horizontal scroll

#### Scenario: iPad landscape rendering
- **WHEN** the app is viewed at 1024×768 landscape
- **THEN** the playground map, mini-games hub, tracing canvas, and progress dashboard each render fully on screen with no horizontal scroll, the full labelled sidebar is shown, and primary content is above the fold

#### Scenario: Phone reflow
- **WHEN** the app is viewed at 360 px width
- **THEN** grids collapse to single columns, mascots scale down proportionally, and touch targets remain ≥48 px

#### Scenario: Orientation flip retains state
- **WHEN** the device rotates from portrait to landscape (or vice versa) while a learning activity is in progress
- **THEN** the layout switches to the orientation-appropriate variant within one animation frame, no in-progress input (current trace, dictation input, selected tile) is lost, and the focus indicator remains on the previously focused element

## ADDED Requirements

### Requirement: Navigation Adapts to Form Factor and Orientation
The system SHALL render one of four navigation variants chosen by form factor and orientation, not by width alone:
- **Bottom tabs** for phone portrait
- **Top tabs** for phone landscape
- **Icon rail** (compact sidebar with icons, no labels) for iPad portrait and iPad split-view
- **Full sidebar** (labels and status pills) for iPad landscape and desktop

All variants MUST surface the same navigation items in the same order. The active item MUST be visibly highlighted and MUST carry `aria-current="page"`. Every nav link MUST have a tap area ≥44 px.

#### Scenario: Phone portrait nav
- **WHEN** the viewport is phone-portrait
- **THEN** the bottom tab bar is visible, the sidebar is hidden, and the bottom bar sits above the home-indicator safe area

#### Scenario: Phone landscape nav
- **WHEN** the viewport is phone-landscape
- **THEN** a top-tab navigation is visible, the bottom tab bar is hidden, and the main content occupies the maximum possible height

#### Scenario: iPad portrait nav
- **WHEN** the viewport is iPad-portrait or iPad split-view
- **THEN** a 64-px-wide icon rail is visible on the leading edge with tooltips on hover/long-press, and the bottom tab bar is hidden

#### Scenario: iPad landscape and desktop nav
- **WHEN** the viewport is iPad-landscape or desktop (≥1024 px wide)
- **THEN** the full sidebar with labels and status pills is visible, the bottom tab bar is hidden, and the layout matches the current desktop experience

### Requirement: Safe-Area and Notch Awareness
The system SHALL honour iOS safe-area insets (notch, home indicator) and Android system bars on every page. Sticky headers MUST pad their top by `--safe-top`; bottom tab bars MUST pad their bottom by `--safe-bottom`; full-screen overlays (modals, game canvases) MUST respect all four insets.

#### Scenario: iPhone notch in landscape
- **WHEN** any page is rendered on an iPhone in landscape with the notch on the leading edge
- **THEN** the back button, page title, status pills, and any leading content are inset past the notch and not clipped by it

#### Scenario: Bottom home indicator on iPhone
- **WHEN** the mobile bottom tab bar is rendered on an iPhone with a home indicator
- **THEN** the tab labels and active dots sit above the home indicator, and the tab-bar background fills the inset area beneath them

### Requirement: Fluid Chinese Typography Preserves HK Stroke Stack
The system's Chinese display utilities (`.font-chinese`, `.hanzi-display`, `.hanzi-medium`, `.hanzi-sentence`, `.jyutping`) SHALL use viewport-responsive `clamp()` font-sizes while keeping the `font-family` chain identical to today: `'Free HK Kai', 'LXGW WenKai TC', var(--font-serif-tc), var(--font-sans-tc), 'Noto Serif TC', 'PMingLiU', serif`. No other property of the font stack — weight, style, font-display, or load order — may change as part of responsive work.

#### Scenario: Stroke style preserved on small screens
- **WHEN** an `.hanzi-medium` element is rendered at a 360 px viewport
- **THEN** the visible glyph is rendered by `Free HK Kai` (or its `LXGW WenKai TC` Kaiti fallback for chars Free HK Kai doesn't ship) and the brushstroke shape matches the desktop rendering of the same glyph

#### Scenario: Stroke style preserved on large screens
- **WHEN** an `.hanzi-medium` element is rendered at a 1440 px viewport
- **THEN** the visible glyph is rendered by the same first-available family as on the 360 px viewport, with no fallback to Noto Sans or PMingLiU
