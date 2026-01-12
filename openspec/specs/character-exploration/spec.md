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

