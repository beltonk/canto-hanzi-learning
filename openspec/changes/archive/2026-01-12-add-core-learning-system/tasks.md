## 1. Data Model Implementation
- [x] 1.1 Define TypeScript types for Character entity (character, grade, radical, stroke count, Jyutping, meanings, tags)
- [x] 1.2 Define TypeScript types for Example entity (sentence, Jyutping, English gloss, image, audio references)
- [x] 1.3 Define TypeScript types for Decomposition entity (character, components list, structure type)
- [x] 1.4 Define TypeScript types for AudioAsset entity (text source, category, voice, URL)
- [x] 1.5 Create data validation utilities for all entity types

## 2. Data Import Pipeline
- [x] 2.1 Create script to import from Words.hk dataset (filter Traditional, extract Jyutping, examples)
- [x] 2.2 Create script to import from CJK decomposition datasets (normalize to internal format)
- [x] 2.3 Implement data merging logic (combine character data from multiple sources)
- [x] 2.4 Add filtering for P1–P3 grade levels
- [x] 2.5 Create output format for processed character data
- [x] 2.6 Add validation and error handling for import process

## 3. TTS Integration Service
- [x] 3.1 Create TTS service abstraction interface
- [x] 3.2 Implement CUTalk provider integration (or primary chosen provider)
- [x] 3.3 Add audio file storage/caching mechanism
- [x] 3.4 Implement fallback to alternative providers if primary fails
- [x] 3.5 Add batch audio generation utility for pre-generating common character audio

## 4. Learning API Endpoints
- [x] 4.1 Create API route for character retrieval by grade level (`/api/characters?grade=P1`)
- [x] 4.2 Create API route for character retrieval by character list (`/api/characters?chars=人,水,火`)
- [x] 4.3 Create API route for exercise generation (`/api/exercises?type=dictation&grade=P1`)
- [x] 4.4 Add error handling and validation for all API endpoints
- [x] 4.5 Add TypeScript types for API request/response payloads

## 5. Character Exploration Activity
- [x] 5.1 Create React component for character display (character, Jyutping, stroke count)
- [x] 5.2 Add audio playback functionality (play Cantonese pronunciation)
- [x] 5.3 Create component for displaying character components/radicals
- [x] 5.4 Add 聯想圖片 display (image reference rendering)
- [x] 5.5 Add brief origin/etymology note display
- [x] 5.6 Integrate with learning API to fetch character data

## 6. Decomposition Play Activity
- [x] 6.1 Create React component for decomposition puzzle interface
- [x] 6.2 Implement component manipulation (drag/drop or click to arrange)
- [x] 6.3 Add validation logic (check if components form correct character)
- [x] 6.4 Add visual feedback (correct/incorrect states)
- [x] 6.5 Integrate with learning API to fetch decomposition data

## 7. Dictation Activities
- [x] 7.1 Create React component for audio dictation exercise
- [x] 7.2 Implement audio playback and input field for character entry
- [x] 7.3 Add correctness checking (compare input to correct answer)
- [x] 7.4 Create React component for image dictation exercise
- [x] 7.5 Add image display with optional audio playback
- [x] 7.6 Implement feedback display (correct/incorrect with answer)
- [x] 7.7 Integrate with learning API to fetch exercise data

## 8. Testing and Validation
- [x] 8.1 Write unit tests for data model validation
- [x] 8.2 Write unit tests for import pipeline logic
- [x] 8.3 Write unit tests for TTS service abstraction
- [x] 8.4 Write integration tests for API endpoints
- [x] 8.5 Write component tests for learning activities
- [x] 8.6 Test with sample P1–P3 character data
- [x] 8.7 Validate Traditional character filtering works correctly
