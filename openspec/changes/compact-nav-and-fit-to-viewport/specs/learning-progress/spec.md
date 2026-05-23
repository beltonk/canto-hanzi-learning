## MODIFIED Requirements

### Requirement: Kid-Friendly Progress Dashboard
The system SHALL provide a "我嘅進度" dashboard at `/progress` that fits within a single viewport on every supported (form factor × orientation) cell without page-level scrolling. The dashboard MUST be composed using the `<PageScaffold>` layout primitive (see `responsive-design-system`).

The **primary zone** MUST contain, in this order:
- A compact summary band with level, XP progress bar, streak, total characters, and mastered count.
- The 7-day activity bar chart.
- The "今日要複習" CTA pill linking to a flashcard session over the SRS-due character list, only rendered when `dueCount > 0`.

The **secondary zone** MUST contain a tabbed region with two tabs:
- `📚 我的貼紙` — the sticker preview grid with a link to `/stickers` for the full book.
- `🗂 學習狀態` — the mastery character grid with the colour legend and the existing per-character popover.

Both secondary tabpanels MUST scroll internally when their content exceeds the allocated height.

The progress page header MUST host a `⚙ 設定` icon-button which, on tap, opens a popover/dialog containing the three management actions: 匯出進度, 匯入進度, 重設進度. The popover MUST trap focus, close on `Escape`, and restore focus to the icon-button on close. The actions MUST NOT appear as a footer card on the page itself.

Empty-state behaviour is preserved: sections with no data show empty-state mascot illustrations instead of zeros.

#### Scenario: View dashboard on phone portrait
- **WHEN** the student opens the progress dashboard at 360×640 px
- **THEN** the summary band, the 7-day chart, and the 今日要複習 CTA are visible above the fold; the secondary tab strip is visible below the chart; the page does not scroll vertically; the chosen secondary tabpanel scrolls internally if its content exceeds its allocated height

#### Scenario: View dashboard on iPad landscape
- **WHEN** the student opens the progress dashboard at 1180×820 px
- **THEN** the summary band, 7-day chart, and 今日要複習 CTA occupy the primary zone; the stickers and mastery grids occupy the right-rail aside zone (stickers on top, mastery beneath, each with internal scroll); the page does not scroll

#### Scenario: Tap a character cell in the mastery grid
- **WHEN** the student taps a character cell within the secondary `🗂 學習狀態` tab
- **THEN** the existing popover shows mastery state and quick-action buttons (寫字 / 字卡 / 詳情); the popover is positioned so it never overflows the secondary panel or the page

#### Scenario: Open the settings popover
- **WHEN** the student taps the `⚙ 設定` button in the page header
- **THEN** a popover opens with 匯出進度, 匯入進度, 重設進度 buttons; tab/shift-tab cycles focus inside the popover; pressing `Escape` closes the popover and returns focus to the `⚙ 設定` button

#### Scenario: Reset progress confirmation
- **WHEN** the student taps 重設進度 in the popover
- **THEN** the button enters its first-press state ("確定重設？再按確認"); a second tap clears local progress and reloads the page; the popover stays open between the two taps so the kill-switch is intentional

### Requirement: Responsive Progress Dashboard Layout
The "我嘅進度" dashboard SHALL reflow its content using the `<PageScaffold>` zone allocation:
- Phone portrait (xs): primary zone is a single column with the summary band, then the chart, then the 今日要複習 CTA; the secondary zone is a tab strip below the primary zone.
- Phone landscape (sm): primary zone is a 2-column row (summary + chart); CTA renders as a pill at the right of the chart row; secondary zone tab strip below.
- iPad portrait / split-view (md): primary zone is a 2- or 3-column row; secondary zone tab strip below.
- iPad landscape and desktop (lg+): primary zone is a 3-column row; secondary content moves into the aside zone as a stacked column (stickers on top, mastery beneath).

In all cases the page document MUST NOT scroll vertically; sections that do not fit MUST scroll within their own region.

#### Scenario: Dashboard on phone portrait
- **WHEN** the progress dashboard is opened on a phone in portrait
- **THEN** the summary band, chart, and CTA stack in a single column inside the primary zone; the secondary zone tab strip is visible below; no section is clipped; the page does not scroll vertically; the 7-day bar chart fits the column width without horizontal scroll

#### Scenario: Dashboard on iPad landscape
- **WHEN** the progress dashboard is opened on iPad in landscape
- **THEN** the primary zone arranges the summary band, chart, and CTA in a 3-column row; the aside zone shows the stickers and mastery sections stacked vertically with internal scroll; the page does not scroll horizontally or vertically

### Requirement: Mastery Grid Cell Sizing
The mastery-grid character cells SHALL size themselves so that on phones each cell is at least 36×36 px, on iPad each cell is at least 44×44 px, and the grid wraps to use the available column width on every viewport. Tapping a cell opens the existing popover positioned so it never overflows the **secondary panel or the aside region**, on any form factor. When the grid contains more than 200 characters, the grid MUST virtualise or paginate so the secondary region's internal scroll remains performant.

#### Scenario: Grid cells on phone
- **WHEN** the mastery grid renders on a phone within the secondary `🗂 學習狀態` tab
- **THEN** every cell is at least 36×36 px, the grid fills the panel width without horizontal overflow, and tapping a cell shows the popover anchored to remain fully on screen

#### Scenario: Grid cells on iPad landscape
- **WHEN** the mastery grid renders on iPad in landscape inside the aside region
- **THEN** every cell is at least 44×44 px, the grid expands to fill the aside column, and the popover renders above or beside the tapped cell without clipping the panel or the page

#### Scenario: Large mastery library
- **WHEN** the student has more than 200 mastered characters
- **THEN** the grid virtualises rows so internal scroll remains smooth at 60 fps on a mid-range iPad, and the existing popover continues to anchor correctly on virtualised rows
