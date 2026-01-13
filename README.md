# 粵語漢字學習系統 (Cantonese Hanzi Learning System)

An interactive Traditional Chinese character learning system for Hong Kong primary school students. This web application helps students learn Cantonese pronunciation, character recognition, decomposition, and dictation through engaging activities with a child-friendly interface.

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

- **🐼 認識漢字 (Character Exploration)**: Interactive character display with pronunciation, stroke count, components, and related words. Features character filtering by radical, stroke count, and Jyutping.
- **🐰 字卡温習 (Flashcard Revision)**: Randomized flashcards with filters for learning stage and stroke count, featuring large navigation arrows and audio pronunciation
- **🐵 拆字遊戲 (Decomposition Play)**: Puzzle-based activity where students arrange character components to form complete characters
- **🦉 默書練習 (Dictation Exercises)**: Audio-based dictation exercises with immediate feedback

### Child-Friendly Design

The interface is specifically designed for primary school students:
- **Light mode default** with **dark mode support** - smooth theme switching
- **Bilingual interface** - Cantonese (default) and English language options
- **Large, touch-friendly buttons** (48-72px touch targets) for iPad users
- **Animal mascots** for each activity providing encouraging feedback
- **Large character display** (120-200px) using Free HK Kai font
- **Compact layouts** to show main content without scrolling
- **Scrollable word lists** with expand/collapse options

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
- **Internationalization**: React Context-based i18n system
- **Linting**: ESLint with Next.js configs

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

- **Home Page**: [http://localhost:3000](http://localhost:3000) - Overview and navigation with 4 activity cards
- **Character Exploration**: [http://localhost:3000/learn/explore](http://localhost:3000/learn/explore) - Learn characters with meanings, decomposition, and examples
- **Flashcard Revision**: [http://localhost:3000/learn/flashcard](http://localhost:3000/learn/flashcard) - Random flashcards with filters
- **Decomposition Play**: [http://localhost:3000/learn/decompose](http://localhost:3000/learn/decompose) - Drag-and-drop character puzzles
- **Dictation Exercises**: [http://localhost:3000/learn/dictation](http://localhost:3000/learn/dictation) - Listen and write dictation practice

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
canto-hanzi-learning/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   └── characters/       # Character retrieval endpoints
│   ├── components/          # React components
│   │   ├── learning/        # Learning activity components
│   │   │   ├── CharacterExploration.tsx
│   │   │   ├── FlashcardRevision.tsx
│   │   │   ├── DecompositionPlay.tsx
│   │   │   ├── DictationExercise.tsx
│   │   │   ├── RelatedWords.tsx
│   │   │   └── StrokeAnimation.tsx
│   │   └── ui/              # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── NavArrow.tsx
│   │       ├── Mascot.tsx
│   │       ├── LanguageSwitcher.tsx
│   │       └── ThemeSwitcher.tsx
│   ├── learn/               # Learning activity pages
│   │   ├── explore/         # Character exploration page
│   │   ├── flashcard/       # Flashcard revision page
│   │   ├── decompose/       # Decomposition puzzle page
│   │   └── dictation/       # Dictation exercises page
│   ├── globals.css          # Global styles and CSS variables
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Home page
├── src/
│   ├── types/                # TypeScript type definitions
│   │   ├── character.ts     # Character, Example, Decomposition types
│   │   └── fullCharacter.ts # Full character data types
│   └── lib/
│       ├── i18n/            # Internationalization
│       │   ├── context.tsx  # Language context provider
│       │   └── translations.ts # Translation keys
│       ├── theme/           # Theme management
│       │   └── context.tsx  # Theme context provider
│       ├── validation/      # Data validation utilities
│       └── data/            # Data loading utilities
│           └── indexLoader.ts # Index-based data loader
├── data/                     # Character data storage
│   ├── characters/          # Individual character JSON files
│   └── indexes/             # Pre-generated indexes
│       ├── all.json         # All characters index
│       ├── lexical-lists-hk.json # HK lexical list characters
│       ├── strokes.json     # Characters grouped by stroke count
│       ├── radical.json     # Characters grouped by radical
│       ├── stage.json       # Words grouped by learning stage
│       └── summary.json     # Statistics
├── scripts/                  # Utility scripts
│   ├── generate-indexes.ts # Generate index files
│   └── crawl-edbchinese-json.ts # EDB Chinese crawler
├── public/
│   └── fonts/               # Custom fonts (Free HK Kai)
└── openspec/                 # OpenSpec documentation
    ├── AGENTS.md            # Agent guidelines
    ├── project.md           # Project context
    └── specs/               # Feature specifications
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
  grade="Stage 1"
  onCharacterChange={(char) => console.log(char)}
/>
```

### Dictation Exercise

```tsx
import DictationExercise from "@/app/components/learning/DictationExercise";

<DictationExercise grade="Stage 1" />
```

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js configs (0 errors, 0 warnings)
- Components use PascalCase
- Files use kebab-case
- Path aliases: `@/*` maps to `src/*`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
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

- [ ] Progress tracking and user accounts
- [ ] Spaced repetition system
- [ ] Mobile app version
- [ ] Additional learning activities

## Contributing

This project uses OpenSpec for specification-driven development. See `openspec/AGENTS.md` for guidelines on creating proposals and implementing changes.

## License

MIT License

## Acknowledgments

- Hong Kong Education Bureau for the official word lists (《香港小學學習字詞表》)
- EDB Chinese (edbchinese.hk) for comprehensive character data
- Free HK Fonts project for the Free HK Kai font
