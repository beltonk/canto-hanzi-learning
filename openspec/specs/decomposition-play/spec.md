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

