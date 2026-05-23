## ADDED Requirements

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
