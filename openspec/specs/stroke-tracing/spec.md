# stroke-tracing Specification

## Purpose
TBD - created by archiving change revamp-kids-ui-and-add-fun-games. Update Purpose after archive.

## Requirements
### Requirement: Stroke Tracing Activity Entry
The system SHALL provide a stroke tracing activity reachable from the home page that lets students practice writing a Traditional character by tracing it with finger, stylus, or mouse, in the official stroke order, using the existing per-character `strokeVectors` data.

#### Scenario: Open stroke tracing for a character
- **WHEN** a student selects a character from the tracing activity
- **THEN** the system displays the character's tracing canvas with the same Free HK Kai grid as the existing stroke animation, plus a brush tool ready for input

#### Scenario: Character without stroke data
- **WHEN** the selected character has no `strokeVectors`
- **THEN** the system shows a friendly placeholder with the panda mascot saying "呢個字未有筆順資料" and offers a related-character suggestion instead of crashing

### Requirement: Animated Stroke Guide
The system SHALL display an animated stroke guide that shows, one stroke at a time, where the next stroke starts, the direction it travels, and where it ends, before the student traces it.

#### Scenario: Showing the next stroke
- **WHEN** a tracing round begins or the student completes the previous stroke
- **THEN** the system highlights the next stroke as a "ghost" outline, plays a short brush sound, and animates a moving brush tip from the stroke's start point to its end point at least once

#### Scenario: Stroke order numbering
- **WHEN** the guide animates a stroke
- **THEN** a numbered badge (1, 2, 3, …) appears at the stroke's start point and remains visible until that stroke is completed

### Requirement: Real-time Path Capture
The system SHALL capture the student's pointer/touch input as a continuous polyline while they trace, sampling at a frequency sufficient for smooth visual feedback (target ≥45 samples/second on iPad).

#### Scenario: Touch input on iPad
- **WHEN** a student presses one finger on the canvas and drags
- **THEN** the system draws an ink trail under the finger that follows it without visible lag

#### Scenario: Mouse input on desktop
- **WHEN** a student presses the mouse button and drags on the canvas
- **THEN** the system draws an ink trail under the cursor identical to the touch behaviour

#### Scenario: Multi-touch rejection
- **WHEN** a second finger touches the canvas while a stroke is already in progress
- **THEN** the system ignores the second touch and continues tracking only the first

### Requirement: Stroke Validation
The system SHALL validate each completed stroke against the target stroke from `strokeVectors`, scoring it on three dimensions:
- **Order**: the stroke matches the expected stroke index
- **Direction**: the stroke begins near the expected start point and ends near the expected end point (tolerance ≤20% of the canvas's shortest side)
- **Shape**: the traced polyline's normalized path is within a configurable similarity threshold of the target path

#### Scenario: Correct stroke
- **WHEN** the student lifts their finger after tracing a stroke that meets all three criteria
- **THEN** the ink turns the brand "success" color, a success chime plays, the stroke is locked in, and the guide advances to the next stroke

#### Scenario: Wrong direction
- **WHEN** the traced stroke starts near the expected end point and ends near the expected start point (i.e., reversed)
- **THEN** the system rejects the stroke, plays a soft "try again" cue, and re-shows the directional arrow on the guide

#### Scenario: Out-of-order stroke
- **WHEN** the student traces a stroke that does not match the currently expected stroke index but matches a later stroke
- **THEN** the system rejects the stroke and the mascot prompts the student to trace the highlighted stroke first

#### Scenario: Shape too far off
- **WHEN** the traced shape similarity is below the threshold
- **THEN** the system fades the wrong ink, marks the attempt as a retry (does not advance), and re-animates the guide for that stroke

### Requirement: Audio and Haptic Feedback
The system SHALL provide audio and (where supported) haptic feedback during tracing, integrated with the global audio system. All sounds MUST respect the global mute toggle.

#### Scenario: Brush sound while drawing
- **WHEN** the student is actively drawing a stroke
- **THEN** a soft brush/ink sound plays for the duration of the stroke

#### Scenario: Per-stroke success cue
- **WHEN** a stroke is accepted
- **THEN** a short pleasant chime plays and, on devices that support `navigator.vibrate`, a 20 ms haptic tap fires

#### Scenario: Character completion cue
- **WHEN** all strokes of a character are accepted
- **THEN** a celebration sound plays, the mascot reacts, and any earned stars are announced via TTS in Cantonese (e.g., "三粒星！")

#### Scenario: Sound off
- **WHEN** the global sound toggle is off
- **THEN** no audio plays during tracing, but visual feedback and haptics still occur

### Requirement: Star Rating per Character
The system SHALL award 1 to 3 stars per completed character based on a combination of stroke accuracy (shape similarity), stroke order correctness, and number of retries.

#### Scenario: Three stars
- **WHEN** the student completes the character with no out-of-order or wrong-direction strokes and average shape similarity ≥85%
- **THEN** the system awards 3 stars, animates them in, and writes the score to the learning progress system

#### Scenario: Lower star tiers
- **WHEN** the student completes the character with one or more retries or lower similarity
- **THEN** the system awards 1 or 2 stars per the documented thresholds and still writes the result to the progress system

### Requirement: Replay of Student's Trace
The system SHALL let the student replay their own most recent trace of the character to compare against the official guide.

#### Scenario: Replay traced strokes
- **WHEN** the student taps the "重睇我寫" button after completing a character
- **THEN** the system replays each captured stroke in the order it was drawn, at the same approximate speed, on top of the grid

### Requirement: Reduced Motion Support
The system SHALL honour the user's `prefers-reduced-motion` setting in stroke tracing.

#### Scenario: Reduced motion enabled
- **WHEN** `prefers-reduced-motion: reduce` is set
- **THEN** the guide uses static directional arrows and instant fades instead of animated brush tips, while audio cues still play

### Requirement: Container-Sized Tracing Canvas
The stroke-tracing canvas SHALL size itself to the largest 1:1 (square) area that fits inside its parent container after accounting for headers, footers, and safe-area insets, derived via `useElementSize()`. The canvas MUST NOT use a fixed pixel size (e.g., hard-coded `width={320}` / `height={320}` props). The drawing buffer (`canvas.width` / `canvas.height`) MUST scale by `window.devicePixelRatio` so strokes remain crisp on high-DPR displays.

#### Scenario: Tracing canvas on phone portrait
- **WHEN** the stroke-tracing activity is opened on a phone in portrait
- **THEN** the canvas occupies the largest available square area (typically ≥320 px), the Free HK Kai grid and guide animation scale with it, and no part of the canvas is clipped by the bottom tab bar or the iPhone home indicator

#### Scenario: Tracing canvas on iPad landscape
- **WHEN** the stroke-tracing activity is opened on iPad in landscape with the full sidebar visible
- **THEN** the canvas occupies a much larger square (typically ≥640 px), the stroke guide and brush remain crisp at high DPR, and ancillary controls (replay button, related-character suggestions) sit beside the canvas rather than below

#### Scenario: Pointer coordinates match resized canvas
- **WHEN** the canvas has been resized (initial mount or orientation flip) and the student begins a stroke
- **THEN** the inked trail tracks the pointer position exactly (no offset drift), because the engine reads `getBoundingClientRect()` on each pointerdown and scales coordinates accordingly

### Requirement: Landscape Layout For Tracing Page
The stroke-tracing page SHALL place ancillary UI (stroke counter, replay button, mascot, related-character suggestions, jyutping/meaning panel) beside the canvas in landscape and iPad orientations, and stack them below the canvas in phone portrait. The square canvas MUST remain centered in its area in all orientations.

#### Scenario: Landscape side-by-side layout
- **WHEN** the tracing page is rendered at iPad landscape or phone landscape
- **THEN** the canvas occupies the leading two-thirds of the content area and the ancillary UI sits in the trailing third, fully visible without scrolling

#### Scenario: Portrait stacked layout
- **WHEN** the tracing page is rendered at phone portrait or iPad portrait
- **THEN** the canvas is centered horizontally with the ancillary UI stacked beneath it in a single column

### Requirement: Stroke Tracing Preserves HK Font Rendering
The stroke-tracing canvas's ghost-character layer, grid background, and the rendered character used for shape comparison SHALL continue to use the documented Hong Kong Chinese font stack (`Free HK Kai` first, `LXGW WenKai TC` fallback, then Noto Serif/Sans TC and PMingLiU). Responsive sizing changes MUST NOT introduce any other font into the tracing surface.

#### Scenario: Ghost layer font stack
- **WHEN** the ghost (target) glyph is rendered on the canvas at any viewport
- **THEN** the rendering uses `Free HK Kai` (or its documented Kaiti fallback for unsupported chars) and the stroke shape matches the desktop rendering of the same glyph
