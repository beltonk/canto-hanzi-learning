# 粵語漢字學習系統 (Cantonese Hanzi Learning System)

An interactive Traditional Chinese character learning system for Hong Kong **P1–P6** (Primary 1-6) students. This web application helps students learn Cantonese pronunciation, character recognition, decomposition, and dictation through engaging activities.

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

## 數據來源 (Data Sources)

### 官方來源 (Official Sources)
- [香港小學學習字詞表](https://www.edb.gov.hk/tc/curriculum-development/kla/chi-edu/resources/primary/lang/index.html) - 教育局官方網站
- [常用字字形表](https://www.edb.gov.hk/tc/curriculum-development/kla/chi-edu/resources/primary/lang/index.html) - 4,762 個常用字

### 數據導入 (Data Import)
本系統支援從以下格式導入完整字詞表：

```bash
# 導入 CSV 格式
npm run import:csv -- --file=/path/to/wordlist.csv

# 導入 JSON 格式  
npm run import:json -- --file=/path/to/wordlist.json
```

CSV 格式要求：
```csv
character,grade,radical,strokeCount,jyutping,meanings,tags
人,P1,人,2,jan4,人類;人物,基礎;人物
```

> 📝 **獲取完整數據**
> 
> 1. 從教育局網站下載《香港小學學習字詞表》PDF
> 2. 使用 OCR 或手動輸入轉換為 CSV
> 3. 運行導入腳本

## Features

### Learning Activities

- **認識漢字 (Character Exploration)**: Interactive character display with pronunciation, stroke count, components, and example sentences in 書面語
- **拆字遊戲 (Decomposition Play)**: Puzzle-based activity where students arrange character components to form complete characters
- **默書練習 (Dictation Exercises)**: Audio-based dictation exercises with immediate feedback

### Core Capabilities

- **Traditional Characters Only**: Focuses exclusively on Traditional Chinese characters aligned with Hong Kong P1–P3 curricula
- **書面語 Content**: All educational content (meanings, examples) in Standard Written Chinese
- **Cantonese Support**: Full Jyutping pronunciation with Web Speech API audio playback (zh-HK)
- **Authoritative Source**: Character data based on HK Education Bureau (教育局) standards
- **Visual Learning Aids**: Character decomposition visualization with structure types

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4
- **Linting**: ESLint with Next.js configs
- **Fonts**: Geist Sans and Geist Mono

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- (Optional) Access to Cantonese TTS service (CUTalk, Aivoov, or cantonese.ai)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd canto-hanzi-learning
```

2. Install dependencies:
```bash
npm install
```

3. Create sample data (optional):
```bash
# The project includes sample data in data/characters.json
# For production, import real data using the import scripts (see Data Import section)
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Pages

Once the server is running, you can access:

- **Home Page**: [http://localhost:3000](http://localhost:3000) - Overview and navigation
- **Character Exploration**: [http://localhost:3000/learn/explore?char=人&grade=P1](http://localhost:3000/learn/explore?char=人&grade=P1)
- **Decomposition Play**: [http://localhost:3000/learn/decompose?char=人&grade=P1](http://localhost:3000/learn/decompose?char=人&grade=P1)
- **Dictation Exercises**: [http://localhost:3000/learn/dictation?grade=P1&category=audio](http://localhost:3000/learn/dictation?grade=P1&category=audio)

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
│   │   └── learning/        # Learning activity components
│   ├── learn/               # Learning activity pages
│   │   ├── explore/         # Character exploration page
│   │   ├── decompose/       # Decomposition puzzle page
│   │   └── dictation/       # Dictation exercises page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── src/
│   ├── types/                # TypeScript type definitions
│   │   └── character.ts     # Character, Example, Decomposition, AudioAsset types
│   ├── lib/
│   │   ├── validation/      # Data validation utilities
│   │   ├── import/          # Data import pipeline
│   │   │   ├── words-hk.ts  # Words.hk dataset importer
│   │   │   ├── cjk-decomp.ts # CJK decomposition importer
│   │   │   └── merger.ts    # Data merging utilities
│   │   ├── tts/             # TTS service integration
│   │   │   ├── service.ts   # TTS service manager
│   │   │   ├── cache.ts     # Audio caching
│   │   │   └── providers/  # TTS provider implementations
│   │   └── data/            # Data loading utilities
│   └── __tests__/           # Test files
├── data/                     # Character data storage
│   └── characters.json      # Processed character data
├── scripts/
│   └── import/              # Data import CLI scripts
│       └── import-data.ts   # Main import script
└── openspec/                 # OpenSpec documentation
    ├── project.md           # Project context and conventions
    └── changes/             # Change proposals
```

## API Documentation

### Character Retrieval

#### Get Characters by Grade
```http
GET /api/characters?grade=P1
```

Returns all characters for the specified grade level (P1, P2, or P3).

**Response:**
```json
{
  "grade": "P1",
  "count": 50,
  "characters": [
    {
      "character": {
        "character": "人",
        "grade": "P1",
        "radical": "人",
        "strokeCount": 2,
        "jyutping": "jan4",
        "meanings": ["person", "people"],
        "tags": ["basic", "people"]
      },
      "decomposition": {
        "character": "人",
        "components": ["人"],
        "structureType": "single"
      },
      "examples": [...]
    }
  ]
}
```

#### Get Characters by List
```http
GET /api/characters?chars=人,水,火
```

Returns specific characters from the provided comma-separated list.

### Exercise Generation

#### Get Dictation Exercises
```http
GET /api/exercises?type=dictation&grade=P1&limit=10
```

Generates dictation exercises for the specified grade.

**Response:**
```json
{
  "type": "dictation",
  "grade": "P1",
  "count": 10,
  "exercises": [
    {
      "type": "dictation",
      "id": "dictation-audio-人-0",
      "character": "人",
      "jyutping": "jan4",
      "audioUrl": "/api/audio/...",
      "correctAnswer": "人",
      "category": "audio"
    }
  ]
}
```

#### Get Decomposition Exercises
```http
GET /api/exercises?type=decomposition&grade=P1&limit=10
```

Generates decomposition puzzle exercises.

## Data Import

The project includes CLI scripts for importing data from external sources. These scripts use `tsx` to run TypeScript files directly.

### Importing from Words.hk Dataset

```bash
# Import Words.hk data for P1 grade
npm run import:words-hk <path-to-words-hk-data.json> P1

# Example:
npm run import:words-hk ./data/words-hk-raw.json P1

# Output will be saved to data/words-hk-P1.json
```

### Importing from CJK Decomposition Datasets

```bash
# Import CJK decomposition data
npm run import:cjk-decomp <path-to-cjk-decomp-data.json>

# Example:
npm run import:cjk-decomp ./data/cjk-decomp-raw.json

# Output will be saved to data/cjk-decomp.json
```

### Merging Data Sources

```bash
# Merge Words.hk and CJK decomposition data
npm run import:merge \
  <words-hk-file> \
  <cjk-decomp-file> \
  <output-file> \
  [grades...]

# Example:
npm run import:merge \
  data/words-hk-P1.json \
  data/cjk-decomp.json \
  data/characters.json \
  P1 P2 P3
```

**Note**: The import scripts require the `tsx` package (included in devDependencies) to run TypeScript files directly.

## Using Learning Components

The learning components are already integrated into the application pages, but you can also use them in your own pages:

### Character Exploration

```tsx
import CharacterExploration from "@/app/components/learning/CharacterExploration";

export default function CharacterPage() {
  return <CharacterExploration character="人" grade="P1" />;
}
```

**Props:**
- `character` (string, required): The Traditional Chinese character to explore
- `grade` (optional): Grade level filter ("P1" | "P2" | "P3")

### Decomposition Play

```tsx
import DecompositionPlay from "@/app/components/learning/DecompositionPlay";

export default function PuzzlePage() {
  return <DecompositionPlay character="人" grade="P1" />;
}
```

**Props:**
- `character` (string, required): The character to decompose
- `grade` (optional): Grade level filter ("P1" | "P2" | "P3")

### Dictation Exercise

```tsx
import DictationExercise from "@/app/components/learning/DictationExercise";

export default function DictationPage() {
  return <DictationExercise grade="P1" category="audio" />;
}
```

**Props:**
- `exerciseId` (optional): Specific exercise ID
- `grade` (optional): Grade level filter ("P1" | "P2" | "P3")
- `category` (optional): Exercise type ("audio" | "image")

### Pre-built Pages

The application includes ready-to-use pages at:
- `/learn/explore` - Character exploration with character and grade selectors
- `/learn/decompose` - Decomposition puzzle with character and grade selectors
- `/learn/dictation` - Dictation exercises with grade and category selectors

## Data Sources

### Authoritative References

- **香港教育局《香港小學學習字詞表》** (HK Education Bureau Primary School Word Lists)
  - Official character lists for P1-P3 levels
  - [EDB Curriculum Resources](https://www.edb.gov.hk)

- **香港教育局《常用字字形表》** (HK Education Bureau Common Character List)
  - Standard character forms for Hong Kong education

### Supplementary Datasets

- **Words.hk**: Comprehensive Cantonese dictionary dataset
  - [Repository](https://repository.eduhk.hk/en/publications/wordshk-a-comprehensive-cantonese-dictionary-dataset-with-definit-2/)
  - [Website](https://words.hk)

- **CJK Decomposition Datasets**:
  - [amake/cjk-decomp](https://github.com/amake/cjk-decomp)
  - [gundramleifert/CJK-decomposition](https://github.com/gundramleifert/CJK-decomposition)
  - [djuretic/Hanzi](https://github.com/djuretic/Hanzi)

### Audio

- **Web Speech API**: Browser-based Cantonese TTS (zh-HK locale)
- Future TTS Services (optional):
  - [CUTalk](http://dsp.ee.cuhk.edu.hk/license_cutalk.php)
  - [Aivoov](https://aivoov.com/text-to-speech-api/chinese-cantonese)
  - [cantonese.ai](https://cantonese.ai/tts)

## Configuration

### TTS Service Setup

Configure TTS providers in your environment or config file:

```typescript
import { createTTSService } from "@/lib/tts/service";

const ttsService = createTTSService([
  {
    name: "cutalk",
    endpoint: "https://api.cutalk.example.com/tts",
    apiKey: process.env.CUTALK_API_KEY,
    defaultVoice: "default",
  },
]);
```

### Data File Location

By default, character data is loaded from `data/characters.json`. You can specify a custom path in the data loader.

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js configs
- Components use PascalCase
- Files use kebab-case or match component names
- Path aliases: `@/*` maps to `src/*`

### Running Tests

Test framework setup is pending. Test examples are in `src/__tests__/`.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run import:words-hk <file> [grade]` - Import Words.hk dataset
- `npm run import:cjk-decomp <file>` - Import CJK decomposition dataset
- `npm run import:merge <words-hk> <cjk-decomp> <output> [grades...]` - Merge datasets

### Linting

```bash
npm run lint
```

## Future Enhancements

- [ ] Progress tracking and user accounts
- [ ] Stroke order animation
- [ ] Advanced character search and filtering
- [ ] Spaced repetition system
- [ ] Multiplayer/social features
- [ ] Mobile app version
- [ ] Database migration (from file-based storage)

## Contributing

This project uses OpenSpec for specification-driven development. See `openspec/AGENTS.md` for guidelines on creating proposals and implementing changes.

## License

[Add your license here]

## Acknowledgments

- Words.hk dataset contributors
- CJK decomposition dataset maintainers
- CUTalk and other TTS service providers
- Hong Kong education community
