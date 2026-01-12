# Tasks: Add Flashcard Revision

## 1. API Enhancement
- [x] 1.1 Extend `/api/characters` to support stroke count range filtering (`minStrokes`, `maxStrokes` query params)
- [x] 1.2 Add random shuffle option to API (`shuffle=true` query param)

## 2. UI Components
- [x] 2.1 Create `FlashcardRevision.tsx` component with:
  - Card-style display with large character (hanzi-display font)
  - Jyutping pronunciation display
  - Meanings display
  - Play pronunciation button (TTS)
  - Large left/right navigation arrows
  - Card flip animation (optional enhancement)
- [x] 2.2 Create scope selection panel with:
  - Learning stage dropdown (KS1 / KS2 / 全部)
  - Stroke count range selector
  - Start revision button
- [x] 2.3 Add progress indicator (current / total)

## 3. Page Integration
- [x] 3.1 Create `app/learn/flashcard/page.tsx` route
- [x] 3.2 Add flashcard activity link to homepage (`app/page.tsx`)
- [x] 3.3 Apply consistent styling with existing learning pages

## 4. UX Polish
- [x] 4.1 Keyboard navigation support (←/→ arrow keys, Space for audio)
- [ ] 4.2 Swipe gesture support for mobile (optional - deferred)
- [x] 4.3 Responsive design for mobile/tablet

## 5. Validation
- [x] 5.1 Manual testing of all filter combinations
- [x] 5.2 Verify TTS works correctly for all cards
- [x] 5.3 Test navigation edge cases (first/last card)
