# Change: Add Core Learning System

## Why
Build an interactive Traditional Chinese character learning system for Hong Kong P1–P3 students. The system will help students learn Cantonese pronunciation, character recognition, decomposition, and dictation through engaging activities. This establishes the foundation for all learning features.

## What Changes
- **ADDED** Core data model for characters, examples, decomposition, and audio assets
- **ADDED** Data import pipeline from external sources (Words.hk, CJK decomposition datasets)
- **ADDED** Character exploration activity with visual aids and pronunciation
- **ADDED** Decomposition play activity as interactive puzzle
- **ADDED** Dictation exercises (audio-based and image-based)
- **ADDED** TTS integration service for Cantonese audio generation
- **ADDED** Learning API endpoints for character retrieval and exercise generation

## Impact
- **Affected specs**: New capabilities: `character-data-model`, `data-import`, `character-exploration`, `decomposition-play`, `dictation`, `tts-integration`, `learning-api`
- **Affected code**: 
  - New data models and schemas
  - New API routes in Next.js App Router
  - New React components for learning activities
  - New services for TTS and data import
- **External dependencies**: 
  - Words.hk dataset (Cantonese dictionary)
  - CJK decomposition datasets (amake/cjk-decomp, gundramleifert/CJK-decomposition, djuretic/Hanzi)
  - Cantonese TTS service (CUTalk, Aivoov, or cantonese.ai)
