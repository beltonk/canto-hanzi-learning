## ADDED Requirements

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
