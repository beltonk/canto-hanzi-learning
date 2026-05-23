## ADDED Requirements

### Requirement: Per-Character Mastery State
The system SHALL maintain a per-character mastery record per device, with the states `unseen`, `introduced`, `practiced`, and `mastered`, plus the timestamp of the last interaction and a per-state interaction count.

#### Scenario: First interaction
- **WHEN** the student interacts with a character for the first time in any activity (explore view, flashcard, tracing, dictation, mini-game)
- **THEN** the character's state moves from `unseen` to `introduced` and the timestamp is recorded

#### Scenario: Repeated successful interactions
- **WHEN** the student successfully completes activities involving the character (e.g., 3-star trace, correct dictation, correct mini-game tap) at least 3 times across at least 2 distinct days
- **THEN** the character is promoted to `mastered`

### Requirement: Activity Result Recording
The system SHALL record the outcome of every rewarded activity completion (activity type, characters/words involved, score, stars, timestamp, duration) into a local activity log used by the progress dashboard and SRS.

#### Scenario: Record a tracing result
- **WHEN** the tracing activity finishes a character with a star score
- **THEN** an entry `{ type: "trace", char, stars, durationMs, timestamp }` is appended to the activity log

#### Scenario: Record a mini-game result
- **WHEN** a mini-game ends
- **THEN** an entry `{ type: "game", gameId, items, stars, durationMs, timestamp }` is appended

### Requirement: Spaced Repetition Queue
The system SHALL maintain a simple spaced-repetition queue that schedules characters for review based on their mastery state and the time since last interaction (using fixed intervals: 1 day, 3 days, 7 days, 21 days for `practiced`/`mastered` characters).

#### Scenario: Build today's review list
- **WHEN** the student opens the app on a new day
- **THEN** the system computes a "今日要溫" (Today's review) list of up to 20 characters whose next-due date is today or earlier

#### Scenario: Reschedule after review
- **WHEN** the student successfully reviews a character via flashcard or tracing
- **THEN** its next-due date is pushed forward by the next interval in the schedule

### Requirement: Difficulty Hint API
The progress system SHALL expose a function that, given a request size N, returns a recommended mix of characters/words from the student's history for use by activities and mini-games.

#### Scenario: Recommend a game item set
- **WHEN** a mini-game requests N items with the default mix hint
- **THEN** the system returns roughly 70% mastered, 25% practiced, 5% new characters drawn from the active scope filters

#### Scenario: Cold start
- **WHEN** the student has no history yet
- **THEN** the system returns N characters chosen from the current scope filters in stable order, without crashing

### Requirement: Kid-Friendly Progress Dashboard
The system SHALL provide a "我嘅進度" dashboard showing, in a primary-school-readable layout: total characters known, current streak and level, a 7-day activity bar chart, a "今日要溫" list, and a treemap or grid colored by mastery state.

#### Scenario: View dashboard
- **WHEN** the student opens the progress dashboard
- **THEN** all sections render with the user's actual data; sections with no data show empty-state mascot illustrations instead of zeros

#### Scenario: Tap a character cell in the mastery grid
- **WHEN** the student taps a character cell
- **THEN** a popover shows its mastery state, last 3 results, and a button to jump straight into tracing or flashcard for that character

### Requirement: Local-Only Storage and Export
All learning progress data SHALL be stored locally per device. The system MUST provide a JSON export and import for the progress data so a parent or teacher can move it between devices manually.

#### Scenario: Export progress
- **WHEN** an adult chooses "匯出進度" in settings
- **THEN** the system downloads a `progress-YYYYMMDD.json` file containing the full progress state

#### Scenario: Import progress
- **WHEN** an adult chooses "匯入進度" and selects a valid export file
- **THEN** the system replaces the current progress with the imported data after a confirm dialog

### Requirement: Data Schema Versioning
The progress data SHALL include a schema version field. The system MUST migrate older versions forward on read; unknown future versions MUST fall back to a clean read-only view that does not corrupt data.

#### Scenario: Migrate on load
- **WHEN** the app loads progress data with an older schema version
- **THEN** the system applies migrations and saves the upgraded version back to storage

#### Scenario: Future version detected
- **WHEN** the loaded data has a higher schema version than the running app
- **THEN** the app displays a friendly "請更新應用程式" notice and treats the data as read-only without erasing it
