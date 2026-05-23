## ADDED Requirements

### Requirement: Learn Hub Landing Page
The system SHALL provide a `/learn` page that acts as the single landing surface for the five learning activities (`查字 · 字卡 · 拆字 · 默書 · 筆順`). The hub MUST be the destination of the primary navigation's `學習` tab on every nav variant (bottom-tabs, top-tabs, icon-rail, full-sidebar).

#### Scenario: Tap the learning tab
- **WHEN** the student taps the `學習` tab in any nav variant
- **THEN** `/learn` opens and renders the hub view, with the back button hidden because the page is a top-level route

#### Scenario: Active state persists on sub-routes
- **WHEN** the student navigates to `/learn/explore`, `/learn/flashcard`, `/learn/decompose`, `/learn/dictation`, or `/learn/trace`
- **THEN** the `學習` nav item is rendered with `aria-current="page"` and uses the active visual state, while no other nav item is active

### Requirement: Learn Hub Tile Grid
The hub SHALL render the five learning activities as a tile grid plus a sixth "今日要複習" tile that deep-links a flashcard session over the SRS-due character list. Tiles MUST keep the same colors, emojis, and labels they already use on the home page so visual recognition transfers from the existing UI. The grid MUST fit above the fold at every supported (form factor × orientation) cell:
- Phone portrait (xs ≤480 px): 2 columns × 3 rows.
- Phone landscape (sm, height ≤500 px): 3 columns × 2 rows.
- iPad portrait / split-view (md): 3 columns × 2 rows.
- iPad landscape and desktop (lg+): 6 columns × 1 row, or 3 columns × 2 rows when the available width is ≤960 px after sidebar chrome.

#### Scenario: Hub renders without page scroll on phone portrait
- **WHEN** the hub is opened at 360×640 px (iPhone SE portrait)
- **THEN** all six tiles, the page header, and the bottom-tab nav are visible without page scroll

#### Scenario: Hub renders without page scroll on iPad landscape
- **WHEN** the hub is opened at 1180×820 px (iPad Pro landscape)
- **THEN** the six tiles render in a single row (or 3×2 grid) within the available area between the full sidebar and the page header, with no page scroll

#### Scenario: Today's review tile reflects SRS state
- **WHEN** the student has at least one SRS-due character
- **THEN** the "今日要複習" tile shows the due count badge and links to `/learn/flashcard?chars=...&title=...`
- **AND** when there are zero due characters the tile reads "🌟 全部溫完" and links to `/learn/explore`

### Requirement: Learn Hub Deep-Link Compatibility
The hub SHALL NOT change any existing `/learn/<activity>` URL. Existing deep links from quests, due-review CTAs, favorites, and external bookmarks MUST continue to render the matching activity page directly without going through the hub.

#### Scenario: External deep link
- **WHEN** an external link points to `/learn/explore?char=水`
- **THEN** the explore activity page renders directly with the character pre-loaded, identical to today's behaviour, and the `學習` nav tab shows as active

### Requirement: Learn Hub Accessibility
The hub MUST expose every tile as a single focusable link (`<Link>`/`<a>`) with a descriptive `aria-label` that includes the activity name and one-line description, and MUST place the six tiles inside a `role="navigation"` landmark labelled `學習活動`.

#### Scenario: Keyboard traversal
- **WHEN** the student tabs through the hub from the page header
- **THEN** focus moves once per tile in row-major order, and every focused tile shows the standard 2-px indigo focus ring used elsewhere in the app

#### Scenario: Screen reader landmark
- **WHEN** an assistive-tech user lists landmarks on `/learn`
- **THEN** the hub appears as a `navigation` landmark named `學習活動`, separate from the `主導覽` landmark used by the primary nav
