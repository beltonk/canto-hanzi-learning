## MODIFIED Requirements

### Requirement: Cross-Viewport Verification Matrix
The system SHALL maintain an automated end-to-end test suite that loads every user-facing route at a fixed matrix of viewport profiles and asserts a set of layout invariants. The matrix MUST be runnable locally via `npm run test:e2e` and MUST run on every pull request as a required check.

The viewport profiles in the matrix MUST include at minimum:
- `iPhone SE` (375×667) portrait and landscape
- `iPad Mini` (768×1024) portrait
- `iPad Pro 11` (834×1194) portrait and landscape
- `Desktop 1440` (1440×900)

The routes in the matrix MUST include at minimum:
- `/`
- `/learn` (NEW — the learn hub landing)
- `/learn/explore`
- `/learn/flashcard`
- `/learn/decompose`
- `/learn/dictation`
- `/learn/trace`
- `/play`
- Each `/play/[gameId]` page for every registered game id
- `/favorites`
- `/progress`
- `/stickers`

#### Scenario: Run the matrix locally
- **WHEN** a developer runs `npm run test:e2e`
- **THEN** the suite loads every route × viewport combination, applies the invariants below, and exits non-zero if any combination fails

#### Scenario: CI gating
- **WHEN** a pull request is opened or updated
- **THEN** the viewport matrix runs in CI and a failing combination blocks merge until fixed

#### Scenario: Learn hub coverage
- **WHEN** the matrix runs
- **THEN** `/learn` is loaded at every viewport profile, all six invariants pass for it, and a baseline screenshot exists at `tests/e2e/responsive/__screenshots__/<viewport>/learn.png`

### Requirement: Layout Invariants Per Viewport
For every (route × viewport) cell of the matrix, the verification suite SHALL assert the following invariants:
1. **No horizontal page scroll**: `document.documentElement.scrollWidth === window.innerWidth`.
2. **No element overlaps the safe-area** or the bottom tab bar where present.
3. **Touch targets ≥44 px**: every interactive element (`button`, `a`, `[role="button"]`, form controls) has a bounding box ≥44 px on both sides after layout. Primary navigation links MUST measure ≥48 px on their smallest side.
4. **HK font first**: the computed `font-family` of any `.font-chinese`, `.hanzi-display`, `.hanzi-medium`, or `.hanzi-sentence` element begins with `'Free HK Kai'`.
5. **No inline overflow**: no element clips outside its intended container along the inline (horizontal) axis at the route's intended scroll boundary.
6. **No vertical page scroll** (NEW): `document.documentElement.scrollHeight <= window.innerHeight + 1`. A page MAY opt out of this invariant by setting `data-allow-scroll="true"` on `<body>` (used only for routes whose content is intrinsically a long article); any opt-out MUST be documented in `tests/e2e/responsive/README.md`. Routes `/`, `/learn`, `/play`, `/progress`, `/favorites`, and `/stickers` MUST NOT opt out — they MUST satisfy the invariant by moving overflow content into region-internal scrolls.

#### Scenario: Horizontal-scroll invariant on a learning page
- **WHEN** the suite loads `/learn/flashcard` on the `iPhone SE` portrait profile
- **THEN** `documentElement.scrollWidth` equals `window.innerWidth` and the assertion passes

#### Scenario: Vertical-scroll invariant on the home page
- **WHEN** the suite loads `/` on the `iPhone SE` portrait profile
- **THEN** `documentElement.scrollHeight` is at most `window.innerHeight + 1` and the assertion passes; the home page's secondary zone is allowed to scroll internally without violating the invariant

#### Scenario: Vertical-scroll invariant on the favorites grid
- **WHEN** the suite loads `/favorites` on any matrix viewport with at least 100 favorited items seeded
- **THEN** the page document does not scroll, but the inner favorites grid region scrolls within its own container and tap-targets remain ≥44 px

#### Scenario: Touch-target invariant on a game
- **WHEN** the suite loads `/play/whack-a-hanzi` on the `iPad Mini` portrait profile
- **THEN** every mole / button bounding box is at least 44×44 px

#### Scenario: Primary nav touch-target
- **WHEN** the suite inspects the primary nav at `iPhone SE` portrait (375 px wide, 5 tabs)
- **THEN** every nav link's bounding box is ≥48 px on its smallest side

#### Scenario: Font-stack invariant on every page
- **WHEN** the suite loads any route at any viewport in the matrix
- **THEN** the computed `font-family` of a sampled Chinese-display element begins with `'Free HK Kai'`

### Requirement: Visual Regression Baselines
The system SHALL capture and version-control a screenshot per (route × viewport) cell as the visual baseline. Subsequent runs MUST compare new screenshots to the baseline and surface pixel-level diffs above a configurable tolerance (default ≤0.2% changed pixels) for human review. When the navigation structure or page-fit layout primitive changes (as in this change), affected baselines MUST be regenerated and committed alongside the implementation in the same pull request.

#### Scenario: Baseline established
- **WHEN** a new route or new viewport profile is added to the matrix
- **THEN** the next test run records baseline screenshots under `tests/e2e/responsive/__screenshots__/<viewport>/<route>.png` and they are committed alongside the change

#### Scenario: Baseline regeneration after nav redesign
- **WHEN** the primary nav is collapsed from 9 to 5 items and primary pages are re-flowed into `<PageScaffold>`
- **THEN** every existing baseline screenshot is re-recorded in the same pull request, the diff is reviewed by a human, and the new baselines become the reference for future runs

#### Scenario: Visual regression detected
- **WHEN** an implementation change causes a screenshot to differ from its baseline by more than 0.2% of pixels
- **THEN** the test reports a diff image and fails the CI check until either the baseline is updated intentionally or the implementation is corrected
