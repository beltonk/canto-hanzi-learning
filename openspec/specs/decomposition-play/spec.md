# decomposition-play Specification

## Purpose
TBD - created by archiving change add-core-learning-system. Update Purpose after archive.
## Requirements
### Requirement: Decomposition Puzzle Interface
The system SHALL present character decomposition as a visual puzzle where components derived from decomposition data can be manipulated to form the full character.

#### Scenario: Display decomposition puzzle
- **WHEN** starting a decomposition play activity
- **THEN** the target character's components are displayed as manipulable elements

### Requirement: Component Manipulation
The system SHALL allow learners to manipulate components (via drag-and-drop or click-to-arrange) to form the target character.

#### Scenario: Arrange components
- **WHEN** learner arranges components in the correct structure
- **THEN** the components are positioned according to the character's structure type (left-right, top-bottom, etc.)

### Requirement: Correctness Validation
The system SHALL validate whether the arranged components form the correct target character and provide immediate feedback.

#### Scenario: Correct arrangement
- **WHEN** learner arranges components correctly to form the target character
- **THEN** the system indicates success and confirms the correct arrangement

#### Scenario: Incorrect arrangement
- **WHEN** learner arranges components incorrectly
- **THEN** the system indicates the arrangement is incorrect and allows retry

### Requirement: Visual Feedback
The system SHALL provide clear visual feedback for correct and incorrect component arrangements.

#### Scenario: Visual success indicator
- **WHEN** components are arranged correctly
- **THEN** visual feedback (e.g., green highlight, checkmark) indicates success

#### Scenario: Visual error indicator
- **WHEN** components are arranged incorrectly
- **THEN** visual feedback (e.g., red highlight, X mark) indicates error

### Requirement: Structure Type Guidance
The system SHALL provide hints about the character's structure type (left-right, top-bottom, surround, etc.) to guide learners.

#### Scenario: Show structure hint
- **WHEN** learner is working on a decomposition puzzle
- **THEN** the system optionally displays or hints at the structure type to aid learning

### Requirement: Adaptive Decomposition Layout
The decomposition activity SHALL reflow its two main regions — the component palette and the assembly area — by form factor and orientation:
- **Phone portrait**: assembly area on top, component palette below as a horizontally-scrollable tray.
- **Phone landscape and iPad portrait**: assembly area on the left, component palette on the right as a vertical tray.
- **iPad landscape and desktop**: assembly area centered with a `max-w-3xl` constraint and the component palette in a right-side panel.

Component tiles and assembly slots MUST size themselves so that the smallest tile remains ≥48 px on its shortest side in every viewport.

#### Scenario: Decomposition on phone portrait
- **WHEN** the decomposition activity is opened on a phone in portrait
- **THEN** the assembly area occupies the upper section, the palette is a horizontally-scrollable tray underneath, and tile/slot tap targets are ≥48 px

#### Scenario: Decomposition on iPad landscape
- **WHEN** the decomposition activity is opened on iPad in landscape
- **THEN** the assembly area is centered with the palette on the right, the structure-type hint is visible without scrolling, and tiles/slots remain ≥48 px

### Requirement: Drag-and-Drop Works In Every Orientation
The decomposition activity's drag-and-drop interaction (touch, pen, and mouse) SHALL continue to work in every form factor and orientation, with hit areas at least as large as the visible tile, and MUST not trigger page scrolling while a drag is in progress.

#### Scenario: Drag on phone portrait
- **WHEN** the student begins a drag on a tile while the page would otherwise be vertically scrollable
- **THEN** vertical scrolling is suppressed for the duration of the drag and the tile follows the finger without offset or jitter

#### Scenario: Orientation flip during drag
- **WHEN** the device rotates while a drag is in progress
- **THEN** the active drag is cancelled gracefully (tile returns to its origin), the layout switches to the orientation-appropriate variant, and the student can re-attempt the drag immediately without state loss

