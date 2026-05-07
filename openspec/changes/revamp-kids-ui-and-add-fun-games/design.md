## Context

The current app is a Next.js 16 / React 19 / Tailwind 4 SPA-style site backed by 3,129 character JSON files (each containing official `strokeVectors` from the HK Education Bureau, plus Stage 1/2 word lists, examples, radicals, and jyutping). Today it ships four activities (Explore, Flashcard, Decompose, Dictation), a custom i18n context (zh-HK / en), a theme context (light default), and an existing `StrokeAnimation.tsx` that renders the EDB stroke vectors via CreateJS EaselJS on a 1080×1080 canvas.

This change is **cross-cutting**: it adds five new capabilities (`stroke-tracing`, `mini-games`, `gamification`, `audio-feedback`, `learning-progress`), modifies `ux-design`, introduces sound assets and illustration assets to `public/`, and reshapes the home page. A design doc is warranted because we need to commit to a stroke-matching algorithm, a game-framework shape, an audio pipeline, and a local-storage data schema before any code is written.

**Stakeholders**
- Hong Kong primary school students (P1–P6), iPad-first.
- Parents and teachers who configure Kid Mode and review progress.
- Future contributors who will add more games into the framework.

**Constraints**
- No backend / no accounts. Everything is client-side, with `localStorage` (and `IndexedDB` only if needed for audio caching).
- Must remain performant on iPad gen 8+ (target ≥45 fps for tracing).
- Must respect `prefers-reduced-motion`, WCAG AA contrast, and a global sound mute.
- Must not break the four existing activities.

## Goals / Non-Goals

**Goals**
1. Make the home page feel like a playground a child wants to open every day, not a study tool.
2. Add real handwriting practice that validates stroke order, direction, and shape in the browser without ML.
3. Ship a reusable mini-games framework so adding game #9 later is a few hundred lines, not a rewrite.
4. Layer XP / streaks / stickers / a garden across all activities to create a single sense of "progress".
5. Centralize audio so every sound (UI tap, brushstroke, mascot voice, TTS, game music) goes through one mixer with one mute.
6. Track per-character mastery and recommend daily review without asking the student to manage anything.

**Non-Goals**
1. No remote auth, no multi-device sync (export/import JSON is the manual escape hatch).
2. No ML-based stroke recognition — geometric matching only.
3. No live multiplayer.
4. No new character data ingestion in this change (data pipeline stays as is).
5. No native iOS/Android app.
6. No teacher dashboard / classroom management features.

## Decisions

### D1. Stroke matching uses a deterministic geometric algorithm, not ML

For each expected stroke we compute three signals from the captured polyline and accept the stroke iff all three pass:

1. **Order** — the stroke index must equal the next expected index. This is just a counter.
2. **Endpoints** — Euclidean distance from `traced[0] → expected.start` and `traced[-1] → expected.end`, each ≤ `0.20 * min(canvasW, canvasH)`. Reverse direction is detected by the same check with start/end swapped.
3. **Shape similarity** — both polylines are resampled to N=32 equidistant points, translated/scaled to fit a unit box, and we compute the mean Euclidean distance between the i-th sampled points (a simplified Procrustes / `$1` recognizer pass without rotation). Acceptance threshold: mean distance ≤ `0.18` (tunable per stroke length).

We extract the **expected polyline** for each stroke from the existing `strokeVectors[].pathData` (SVG-style mini-path). The path is parsed once per stroke into a polyline with ≥64 sampled points using `Path2D` + a `<canvas>`'s `getPathData` polyfill, or by walking the path with manual SVG path tokenization. We will write a small parser (existing data uses only `M/Q/L/A/Z` per inspection of `0001.json`) and cache the resulting polyline on the character record at first use.

**Alternatives considered**
- **HanziWriter** (npm `hanzi-writer`) — does this beautifully but requires its own data format (Make Me a Hanzi). We already own EDB data with the official HK stroke order; switching would risk diverging from the curriculum. Rejected.
- **TensorFlow.js sketch model** — too heavy to load on iPad, no upside given we know the ground-truth stroke.
- **Rotation-invariant `$1` recognizer** — overkill; we want to *enforce* correct direction, not normalize it away.

### D2. Tracing canvas reuses the existing 1080×1080 CreateJS pipeline

The new `StrokeTracing.tsx` is a sibling of `StrokeAnimation.tsx`, sharing:
- The 1080×1080 internal coordinate space.
- The grid + dashed crosshair background.
- The CreateJS Stage / Shape lifecycle (already loaded via `<Script>`).

Tracing adds a second layer (`createjs.Shape` for the live ink) that's redrawn each pointer move. Pointer events are normalized to the 1080×1080 space using the canvas's bounding rect.

**Why reuse vs. rewrite in plain `<canvas>`?** Reusing keeps the visual identity identical between "show me how to write" (animation) and "now you write it" (tracing), and avoids paying for a second graphics library.

### D3. Mini-games framework is a small in-house React layer, not a game engine

Each game is a React component that implements a thin contract:

```ts
type GameModule = {
  id: string;                              // "match-up", "whack", ...
  manifest: {
    title: { "zh-HK": string; en: string };
    mascot: MascotId;
    color: PaletteToken;
    musicId?: SoundId;
    minStage?: 1 | 2;
    minLevel?: number;                     // gamification gate
    recommendedItemCount: number;
  };
  Component: React.FC<GameProps>;          // receives items, scope, onResult
};
```

The framework owns: scope-filter UI, intro screen, item loading via existing `/api/characters`, pause/resume, the result screen, and writing the result into `learning-progress`. Games own only their own playfield.

**Alternatives considered**
- **PixiJS / Phaser** — overkill for the eight games we have in mind; most are DOM-friendly. Adds bundle weight and a second mental model alongside React.
- **One mega-game with modes** — couples too much; harder to add or A/B a new game.

### D4. Audio engine is a thin Web Audio wrapper with `<audio>` fallback

A single `AudioEngine` singleton:
- Holds an `AudioContext` lazily created on the first user gesture (Safari requirement).
- Has 4 `GainNode` channels: `ui`, `voice`, `music`, `effect`.
- Loads sounds via `fetch` → `decodeAudioData`, caches `AudioBuffer` per id.
- Implements ducking: when a `voice` clip starts, lower `music` to 30% with `linearRampToValueAtTime`; restore on `ended`.
- Brushstroke sound uses an `AudioBufferSourceNode` with `loop = true`; we start it on `pointerdown` and stop on `pointerup`.
- Falls back to a pool of `<audio>` elements when `AudioContext` is unavailable (older iOS); no ducking in that mode.

**Alternatives considered**
- **Howler.js** — solid library but ~40 KB gz and we only need 8 features. Rejected.
- **Per-component `Audio` instances** — leads to overlap, no global mute, no ducking. Rejected.

### D5. Local data schema (single `localStorage` key, JSON, versioned)

We store one root key `cantoHanzi.v1` containing:

```jsonc
{
  "schemaVersion": 1,
  "settings": { "soundOn": true, "kidMode": true, "language": "zh-HK", "theme": "light" },
  "gamification": {
    "xp": 0, "level": 1, "streak": 0, "lastActiveDay": "2026-05-07",
    "freezes": 0, "stickers": ["panda_idle"], "garden": ["seed_1"],
    "quests": { "today": [{ "id": "trace_5", "progress": 0, "target": 5, "done": false }] }
  },
  "progress": {
    "characters": { "一": { "state": "introduced", "lastSeen": 1715000000000, "wins": 1, "due": 1715100000000 } },
    "log": [ { "type": "trace", "char": "一", "stars": 3, "at": 1715000000000, "ms": 18000 } ]
  }
}
```

The activity `log` is **bounded** to the last 1,000 entries (FIFO). The mastery map is unbounded but small (max ~3,200 entries × ~80 bytes ≈ 250 KB).

**Migration**: a `migrations` table keyed by source version runs in order on read. Unknown future versions trigger a read-only banner and the app uses an in-memory empty state for the rest of the session.

### D6. SRS uses fixed Leitner-like intervals, not SM-2

Intervals: `1d → 3d → 7d → 21d → 60d`. Promotion on a "win" (3-star trace, correct flashcard, correct mini-game tap that targets that character). Demotion on a wrong answer is **disabled** (per the no-negative-feedback rule); the character simply stays at its current interval.

**Why not SM-2?** SM-2 requires a self-rated quality (0–5), which is a poor UX for primary school. Fixed intervals are good enough for daily-practice rhythm.

### D7. Routing additions

```
app/
  page.tsx                                # rewritten as the playground map
  learn/
    explore/                              # unchanged
    flashcard/                            # unchanged
    decompose/                            # unchanged
    dictation/                            # unchanged
    trace/                                # NEW: stroke tracing
  play/
    page.tsx                              # NEW: mini-games hub
    [gameId]/page.tsx                     # NEW: game host page
  progress/page.tsx                       # NEW: progress dashboard
  stickers/page.tsx                       # NEW: sticker book
```

### D8. New shared modules

```
src/lib/
  audio/                                  # AudioEngine + sound registry + react hooks
  progress/                               # mastery + SRS + activity log + storage
  gamification/                           # XP table, level curve, quests, streak
  motion/                                 # named primitives + reduced-motion gate
  illustrations/                          # typed registry + <Illustration id="..."/>
  storage/                                # one place that reads/writes the v1 root key
app/components/
  ui/                                     # extended with KidMode wrappers, Quest, Garden, Sticker
  games/                                  # framework + 8 game components
  learning/StrokeTracing.tsx              # NEW
```

### D9. Testing approach

- **Unit**: stroke matching (synthetic polylines vs. expected stroke), gamification math (XP table, level curve, streak edges), SRS scheduling, storage migrations. Use Vitest (introduced in this change since no test framework exists yet).
- **Component**: the game framework's lifecycle and result screen, KidMode toggling, Mascot pose switching.
- **Manual / Playwright smoke**: each new route renders without console errors on iPad viewport (1024×768).

We add Vitest + React Testing Library as devDependencies; this is the first formal test setup, sized minimally.

## Risks / Trade-offs

- **Stroke shape thresholds will need tuning per stroke length** — very short strokes (single dots) are noisier. Mitigation: parameterize the threshold by expected polyline length and ship a hidden debug overlay (visible when Kid Mode is off + a query flag) that draws expected vs. traced and prints the score.
- **Web Audio on iOS Safari requires a user gesture to unlock** — silent failure on first launch is likely if we try to autoplay home-page music. Mitigation: gate music on the first tap anywhere; UI taps and chimes will work after that gesture; document the constraint in the audio engine code.
- **Asset weight could balloon** — 8 mini-games × music + voicelines + illustrations could exceed budget. Mitigation: enforce 500 KB initial budget via a CI check (script that sums files in `public/sounds/_initial/` and `public/illustrations/_initial/`); lazy-load everything else per route.
- **Local-storage size limits (~5 MB)** — we cap the activity log at 1,000 entries (~80 KB) and the mastery map at the dataset size (~250 KB). Settings/gamification are negligible. Headroom is large.
- **Stroke matching with `pathData` parsing is custom code** — risk of bugs vs. CreateJS rendering. Mitigation: render a debug overlay where the expected polyline is drawn on top of the CreateJS-rendered guide and visually verified for a sample of 30 characters of varying complexity before locking thresholds.
- **Gamification can get addictive in unhealthy ways** — mitigation: no streak-shaming copy, automatic daily quest cap, no leaderboards, no notifications.
- **Adding Vitest changes the build/CI footprint slightly** — mitigation: keep test scripts opt-in (`npm test`), do not block `npm run build` on tests.
- **Eight new games is a lot to ship** — mitigation: order games by ROI (Match-Up, Whack-a-Hanzi, Word Builder first; Stroke Racer last because it depends on tracing). Each game is independent; partial roll-out is fine.

## Migration Plan

This is additive; no data migration is needed for the first install. For users who already have local state from the four legacy activities (none today, but defensively):

1. On first load of the new build, read the legacy keys (if any) and copy them into the new `cantoHanzi.v1` schema under `progress.log` as best-effort historical entries.
2. Delete legacy keys after successful migration.
3. If migration fails, log to console, leave legacy keys in place, and start fresh — never crash.

**Rollout** is a single Next.js deploy. No backend coordination. Rollback = redeploy previous build; the new local-storage key is harmless on the old build (which simply ignores it).

## Open Questions

1. **Voiceline source** — do we record real Cantonese clips (better quality, more work) or synthesize via the existing TTS path (fast, sometimes robotic)? Default plan: synthesize for v1 and replace top 20 lines with real recordings post-launch.
2. **Garden vs. Aquarium theme** — both are fun; Garden is more universal. Default plan: ship Garden; revisit themed seasons (Aquarium for summer, Snowscape for winter) post-launch.
3. **Should Kid Mode also gate the in-app theme switcher?** Default: no — visual theme stays available, only verbose controls hide.
4. **Tracing scoring weights** (order vs. shape vs. retries) — default 50/40/10, but final balance should be tuned with 5–10 real students.
5. **Per-game leaderboards** — explicitly excluded for v1 to avoid social comparison pressure; revisit for a future "family mode".
