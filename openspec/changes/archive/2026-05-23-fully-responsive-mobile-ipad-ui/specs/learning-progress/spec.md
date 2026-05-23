## ADDED Requirements

### Requirement: Responsive Progress Dashboard Layout
The "我嘅進度" dashboard SHALL reflow its sections (total characters known, current streak/level, 7-day activity bar chart, "今日要溫" list, mastery-state grid/treemap) so that on phone portrait sections stack vertically in a single column with the bar chart scrollable horizontally if needed, on phone landscape and iPad portrait sections render as a 2-column grid, and on iPad landscape and desktop sections render as a 3-column grid with the mastery grid expanding to fill the remaining column span.

#### Scenario: Dashboard on phone portrait
- **WHEN** the progress dashboard is opened on a phone in portrait
- **THEN** every section is visible in a single-column stack, no section is clipped, and the 7-day bar chart fits the viewport width or scrolls horizontally with momentum

#### Scenario: Dashboard on iPad landscape
- **WHEN** the progress dashboard is opened on iPad in landscape
- **THEN** sections are arranged in a 3-column grid, the mastery grid uses the full bottom row, and the page does not scroll horizontally

### Requirement: Mastery Grid Cell Sizing
The mastery-grid character cells SHALL size themselves so that on phones each cell is at least 36×36 px, on iPad each cell is at least 44×44 px, and the grid wraps to use the available column width on every viewport. Tapping a cell opens the existing popover positioned so it never overflows the viewport on any form factor.

#### Scenario: Grid cells on phone
- **WHEN** the mastery grid renders on a phone
- **THEN** every cell is at least 36×36 px, the grid fills the column width without horizontal overflow, and tapping a cell shows the popover anchored to remain fully on screen

#### Scenario: Grid cells on iPad landscape
- **WHEN** the mastery grid renders on iPad in landscape
- **THEN** every cell is at least 44×44 px, the grid expands to fill its column span, and the popover renders above or beside the tapped cell without clipping

### Requirement: Garden and Sticker Panels Reflow
The garden panel (on the home page) and the sticker collection page SHALL reflow their item grids by viewport: 4- or 5-up on phone portrait, 6- to 8-up on iPad portrait, and 8- to 12-up on iPad landscape and desktop. No item may exceed the column width on the smallest target viewport.

#### Scenario: Garden on phone portrait
- **WHEN** the garden panel renders on a phone in portrait
- **THEN** plants are displayed in a 4- or 5-column grid with consistent gutters, and no plant card exceeds the column width

#### Scenario: Sticker page on iPad landscape
- **WHEN** the sticker collection page renders on iPad in landscape
- **THEN** stickers are displayed in an 8- to 12-column grid, every sticker is fully visible without clipping, and the page does not scroll horizontally
