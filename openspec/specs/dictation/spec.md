# dictation Specification

## Purpose
TBD - created by archiving change add-core-learning-system. Update Purpose after archive.
## Requirements
### Requirement: Audio Dictation Exercise
The system SHALL provide dictation exercises where Cantonese audio is played and learners input the correct Traditional character(s).

#### Scenario: Audio dictation flow
- **WHEN** learner starts an audio dictation exercise
- **THEN** Cantonese audio is played, and the learner is prompted to input the correct Traditional character(s)

#### Scenario: Audio dictation feedback
- **WHEN** learner submits their answer after hearing audio
- **THEN** the system provides immediate feedback indicating whether the answer is correct or incorrect

### Requirement: Image Dictation Exercise
The system SHALL provide dictation exercises where a picture linked to a target character or word is shown, optionally with Cantonese pronunciation, and learners input the correct Traditional character(s).

#### Scenario: Image dictation flow
- **WHEN** learner starts an image dictation exercise
- **THEN** a picture is displayed, optional audio is played, and the learner is prompted to input the correct Traditional character(s)

#### Scenario: Image dictation with audio
- **WHEN** learner views an image dictation exercise
- **THEN** the system optionally plays the Cantonese pronunciation of the target character/word

### Requirement: Correctness Checking
The system SHALL compare learner input to the correct answer and provide immediate feedback.

#### Scenario: Correct answer
- **WHEN** learner inputs the correct Traditional character(s)
- **THEN** the system indicates success and may show additional information about the character

#### Scenario: Incorrect answer
- **WHEN** learner inputs incorrect character(s)
- **THEN** the system indicates the answer is incorrect and shows the correct answer

### Requirement: Answer Display
The system SHALL display the correct answer after learner submission, showing the Traditional character(s) and optionally Jyutping.

#### Scenario: Show correct answer
- **WHEN** learner submits an answer (correct or incorrect)
- **THEN** the system displays the correct Traditional character(s) and Jyutping pronunciation

### Requirement: Exercise Variety
The system SHALL support dictation exercises for individual characters, words, and short sentences.

#### Scenario: Character dictation
- **WHEN** generating a character-level dictation exercise
- **THEN** audio or image prompts for a single character

#### Scenario: Sentence dictation
- **WHEN** generating a sentence-level dictation exercise
- **THEN** audio or image prompts for multiple characters forming a sentence

### Requirement: Adaptive Handwriting Pane Sizing
The dictation activity's handwriting pane SHALL size itself to the largest square area that fits in its container after accounting for the prompt area, audio replay button, answer review row, and chrome (header, bottom tab bar, safe-area insets), derived via `useElementSize()`. The pane MUST NOT use fixed pixel sizing.

#### Scenario: Handwriting pane on phone portrait
- **WHEN** the dictation activity is opened on a phone in portrait
- **THEN** the handwriting pane is at least 280 px on a side, the audio replay button is above it with a ≥48 px tap target, and the answer review row sits below it without overlapping the bottom tab bar

#### Scenario: Handwriting pane on iPad landscape
- **WHEN** the dictation activity is opened on iPad in landscape
- **THEN** the handwriting pane expands to the largest available square (typically ≥640 px), the prompt and audio controls sit beside it, and the layout uses the full available width

### Requirement: Dictation Page Reflow Across Orientations
The dictation page SHALL stack its components vertically on phone portrait (prompt → pane → controls → review row), arrange them as a left/right split on phone landscape (prompt+controls on left, pane on right), and use a three-region layout on iPad+ (prompt at top, pane on left, review on right).

#### Scenario: Phone landscape dictation layout
- **WHEN** the dictation activity is opened on a phone in landscape
- **THEN** the prompt and audio replay button sit on the leading half of the content area, the handwriting pane sits on the trailing half as a near-full-height square, and the layout avoids the top-tab navigation

#### Scenario: Orientation flip preserves in-flight answer
- **WHEN** the student rotates the device after writing partial strokes in the handwriting pane
- **THEN** the layout switches to the orientation-appropriate variant, and the in-progress strokes are preserved exactly (no clear, no re-render of the pane that discards the bitmap)

### Requirement: Dictation Audio And Sound Toggle Unchanged
The responsive layout changes SHALL NOT alter the dictation activity's audio behaviour: pronunciation playback, voice selection (Cantonese female voice via the audio engine), and respect for the global sound toggle remain exactly as specified in the existing dictation behaviour.

#### Scenario: Audio playback at any viewport
- **WHEN** the student taps the audio replay button on any supported form factor
- **THEN** the Cantonese pronunciation plays through the audio engine using the same voice selection as before the responsive work, and respects the global mute toggle

