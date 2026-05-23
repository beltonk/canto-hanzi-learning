## MODIFIED Requirements

### Requirement: Mini-Games Hub
The system SHALL provide a "遊戲樂園" (Mini-Games Hub) page that lists all available mini-games as colorful cards, each labelled with its mascot, name, brief description, recommended age band, and best-star record. The card grid MUST adapt to viewport and orientation: 1-up on phone portrait when card width would otherwise drop below 280 px, 2-up on phone landscape, 2- or 3-up on iPad portrait, 3-up on iPad landscape, and 4-up on desktop. The hub MUST avoid horizontal scrolling at every supported viewport and orientation.

#### Scenario: View the hub on phone portrait
- **WHEN** a student navigates to the mini-games hub on a phone in portrait
- **THEN** the cards are displayed in a 1- or 2-column grid based on viewport width, no card is narrower than 280 px, and there is no horizontal scroll

#### Scenario: View the hub on iPad portrait
- **WHEN** a student navigates to the mini-games hub on an iPad in portrait (768–1023 px wide)
- **THEN** the cards are displayed in a 2- or 3-column grid that fills the available horizontal space and respects the icon-rail navigation

#### Scenario: View the hub on iPad landscape and desktop
- **WHEN** a student navigates to the mini-games hub at ≥1024 px wide
- **THEN** the cards are displayed in a 3- or 4-column grid alongside the full sidebar, with no horizontal scroll

#### Scenario: Locked vs unlocked games
- **WHEN** a game is locked (e.g., requires a certain XP level)
- **THEN** its card is rendered grayscale with a padlock icon and a tooltip explaining how to unlock it

## ADDED Requirements

### Requirement: Container-Sized Game Boards
Every mini-game (Match-Up, Whack-a-Hanzi, Character Rain, Word Builder, Sentence Garden, Tone Bingo, Radical Detective, Stroke Racer) SHALL compute its playing board dimensions from the available container size via `useElementSize()`, with a guaranteed minimum interactive-element size of 44×44 px and a documented maximum aspect ratio. Games MUST NOT use fixed pixel widths or heights for the playing field, scoring HUD, or interactive tiles.

#### Scenario: Whack-a-Hanzi on phone portrait
- **WHEN** Whack-a-Hanzi is started on a phone in portrait (~390×750 px viewport)
- **THEN** the mole grid sizes itself to fit the available height after subtracting header, status bar, and bottom-tab chrome, every mole has a tap target ≥48 px, and no mole is clipped or overflows the safe area

#### Scenario: Whack-a-Hanzi on iPad landscape
- **WHEN** Whack-a-Hanzi is started on iPad in landscape
- **THEN** the mole grid scales up to fill the available area without exceeding the documented maximum aspect ratio, the moles remain visually centered, and tap targets remain ≥48 px

#### Scenario: Phone landscape playability
- **WHEN** any mini-game is loaded at a phone-landscape viewport
- **THEN** the game board and HUD fit on screen without horizontal scroll, the top-tab navigation is used, and gameplay remains fully playable (no clipped controls, no overlapping HUD)

### Requirement: Orientation Re-Layout Mid-Game
The mini-games framework SHALL re-layout the active game's board and HUD on orientation change without ending the round or losing score, timer, lives, or current item state.

#### Scenario: Rotate device during a round
- **WHEN** the device rotates from portrait to landscape (or vice versa) while a mini-game round is active
- **THEN** the game's board re-sizes to the new container, the score/timer/lives state persists exactly, and any in-flight animation either resumes from its current logical position or restarts at the next frame boundary (never freezes)

### Requirement: Result and Pause Modals Are Responsive
The mini-games framework's result screen, pause sheet, and adaptive-difficulty filter sheet SHALL render as a full-screen sheet on phone portrait, as a bottom-anchored sheet (max-height `min(90dvh, 600px)`) on phone landscape and iPad portrait, and as a centered card (`max-w-md lg:max-w-lg`) on iPad landscape and desktop. All variants MUST trap keyboard focus, close on `Escape`, and restore focus to the invoking element on close.

#### Scenario: Result screen on phone portrait
- **WHEN** a game round ends on a phone in portrait
- **THEN** the result screen takes the full viewport, the "再玩一次 / 下個遊戲 / 返樂園" buttons are stacked vertically with ≥48 px tap targets, and the safe-area bottom inset is respected

#### Scenario: Result screen on iPad landscape
- **WHEN** a game round ends on iPad in landscape
- **THEN** the result screen appears as a centered card with a backdrop, the buttons are aligned in a row, and the rest of the page is `inert` while the dialog is open
