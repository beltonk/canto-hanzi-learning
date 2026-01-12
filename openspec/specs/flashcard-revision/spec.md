# flashcard-revision Specification

## Purpose
TBD - created by archiving change add-flashcard-revision. Update Purpose after archive.
## Requirements
### Requirement: Flashcard Display
The system SHALL display characters in a card-style format showing:
- Large Traditional character (centered, prominent)
- Jyutping pronunciation
- Character meanings
- Stroke count
- Radical information

#### Scenario: View flashcard
- **WHEN** a flashcard is displayed
- **THEN** the character is shown in large font with Jyutping, meanings, stroke count, and radical clearly visible

#### Scenario: Card styling
- **WHEN** viewing the flashcard interface
- **THEN** the card has rounded corners, subtle shadow, and centered alignment for a polished appearance

### Requirement: Scope Selection
The system SHALL provide filters to customize the flashcard set:
- Learning stage: KS1 (第一學習階段), KS2 (第二學習階段), or All (全部)
- Stroke count range: selectable minimum and maximum stroke counts

#### Scenario: Filter by learning stage
- **WHEN** user selects KS1 as the learning stage
- **THEN** only characters from KS1 (小一至小三) are included in the flashcard set

#### Scenario: Filter by stroke count
- **WHEN** user selects stroke count range 1-5
- **THEN** only characters with 1 to 5 strokes are included in the flashcard set

#### Scenario: Combined filters
- **WHEN** user selects KS1 and stroke count 6-10
- **THEN** only KS1 characters with 6-10 strokes are included

### Requirement: Random Order
The system SHALL present flashcards in randomized order to prevent memorization of sequence patterns.

#### Scenario: Shuffle flashcards
- **WHEN** a flashcard session begins
- **THEN** the characters are presented in a random order different from their storage order

#### Scenario: Consistent shuffle per session
- **WHEN** navigating back and forth through flashcards in a session
- **THEN** the order remains consistent within that session

### Requirement: Audio Pronunciation
The system SHALL provide Cantonese audio pronunciation playback for each flashcard using the TTS system.

#### Scenario: Play pronunciation
- **WHEN** user clicks the audio/pronunciation button on a flashcard
- **THEN** the Cantonese pronunciation of the character is played via TTS

#### Scenario: Keyboard audio trigger
- **WHEN** user presses Space key while viewing a flashcard
- **THEN** the Cantonese pronunciation is played

### Requirement: Card Navigation
The system SHALL provide large, touch-friendly navigation controls to move between flashcards.

#### Scenario: Next card navigation
- **WHEN** user clicks the right arrow or presses → key
- **THEN** the next flashcard in the shuffled sequence is displayed

#### Scenario: Previous card navigation
- **WHEN** user clicks the left arrow or presses ← key
- **THEN** the previous flashcard in the shuffled sequence is displayed

#### Scenario: First card boundary
- **WHEN** viewing the first flashcard and user attempts to go previous
- **THEN** the previous button is disabled or navigation wraps to the last card

#### Scenario: Last card boundary
- **WHEN** viewing the last flashcard and user attempts to go next
- **THEN** the next button is disabled or navigation wraps to the first card

### Requirement: Progress Indicator
The system SHALL display the current position within the flashcard set.

#### Scenario: Show progress
- **WHEN** viewing a flashcard
- **THEN** a progress indicator shows current card number and total (e.g., "3 / 25")

### Requirement: Session Persistence
The system SHALL remember the user's last selected filters within a browser session.

#### Scenario: Remember filter selection
- **WHEN** user returns to the flashcard activity in the same session
- **THEN** their previously selected filters are pre-populated

