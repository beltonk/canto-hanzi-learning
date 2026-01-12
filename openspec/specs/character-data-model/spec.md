# character-data-model Specification

## Purpose
TBD - created by archiving change add-core-learning-system. Update Purpose after archive.
## Requirements
### Requirement: Character Entity
The system SHALL store character entities with the following attributes:
- Traditional character (single character string)
- Grade level (P1, P2, or P3)
- Radical (部首)
- Stroke count (integer)
- Decomposition reference (link to decomposition entity)
- Jyutping pronunciation (romanization string)
- Brief meanings (array of strings)
- Topical tags (array of strings, e.g., "family", "school", "food")

#### Scenario: Character entity creation
- **WHEN** a character entity is created with all required fields
- **THEN** the entity is stored and can be retrieved by character or grade level

#### Scenario: Character filtering by grade
- **WHEN** querying characters for grade P1
- **THEN** only characters with grade="P1" are returned

### Requirement: Example Entity
The system SHALL store example entities linked to characters with:
- Target character reference
- Short written Cantonese sentence
- Jyutping for the sentence
- Optional English gloss
- Image reference (URL or file path for 聯想圖片)
- Audio reference (URL to Cantonese audio)

#### Scenario: Example linked to character
- **WHEN** retrieving a character with examples
- **THEN** all associated example entities are included with their sentences, Jyutping, and media references

### Requirement: Decomposition Entity
The system SHALL store decomposition entities with:
- Target character (Traditional character)
- List of component symbols (array of character strings)
- Structure type (e.g., "left-right", "top-bottom", "surround", "single")

#### Scenario: Decomposition retrieval
- **WHEN** requesting decomposition for a character
- **THEN** the decomposition entity returns the component list and structure type

### Requirement: Audio Asset Entity
The system SHALL store audio asset entities with:
- Text source (the Cantonese text that was converted to speech)
- Category (one of: "character", "word", "sentence")
- Chosen voice identifier
- URL of the generated Cantonese audio clip

#### Scenario: Audio asset retrieval
- **WHEN** requesting audio for a character or example
- **THEN** the audio asset entity provides the URL to the generated audio file

### Requirement: Traditional Character Constraint
The system SHALL only store and display Traditional Chinese characters. Simplified character forms MUST NOT be stored or displayed anywhere in the system.

#### Scenario: Simplified character rejection
- **WHEN** attempting to import or store a simplified character
- **THEN** the system rejects it or converts it to Traditional form before storage

