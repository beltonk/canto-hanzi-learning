# mini-games Specification

## Purpose
TBD - created by archiving change revamp-kids-ui-and-add-fun-games. Update Purpose after archive.

## Requirements
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

### Requirement: Shared Game Framework
The system SHALL provide a shared mini-games framework that handles concerns common to every game: scope filters (learning stage, stroke range), session lifecycle (intro → play → result), score/star recording into the progress system, sound integration, pause/resume, and a uniform "result screen" with replay/next/exit controls.

#### Scenario: Start a game
- **WHEN** a student selects a game and chooses scope filters
- **THEN** the framework loads characters/words from the existing API, mounts the game with those items, plays the game's intro mascot line, and starts the round

#### Scenario: Result screen
- **WHEN** a game round ends (win, time-up, or quit)
- **THEN** the framework displays a uniform result screen showing earned stars, XP gained, mascot reaction, and three buttons: "再玩一次", "下個遊戲", "返樂園"

#### Scenario: Pause and resume
- **WHEN** the student taps the pause button during play
- **THEN** all timers and animations freeze, music ducks, and a panel offers "繼續", "重新開始", "離開"

#### Scenario: Empty data fallback
- **WHEN** the chosen scope filters return zero items
- **THEN** the framework shows the panda mascot with "未有合適嘅字呀，試下放寬篩選？" and a button to reopen filters instead of starting an empty game

### Requirement: Game — Match-Up (配對王)
The system SHALL provide a memory-match game where the student flips face-down tiles to find matching pairs across three configurable modes:
- Character ↔ Jyutping
- Character ↔ Brief meaning
- Character ↔ Mascot illustration (when an illustration exists)

#### Scenario: Successful pair
- **WHEN** the student flips two tiles whose contents match per the chosen mode
- **THEN** the tiles glow, a success sound plays, the pair is removed from the board, and the score increments

#### Scenario: Round complete
- **WHEN** all pairs are matched
- **THEN** the framework awards stars based on time and incorrect flips, and shows the result screen

### Requirement: Game — Whack-a-Hanzi (打地鼠)
The system SHALL provide a tap-the-correct-character game where 6–9 character moles pop up from holes and the student must tap the one that matches the audio prompt or meaning prompt within a time window.

#### Scenario: Correct tap
- **WHEN** the student taps the mole whose character matches the prompt
- **THEN** the mole reacts, score increases, and the next prompt and pop pattern start

#### Scenario: Wrong tap
- **WHEN** the student taps a wrong mole
- **THEN** the mole shakes, a soft "try again" cue plays, and the round timer is unaffected (no penalty for kids)

### Requirement: Game — Character Rain (落字雨)
The system SHALL provide an arcade game in which characters fall from the top of the screen and the student taps the one that matches the on-screen target before it reaches the ground.

#### Scenario: Catch the right character
- **WHEN** the student taps the falling character that matches the current target
- **THEN** that character bursts in confetti, score increases, and a new target appears

#### Scenario: Miss
- **WHEN** the target character reaches the ground
- **THEN** a soft "唉呀" sound plays, the lives counter decreases by one (max 3 lives), and a new target appears

### Requirement: Game — Word Builder (拼字工坊)
The system SHALL provide a drag-and-drop game where the student drags character tiles into slots to form a target word from the official Stage 1 / Stage 2 word list.

#### Scenario: Correct word
- **WHEN** all slots are filled in the correct order
- **THEN** the word is read aloud in Cantonese, stars are awarded, and the next word loads

#### Scenario: Use a hint
- **WHEN** the student taps the hint button
- **THEN** the next correct slot lights up and one star is removed from the available reward

### Requirement: Game — Sentence Garden (造句樂園)
The system SHALL provide a drag-and-drop game where the student arranges word blocks to form a grammatical example sentence taken from the existing example data.

#### Scenario: Correct sentence
- **WHEN** the dropped order matches the target sentence
- **THEN** the sentence is read aloud, the garden gains a flower, and the next sentence loads

#### Scenario: Reset attempt
- **WHEN** the student taps "重新排"
- **THEN** all blocks return to the tray and the student may try again without penalty

### Requirement: Game — Tone Bingo (聲調賓果)
The system SHALL provide a 5×5 bingo card populated with characters that have varied jyutping tones; an audio caller plays a character's pronunciation and the student taps any matching square.

#### Scenario: Mark a square
- **WHEN** the called audio matches a square's character
- **THEN** the student may tap it; on a correct tap, the square is marked with a stamp and the next call begins

#### Scenario: Bingo
- **WHEN** the student completes a row, column, or diagonal
- **THEN** "BINGO!" is announced via mascot voice, stars are awarded, and the round ends

### Requirement: Game — Radical Detective (拆字偵探)
The system SHALL provide a "find them all" game where, given a target radical, the student taps every character in a grid that contains that radical, within a time limit.

#### Scenario: Correct find
- **WHEN** the student taps a character that contains the target radical
- **THEN** the character is marked with a magnifying-glass stamp and the score increases

#### Scenario: All found
- **WHEN** the student finds every matching character before time runs out
- **THEN** stars are awarded based on time remaining and number of false taps

### Requirement: Game — Stroke Racer (太空寫字)
The system SHALL provide a game that combines stroke tracing with a race-the-clock arcade format: students must complete tracing of a sequence of characters before the timer runs out, with each correct character speeding up a rocket animation.

#### Scenario: Complete a character in time
- **WHEN** the student traces a character correctly before its individual timer ends
- **THEN** the rocket moves forward one segment and the next character loads

#### Scenario: Out of time
- **WHEN** an individual character timer expires
- **THEN** the rocket stops, the run ends, and the result screen shows distance travelled in stars

### Requirement: Adaptive Difficulty Hooks
The system SHALL allow each mini-game to read suggested difficulty hints from the learning-progress system (e.g., "use mostly mastered + a few practiced characters") so the game feels appropriately challenging without manual tuning by the student.

#### Scenario: Difficulty mix
- **WHEN** a mini-game starts and the student has prior progress
- **THEN** the framework supplies a candidate item set whose composition follows the difficulty hint from the progress system (default: 70% mastered, 25% practiced, 5% new)

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
