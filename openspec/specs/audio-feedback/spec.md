# audio-feedback Specification

## Purpose
TBD - created by archiving change revamp-kids-ui-and-add-fun-games. Update Purpose after archive.

## Requirements
### Requirement: Centralized Audio Engine
The system SHALL provide a single client-side audio engine (built on the Web Audio API where available, with an `<audio>` element fallback) that owns playback for all UI sounds, mascot voicelines, brush sounds, success/failure cues, per-game music beds, and TTS character pronunciation. All other modules MUST route audio playback through this engine instead of creating their own `Audio` instances.

#### Scenario: Play a UI sound
- **WHEN** any module requests a registered sound by id (e.g., `audio.play("ui.tap")`)
- **THEN** the engine plays it at the correct gain channel without overlapping itself if it's a non-overlap effect

#### Scenario: Lazy load
- **WHEN** a sound is requested for the first time
- **THEN** the engine fetches and decodes the asset, caches it, and plays as soon as it's ready

### Requirement: Sound Categories and Mix
The audio engine SHALL classify sounds into at least four categories: `ui`, `voice`, `music`, `effect`, each with its own gain control, so that, for example, music can be ducked while a mascot voiceline plays.

#### Scenario: Duck music for voice
- **WHEN** a `voice` sound starts playing while a `music` track is active
- **THEN** the engine reduces the `music` gain to 30% for the duration of the voice clip and restores it after

### Requirement: Global Sound Toggle and Per-Category Toggles
The system SHALL provide a global sound on/off toggle in the settings UI and additionally a per-category toggle (mute music, mute voice, mute effects) for parents/teachers.

#### Scenario: Global mute
- **WHEN** the global toggle is off
- **THEN** no sounds in any category are played

#### Scenario: Mute only music
- **WHEN** the music toggle is off but global is on
- **THEN** music does not play but voice, effects, and UI sounds still play

#### Scenario: Persistence
- **WHEN** the student or adult changes a sound toggle
- **THEN** the choice is persisted in `localStorage` and restored on next launch

### Requirement: Mascot Voicelines
The system SHALL provide a library of pre-recorded short Cantonese mascot voicelines (e.g., "好叻呀！", "再試一次", "三粒星！") that activities can trigger by id. Voicelines MUST be classified as `voice` for ducking purposes.

#### Scenario: Trigger a voiceline
- **WHEN** an activity calls `audio.voice("praise.three_stars")`
- **THEN** the engine plays a randomly chosen "three stars" voiceline from the available variants and ducks any active music

#### Scenario: Voiceline missing
- **WHEN** the requested voiceline id is not registered
- **THEN** the engine logs a warning in dev mode and silently no-ops in production (no crash)

### Requirement: Per-Game Music Beds
The system SHALL allow each mini-game to register a music bed that loops while the game is in its active state and stops when paused or exited.

#### Scenario: Game music starts
- **WHEN** a game enters its active state
- **THEN** its registered music bed begins looping at the music gain level

#### Scenario: Game music stops
- **WHEN** the game pauses, ends, or the student exits to the hub
- **THEN** the music bed stops within 250 ms (with a short fade-out)

### Requirement: Brushstroke Sound Streaming
The system SHALL provide a continuous brush/ink sound that plays only while the student is actively drawing a stroke in the tracing activity, smoothly looping during the stroke and stopping when the pointer is lifted.

#### Scenario: Smooth brush sound
- **WHEN** the student begins a stroke
- **THEN** the brush sound starts within 50 ms and loops without an audible seam until the stroke ends

### Requirement: Asset Budget and Lazy Loading
The system SHALL keep the initial sound asset payload (loaded on first home-page visit) to ≤500 KB total and SHALL lazy-load per-game music and per-activity voicelines on activity entry.

#### Scenario: Initial payload
- **WHEN** the home page loads on a fresh visit
- **THEN** only UI sounds and the success/failure chimes are fetched; music beds and voicelines are not

### Requirement: Reuse for Cantonese TTS
The existing Web Speech / Cantonese TTS pronunciation feature SHALL also be routed through the audio engine so it respects the global mute and ducks music like other voice clips.

#### Scenario: TTS while music plays
- **WHEN** the student taps "聽發音" while a game's music bed is playing
- **THEN** the music ducks for the duration of the TTS playback and restores after
