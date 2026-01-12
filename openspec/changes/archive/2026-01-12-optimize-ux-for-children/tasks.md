# Tasks: Optimize UX for Children

## 1. Foundation: Color System & Typography
- [ ] 1.1 Define CSS custom properties for child-friendly color palette in `globals.css`
- [ ] 1.2 Remove dark mode default, set light mode as default
- [ ] 1.3 Update typography scale with larger base sizes
- [ ] 1.4 Add utility classes for consistent spacing (`.space-touch`, `.pad-child`)

## 2. Shared UI Components
- [ ] 2.1 Create `app/components/ui/Button.tsx` with large touch targets and hover effects
- [ ] 2.2 Create `app/components/ui/Card.tsx` with rounded corners, soft shadows, icon support
- [ ] 2.3 Create `app/components/ui/NavArrow.tsx` with 72px touch targets
- [ ] 2.4 Create `app/components/ui/ProgressBar.tsx` with colorful segments
- [ ] 2.5 Create `app/components/ui/Mascot.tsx` for animal mascot display with messages

## 3. Homepage Redesign
- [ ] 3.1 Update `app/page.tsx` with new color palette and larger cards
- [ ] 3.2 Add mascot icons to activity cards
- [ ] 3.3 Increase card sizes and spacing for touch
- [ ] 3.4 Add decorative background elements (gradient, subtle patterns)
- [ ] 3.5 Redesign "如何開始" section with illustrations

## 4. Character Exploration Update
- [ ] 4.1 Update `CharacterExploration.tsx` with larger character display (160px+)
- [ ] 4.2 Apply new color palette and spacing
- [ ] 4.3 Add mascot (Panda) with encouraging messages
- [ ] 4.4 Make all buttons finger-friendly (48px+ height)

## 5. Flashcard Revision Update
- [ ] 5.1 Update `FlashcardRevision.tsx` with new card styling
- [ ] 5.2 Enlarge navigation arrows to 72px
- [ ] 5.3 Add Rabbit mascot to settings and cards
- [ ] 5.4 Implement swipe gestures for mobile/tablet
- [ ] 5.5 Add celebration animation for completing set

## 6. Decomposition Play Update
- [ ] 6.1 Update `DecompositionPlay.tsx` with new palette
- [ ] 6.2 Add Monkey mascot with playful messages
- [ ] 6.3 Enlarge component drag targets
- [ ] 6.4 Add success animation (stars) for correct arrangement

## 7. Dictation Exercise Update
- [ ] 7.1 Update `DictationExercise.tsx` with new design
- [ ] 7.2 Add Owl mascot
- [ ] 7.3 Enlarge input field and audio button
- [ ] 7.4 Add gentle feedback animations (correct/incorrect)

## 8. Visual Assets
- [ ] 8.1 Create/source mascot SVG images (Panda, Rabbit, Monkey, Owl)
- [ ] 8.2 Add star/celebration SVG assets
- [ ] 8.3 Create gradient background patterns
- [ ] 8.4 Optimize all images for web (SVG preferred, PNG fallback)

## 9. Animations & Micro-interactions
- [ ] 9.1 Add button press/hover animations (scale, color)
- [ ] 9.2 Add page transition animations (fade/slide)
- [ ] 9.3 Create celebration animation component (confetti/stars)
- [ ] 9.4 Add loading state with bouncing mascot

## 10. Accessibility & Testing
- [ ] 10.1 Verify WCAG AA contrast ratios for all text
- [ ] 10.2 Test touch targets on iPad (Safari)
- [ ] 10.3 Test on various screen sizes (phone, tablet, desktop)
- [ ] 10.4 Ensure animations respect `prefers-reduced-motion`
