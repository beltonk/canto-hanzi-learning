# Change: Optimize UX for Primary School Children

## Why
The current UI uses generic corporate styling that doesn't engage young learners (P1-P6 students, ages 6-12). Primary school children need larger touch targets, playful visuals, and encouraging feedback to stay engaged during learning activities.

## What Changes

### 1. Light Mode as Default
- **BREAKING**: Remove `prefers-color-scheme: dark` as default
- Set light mode as the application default
- Add optional theme toggle for accessibility

### 2. Child-Friendly Color Palette
- Replace blue-gray corporate palette with warm, vibrant colors
- Use a cohesive palette: coral/peach (warm), mint/teal (fresh), golden yellow (encouraging)
- Ensure WCAG AA contrast for readability
- Add gradient backgrounds with playful tones

### 3. Typography for Young Readers
- Increase base font sizes (18px+ for body text)
- Activity titles: 28-32px
- Character display: 140-200px for large hanzi
- Jyutping: 24-28px for clear pronunciation display
- Use rounded, friendly typefaces for UI elements

### 4. Space Management
- Increase padding throughout (min 16px, prefer 24-32px)
- Larger margins between sections
- More breathing room around interactive elements
- Reduce content density per screen

### 5. Visual Elements & Theming
- Add cute animal mascot icons for each activity:
  - 🐼 認識漢字 (Panda - wisdom)
  - 🐰 字卡温習 (Rabbit - quick learner)
  - 🐵 拆字遊戲 (Monkey - playful)
  - 🦉 默書練習 (Owl - listening)
- Replace text-only cards with illustrated activity cards
- Add decorative elements (stars, clouds, bamboo)

### 6. Touch-Friendly Design (iPad Optimization)
- Minimum touch target: 48x48px (Apple HIG recommends 44px)
- Larger buttons with generous padding
- Navigation arrows: 64-72px diameter
- Swipe gestures for card navigation
- Tap zones clearly indicated

### 7. Engagement & Feedback
- Add celebration animations for correct answers (confetti, stars)
- Sound effects for interactions (optional, toggleable)
- Progress indicators with visual rewards
- Encouraging messages in Cantonese

## Impact
- Affected specs: New spec `ux-design`
- Affected code:
  - `app/globals.css` - new color palette, typography
  - `app/layout.tsx` - theme provider, default light mode
  - `app/page.tsx` - redesigned homepage
  - `app/components/learning/*.tsx` - all learning components
  - `app/components/ui/` - new shared UI components (buttons, cards)
  - `public/images/` - mascot and decorative images
