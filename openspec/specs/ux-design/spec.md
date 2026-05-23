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
The system SHALL be designed to render correctly across **every supported form factor and orientation**, not only iPad landscape. Layouts and component sizing MUST be tuned so that:
- Phone portrait (≥360 px wide) renders all primary content above the fold with the bottom-tab navigation and a 1-column grid.
- Phone landscape (≥568 px wide, height ≤500 px) renders with a top-tab navigation to reclaim vertical space and a 2-column or row-oriented layout where appropriate.
- iPad portrait and iPad split-view (≥768 px wide) renders with an icon rail (compact sidebar) instead of the mobile bottom tab bar, and a 2- or 3-column grid where content allows.
- iPad landscape and desktop (≥1024 px) renders with the full labelled sidebar and a 3- or 4-column grid.

Every page MUST avoid horizontal scrolling in every (form factor × orientation) combination defined by the canonical breakpoint contract.

#### Scenario: Phone portrait rendering
- **WHEN** the app is viewed at 360–430 px width in portrait
- **THEN** the playground map, every learning page, and every mini-game render with no horizontal scroll, the bottom-tab nav visible, touch targets ≥48 px, and all chrome respecting the bottom safe-area inset

#### Scenario: Phone landscape rendering
- **WHEN** the app is viewed at a phone landscape viewport (width ≥568 px, height ≤500 px)
- **THEN** the navigation moves to the top of the screen (top-tabs), the main content area uses the freed vertical space, and no element overlaps the iOS notch in landscape

#### Scenario: iPad portrait / split-view rendering
- **WHEN** the app is viewed at 768–1023 px width
- **THEN** an icon rail (compact sidebar) is shown instead of the bottom tab bar, learning canvases and game boards expand to fill the freed horizontal space, and the page renders with no horizontal scroll

#### Scenario: iPad landscape rendering
- **WHEN** the app is viewed at 1024×768 landscape
- **THEN** the playground map, mini-games hub, tracing canvas, and progress dashboard each render fully on screen with no horizontal scroll, the full labelled sidebar is shown, and primary content is above the fold

#### Scenario: Phone reflow
- **WHEN** the app is viewed at 360 px width
- **THEN** grids collapse to single columns, mascots scale down proportionally, and touch targets remain ≥48 px

#### Scenario: Orientation flip retains state
- **WHEN** the device rotates from portrait to landscape (or vice versa) while a learning activity is in progress
- **THEN** the layout switches to the orientation-appropriate variant within one animation frame, no in-progress input (current trace, dictation input, selected tile) is lost, and the focus indicator remains on the previously focused element

### Requirement: Navigation Adapts to Form Factor and Orientation
The system SHALL render one of four navigation variants chosen by form factor and orientation, not by width alone:
- **Bottom tabs** for phone portrait
- **Top tabs** for phone landscape
- **Icon rail** (compact sidebar with icons, no labels) for iPad portrait and iPad split-view
- **Full sidebar** (labels and status pills) for iPad landscape and desktop

All variants MUST surface the same navigation items in the same order. The active item MUST be visibly highlighted and MUST carry `aria-current="page"`. Every nav link MUST have a tap area ≥44 px.

#### Scenario: Phone portrait nav
- **WHEN** the viewport is phone-portrait
- **THEN** the bottom tab bar is visible, the sidebar is hidden, and the bottom bar sits above the home-indicator safe area

#### Scenario: Phone landscape nav
- **WHEN** the viewport is phone-landscape
- **THEN** a top-tab navigation is visible, the bottom tab bar is hidden, and the main content occupies the maximum possible height

#### Scenario: iPad portrait nav
- **WHEN** the viewport is iPad-portrait or iPad split-view
- **THEN** a 64-px-wide icon rail is visible on the leading edge with tooltips on hover/long-press, and the bottom tab bar is hidden

#### Scenario: iPad landscape and desktop nav
- **WHEN** the viewport is iPad-landscape or desktop (≥1024 px wide)
- **THEN** the full sidebar with labels and status pills is visible, the bottom tab bar is hidden, and the layout matches the current desktop experience

### Requirement: Safe-Area and Notch Awareness
The system SHALL honour iOS safe-area insets (notch, home indicator) and Android system bars on every page. Sticky headers MUST pad their top by `--safe-top`; bottom tab bars MUST pad their bottom by `--safe-bottom`; full-screen overlays (modals, game canvases) MUST respect all four insets.

#### Scenario: iPhone notch in landscape
- **WHEN** any page is rendered on an iPhone in landscape with the notch on the leading edge
- **THEN** the back button, page title, status pills, and any leading content are inset past the notch and not clipped by it

#### Scenario: Bottom home indicator on iPhone
- **WHEN** the mobile bottom tab bar is rendered on an iPhone with a home indicator
- **THEN** the tab labels and active dots sit above the home indicator, and the tab-bar background fills the inset area beneath them

### Requirement: Fluid Chinese Typography Preserves HK Stroke Stack
The system's Chinese display utilities (`.font-chinese`, `.hanzi-display`, `.hanzi-medium`, `.hanzi-sentence`, `.jyutping`) SHALL use viewport-responsive `clamp()` font-sizes while keeping the `font-family` chain identical to today: `'Free HK Kai', 'LXGW WenKai TC', var(--font-serif-tc), var(--font-sans-tc), 'Noto Serif TC', 'PMingLiU', serif`. No other property of the font stack — weight, style, font-display, or load order — may change as part of responsive work.

#### Scenario: Stroke style preserved on small screens
- **WHEN** an `.hanzi-medium` element is rendered at a 360 px viewport
- **THEN** the visible glyph is rendered by `Free HK Kai` (or its `LXGW WenKai TC` Kaiti fallback for chars Free HK Kai doesn't ship) and the brushstroke shape matches the desktop rendering of the same glyph

#### Scenario: Stroke style preserved on large screens
- **WHEN** an `.hanzi-medium` element is rendered at a 1440 px viewport
- **THEN** the visible glyph is rendered by the same first-available family as on the 360 px viewport, with no fallback to Noto Sans or PMingLiU
