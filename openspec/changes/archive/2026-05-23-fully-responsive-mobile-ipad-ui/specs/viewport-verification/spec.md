## ADDED Requirements

### Requirement: Cross-Viewport Verification Matrix
The system SHALL maintain an automated end-to-end test suite that loads every user-facing route at a fixed matrix of viewport profiles and asserts a set of layout invariants. The matrix MUST be runnable locally via `npm run test:e2e` and MUST run on every pull request as a required check.

The viewport profiles in the matrix MUST include at minimum:
- `iPhone SE` (375×667) portrait and landscape
- `iPad Mini` (768×1024) portrait
- `iPad Pro 11` (834×1194) portrait and landscape
- `Desktop 1440` (1440×900)

The routes in the matrix MUST include at minimum:
- `/`
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

### Requirement: Layout Invariants Per Viewport
For every (route × viewport) cell of the matrix, the verification suite SHALL assert the following invariants:
1. No horizontal page scroll: `document.documentElement.scrollWidth === window.innerWidth`.
2. No element overlaps the safe-area or the bottom tab bar where present.
3. Every interactive element (`button`, `a`, `[role="button"]`, form controls) has a bounding box ≥44 px on both sides after layout.
4. The computed `font-family` of any `.font-chinese`, `.hanzi-display`, `.hanzi-medium`, or `.hanzi-sentence` element begins with `'Free HK Kai'`.
5. No element clips outside its intended container along the inline (horizontal) axis at the route's intended scroll boundary.

#### Scenario: Horizontal-scroll invariant on a learning page
- **WHEN** the suite loads `/learn/flashcard` on the `iPhone SE` portrait profile
- **THEN** `documentElement.scrollWidth` equals `window.innerWidth` and the assertion passes

#### Scenario: Touch-target invariant on a game
- **WHEN** the suite loads `/play/whack-a-hanzi` on the `iPad Mini` portrait profile
- **THEN** every mole / button bounding box is at least 44×44 px

#### Scenario: Font-stack invariant on every page
- **WHEN** the suite loads any route at any viewport in the matrix
- **THEN** the computed `font-family` of a sampled Chinese-display element begins with `'Free HK Kai'`

### Requirement: Visual Regression Baselines
The system SHALL capture and version-control a screenshot per (route × viewport) cell as the visual baseline. Subsequent runs MUST compare new screenshots to the baseline and surface pixel-level diffs above a configurable tolerance (default ≤0.2% changed pixels) for human review.

#### Scenario: Baseline established
- **WHEN** a new route or new viewport profile is added to the matrix
- **THEN** the next test run records baseline screenshots under `tests/e2e/responsive/__screenshots__/<route>/<viewport>.png` and they are committed alongside the change

#### Scenario: Visual regression detected
- **WHEN** an implementation change causes a screenshot to differ from its baseline by more than 0.2% of pixels
- **THEN** the test reports a diff image and fails the CI check until either the baseline is updated intentionally or the implementation is corrected

### Requirement: Verification Loop Documentation
The system SHALL document the verification protocol — how to add a new route to the matrix, how to add a new viewport profile, how to re-baseline screenshots, and how to run a single (route × viewport) cell — in `tests/e2e/responsive/README.md`. The document MUST be discoverable from the repository `README.md`.

#### Scenario: Add a route to the matrix
- **WHEN** a contributor introduces a new top-level user-facing route
- **THEN** following the documented procedure adds it to the matrix in one place and the suite begins verifying it on the next run

#### Scenario: Re-baseline after an intentional visual change
- **WHEN** a contributor intentionally changes a page's visual layout
- **THEN** the documented `npm run test:e2e -- --update-snapshots` (or equivalent) command refreshes the affected baselines and only those baselines
