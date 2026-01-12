## ADDED Requirements

### Requirement: TTS Service Abstraction
The system SHALL provide a TTS service abstraction that supports multiple Cantonese TTS providers (CUTalk, Aivoov, cantonese.ai) with a unified interface.

#### Scenario: Generate audio via TTS service
- **WHEN** requesting Cantonese audio for a character, word, or sentence
- **THEN** the TTS service generates audio and returns a URL to the audio file

#### Scenario: Provider fallback
- **WHEN** the primary TTS provider fails or is unavailable
- **THEN** the system falls back to an alternative provider automatically

### Requirement: Audio Asset Storage
The system SHALL store generated audio files and create audio asset entity references with:
- Text source
- Category (character, word, or sentence)
- Voice identifier
- Audio file URL

#### Scenario: Store generated audio
- **WHEN** TTS service generates audio for a character
- **THEN** the audio file is stored and an audio asset entity is created with the URL reference

### Requirement: Audio Caching
The system SHALL cache generated audio files to avoid redundant TTS API calls for the same text.

#### Scenario: Reuse cached audio
- **WHEN** requesting audio for text that was previously generated
- **THEN** the system returns the cached audio URL instead of calling TTS service again

### Requirement: Batch Audio Generation
The system SHALL support batch generation of audio files for pre-generating common character pronunciations.

#### Scenario: Batch generate character audio
- **WHEN** running batch audio generation for a list of characters
- **THEN** audio files are generated for all characters and stored with proper asset references
