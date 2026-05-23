# 粵語漢字學習系統 (Cantonese Hanzi Learning System)

An interactive Traditional Chinese character learning system for Hong Kong
primary school students. This web app helps kids learn Cantonese
pronunciation, character recognition, decomposition, and dictation through
engaging activities with a child-friendly Material Design interface.

Highlights:

- A search-first home page (search by character / 部首 / 粵拼) with quick
  links to every activity.
- Finger-tracing of stroke order with a forgiving pixel-mask matcher,
  star scoring, stroke replay, and a reduced-motion path.
- 8 mini-games with a shared lifecycle (intro → play → pause → result),
  all unlocked by default and fed from a 60+-item shuffled pool.
- A gamification core (XP, levels, streaks with freeze grace, daily
  quests, stickers, garden plants) and a Spaced Repetition queue.
- "我的收藏" — a personal collection that auto-saves the characters and
  words you got wrong in dictation, games, and Sentence Garden.
- Modern UI with Free HK Kai brush-stroke font, WCAG-AA-pinned palette,
  and `prefers-reduced-motion`–aware animations throughout.
- Adaptive responsive layout across phone portrait, phone landscape, iPad portrait (icon rail), iPad landscape, and desktop, with four navigation variants and fluid Chinese typography.
- Safe-area-inset awareness for iOS notch and home indicator on all devices.
- Automated Playwright viewport matrix (`npm run test:e2e`) gating every route on 6 device profiles — see [`tests/e2e/responsive/README.md`](tests/e2e/responsive/README.md).

## Responsive Design

The app uses a canonical breakpoint contract (see `src/lib/viewport/`):

| Token | Min px | Typical device                | Nav variant    |
|-------|--------|-------------------------------|----------------|
| xs    |      0 | Phone portrait                | Bottom tabs    |
| sm    |    480 | Phone landscape               | Top tabs       |
| md    |    768 | iPad portrait / split-view    | Icon rail      |
| lg    |   1024 | iPad landscape / small laptop | Full sidebar   |
| xl    |   1280 | Desktop                       | Full sidebar   |
| 2xl   |   1536 | Large desktop                 | Full sidebar   |

The Hong Kong Chinese font stack (`Free HK Kai`, `LXGW WenKai TC`, Noto Serif/Sans TC, PMingLiU) is immutable and is enforced as an invariant in the E2E test suite. Fluid `clamp()`-based sizing is used for all Chinese typography classes while keeping `font-family` byte-for-byte identical.

## 數據來源 (Data Source)

本系統基於 **《香港小學學習字詞表》** (Lexical Lists for Chinese Learning in Hong Kong) 的完整數據。

- Character selection is based on **《香港小學學習字詞表》** (Lexical Lists for Chinese Learning in Hong Kong)
- All character data is sourced from the official HK Education Bureau (教育局) word lists
- Jyutping romanization is provided for Cantonese pronunciation

## 學習階段 (Learning Stages)

本系統按照《香港小學學習字詞表》的官方結構分為兩個學習階段：

| 學習階段 | 官方用字 | **現有數據** | 覆蓋率 |
|----------|----------|--------------|--------|
| **第一學習階段 (Stage 1)** | 2,169 | **3,129** | 完整覆蓋 |
| **第二學習階段 (Stage 2)** | 1,002 | **3,129** | 完整覆蓋 |
| **總計** | **3,171** | **3,129** | **98.7%** |

> ✅ **數據狀態 / Data Status**
> 
> 本系統包含 **3,129 個字符**，涵蓋《香港小學學習字詞表》中收錄的所有字符。
> 
> This system contains **3,129 characters**, covering all characters from the Lexical Lists for Chinese Learning in Hong Kong.
> 
> - **總字符數**: 4,762 characters (包含所有數據源)
> - **字詞表字符**: 3,129 characters (來自《香港小學學習字詞表》)
> - **第一學習階段詞語**: 5,018 words
> - **第二學習階段詞語**: 4,856 words

## Features

### Learning Activities

- **🔍 查字 · 認字 (Character Exploration + Search)**: A unified search-and-learn surface. Search by character, radical (部首), or Jyutping; jump straight from the home page or the in-app search box. Each result shows pronunciation, stroke count, components, related words, and a one-tap favorite.
- **🃏 字卡溫習 (Flashcard Revision)**: Randomized flashcards with filters for learning stage and stroke count, large navigation arrows, audio pronunciation, and a `floatIn` card transition (auto-disabled under `prefers-reduced-motion`).
- **🧩 拆字 (Decomposition Play)**: Drag-and-drop puzzle where students arrange character components into complete characters; success/error feedback uses the shared motion primitives.
- **✏️ 默書練習 (Dictation Exercises)**: Audio-based dictation with auto-pronunciation, immediate feedback, and automatic addition of any missed character to 我的收藏.
- **🖌️ 筆順練習 (Stroke Tracing)**: Finger / pen tracing on a 1080-px canvas. Uses a **pixel-mask matcher** (renders the expected stroke offscreen, builds a binary mask + distance field, then checks coverage / reach / oversize) so kids who are roughly on the right path always pass. Includes star scoring, mascot feedback, audio cues, **重睇我寫 replay** of captured polylines, a reduced-motion path, and a hidden `?debug=trace` overlay.
- **🎮 遊戲樂園 (Mini-Games Hub)**: 8 engaging mini-games — Match-Up, Whack-a-Hanzi, Character Rain, Word Builder, Sentence Garden, Tone Bingo, Radical Detective, and Stroke Racer — sharing a single `GameHost` lifecycle (intro → play → pause → result → XP).
- **❤️ 我的收藏 (My Collection)**: A dedicated page (`/favorites`) for characters and words the student wants to revisit. Mistakes from dictation, Radical Detective, Tone Bingo, Character Rain, and Sentence Garden are auto-saved with a `mistake` tag; users can also manually star anything via the heart button.

### Mini-Games

| Game | Chinese Name | Description |
|------|-------------|-------------|
| Match-Up | 配對王 | Match characters with jyutping/meaning/radical in pairs |
| Whack-a-Hanzi | 打地鼠 | Tap the correct character as it pops up in holes |
| Character Rain | 落字雨 | Catch falling characters before they hit the bottom |
| Word Builder | 拼字工坊 | Arrange character tiles to form target words |
| Sentence Garden | 造句樂園 | Order word blocks to form correct sentences |
| Tone Bingo | 聲調賓果 | Mark characters on a bingo board matching the called character |
| Radical Detective | 拆字偵探 | Find all characters containing a target radical |
| Stroke Racer | 太空寫字 | Complete stroke tracing against a countdown timer |

### Gamification System

- **XP & Levels**: Earn XP for every learning activity. (All 8 mini-games are unlocked by default — no gating.)
- **Daily Streaks**: Keep your learning streak alive with daily activity; freeze days protect streaks of 7+ days from a single missed day.
- **Daily Quests**: 3 deterministic daily quests with progress tracking, keyed by date.
- **Sticker Book**: Collect stickers by leveling up; view your collection at `/stickers`.
- **Garden**: Earn garden plants as level-up rewards.
- **Progress Dashboard**: View mastery stats, 7-day activity chart, SRS due characters, and per-character history.

### Progress Tracking

- **Spaced Repetition (SRS)**: Characters follow a Leitner-like schedule (1, 3, 7, 21, 60 days)
- **Mastery States**: `unseen → introduced → practiced → mastered` based on wins across multiple days
- **Activity Log**: Last 1,000 interactions stored for review and recommendations
- **Export/Import**: Download progress as JSON; import on another device
- **Reset**: Full progress reset with confirmation

### Child-Friendly Design

The interface is specifically designed for primary school students:
- **Material Design 3 palette** (indigo / purple / emerald + tinted surfaces); WCAG AA contrast pinned in unit tests for body text, status callouts, and white-on-color buttons.
- **Consistent AppShell** on every page: sticky top bar + adaptive navigation (labeled left sidebar on larger screens, compact bottom tabs on smaller screens).
- **Main-pane spacing system**: full-width content with small consistent margins so pages feel roomy without wasting space.
- **Light mode default** with **dark mode support** — smooth theme switching.
- **Bilingual interface** — Cantonese (default) and English.
- **Large, touch-friendly buttons** (≥ 44 px touch targets) tuned for iPad.
- **Animal mascots** (panda / rabbit / monkey / owl / cat / tiger × idle / happy / cheer / oops) providing encouraging feedback.
- **Large character display** (120–200 px) using the **Free HK Kai** brush-stroke font.
- **Reduced-motion aware**: `useReducedMotion()` + a shared `useMotionClass()` hook gate every animation primitive (pop / wiggle / floatIn / cheer / confetti / parallax) and every page-level animation (Stroke Tracing pulse, Flashcard enter, Decomposition feedback).

### Core Capabilities

- **Traditional Characters Only**: Focuses exclusively on Traditional Chinese characters aligned with Hong Kong curricula
- **Cantonese Support**: Full Jyutping pronunciation with Web Speech API audio playback (zh-HK)
- **Authoritative Source**: Character data based on HK Education Bureau (教育局) standards
- **Visual Learning Aids**: Character decomposition visualization with structure types and stroke animations
- **Complete Word Lists**: Includes all words from Stage 1 and Stage 2 of the official word lists

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4 with CSS variables for theme support
- **Font**: Free HK Kai (Traditional Chinese Kaishu)
- **Internationalization**: React Context–based i18n (`zh-HK` + `en`)
- **Audio**: Custom `AudioEngine` over Web Audio API with 4 channels (`ui` / `voice` / `music` / `effect`), lazy `AudioContext`, iOS/WebKit unlock-on-gesture handling, and an asset registry. TTS via `SpeechSynthesis` with explicit voice picking (`Sinji` / `Tracy` for Cantonese, `Tingting` / `Xiaoxiao` for Mandarin) and a wait-for-voices fallback.
- **Storage**: `localStorage` under the `cantoHanzi.v1` key, with a typed `RootSchema`, schema versioning, and migrations (currently at v2; v1 → v2 adds the `favorites` collection).
- **Stroke matching**: Pixel-mask matcher in `src/lib/tracing/match.ts` (`buildExpectedMask` + `computeDistanceField` + `matchStrokeByMask`).
- **Motion primitives**: `useReducedMotion()` and `useMotionClass()` in `src/lib/motion/` (`pop` / `wiggle` / `floatIn` / `cheer` / `confetti` / `parallax`).
- **Testing**: Vitest + `@testing-library/react` + `jsdom` — **78 unit tests across 9 files** (storage, gamification, progress, tracing, favorites, motion, GameHost lifecycle, contrast, illustrations).
- **Linting**: ESLint with Next.js core-web-vitals config (0 errors, 0 warnings).
- **Spec workflow**: OpenSpec change `revamp-kids-ui-and-add-fun-games` (validates `--strict`).

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/beltonk/canto-hanzi-learning.git
cd canto-hanzi-learning
```

2. Install dependencies:
```bash
npm install
```

3. Generate indexes (if needed):
```bash
npm run index:generate
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Pages

Once the server is running, you can access:

- **Home (Playground Map)**: [http://localhost:3000](http://localhost:3000) — global search bar, activity tiles, quick links, today's review, daily quests, and the garden.
- **Character Exploration + Search**: [http://localhost:3000/learn/explore](http://localhost:3000/learn/explore) — also accepts `?char=明` or `?q=口` to deep-link a search.
- **Flashcard Revision**: [http://localhost:3000/learn/flashcard](http://localhost:3000/learn/flashcard)
- **Decomposition (拆字)**: [http://localhost:3000/learn/decompose](http://localhost:3000/learn/decompose)
- **Dictation Exercises**: [http://localhost:3000/learn/dictation](http://localhost:3000/learn/dictation)
- **Stroke Tracing**: [http://localhost:3000/learn/trace](http://localhost:3000/learn/trace) — append `?debug=trace` to see per-stroke score components.
- **Mini-Games Hub**: [http://localhost:3000/play](http://localhost:3000/play) — list of all 8 games.
- **Individual game**: [http://localhost:3000/play/character-rain](http://localhost:3000/play/character-rain) (and the other 7 game ids).
- **Progress Dashboard**: [http://localhost:3000/progress](http://localhost:3000/progress)
- **Sticker Book**: [http://localhost:3000/stickers](http://localhost:3000/stickers)
- **My Collection (我的收藏)**: [http://localhost:3000/favorites](http://localhost:3000/favorites)

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
canto-hanzi-learning/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── characters/           # Character retrieval endpoints
│   │   └── decomposition/        # Decomposition data
│   ├── components/
│   │   ├── games/                # 8 games + shared lifecycle
│   │   │   ├── GameHost.tsx           # intro → play → pause → result
│   │   │   ├── ResultScreen.tsx       # stars + XP screen
│   │   │   ├── registry.ts            # game id → manifest + dynamic import
│   │   │   ├── types.ts               # GameModule / GameProps / GameResult
│   │   │   ├── MatchUp.tsx            # 配對王
│   │   │   ├── WhackAHanzi.tsx        # 打地鼠
│   │   │   ├── CharacterRain.tsx      # 落字雨
│   │   │   ├── WordBuilder.tsx        # 拼字工坊
│   │   │   ├── SentenceGarden.tsx     # 造句樂園
│   │   │   ├── ToneBingo.tsx          # 聲調賓果
│   │   │   ├── RadicalDetective.tsx   # 拆字偵探
│   │   │   └── StrokeRacer.tsx        # 太空寫字
│   │   ├── learning/
│   │   │   ├── CharacterExploration.tsx
│   │   │   ├── FlashcardRevision.tsx
│   │   │   ├── DecompositionPlay.tsx
│   │   │   ├── DictationExercise.tsx
│   │   │   ├── StrokeTracing.tsx      # pixel-mask matcher + replay
│   │   │   ├── StrokeAnimation.tsx
│   │   │   └── RelatedWords.tsx
│   │   └── ui/
│   │       ├── AppShell.tsx           # responsive shell + adaptive navigation
│   │       ├── Mascot.tsx             # panda/rabbit/monkey/owl/cat/tiger
│   │       ├── FavoriteButton.tsx     # heart toggle (pill / icon / chip)
│   │       ├── QuestCard.tsx
│   │       ├── GardenPanel.tsx
│   │       ├── StickerThumb.tsx
│   │       ├── XpToast.tsx
│   │       ├── LevelUpModal.tsx
│   │       ├── EndOfSessionSummary.tsx
│   │       └── …
│   ├── learn/{explore,flashcard,decompose,dictation,trace}/page.tsx
│   ├── play/page.tsx                 # mini-games hub
│   ├── play/[gameId]/page.tsx        # individual game host
│   ├── progress/page.tsx             # dashboard + mastery grid
│   ├── stickers/page.tsx             # sticker book
│   ├── favorites/page.tsx            # 我的收藏
│   ├── globals.css                   # palette tokens + keyframes
│   ├── layout.tsx                    # Root layout (providers + AudioProvider)
│   └── page.tsx                      # Home (search + activities + quests)
├── src/
│   ├── types/
│   │   ├── character.ts
│   │   └── fullCharacter.ts
│   ├── lib/
│   │   ├── audio/                    # AudioEngine + registry + React context
│   │   ├── motion/                   # useReducedMotion + useMotionClass
│   │   ├── illustrations/            # mascot/sticker/garden registry
│   │   ├── kidMode/                  # Kid Mode provider
│   │   ├── activity/                 # recordActivity + session summary hook
│   │   ├── gamification/             # xpTable, levelCurve, streak, quests, rewards
│   │   ├── progress/                 # mastery, srs, log, recommend, exportImport
│   │   ├── tracing/                  # svgPathParse + pixel-mask matcher
│   │   ├── favorites/                # 我的收藏 storage helpers
│   │   ├── storage/                  # cantoHanzi.v1 RootSchema + migrations
│   │   ├── i18n/                     # zh-HK + en translations
│   │   ├── theme/                    # light/dark theme context
│   │   ├── data/                     # indexLoader + decompositionLoader
│   │   └── validation/
│   └── __tests__/                    # 78 vitest tests across 9 files
├── data/
│   ├── characters/                   # one JSON per character
│   ├── decomposition.json            # static character decomposition table
│   └── indexes/                      # pre-generated lookups
├── docs/
│   ├── audio.md                      # asset registry + how to extend
│   └── tracing.md                    # pixel-mask matching algorithm
├── public/
│   ├── fonts/                        # Free HK Kai
│   └── sounds/_initial/              # placeholder UI sounds (≤ 500 KB budget)
├── scripts/
│   ├── generate-indexes.ts
│   ├── crawl-edbchinese-json.ts
│   └── check-asset-budget.ts         # CI guard for sounds budget
├── openspec/
│   ├── changes/revamp-kids-ui-and-add-fun-games/   # current change
│   └── config.yaml
└── vitest.config.ts                  # @/* alias mirrors tsconfig multi-root
```

## API Documentation

### Character Retrieval

#### Get Characters with Filters
```http
GET /api/characters?minStrokes=1&maxStrokes=5&shuffle=true&inLexicalListsHK=true
GET /api/characters?char=人
GET /api/characters?meta=summary
```

**Query Parameters:**
- `char`: Specific character to retrieve
- `grade`: Learning stage (Stage 1 or Stage 2) - applies to words, not characters
- `minStrokes`: Minimum stroke count
- `maxStrokes`: Maximum stroke count
- `shuffle`: Randomize order (true/false)
- `inLexicalListsHK`: Only characters from HK lexical lists (true/false)
- `limit`: Maximum number of results
- `meta`: Request metadata only (e.g., "summary")

**Response:**
```json
{
  "characters": [
    {
      "id": "0001",
      "character": "人",
      "radical": "人",
      "strokeCount": 2,
      "jyutping": "jan4",
      "pinyin": "rén",
      "strokeVectors": [...],
      "stage1Words": [...],
      "stage2Words": [...],
      "fourCharacterPhrases": [...],
      "classicalPhrases": [...],
      "multiCharacterIdioms": [...],
      "properNouns": [...]
    }
  ],
  "count": 1
}
```

## Data Structure

### Character Data

Characters are stored in individual JSON files under `data/characters/`:
- Each file is named `{id}.json` (e.g., `0001.json`)
- Contains full character data including stroke vectors, word lists, and phrases

### Index Files

Pre-generated indexes for fast filtering and searching:
- `all.json`: Flat index of all characters
- `lexical-lists-hk.json`: Characters from HK lexical lists only
- `strokes.json`: Characters grouped by stroke count
- `radical.json`: Characters grouped by radical
- `stage.json`: Words grouped by learning stage (Stage 1/Stage 2)
- `summary.json`: Statistics and counts

### Generating Indexes

To regenerate index files after data updates:

```bash
npm run index:generate
```

## Using Learning Components

### Character Exploration

```tsx
import CharacterExploration from "@/app/components/learning/CharacterExploration";

<CharacterExploration 
  character="人" 
  onCharacterChange={(char) => console.log(char)}
/>
```

### Flashcard Revision

```tsx
import FlashcardRevision from "@/app/components/learning/FlashcardRevision";

<FlashcardRevision />
```

### Decomposition Play

```tsx
import DecompositionPlay from "@/app/components/learning/DecompositionPlay";

<DecompositionPlay 
  character="明"
  onCharacterChange={(char) => console.log(char)}
/>
```

### Dictation Exercise

```tsx
import DictationExercise from "@/app/components/learning/DictationExercise";

<DictationExercise />
```

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js configs (0 errors, 0 warnings)
- Components use PascalCase
- Path aliases: `@/*` resolves to **both** `./src/*` and `./*` (matches `tsconfig.json`); `vitest.config.ts` mirrors the same dual-root resolution.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests (Vitest)
- `npm run check` - Run lint + tests (CI gate)
- `npm run check:assets` - Verify initial sound assets are under 500 KB budget
- `npm run index:generate` - Generate index files from character data

## Internationalization

The system supports bilingual interface:
- **Cantonese (粵語)** - Default language
- **English** - Full translation available

Language preference is saved in localStorage and persists across sessions.

## Theme Support

The system supports both light and dark modes:
- **Light mode** - Default theme with warm, child-friendly colors
- **Dark mode** - Dark theme with adjusted colors for better contrast

Theme preference is saved in localStorage and persists across sessions.

## Future Enhancements

- [ ] Real audio files for UI sounds and mascot voicelines (the `_initial/` set is placeholder).
- [ ] Playwright smoke tests for all routes (current sweep is via the in-IDE browser MCP).
- [ ] iPad performance profiling for stroke tracing on a real device (target ≥ 45 fps for a 10-stroke character).

Already shipped (was previously on this list):

- [x] Pixel-mask stroke matcher with kid-friendly tolerances.
- [x] "重睇我寫" replay of captured polylines.
- [x] WCAG-AA contrast pinned in unit tests for the new palette tokens.
- [x] `prefers-reduced-motion` regression for every motion primitive + Flashcard / Decomposition / Stroke Tracing.

## Contributing

This project uses **OpenSpec** for specification-driven development. The
current change lives under
`openspec/changes/revamp-kids-ui-and-add-fun-games/` (proposal, design,
tasks, and per-capability spec deltas). Use the `opsx-*` Cursor commands
(`opsx-propose`, `opsx-explore`, `opsx-apply`, `opsx-archive`) or invoke
the matching Cursor skills directly to author or implement a change.

When working on this repo with an AI agent:

- Run `npm run check` (lint + 78 vitest tests) before pushing.
- Run `npx openspec validate <change-id> --strict` after editing any
  spec under `openspec/changes/`.
- See `docs/tracing.md` for the stroke-matching algorithm and
  `docs/audio.md` for the audio asset registry before extending those
  systems.

## License

MIT License

## Acknowledgments

- Hong Kong Education Bureau for the official word lists (《香港小學學習字詞表》)
- EDB Chinese (edbchinese.hk) for comprehensive character data
- Free HK Fonts project for the Free HK Kai font
