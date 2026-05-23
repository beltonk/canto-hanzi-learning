# character-exploration Specification

## Purpose
TBD - created by archiving change add-core-learning-system. Update Purpose after archive.
## Requirements
### Requirement: Character Display
The system SHALL display a Traditional character with its basic information: the character form, Jyutping pronunciation, and stroke count.

#### Scenario: Display character information
- **WHEN** viewing a character in the exploration activity
- **THEN** the character, Jyutping, and stroke count are displayed clearly

### Requirement: Cantonese Audio Playback
The system SHALL provide audio playback functionality that plays the Cantonese pronunciation of the character when requested.

#### Scenario: Play character pronunciation
- **WHEN** user clicks the audio play button for a character
- **THEN** the Cantonese audio for that character is played

### Requirement: Components Display
The system SHALL display the character's components (部件/部首) in a visual format showing how the character is composed.

#### Scenario: Show character components
- **WHEN** viewing a character in exploration mode
- **THEN** the character's components and radical are displayed visually

### Requirement: 聯想圖片 Display
The system SHALL display 聯想圖片 (association images) linked to characters, using original, child-friendly illustrations inspired by historical forms.

#### Scenario: Display association image
- **WHEN** a character has an associated 聯想圖片
- **THEN** the image is displayed alongside the character to aid visual memory

### Requirement: Origin Note Display
The system SHALL display a brief note about the character's origin or etymology to support visual memory and understanding.

#### Scenario: Show character origin
- **WHEN** viewing a character in exploration mode
- **THEN** a brief note about the character's origin or evolution is displayed

### Requirement: Example Sentences Display
The system SHALL display example sentences in written Cantonese with Jyutping for the character being explored.

#### Scenario: Show usage examples
- **WHEN** viewing a character in exploration mode
- **THEN** example sentences using the character are displayed with Jyutping and optional English gloss

### Requirement: Adaptive Single-Pane vs Dual-Pane Layout
The character-exploration page SHALL render as a single column on phone portrait and phone landscape (search bar at the top, results grid below, character detail opened in a modal sheet on tap), and as a two-pane layout on iPad portrait, iPad landscape, and desktop (search + results on the left, persistent detail panel on the right).

#### Scenario: Phone single-pane layout
- **WHEN** the character-exploration page is opened on a phone (portrait or landscape)
- **THEN** the search bar is sticky at the top, the results grid fills the remaining viewport, and tapping a result opens the character detail as a full-height sheet that closes back to the results

#### Scenario: iPad dual-pane layout
- **WHEN** the character-exploration page is opened on iPad (portrait or landscape) or desktop
- **THEN** the leading column shows the search bar and results grid, the trailing column shows the selected character's detail panel, and the two panes scroll independently

### Requirement: Responsive Results Grid
The exploration page's results grid SHALL render as 3- or 4-up on phone portrait, 5- or 6-up on phone landscape, 6- to 8-up on iPad portrait, and 8- to 10-up on iPad landscape and desktop, depending on the available column width. Every result cell MUST have a tap target ≥48 px and MUST use the documented Hong Kong Chinese font stack.

#### Scenario: Grid density on phone portrait
- **WHEN** the results grid is rendered on a phone in portrait
- **THEN** the grid shows 3 or 4 columns based on viewport width, each cell is at least 48 px square, and the rendered characters use the Free HK Kai stack

#### Scenario: Grid density on iPad landscape
- **WHEN** the results grid is rendered on iPad in landscape with the full sidebar visible
- **THEN** the grid shows 8 to 10 columns, the detail panel remains visible on the right, and there is no horizontal scroll

### Requirement: Character Detail Sheet Modality on Phones
On phone form factors the character detail view SHALL open as a bottom-anchored sheet that takes the full height of the viewport minus the top safe-area inset, traps keyboard focus, and closes on `Escape`, swipe-down, or backdrop tap.

#### Scenario: Open detail on phone
- **WHEN** the student taps a result on a phone
- **THEN** the detail sheet animates up from the bottom, focus moves into the sheet, and the underlying results list is `inert`

#### Scenario: Close detail on phone
- **WHEN** the student presses `Escape`, swipes the sheet down, or taps the backdrop
- **THEN** the sheet closes, focus returns to the tapped result, and the underlying results list becomes interactive again

