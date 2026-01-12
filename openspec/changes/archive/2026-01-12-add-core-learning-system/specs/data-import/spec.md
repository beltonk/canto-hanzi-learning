## ADDED Requirements

### Requirement: Words.hk Dictionary Import
The system SHALL import Cantonese lexical data from the Words.hk dataset, extracting:
- Traditional characters
- Jyutping pronunciations
- Example sentences with Jyutping
- Tags and metadata

#### Scenario: Import Words.hk data
- **WHEN** running the import script with Words.hk dataset
- **THEN** Traditional characters, Jyutping, and examples are extracted and stored in the internal data model

#### Scenario: Filter Traditional characters only
- **WHEN** importing from Words.hk dataset
- **THEN** only Traditional characters are imported, simplified forms are excluded

### Requirement: CJK Decomposition Import
The system SHALL import character decomposition data from public CJK decomposition datasets (amake/cjk-decomp, gundramleifert/CJK-decomposition, djuretic/Hanzi), preprocessing into a simple internal format with:
- Component symbols list
- Structure type classification

#### Scenario: Import decomposition data
- **WHEN** running the import script with CJK decomposition dataset
- **THEN** decomposition data is normalized to the internal format (components list + structure type)

#### Scenario: Handle multiple decomposition sources
- **WHEN** importing from multiple CJK decomposition datasets
- **THEN** the system merges or prioritizes data to create a unified decomposition entity

### Requirement: Data Merging
The system SHALL merge character data from multiple sources (Words.hk, decomposition datasets) into unified character entities.

#### Scenario: Merge character data
- **WHEN** character data exists in both Words.hk and decomposition sources
- **THEN** the system creates a unified character entity combining pronunciation, examples, and decomposition

### Requirement: Grade Level Filtering
The import pipeline SHALL filter characters to only include those aligned with Hong Kong P1–P3 curricula.

#### Scenario: Filter by grade level
- **WHEN** importing character data
- **THEN** only characters tagged with P1, P2, or P3 grade levels are included in the final dataset

### Requirement: Import Validation
The import pipeline SHALL validate imported data and handle errors gracefully, reporting missing fields or format issues.

#### Scenario: Validation error handling
- **WHEN** imported data has missing required fields or invalid format
- **THEN** the system reports validation errors and skips invalid entries without stopping the entire import
