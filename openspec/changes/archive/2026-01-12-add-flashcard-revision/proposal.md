# Change: Add Flashcard Revision Exercise

## Why
Students need a focused revision mode to review characters they've learned. Flashcards provide a proven, low-friction way to reinforce character recognition and pronunciation through spaced repetition-style practice.

## What Changes
- Add new **Flashcard Revision** activity accessible from the homepage
- Implement scope selection filters:
  - Learning stage (KS1 / KS2 / All)
  - Content type (單字 single characters / 詞語 words - future extensibility)
  - Stroke count range (e.g., 1-5, 6-10, 11-15, 16+)
- Display characters in randomized order as card-style UI
- Include Cantonese pronunciation playback (TTS) on each card
- Provide large, touch-friendly navigation arrows (previous/next)
- Show card progress indicator (e.g., "3 / 25")

## Impact
- Affected specs: New spec `flashcard-revision`
- Affected code:
  - `app/learn/flashcard/page.tsx` - new page
  - `app/components/learning/FlashcardRevision.tsx` - new component
  - `app/page.tsx` - add navigation link
  - `app/api/characters/route.ts` - extend with stroke count filtering
