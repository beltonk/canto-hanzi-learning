## MODIFIED Requirements

### Requirement: Navigation Adapts to Form Factor and Orientation
The system SHALL render one of four navigation variants chosen by form factor and orientation, not by width alone:
- **Bottom tabs** for phone portrait
- **Top tabs** for phone landscape
- **Icon rail** (compact sidebar with icons, no labels) for iPad portrait and iPad split-view
- **Full sidebar** (labels and status pills) for iPad landscape and desktop

The primary navigation MUST surface exactly **five** items, in this order, on every variant:
1. `首頁` → `/`
2. `學習` → `/learn` (aggregates `查字`, `字卡`, `拆字`, `默書`, `筆順`)
3. `遊戲` → `/play`
4. `收藏` → `/favorites`
5. `進度` → `/progress`

The active item MUST be visibly highlighted and MUST carry `aria-current="page"`. Active-state matching MUST be route-prefix based: `學習` is active for any path starting with `/learn`, `遊戲` is active for any path starting with `/play`, `收藏` for `/favorites*`, `進度` for `/progress*` and `/stickers*` (since the sticker book is a sub-surface of progress), and `首頁` is active only when the path is exactly `/`.

Every nav link MUST have a tap area ≥48 px on its smallest side. The bottom-tab variant MUST render in a single row (no second row of secondary items).

#### Scenario: Phone portrait nav
- **WHEN** the viewport is phone-portrait
- **THEN** a single-row bottom tab bar with five items is visible, the sidebar is hidden, and the bar sits above the home-indicator safe area with each tap target ≥48 px wide

#### Scenario: Phone landscape nav
- **WHEN** the viewport is phone-landscape
- **THEN** a top-tab navigation with five items is visible, the bottom tab bar is hidden, and the main content occupies the maximum possible height

#### Scenario: iPad portrait nav
- **WHEN** the viewport is iPad-portrait or iPad split-view
- **THEN** a 64-px-wide icon rail with five items is visible on the leading edge with tooltips on hover/long-press, and the bottom tab bar is hidden

#### Scenario: iPad landscape and desktop nav
- **WHEN** the viewport is iPad-landscape or desktop (≥1024 px wide)
- **THEN** the full sidebar with five labelled items and status pills is visible, the bottom tab bar is hidden, and the layout matches the desktop experience

#### Scenario: Active state on a learning sub-route
- **WHEN** the student is on `/learn/flashcard?chars=...`
- **THEN** the `學習` nav item is rendered with `aria-current="page"` and the active visual state, and no other nav item is active

#### Scenario: Active state on the sticker book
- **WHEN** the student is on `/stickers`
- **THEN** the `進度` nav item is rendered with `aria-current="page"` because stickers is a sub-surface of progress

### Requirement: Playground Map Home Page
The system SHALL render the home page at `/` as a child-friendly landing that **fits within a single viewport on every supported (form factor × orientation) cell** without page-level vertical or horizontal scrolling. The home page MUST be composed using the `<PageScaffold>` layout primitive (see `responsive-design-system`) with the following zone allocation:

- **Primary zone** (always above the fold): a one-line welcome row with status pills (Lv / 🔥 / 💎 / ❤️), the search bar with hot-radical chips, and the 6-tile activity grid (the same five learning activities + 遊戲樂園).
- **Secondary zone** (rendered as a tab strip on xs/sm/md and as a stacked column inside the lg+ aside): three panels — `📖 今日要複習`, `🎯 今日任務`, `🌱 我的花園`. The active tab on first load MUST be `📖 今日要複習` if there is any due character, otherwise `🎯 今日任務`. The selected tab MUST persist across sessions in `localStorage` under the key `home.secondaryTab`.
- **Aside zone** (lg+ only): all three secondary panels rendered as a stacked column at the right rail so the student can see review, quests, and garden simultaneously without tabbing.

Internal scrolling within secondary panels (chip cloud, quest list, plant grid) is allowed and MUST be visually contained within its panel. The page document itself MUST NOT scroll.

#### Scenario: First-visit home page
- **WHEN** a student opens the app for the first time
- **THEN** the primary zone shows the welcome row, search, and six activity tiles entirely above the fold; the secondary zone shows the empty-state quests and garden under a default tab; the page does not scroll vertically or horizontally

#### Scenario: Returning visit on phone portrait
- **WHEN** a returning student opens the home page at 360×640 px
- **THEN** the search bar and all six activity tiles are visible without scrolling the page; the secondary tab strip shows under the grid and switches the visible panel without affecting page chrome

#### Scenario: Returning visit on iPad landscape
- **WHEN** a returning student opens the home page at 1180×820 px
- **THEN** the primary zone occupies the centre column, the aside zone shows due-review + quests + garden as a stacked column on the right, and the page does not scroll

#### Scenario: Touch target sizing on home
- **WHEN** the home page is viewed on a tablet
- **THEN** every interactive badge, search button, hot-radical chip, and tab has a tappable surface ≥48 px on its smallest side

### Requirement: iPad-First Layout Defaults
The system SHALL be designed to render correctly across **every supported form factor and orientation**, not only iPad landscape. Layouts and component sizing MUST be tuned so that:
- Phone portrait (≥360 px wide) renders all primary content above the fold with the bottom-tab navigation and a 1-column grid where applicable.
- Phone landscape (≥568 px wide, height ≤500 px) renders with a top-tab navigation to reclaim vertical space and a 2-column or row-oriented layout where appropriate.
- iPad portrait and iPad split-view (≥768 px wide) renders with an icon rail (compact sidebar) instead of the mobile bottom tab bar, and a 2- or 3-column grid where content allows.
- iPad landscape and desktop (≥1024 px) renders with the full labelled sidebar and a 3- or 4-column grid.

Every page MUST avoid horizontal scrolling **and page-level vertical scrolling** in every (form factor × orientation) combination defined by the canonical breakpoint contract. Pages whose primary content cannot fit (e.g., favorites grid) MUST move overflow into a region-internal scroll inside the `secondary` zone of `<PageScaffold>` rather than scrolling the page.

#### Scenario: Phone portrait rendering
- **WHEN** the app is viewed at 360–430 px width in portrait
- **THEN** the home, learn-hub, play, progress, favorites, stickers, and every learning page render with no horizontal scroll **and no page-level vertical scroll**, the bottom-tab nav visible, touch targets ≥48 px, and all chrome respecting the bottom safe-area inset

#### Scenario: Phone landscape rendering
- **WHEN** the app is viewed at a phone landscape viewport (width ≥568 px, height ≤500 px)
- **THEN** the navigation moves to the top of the screen (top-tabs), the main content area uses the freed vertical space, primary content fits without page-level vertical scroll, and no element overlaps the iOS notch in landscape

#### Scenario: iPad portrait / split-view rendering
- **WHEN** the app is viewed at 768–1023 px width
- **THEN** an icon rail (compact sidebar) is shown instead of the bottom tab bar, learning canvases and game boards expand to fill the freed horizontal space, and the page renders with no horizontal or vertical page-level scroll

#### Scenario: iPad landscape rendering
- **WHEN** the app is viewed at 1024×768 landscape
- **THEN** the home, learn-hub, mini-games hub, tracing canvas, and progress dashboard each render fully on screen with no horizontal or vertical page-level scroll, the full labelled sidebar is shown, the optional aside zone is visible where defined, and primary content is above the fold

#### Scenario: Phone reflow
- **WHEN** the app is viewed at 360 px width
- **THEN** grids collapse to single columns or 2-up tiles where defined, mascots scale down proportionally, touch targets remain ≥48 px, and overflow content lives in scrollable secondary regions rather than scrolling the page

#### Scenario: Orientation flip retains state
- **WHEN** the device rotates from portrait to landscape (or vice versa) while a learning activity is in progress
- **THEN** the layout switches to the orientation-appropriate variant within one animation frame, no in-progress input (current trace, dictation input, selected tile) is lost, and the focus indicator remains on the previously focused element
