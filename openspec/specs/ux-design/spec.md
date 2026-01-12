# ux-design Specification

## Purpose
Define the user experience design requirements for a child-friendly educational interface optimized for Hong Kong primary school students (P1-P6). The design emphasizes large touch targets for iPad users, warm inviting colors, friendly animal mascots, and layouts that avoid unnecessary scrolling.

## Requirements

### Requirement: Light Mode Default
The system SHALL use light mode as the default theme. Dark mode MAY be available as an optional accessibility setting but SHALL NOT be the default.

#### Scenario: Initial page load
- **WHEN** a user visits the application for the first time
- **THEN** the interface displays in light mode with the child-friendly color palette

#### Scenario: System dark mode preference
- **WHEN** a user's device has dark mode enabled
- **THEN** the application still displays in light mode by default unless user explicitly selects dark mode

### Requirement: Child-Friendly Color Palette
The system SHALL use a warm, vibrant color palette designed for young learners including:
- Coral/Peach tones for primary elements
- Mint/Teal for success states
- Sky Blue for informational elements
- Golden Yellow for achievements and highlights
- Cream/Warm White for backgrounds

#### Scenario: Activity card colors
- **WHEN** viewing activity cards on the homepage
- **THEN** each card has a distinct warm color with soft gradients

#### Scenario: Success feedback color
- **WHEN** a student answers correctly
- **THEN** the feedback uses mint/green tones to indicate success

### Requirement: Typography for Young Readers
The system SHALL use typography sizes optimized for developing readers:
- Body text: minimum 18px
- Headings: 22-36px based on hierarchy
- Hanzi characters: 80-200px for learning displays
- Jyutping: 24-28px for clear pronunciation

#### Scenario: Reading body text
- **WHEN** viewing instructional text or descriptions
- **THEN** the text is rendered at minimum 18px for easy reading

#### Scenario: Learning character display
- **WHEN** viewing a character in exploration or flashcard mode
- **THEN** the character is displayed at 120-200px with Free HK Kai font

### Requirement: Touch-Friendly Interaction
The system SHALL provide touch targets that meet or exceed Apple Human Interface Guidelines minimum of 44x44px, with recommended targets of 48-72px for primary actions.

#### Scenario: Button touch target
- **WHEN** a button is displayed for primary action
- **THEN** the button has minimum dimensions of 48x48px

#### Scenario: Navigation arrow touch target
- **WHEN** navigation arrows are displayed (previous/next)
- **THEN** each arrow has a minimum touch target of 64x64px

#### Scenario: Card selection
- **WHEN** activity cards are displayed
- **THEN** the entire card area is tappable with adequate spacing between cards (12px minimum)

### Requirement: Activity Mascots
The system SHALL display friendly animal mascot characters for each learning activity to create emotional engagement:
- 🐼 Panda for Character Exploration
- 🐰 Rabbit for Flashcard Revision
- 🐵 Monkey for Decomposition Play
- 🦉 Owl for Dictation Exercise

#### Scenario: Homepage mascot display
- **WHEN** viewing the homepage activity cards
- **THEN** each activity card displays its associated mascot icon

#### Scenario: In-activity mascot presence
- **WHEN** using a learning activity
- **THEN** the mascot appears with encouraging messages in Standard Written Chinese (書面語)

### Requirement: Positive Feedback Animations
The system SHALL provide encouraging visual feedback for student interactions without discouraging wrong answers.

#### Scenario: Correct answer celebration
- **WHEN** a student provides a correct answer
- **THEN** the system displays a celebration animation (stars, confetti) with encouraging text

#### Scenario: Incorrect answer feedback
- **WHEN** a student provides an incorrect answer
- **THEN** the system provides gentle feedback (soft shake) with encouraging "try again" message without negative sounds or imagery

#### Scenario: Animation accessibility
- **WHEN** a user has `prefers-reduced-motion` enabled
- **THEN** animations are disabled or simplified

### Requirement: Adequate Spacing
The system SHALL use generous spacing to reduce visual clutter and improve focus:
- Minimum padding inside containers: 16px
- Recommended padding for cards: 24-32px
- Spacing between interactive elements: 12px minimum

#### Scenario: Card internal spacing
- **WHEN** viewing a learning card or activity panel
- **THEN** content has minimum 24px padding from card edges

#### Scenario: Button group spacing
- **WHEN** multiple buttons are displayed in a group
- **THEN** there is minimum 12px spacing between buttons to prevent mis-taps
