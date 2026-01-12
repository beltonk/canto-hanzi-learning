# 粵語漢字學習系統 (Cantonese Hanzi Learning System)

An interactive Traditional Chinese character learning system for Hong Kong **P1–P6** (Primary 1-6) students. This web application helps students learn Cantonese pronunciation, character recognition, decomposition, and dictation through engaging activities with a child-friendly interface.

## 語言標準 (Language Standard)

**本系統只使用書面語（Standard Written Chinese），不使用口語（Colloquial Cantonese）。**

- All character meanings and example sentences use **書面語** (Standard Written Chinese)
- UI text is in Standard Written Chinese for educational consistency
- Character selection is based on **香港教育局《香港小學學習字詞表》** (HK EDB Primary School Word Lists)
- Jyutping romanization is provided for Cantonese pronunciation

## 學習階段 (Learning Stages)

本系統按照《香港小學學習字詞表》的官方結構分為兩個學習階段：

| 學習階段 | 年級 | 官方用字 | **現有數據** | 覆蓋率 |
|----------|------|----------|--------------|--------|
| **第一學習階段 (KS1)** | 小一至小三 | 2,169 | **122** | 5.6% |
| **第二學習階段 (KS2)** | 小四至小六 | 1,002 | **83** | 8.3% |
| **總計** | 小一至小六 | **3,171** | **205** | **6.5%** |

> ⚠️ **重要提示 / Important Note**
> 
> 本系統目前只包含 **205 個示範字符**，佔官方《香港小學學習字詞表》的 6.5%。
> 
> This system currently contains only **205 sample characters**, which is 6.5% of the official HK EDB word list.
> 
> **如需完整數據，請參閱下方「數據導入」部分。**

## Features

### Learning Activities

- **🐼 認識漢字 (Character Exploration)**: Interactive character display with pronunciation, stroke count, components, and example sentences
- **🐰 字卡温習 (Flashcard Revision)**: Randomized flashcards with filters for learning stage and stroke count, featuring large navigation arrows and audio pronunciation
- **🐵 拆字遊戲 (Decomposition Play)**: Puzzle-based activity where students arrange character components to form complete characters
- **🦉 默書練習 (Dictation Exercises)**: Audio-based dictation exercises with immediate feedback

### Child-Friendly Design

The interface is specifically designed for primary school students:
- **Light mode default** with warm, inviting color palette (coral, mint, sky blue, golden)
- **Large, touch-friendly buttons** (48-72px touch targets) for iPad users
- **Animal mascots** for each activity providing encouraging feedback in 書面語
- **Large character display** (120-200px) using Free HK Kai font
- **Compact layouts** to show main content without scrolling
- **Collapsible word lists** showing 2 rows by default with "展開全部" option

### Core Capabilities

- **Traditional Characters Only**: Focuses exclusively on Traditional Chinese characters aligned with Hong Kong curricula
- **書面語 Content**: All educational content (meanings, examples, UI) in Standard Written Chinese
- **Cantonese Support**: Full Jyutping pronunciation with Web Speech API audio playback (zh-HK)
- **Authoritative Source**: Character data based on HK Education Bureau (教育局) standards
- **Visual Learning Aids**: Character decomposition visualization with structure types

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4
- **Font**: Free HK Kai (Traditional Chinese Kaishu)
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

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

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
│   │   ├── characters/       # Character retrieval endpoints
│   │   └── exercises/        # Exercise generation endpoints
│   ├── components/          # React components
│   │   ├── learning/        # Learning activity components
│   │   │   ├── CharacterExploration.tsx
│   │   │   ├── FlashcardRevision.tsx
│   │   │   ├── DecompositionPlay.tsx
│   │   │   └── DictationExercise.tsx
│   │   └── ui/              # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── NavArrow.tsx
│   │       └── Mascot.tsx
│   ├── learn/               # Learning activity pages
│   │   ├── explore/         # Character exploration page
│   │   ├── flashcard/       # Flashcard revision page
│   │   ├── decompose/       # Decomposition puzzle page
│   │   └── dictation/       # Dictation exercises page
│   ├── globals.css          # Global styles and CSS variables
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── src/
│   ├── types/                # TypeScript type definitions
│   │   └── character.ts     # Character, Example, Decomposition types
│   └── lib/
│       ├── validation/      # Data validation utilities
│       └── import/          # Data import pipeline
├── data/                     # Character data storage
│   └── characters.json      # 205 sample characters
├── public/
│   └── fonts/               # Custom fonts (Free HK Kai)
└── openspec/                 # OpenSpec documentation
    ├── project.md           # Project context
    └── specs/               # Feature specifications
        ├── character-exploration/
        ├── flashcard-revision/
        ├── decomposition-play/
        ├── dictation/
        └── ux-design/
```

## API Documentation

### Character Retrieval

#### Get Characters by Learning Stage
```http
GET /api/characters?grade=KS1
GET /api/characters?grade=KS2
```

Returns all characters for the specified learning stage.

#### Get Characters with Filters
```http
GET /api/characters?grade=KS1&minStrokes=1&maxStrokes=5&shuffle=true
```

**Query Parameters:**
- `grade`: Learning stage (KS1 or KS2)
- `minStrokes`: Minimum stroke count
- `maxStrokes`: Maximum stroke count
- `shuffle`: Randomize order (true/false)

**Response:**
```json
{
  "grade": "KS1",
  "count": 50,
  "characters": [
    {
      "character": {
        "character": "人",
        "grade": "KS1",
        "radical": "人",
        "strokeCount": 2,
        "jyutping": "jan4",
        "meanings": ["人類", "人物"],
        "tags": ["基礎", "人物"]
      },
      "decomposition": {
        "character": "人",
        "components": ["人"],
        "structureType": "獨體字"
      },
      "examples": [...]
    }
  ]
}
```

## Data Import

The system supports importing character data from external sources:

```bash
# Import CSV format
npm run import:csv -- --file=/path/to/wordlist.csv

# CSV format requirement:
# character,grade,radical,strokeCount,jyutping,meanings,tags
# 人,KS1,人,2,jan4,人類;人物,基礎;人物
```

### Data Sources

#### Official Sources
- [香港小學學習字詞表](https://www.edb.gov.hk/tc/curriculum-development/kla/chi-edu/resources/primary/lang/index.html) - 教育局官方網站
- [常用字字形表](https://www.edb.gov.hk/tc/curriculum-development/kla/chi-edu/resources/primary/lang/index.html) - 4,762 個常用字

#### Supplementary Datasets
- **Words.hk**: Comprehensive Cantonese dictionary dataset
- **CJK Decomposition Datasets**: Character component analysis

## Using Learning Components

### Character Exploration

```tsx
import CharacterExploration from "@/app/components/learning/CharacterExploration";

<CharacterExploration 
  character="人" 
  grade="KS1" 
  onCharacterChange={(char) => console.log(char)}
/>
```

### Flashcard Revision

```tsx
import FlashcardRevision from "@/app/components/learning/FlashcardRevision";

<FlashcardRevision initialGrade="KS1" />
```

### Decomposition Play

```tsx
import DecompositionPlay from "@/app/components/learning/DecompositionPlay";

<DecompositionPlay 
  character="明" 
  grade="KS1"
  onCharacterChange={(char) => console.log(char)}
/>
```

### Dictation Exercise

```tsx
import DictationExercise from "@/app/components/learning/DictationExercise";

<DictationExercise grade="KS1" />
```

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js configs
- Components use PascalCase
- Files use kebab-case
- Path aliases: `@/*` maps to `src/*`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Future Enhancements

- [ ] Complete character data import (3,171 characters)
- [ ] Progress tracking and user accounts
- [ ] Stroke order animation
- [ ] Spaced repetition system
- [ ] Mobile app version
- [ ] Dark mode option

## Contributing

This project uses OpenSpec for specification-driven development. See `openspec/AGENTS.md` for guidelines on creating proposals and implementing changes.

## License

MIT License

## Acknowledgments

- Hong Kong Education Bureau for the official word lists
- Words.hk dataset contributors
- CJK decomposition dataset maintainers
- Free HK Fonts project for the Kai font
