## 1. Foundation: storage, motion, illustrations, audio engine

- [x] 1.1 Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` as devDependencies; add `npm test` script (do not block `npm run build`).
- [x] 1.2 Create `src/lib/storage/` with a single `loadRoot()` / `saveRoot()` pair against the `cantoHanzi.v1` localStorage key, including the schema `{ schemaVersion, settings, gamification, progress }` and a `migrations` table; ship migration `0 → 1` (no-op) plus a unit test.
- [x] 1.3 Create `src/lib/motion/` exposing `pop`, `wiggle`, `floatIn`, `cheer`, `confetti`, `parallax` primitives as React hooks/CSS classes built on Tailwind keyframes; gate all primitives behind a `useReducedMotion()` hook.
- [x] 1.4 Create `src/lib/illustrations/` with a typed registry `{ id → { src, intrinsicSize, dark? } }` and an `<Illustration id pose? />` component; populate stub IDs for all mascot poses (`panda|rabbit|monkey|owl|cat|tiger` × `idle|happy|cheer|oops`), all sticker placeholders, and garden plants 1–10.
- [x] 1.5 Create `src/lib/audio/AudioEngine.ts` with lazy `AudioContext`, four `GainNode` channels (`ui|voice|music|effect`), `play(id)`, `voice(id)`, `music.start(id)`/`stop()`, and brushstream `startBrush()`/`stopBrush()`; include the `<audio>` fallback path.
- [x] 1.6 Create `src/lib/audio/registry.ts` with the initial sound id catalogue (`ui.tap`, `ui.error`, `success.chime`, `failure.soft`, `levelup`, `confetti.burst`, `brush.loop`); add a CI script `scripts/check-asset-budget.ts` that fails if `public/sounds/_initial/` exceeds 500 KB.
- [x] 1.7 Add a `useAudio()` React hook that returns the engine, and an `AudioProvider` mounted in `app/layout.tsx`; wire the global mute + per-category mutes to `settings.soundOn` etc. in storage.
- [x] 1.8 Drop placeholder/short-licensed sound files into `public/sounds/_initial/` for the ids in 1.6 (final assets can be replaced later without code changes).

## 2. Gamification + learning-progress core (no UI yet)

- [x] 2.1 Implement `src/lib/gamification/xpTable.ts` (action → XP table) and `src/lib/gamification/levelCurve.ts` (XP → level / nextLevelXP); unit tests for boundaries.
- [x] 2.2 Implement `src/lib/gamification/streak.ts` (increment, reset, freeze grace at ≥7); unit tests for midnight rollover, missed days, and freeze consumption.
- [x] 2.3 Implement `src/lib/gamification/quests.ts` (deterministic 3-quest pick keyed by date, action-condition matching, persistent progress); unit tests.
- [x] 2.4 Implement `src/lib/gamification/rewards.ts` (sticker + garden item award rules on level up); unit tests.
- [x] 2.5 Implement `src/lib/progress/mastery.ts` (state machine `unseen → introduced → practiced → mastered` per the spec rules); unit tests.
- [x] 2.6 Implement `src/lib/progress/srs.ts` (fixed Leitner intervals 1/3/7/21/60 days, no demotion); unit tests including cold-start.
- [x] 2.7 Implement `src/lib/progress/log.ts` (FIFO bounded at 1,000 entries; `recordResult({type, ...})`); unit tests.
- [x] 2.8 Implement `src/lib/progress/recommend.ts` (`recommendItems(N, hint)` returning a 70/25/5 mix by default, falls back gracefully on cold start); unit tests.
- [x] 2.9 Implement `src/lib/progress/exportImport.ts` (download `progress-YYYYMMDD.json`, import-with-confirm replacing state); unit tests for round-trip.

## 3. UX revamp: palette, mascots, kid mode, playground home

- [x] 3.1 Extend `app/globals.css` with the new palette tokens (`--color-bubble`, `--color-grape`, plus dark/hover/tint variants) and verify WCAG AA contrast for body and large text on each.
- [x] 3.2 Update `app/components/ui/Mascot.tsx` to support `id` (`panda|rabbit|monkey|owl|cat|tiger`) × `pose` (`idle|happy|cheer|oops`) and an optional `<Mascot.Speech>` bubble that triggers an audio voiceline on mount.
- [x] 3.3 Add `KidModeProvider` in `src/lib/kidMode/` reading `settings.kidMode` from storage, defaulting to `true` for new installs; expose `useKidMode()`.
- [x] 3.4 Add reusable kid-mode UI components in `app/components/ui/`: `QuestCard`, `GardenPanel`, `StickerThumb`, `XpToast`, `LevelUpModal`, `EndOfSessionSummary`.
- [x] 3.5 Rewrite `app/page.tsx` as the playground map with: activity badges (Explore/Flashcard/Decompose/Dictation/Trace/Mini-Games), `GardenPanel`, `QuestStrip` (3 quests), today's review row pulling from `progress/srs.ts`, and the settings tray (theme/language/sound/kid mode).
- [x] 3.6 Add `prefers-reduced-motion` regression checks: every motion primitive renders the simplified path; verify in a Vitest component test.
- [x] 3.7 Add iPad landscape (1024×768) snapshot/visual check (manual via Playwright or screenshot) for the new home page.
- [x] 3.8 Extend `src/lib/i18n/translations.ts` with all new strings (zh-HK + en) for new activities, quests, mascot lines, settings labels.

## 4. Stroke tracing activity

- [x] 4.1 Create `src/lib/tracing/svgPathParse.ts` to parse `strokeVectors[].pathData` into a polyline with ≥64 sampled points; unit tests against `0001.json` strokes.
- [x] 4.2 Create `src/lib/tracing/match.ts` implementing the order/endpoints/shape similarity checks from the design doc; unit tests covering correct, reversed, out-of-order, too-far-off cases.
- [x] 4.3 Create `app/components/learning/StrokeTracing.tsx` reusing the CreateJS canvas pipeline from `StrokeAnimation.tsx`; render the grid + ghost guide + numbered badges + live ink layer.
- [x] 4.4 Wire pointer events (`pointerdown/move/up`) → polyline capture in 1080×1080 space; reject second touch while a stroke is in progress.
- [x] 4.5 On `pointerup`, run `match.ts`, advance/retry, dispatch audio cues (brush stop, success chime / soft-failure), and trigger mascot reaction.
- [x] 4.6 Implement star scoring (1–3) per the spec thresholds; on character completion, write `recordResult({ type: "trace", char, stars })` and award XP via gamification.
- [x] 4.7 Implement the "重睇我寫" replay button by re-playing captured polylines on the canvas at recorded speed.
- [x] 4.8 Create `app/learn/trace/page.tsx` with character picker (reuses the existing index loader and supports stage / stroke filters).
- [x] 4.9 Add reduced-motion path for the guide (static arrows, instant fades, audio still plays).
- [x] 4.10 Add a hidden debug overlay (visible via `?debug=trace` query) showing per-stroke score components (coverage / similarity / reason).

## 5. Mini-games framework

- [x] 5.1 Define `GameModule` and `GameProps` types in `app/components/games/types.ts` per the design doc.
- [x] 5.2 Implement `app/components/games/GameHost.tsx` handling intro → play → result lifecycle, scope-filter sheet, item loading from `/api/characters` + `recommendItems`, pause/resume, and `EndOfSessionSummary` integration.
- [x] 5.3 Implement `app/components/games/ResultScreen.tsx` (stars, XP, mascot, "再玩一次 / 下個遊戲 / 返樂園").
- [x] 5.4 Implement `app/components/games/registry.ts` listing all 8 game modules with their manifests and dynamic imports.
- [x] 5.5 Create `app/play/page.tsx` (Mini-Games Hub) rendering cards from the registry, lock states from gamification level, and best-star records from progress.
- [x] 5.6 Create `app/play/[gameId]/page.tsx` mounting `GameHost` with the chosen module.
- [x] 5.7 Add a Vitest suite covering the framework lifecycle: scope-filter empty state, pause/resume, result-screen XP write-through.

## 6. Mini-games (8 games)

- [x] 6.1 Match-Up (配對王) — three modes (jyutping / meaning / illustration); board sizes 4/6/8 pairs; result screen.
- [x] 6.2 Whack-a-Hanzi (打地鼠) — 6–9 holes, audio/meaning prompts, no penalty for wrong taps.
- [x] 6.3 Character Rain (落字雨) — 3-life arcade, scaling difficulty, confetti on catch.
- [x] 6.4 Word Builder (拼字工坊) — drag-tile slots, one-star hint button, reads correct word aloud.
- [x] 6.5 Sentence Garden (造句樂園) — drag word blocks; "重新排" reset; flower added on success.
- [x] 6.6 Tone Bingo (聲調賓果) — 5×5 board, audio caller, BINGO detection on row/col/diag.
- [x] 6.7 Radical Detective (拆字偵探) — given a radical, find all matching characters in a grid within a timer.
- [x] 6.8 Stroke Racer (太空寫字) — sequence of trace rounds against per-character timer, rocket animation; depends on Section 4.

## 7. Progress dashboard, sticker book, settings

- [x] 7.1 Create `app/progress/page.tsx` rendering: total characters known, level + streak, 7-day activity bar chart (raw `<svg>`), today's review list, and a mastery-state colored character grid; tap a cell → popover with last 3 results + jump-to-trace/flashcard.
- [x] 7.2 Create `app/stickers/page.tsx` rendering all stickers (silhouettes for locked) with date earned and "NEW" badges.
- [x] 7.3 Extend the home settings tray to expose: sound on/off, per-category mutes (music/voice/effect), kid mode, theme, language, "匯出進度", "匯入進度", and a confirmed "重設進度".
- [x] 7.4 Add an empty-state mascot illustration to every dashboard section that has no data yet.

## 8. Cross-cutting integration

- [x] 8.1 Route every existing `Audio`/`SpeechSynthesis` call (e.g., character TTS in `CharacterExploration`, `FlashcardRevision`, `DictationExercise`) through the new `AudioEngine` so global mute and ducking apply.
- [x] 8.2 Wire each existing activity (Explore/Flashcard/Decompose/Dictation) to call `recordResult(...)` and award XP on per-card completion or per-answer correctness, per the XP table.
- [x] 8.3 Mark each character interaction in any activity as `mastery.touch(char)` so the mastery state machine sees consistent input.
- [x] 8.4 Show the `EndOfSessionSummary` modal when the student exits any rewarded activity to the home page.
- [x] 8.5 Add `prefers-reduced-motion` regression: existing flashcard transitions and decomposition feedback also use the new motion primitives.

## 9. Quality, performance, accessibility

- [x] 9.1 Add a Vitest run to CI (or a `npm run check` script) covering all new unit tests (storage, gamification, progress, tracing match).
- [x] 9.2 Smoke navigation across `/`, `/learn/trace`, `/play`, `/progress`, `/stickers`, `/favorites` on a 1024×768 viewport via browser MCP — every page renders, no console errors, no missing nav.
- [ ] 9.3 Run a manual perf pass on tracing on a real iPad (or DevTools mobile profile) and confirm ≥45 fps for a 10-stroke character; tune redraw / sampling if not.
- [x] 9.4 Verify WCAG AA contrast on all new palette tokens for text + UI states; pinned in `src/__tests__/contrast.test.ts` (14 token-pair assertions covering body text, status callouts, and white-on-color buttons).
- [x] 9.5 Verify the asset-budget script (1.6) passes; lazy-load all per-game music and per-activity voicelines.
- [x] 9.6 Run `npm run lint` and resolve any new warnings or errors.

## 10. Docs and final validation

- [x] 10.1 Update `README.md` to list the new activities (Stroke Tracing + Mini-Games Hub), the 8 named games, the gamification system, and the progress dashboard.
- [x] 10.2 Add a short `docs/audio.md` and `docs/tracing.md` explaining the asset registry and the matching algorithm so future contributors can extend them.
- [x] 10.3 Run `openspec validate revamp-kids-ui-and-add-fun-games --strict` and confirm pass.
- [ ] 10.4 Hand off for review; on merge, follow the standard archive flow per `openspec/AGENTS.md`.
