# flashcard-revision Specification

## Purpose
Provide a flashcard-based revision activity where students can review characters in a randomized order with customizable filters for learning stage and stroke count. The flashcard interface features large navigation arrows, audio pronunciation, and a card-style display optimized for touch devices.
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

### Requirement: Adaptive Flashcard Layout
The flashcard activity SHALL render in one of three layout variants chosen by form factor and orientation:
- **Phone portrait**: the card is centered and takes the full content width minus the edge gutter; navigation arrows are large bottom-row controls; the audio button and jyutping label sit immediately above the arrows.
- **Phone landscape**: the card sits on the leading half of the content area; navigation arrows and the audio button sit on the trailing half so the student can see the card and reach the controls with the same hand.
- **iPad portrait / landscape / desktop**: the card is centered within a `max-w-lg` (portrait) or `max-w-xl` (landscape/desktop) container with navigation arrows on the left and right sides at ≥64 px touch targets.

In all variants the Traditional character MUST be rendered with the Hong Kong Chinese font stack and a fluid font-size that scales between approximately 96 px and 200 px based on the available card area.

#### Scenario: Phone portrait flashcard
- **WHEN** the flashcard activity is opened on a phone in portrait
- **THEN** the card fills the content width, the character is at least 96 px tall, and the previous/next/audio controls are stacked along the bottom with ≥48 px tap targets

#### Scenario: Phone landscape flashcard
- **WHEN** the flashcard activity is opened on a phone in landscape
- **THEN** the card occupies the leading half of the content area, the navigation/audio controls occupy the trailing half, and no part of the card overlaps the iPhone notch

#### Scenario: iPad landscape flashcard
- **WHEN** the flashcard activity is opened on iPad in landscape
- **THEN** the card sits centered within a `max-w-xl` container, navigation arrows sit on the left and right at ≥64 px, and the layout matches the existing desktop experience

### Requirement: Flashcard Setup Screen Is Responsive
The flashcard setup screen (filters for learning stage and stroke-count range) SHALL render its filter groups as stacked sections on phone portrait, a 2-column layout on iPad portrait and phone landscape, and a 3-column layout on iPad landscape and desktop. The "開始溫習" call-to-action MUST be a full-width sticky button at the bottom of the visible area on phone portrait, and a right-aligned button in a footer row on larger viewports.

#### Scenario: Setup screen on phone portrait
- **WHEN** the flashcard setup screen is opened on a phone in portrait
- **THEN** filter groups are stacked, every filter chip has a ≥44 px tap target, and the "開始溫習" button is a full-width sticky button above the bottom safe-area inset

#### Scenario: Setup screen on iPad landscape
- **WHEN** the flashcard setup screen is opened on iPad in landscape
- **THEN** filter groups appear in a 3-column layout, the "開始溫習" button sits in a right-aligned footer row, and no horizontal scroll occurs

