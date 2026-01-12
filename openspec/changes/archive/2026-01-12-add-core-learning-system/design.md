# Design: Core Learning System

## Context
This system provides Traditional Chinese character learning for Hong Kong P1–P3 students. It must handle:
- Traditional characters only (no simplified forms)
- Cantonese pronunciation (Jyutping) with audio
- Character decomposition and visual learning aids
- Interactive exercises (exploration, puzzles, dictation)
- Integration with external data sources and TTS services

## Goals / Non-Goals

### Goals
- Support P1–P3 curriculum characters with grade-level filtering
- Provide visual learning aids (聯想圖片, 拆字視覺化) with child-friendly illustrations
- Enable interactive decomposition puzzles
- Support audio and image-based dictation exercises
- Integrate with open Cantonese dictionary and CJK decomposition datasets
- Generate Cantonese audio via TTS service

### Non-Goals
- Simplified character support
- Characters outside P1–P3 scope
- Real-time multiplayer or social features
- Progress tracking or user accounts (future scope)
- Stroke order animation (future scope)

## Decisions

### Decision: Data Storage Format
**What**: Store character data, examples, and decomposition in structured format (JSON/TypeScript types initially, database later if needed)
**Why**: Start simple with file-based storage for MVP, migrate to database when scale requires it
**Alternatives considered**: 
- Start with database (PostgreSQL/SQLite) - Rejected: premature optimization
- Use external API only - Rejected: need offline capability and performance

### Decision: TTS Service Selection
**What**: Support multiple TTS providers (CUTalk, Aivoov, cantonese.ai) with abstraction layer
**Why**: Provider availability and quality may vary; abstraction allows switching
**Alternatives considered**:
- Single provider only - Rejected: risk of vendor lock-in
- Client-side TTS only - Rejected: quality and consistency concerns

### Decision: Character Decomposition Format
**What**: Use simplified internal format derived from CJK decomposition datasets
**Why**: Different sources have different formats; normalize to simple structure (components list + structure type)
**Alternatives considered**:
- Use raw decomposition format - Rejected: too complex, inconsistent across sources
- Custom decomposition - Rejected: requires domain expertise and manual work

### Decision: Image Storage
**What**: Store 聯想圖片 references (URLs or file paths) linked to characters
**Why**: Images are external assets; store references, not binary data initially
**Alternatives considered**:
- Embed images as base64 - Rejected: bloats data files
- Require all characters to have images - Rejected: MVP should work with partial data

### Decision: API Architecture
**What**: Next.js API routes (App Router) for character and exercise retrieval
**Why**: Leverages existing Next.js stack, server-side rendering support, simple deployment
**Alternatives considered**:
- Separate backend service - Rejected: adds complexity, not needed for MVP
- Client-side only - Rejected: need server-side data processing and TTS integration

## Risks / Trade-offs

### Risk: TTS Service Availability
- **Risk**: External TTS service may be unavailable or rate-limited
- **Mitigation**: Cache generated audio files, support multiple providers, graceful degradation

### Risk: Data Source Format Changes
- **Risk**: External datasets (Words.hk, CJK decomposition) may change format
- **Mitigation**: Version import scripts, validate data on import, store processed data locally

### Risk: Character Coverage Gaps
- **Risk**: Not all P1–P3 characters may be in external datasets
- **Mitigation**: Manual curation for missing characters, prioritize high-frequency characters

### Trade-off: Simplicity vs Completeness
- **Trade-off**: Start with essential features, add advanced features (stroke order, progress tracking) later
- **Decision**: MVP focuses on core learning activities, defer advanced features

## Migration Plan
- N/A (new system, no migration needed)
- Future: When adding database, create migration scripts to move from file-based to database storage

## Open Questions
- Which TTS provider should be primary? (Evaluate CUTalk, Aivoov, cantonese.ai for quality, cost, rate limits)
- How to handle missing decomposition data for some characters? (Manual entry, skip, or use fallback)
- Should audio be pre-generated for all characters or generated on-demand? (Pre-generate for common characters, on-demand for others)
