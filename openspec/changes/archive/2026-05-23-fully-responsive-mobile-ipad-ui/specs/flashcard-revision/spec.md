## ADDED Requirements

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
