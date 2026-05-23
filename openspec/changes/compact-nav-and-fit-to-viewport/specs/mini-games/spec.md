## MODIFIED Requirements

### Requirement: Mini-Games Hub
The system SHALL provide a "遊戲樂園" (Mini-Games Hub) page at `/play` that fits within a single viewport on every supported (form factor × orientation) cell without page-level scrolling. The hub MUST be composed using the `<PageScaffold>` layout primitive (see `responsive-design-system`).

The hub MUST NOT use a full-width hero band. Instead, the total-stars summary MUST appear as a compact pill anchored top-right of the page header (e.g., `⭐ 14 / 24`).

The card grid MUST list all available mini-games with mascot, name, brief description, recommended age band, and best-star record, and MUST adapt to viewport so the **entire grid is visible above the fold** at every supported (form factor × orientation) cell:
- Phone portrait (xs): 2 columns × ⌈N/2⌉ rows, with each card no narrower than 150 px and no taller than `(viewportHeight − chrome) / ⌈N/2⌉ − 8 px`.
- Phone landscape (sm, height ≤500 px): 4 columns × ⌈N/4⌉ rows.
- iPad portrait / split-view (md): 3 columns × ⌈N/3⌉ rows.
- iPad landscape and desktop (lg+): 4 columns × ⌈N/4⌉ rows.

Where `N` is the number of registered mini-games (currently 8). The hub MUST avoid horizontal scrolling at every supported viewport and orientation. If the grid cannot fit above the fold (e.g., a future game count makes 8 → 16), the grid MUST move into the `secondary` zone as an internally-scrollable region rather than scrolling the page.

#### Scenario: View the hub on phone portrait
- **WHEN** a student navigates to the mini-games hub at 360×640 px
- **THEN** all eight game cards are displayed in a 2-column grid, every card is at least 150 px wide and ≥130 px tall with a tap target ≥48 px, the page header shows the compact `⭐ N / M` pill, no card is below the fold, and there is no horizontal or vertical page scroll

#### Scenario: View the hub on iPad portrait
- **WHEN** a student navigates to the mini-games hub at 768–1023 px wide
- **THEN** the cards are displayed in a 3-column grid that fills the available horizontal space and respects the icon-rail navigation; all eight cards are visible above the fold

#### Scenario: View the hub on iPad landscape and desktop
- **WHEN** a student navigates to the mini-games hub at ≥1024 px wide
- **THEN** the cards are displayed in a 4-column grid alongside the full sidebar, all eight cards are visible without page scroll, and the compact stars pill appears in the page header rather than as a hero band

#### Scenario: Locked vs unlocked games
- **WHEN** a game is locked (e.g., requires a certain XP level)
- **THEN** its card is rendered grayscale with a padlock icon and a tooltip explaining how to unlock it

#### Scenario: Future game count overflows
- **WHEN** the number of registered mini-games grows past what can fit above the fold at the smallest supported viewport
- **THEN** the grid moves into the `<PageScaffold>` `secondary` region as an internally-scrollable area, the page document still does not scroll, and the existing primary chrome stays in place
