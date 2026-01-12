# learning-api Specification

## Purpose
TBD - created by archiving change add-core-learning-system. Update Purpose after archive.
## Requirements
### Requirement: Character Retrieval by Grade
The system SHALL provide an API endpoint that returns character entities for a given grade level (P1, P2, or P3), including associated decomposition, examples, and asset references.

#### Scenario: Retrieve P1 characters
- **WHEN** calling `/api/characters?grade=P1`
- **THEN** the API returns all character entities for grade P1 with their decomposition, examples, and audio/image references

#### Scenario: Retrieve P2 characters
- **WHEN** calling `/api/characters?grade=P2`
- **THEN** the API returns all character entities for grade P2 with complete data

### Requirement: Character Retrieval by Character List
The system SHALL provide an API endpoint that returns character entities for a specified list of characters.

#### Scenario: Retrieve specific characters
- **WHEN** calling `/api/characters?chars=人,水,火`
- **THEN** the API returns character entities for 人, 水, and 火 with all associated data

### Requirement: Exercise Retrieval
The system SHALL provide an API endpoint that returns dictation and game tasks (audio dictation, image dictation, decomposition tasks) with all required text, media URLs, and correct answers.

#### Scenario: Retrieve dictation exercises
- **WHEN** calling `/api/exercises?type=dictation&grade=P1`
- **THEN** the API returns dictation exercise tasks with audio URLs, correct answers, and metadata

#### Scenario: Retrieve decomposition exercises
- **WHEN** calling `/api/exercises?type=decomposition&grade=P1`
- **THEN** the API returns decomposition puzzle tasks with component lists and target characters

### Requirement: API Error Handling
The API SHALL return appropriate error responses for invalid requests (invalid grade, missing characters, etc.).

#### Scenario: Invalid grade parameter
- **WHEN** calling `/api/characters?grade=invalid`
- **THEN** the API returns a 400 error with a descriptive error message

#### Scenario: Character not found
- **WHEN** calling `/api/characters?chars=不存在`
- **THEN** the API returns a 404 error or empty result set with appropriate status

