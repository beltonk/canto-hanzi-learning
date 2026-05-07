## MODIFIED Requirements

### Requirement: Child-Friendly Color Palette
The system SHALL use a vibrant, primary-school color palette designed to feel playful while remaining legible. The palette MUST be expressed as CSS variables and MUST include:
- **Coral / Peach** — primary brand and "Explore" activity
- **Mint / Teal** — success states and "Decomposition" activity
- **Sky Blue** — informational elements and "Flashcard" activity
- **Golden Yellow** — achievements, stars, and "Dictation" activity
- **Bubble Pink** — mini-games hub and gamification surfaces (NEW)
- **Grape Purple** — stroke tracing activity and mascot accents (NEW)
- **Cream / Warm White** — backgrounds (light mode)
- **Charcoal** — primary text
Each activity color MUST be available as a base, a darker hover/active variant, and a soft 10–20% tint for backgrounds.

#### Scenario: Activity card colors
- **WHEN** viewing activity cards on the homepage
- **THEN** each card has a distinct vibrant color with a soft gradient and a 10–20% tint background

#### Scenario: Success feedback color
- **WHEN** a student answers correctly
- **THEN** the feedback uses mint/green tones to indicate success

#### Scenario: New activity colors
- **WHEN** the student opens the mini-games hub or stroke tracing
- **THEN** the hub uses the bubble-pink palette and tracing uses the grape-purple palette as their primary surface tints

#### Scenario: Color contrast
- **WHEN** any text is rendered on any palette color background
- **THEN** the contrast ratio meets WCAG AA for body text (≥4.5:1) and AA Large for headings (≥3:1)

### Requirement: Activity Mascots
The system SHALL display friendly animal mascot characters for each learning activity to create emotional engagement. Mascot identities are:
- 🐼 Panda — Character Exploration
- 🐰 Rabbit — Flashcard Revision
- 🐵 Monkey — Decomposition Play
- 🦉 Owl — Dictation Exercise
- 🐱 Cat — Stroke Tracing (NEW)
- 🐯 Tiger — Mini-Games Hub (NEW)
Each mascot MUST be available in at least four poses — `idle`, `happy`, `cheer`, `oops` — and MUST support a "speak" bubble component capable of rendering Cantonese text plus an optional voiceline id played through the audio engine.

#### Scenario: Homepage mascot display
- **WHEN** viewing the homepage activity cards
- **THEN** each activity card displays its associated mascot in its `idle` pose

#### Scenario: In-activity mascot presence
- **WHEN** using a learning activity
- **THEN** the activity's mascot appears with encouraging messages in Standard Written Chinese (書面語) or Cantonese as appropriate

#### Scenario: Mascot reaction on success
- **WHEN** the student succeeds at an action (correct answer, completed trace, level up)
- **THEN** the mascot transitions to `happy` or `cheer` for ≥800 ms and may speak a voiceline via the audio engine

#### Scenario: Mascot reaction on retry
- **WHEN** the student gets a wrong answer
- **THEN** the mascot transitions to `oops` briefly and shows an encouraging line, never a scolding one

### Requirement: Positive Feedback Animations
The system SHALL provide encouraging visual feedback for student interactions without discouraging wrong answers. Feedback MUST be implemented through the shared motion system (see "Motion System") so that timings, easings, and reduced-motion handling are consistent across activities.

#### Scenario: Correct answer celebration
- **WHEN** a student provides a correct answer
- **THEN** the system displays a celebration animation (stars, confetti, mascot cheer) and may play a success chime

#### Scenario: Incorrect answer feedback
- **WHEN** a student provides an incorrect answer
- **THEN** the system provides gentle feedback (soft shake or wiggle) with an encouraging "再試一次" message — never red flashes, never harsh sounds

#### Scenario: Level up celebration
- **WHEN** the student levels up (gamification system)
- **THEN** a confetti burst plays, the mascot cheers, and an unlocked sticker animates into the sticker book — all built from the motion system primitives

#### Scenario: Animation accessibility
- **WHEN** a user has `prefers-reduced-motion` enabled
- **THEN** animations are simplified to short fades and instant transitions while still conveying the same information

## ADDED Requirements

### Requirement: Playground Map Home Page
The system SHALL render the home page as a child-friendly "playground map" instead of a flat 2×2 grid. The map MUST visibly host:
- Activity entry points (each as a large illustrated badge with mascot)
- The reward garden / aquarium (gamification system)
- The "今日要溫" review row (learning progress system)
- The day's 3 quests
- A persistent settings tray (theme, language, sound, kid-mode toggle)

#### Scenario: First-visit home page
- **WHEN** a student opens the app for the first time
- **THEN** the playground map renders with empty garden art, all activity badges visible and unlocked, an empty quest strip placeholder, and an onboarding panda waving

#### Scenario: Returning visit
- **WHEN** a returning student opens the app
- **THEN** the garden, streak counter, level, today's review row, and quests reflect persisted progress

#### Scenario: Touch target sizing on home
- **WHEN** the home page is viewed on a tablet
- **THEN** every interactive badge or quest card has a tappable surface ≥72 px on its smallest side

### Requirement: Illustration & Sticker System
The system SHALL provide a typed illustration registry (mascot poses, garden plants, sticker book entries, game splash art) loaded from `public/illustrations/`. Components MUST request illustrations by id rather than by raw asset path, so the registry can swap variants (e.g., dark mode, accessibility) centrally.

#### Scenario: Use a mascot pose
- **WHEN** a component renders `<Mascot id="panda" pose="cheer" />`
- **THEN** the registry resolves the correct asset and renders it with the correct intrinsic size

#### Scenario: Missing illustration
- **WHEN** a component requests an unknown id
- **THEN** in dev mode a visible placeholder and console warning are shown; in production an invisible empty box is rendered (no crash)

### Requirement: Motion System
The system SHALL provide a shared motion system with named primitives (`pop`, `wiggle`, `floatIn`, `cheer`, `confetti`, `parallax`) and standard tokens for durations and easings. All activities MUST use this system instead of ad-hoc CSS transitions.

#### Scenario: Pop a sticker into view
- **WHEN** a component plays the `pop` primitive on an element
- **THEN** the element scales from 0 → 1.1 → 1 with the system's `bouncy` easing over the system's `medium` duration

#### Scenario: Reduced motion replacement
- **WHEN** `prefers-reduced-motion: reduce` is set
- **THEN** the motion system replaces `pop`, `cheer`, `wiggle`, and `confetti` with simple opacity fades and skips parallax entirely

### Requirement: Sound & Haptics Integration
The UX layer SHALL be wired into the centralized audio engine (see `audio-feedback`) and into the device haptics API (`navigator.vibrate`) where present, so common interactions feel responsive without each component re-inventing them.

#### Scenario: Tap sound on primary buttons
- **WHEN** the student taps a primary action button
- **THEN** a short `ui.tap` sound plays through the audio engine, respecting the global mute

#### Scenario: Haptic on selection
- **WHEN** the student taps a critical control (e.g., "submit answer", "complete trace")
- **THEN** a 10–20 ms haptic pulse fires on supporting devices, with no error if the API is absent

### Requirement: Kid Mode
The system SHALL provide a "兒童模式" (Kid Mode) toggle in settings that, when on, hides text-heavy controls (advanced filters, debug counters, technical labels) in favor of larger illustrated buttons and mascot-led prompts. Kid Mode MUST default to ON for new installs.

#### Scenario: Kid Mode default
- **WHEN** a student opens the app for the first time
- **THEN** Kid Mode is on, the home page shows the playground map, and advanced filter UIs are collapsed behind a single "更多選擇" mascot button

#### Scenario: Adult turns Kid Mode off
- **WHEN** an adult turns Kid Mode off
- **THEN** all advanced controls (full filter panels, score numbers, raw stroke counts) become visible immediately and the choice is persisted

### Requirement: iPad-First Layout Defaults
The system SHALL be designed iPad-first: layouts and component sizing MUST be tuned for a 1024×768 viewport in landscape and gracefully reflow to phones (≥360 px) and desktops (≥1280 px). Every page MUST avoid horizontal scrolling at the iPad target.

#### Scenario: iPad landscape rendering
- **WHEN** the app is viewed at 1024×768 landscape
- **THEN** the playground map, mini-games hub, tracing canvas, and progress dashboard each render fully on screen with no horizontal scroll and primary content above the fold

#### Scenario: Phone reflow
- **WHEN** the app is viewed at 360 px width
- **THEN** grids collapse to single columns, mascots scale down proportionally, and touch targets remain ≥48 px
