## Why

The current Cantonese-Hanzi learning system covers the four core activities (Explore / Flashcard / Decomposition / Dictation) but feels like a reference tool more than a game. For Hong Kong primary school students (P1–P6), the visual design is restrained, sessions are static, and there is no kinesthetic stroke practice — which research shows is one of the most effective ways for children to internalize Hanzi. Children also lack short-loop fun (mini-games, rewards, mascot moments) that pulls them back day after day. This change re-positions the app as a **playful, kid-first learning playground** with hands-on stroke tracing, a catalog of mini-games, and a light gamification layer that makes daily practice feel like a game rather than homework.

## What Changes

- **Kid-first visual revamp** of the global UI: bolder color palette, playful illustrations, animated mascots with reactions, soft motion (squash/stretch, parallax, sticker pop-ins), bigger touch targets, an iPad-first home "playground map" replacing the current 2×4 grid, and a configurable "kid mode" that hides text-heavy controls.
- **NEW: Stroke tracing activity** — students follow the official stroke order using finger/mouse on touch devices. Includes:
  - Animated stroke guide (ghost stroke + moving brush tip + numbered stroke order) reused from existing `strokeVectors` data.
  - Real-time path matching against the target stroke (start point, direction, shape tolerance).
  - Per-stroke audio cues (brush sound, success chime, encouraging "再試一次" voice) and haptic feedback on supported devices.
  - Star rating per character (1–3 stars based on accuracy/order/speed) and replay of the student's own trace.
- **NEW: Mini-games catalog** — a unified game framework hosting 8 new games sharing characters/words/audio from the existing dataset:
  1. **配對王 Match-Up** — flip-card memory match (character ↔ jyutping / character ↔ meaning / character ↔ image).
  2. **打地鼠 Whack-a-Hanzi** — tap the correct character among popping moles when given audio or meaning.
  3. **落字雨 Character Rain** — tap or drag the right character before it hits the ground; difficulty scales.
  4. **拼字工坊 Word Builder** — drag character tiles to assemble a target word from the official Stage-1/2 word list.
  5. **造句樂園 Sentence Garden** — drag word blocks into the right order to form an example sentence.
  6. **聲調賓果 Tone Bingo** — 5×5 jyutping/tone bingo card; mark squares as audio plays.
  7. **拆字偵探 Radical Detective** — given a radical, find characters that contain it from a grid; reuses radical data.
  8. **太空寫字 Stroke Racer** — race against the clock by stroke-tracing characters correctly; combines tracing + arcade feel.
- **NEW: Gamification layer** — daily streaks, XP/levels, unlockable mascot stickers, a "garden / aquarium" home where every completed activity grows a plant or hatches a sea creature, end-of-session star summary, and gentle daily quests (e.g., "trace 5 characters", "win 1 game"). All progress is stored locally (no accounts required) with optional export.
- **NEW: Sound & feedback system** — a lightweight sound engine that plays UI taps, success/failure chimes, mascot voices, brush sounds during tracing, and per-game music beds. Respects a global "sound on/off" toggle and `prefers-reduced-motion`.
- **NEW: Learning progress & smart practice** — per-character mastery state (introduced / practiced / mastered), a simple spaced-repetition queue that powers a "今日推薦" (Today's recommended) row on the home page, and a kid-friendly progress dashboard.
- **MODIFIED ux-design**: replace the current "warm-but-quiet" palette with a vibrant primary-school palette, add a motion and illustration system, expand mascot roles to include reactions/voicelines, redesign the home page as a playground map, and add the sound/haptics feedback contract.
- **Non-breaking** for the existing four activities: `character-exploration`, `flashcard-revision`, `decomposition-play`, and `dictation` keep working with their current contracts; the revamp adds new entry points and visual polish around them.

## Capabilities

### New Capabilities

- `stroke-tracing`: Finger/mouse-based stroke order tracing with real-time validation, animated guide, audio/haptic feedback, and star scoring.
- `mini-games`: A unified mini-games framework plus a catalog of 8 named games that reuse the existing character/word/audio dataset.
- `gamification`: Cross-activity engagement layer covering XP, levels, daily streaks, badges/stickers, daily quests, and a "garden/aquarium" reward home.
- `audio-feedback`: Centralized sound system providing UI sound effects, mascot voicelines, per-game music, success/failure chimes, brushstroke audio, and a global mute toggle.
- `learning-progress`: Per-character mastery tracking, spaced-repetition recommendations, and a kid-friendly progress dashboard, all persisted locally.

### Modified Capabilities

- `ux-design`: Revamp the kid-first visual language for primary school students — vibrant palette, playful illustrations, motion system, expanded mascot roles, playground-map home page, and sound/haptics integration.

## Impact

- **Affected specs**: NEW `stroke-tracing`, `mini-games`, `gamification`, `audio-feedback`, `learning-progress`; MODIFIED `ux-design`.
- **Affected code**:
  - `app/page.tsx` (home is restructured into a playground map with progress + quests).
  - `app/globals.css`, `app/components/ui/*` (theme tokens, motion utilities, new shared kid-mode components).
  - New routes under `app/learn/trace/` and `app/play/<game-id>/` plus a shared game framework in `app/components/games/`.
  - New `app/components/learning/StrokeTracing.tsx` (sibling of existing `StrokeAnimation.tsx`) reusing `strokeVectors` from `data/characters/*.json`.
  - New `src/lib/audio/` (sound engine), `src/lib/progress/` (mastery + SRS), `src/lib/gamification/` (XP/quests/streaks).
  - `src/lib/i18n/translations.ts` extended with new strings (zh-HK + en) for the new activities, mascot lines, and quest labels.
- **Data & assets**: requires a new `public/sounds/` folder for SFX/voice clips and a new `public/illustrations/` folder for mascot poses, stickers, and the playground/garden art.
- **Dependencies**: no new runtime backends. Stroke matching uses the existing CreateJS/canvas pipeline plus light vector math (no ML). Sound uses the Web Audio API. Persistence uses `localStorage` (and `IndexedDB` only if/when audio caching grows).
- **Performance**: tracing must hit ≥45 fps on iPad (gen 8+). Sound assets must total ≤500 KB initial; per-game music lazy-loads. Bundle budget for the new playground home page: ≤30 KB gzipped over the current home page.
- **Accessibility**: every new activity must support `prefers-reduced-motion`, a sound toggle, and 48–72 px touch targets per existing `ux-design` rules.
