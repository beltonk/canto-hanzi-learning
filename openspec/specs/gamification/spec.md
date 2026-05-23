# gamification Specification

## Purpose
TBD - created by archiving change revamp-kids-ui-and-add-fun-games. Update Purpose after archive.

## Requirements
### Requirement: XP and Levels
The system SHALL track a single XP counter per device and convert it into a level using a documented curve. Every learning action (tracing a character, completing a flashcard set, winning a mini-game, finishing a dictation set, etc.) MUST award XP by a fixed table.

#### Scenario: Earning XP from an activity
- **WHEN** the student completes any rewarded action (e.g., 3-star tracing, finishing a Word Builder round)
- **THEN** the system increments XP by the action's table value and shows a small "+12 XP" toast that animates upward and fades

#### Scenario: Level up
- **WHEN** XP crosses a level threshold
- **THEN** a level-up celebration plays (mascot, confetti, chime) and a new sticker or mascot pose is unlocked from the catalogue

### Requirement: Daily Streaks
The system SHALL track a daily-practice streak that increments on each calendar day during which the student completes at least one rewarded action, and resets if a day is missed.

#### Scenario: Increment streak
- **WHEN** the student completes any rewarded action on a calendar day after midnight local time
- **THEN** the streak counter increments by one and a small flame icon animates

#### Scenario: Break streak
- **WHEN** a calendar day passes with zero rewarded actions
- **THEN** the streak resets to zero on next launch and the student is shown a gentle "返黎啦！重新開始" message instead of a punishing one

#### Scenario: Streak freeze (grace day)
- **WHEN** the student has a streak ≥7 and misses one day
- **THEN** one automatic "freeze" is consumed (max 1 in inventory) and the streak does not break

### Requirement: Daily Quests
The system SHALL offer 3 small daily quests at midnight, each tied to a specific action (e.g., "trace 5 characters", "win 1 mini-game", "review 10 flashcards"). Completed quests award bonus XP and a sticker chance.

#### Scenario: View quests
- **WHEN** the student opens the home page
- **THEN** the day's 3 quests are visible as a horizontal strip with progress bars

#### Scenario: Complete a quest
- **WHEN** the student fulfills a quest's condition
- **THEN** the quest card flips to "完成" with a checkmark, bonus XP is granted, and a sticker may be awarded

### Requirement: Sticker / Mascot Catalogue
The system SHALL maintain a catalogue of unlockable stickers and mascot poses, viewable from a "貼紙簿" (Sticker Book) screen.

#### Scenario: Unlock a sticker
- **WHEN** an action awards a sticker (level-up, quest completion, special game milestone)
- **THEN** the sticker is added to the catalogue with the date earned and a "NEW" badge until viewed

#### Scenario: View the sticker book
- **WHEN** the student opens the sticker book
- **THEN** all stickers are shown; locked ones appear as silhouettes with an unlock hint

### Requirement: Reward Home (Garden / Aquarium)
The system SHALL render a persistent "garden" or "aquarium" panel on the home page that grows visually as the student earns XP — e.g., new plants/flowers/sea creatures appear at level milestones.

#### Scenario: Add a plant on level up
- **WHEN** the student levels up
- **THEN** a new plant or sea creature is added to the home garden with an animation, and is permanent

#### Scenario: Tap a plant
- **WHEN** the student taps a plant or creature in the garden
- **THEN** its name and the date it was earned are displayed in a small popover

### Requirement: End-of-Session Summary
The system SHALL show a unified end-of-session summary whenever a student leaves any activity that earned XP, recapping XP gained, characters/words practiced, current streak, and quest progress.

#### Scenario: Summary on activity exit
- **WHEN** the student taps "返主頁" or "完成" from any rewarded activity
- **THEN** the summary modal appears before navigation and dismisses on tap

### Requirement: Local Persistence and Reset
The system SHALL persist all gamification state (XP, level, streak, freezes, stickers, garden, quest progress) in browser local storage, scoped per browser/device, with no account required. The system MUST provide a parent/teacher "Reset progress" control behind a confirm dialog.

#### Scenario: Persist across sessions
- **WHEN** the student returns to the app on the same device
- **THEN** their XP, level, streak, and stickers are restored

#### Scenario: Reset progress
- **WHEN** an adult uses the Reset Progress control and confirms
- **THEN** all gamification state is cleared and the home page returns to the empty garden state

### Requirement: No Negative Feedback for Wrong Answers
The gamification layer MUST NOT punish wrong answers (no XP loss, no streak break for wrong answers within a day, no sad sounds). Mistakes are encouraged via gentle, supportive feedback only.

#### Scenario: Wrong answer in a game
- **WHEN** the student gives a wrong answer in any rewarded activity
- **THEN** XP and streak are unchanged and the system shows a friendly "再試一次" without penalty
