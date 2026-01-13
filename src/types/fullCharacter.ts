/**
 * Full Character Data Types
 * 
 * These types represent the complete character data from individual JSON files
 * including stroke animations, related words, and phrases.
 */

/**
 * Stroke vector data for animation rendering
 */
export interface StrokeVector {
  /** Stroke number (1, 2, 3...) */
  strokeNumber: number;
  /** Segment within the stroke (for multi-segment strokes) */
  segment: number;
  /** Animation frame number */
  frame: number;
  /** SVG path data (base64 encoded or raw SVG path) */
  pathData: string;
  /** Transform position */
  transform: {
    x: number;
    y: number;
  };
  /** Stroke color (hex) */
  color: string;
}

/**
 * Word entry with pronunciation (for character data)
 */
export interface Word {
  /** The word/phrase */
  word: string;
  /** Cantonese romanization */
  jyutping?: string;
  /** Mandarin pinyin */
  pinyin?: string;
  /** Learning stage ("1" or "2") */
  stage?: string;
}

/**
 * Simple phrase entry (just the word)
 */
export interface Phrase {
  /** The phrase/idiom */
  word: string;
}

/**
 * Full character data from individual JSON files
 */
export interface FullCharacterData {
  /** Character ID (e.g., "0001") */
  id: string;
  /** The character itself */
  character: string;
  /** Source URL from EDB Chinese */
  sourceUrl?: string;
  /** Radical (部首) */
  radical: string;
  /** Total stroke count */
  strokeCount: number;
  /** Cantonese romanization (粵拼) */
  jyutping: string;
  /** Mandarin pinyin */
  pinyin?: string;
  /** URLs to stroke animation HTML pages */
  strokeOrderImages?: string[];
  /** Vector graphics data for stroke animations */
  strokeVectors?: StrokeVector[];
  /** Whether in HK lexical lists */
  inLexicalListsHK?: boolean;
  /** Stage 1 (第一學習階段) words */
  stage1Words?: Word[];
  /** Stage 2 (第二學習階段) words */
  stage2Words?: Word[];
  /** 四字詞語 (4-character phrases) */
  fourCharacterPhrases?: Phrase[];
  /** 文言詞語 (classical phrases) */
  classicalPhrases?: Phrase[];
  /** 多字成語 (multi-character idioms) */
  multiCharacterIdioms?: Phrase[];
  /** 專有名詞 (proper nouns) */
  properNouns?: Phrase[];
  /** 音譯詞 (transliterated words) */
  transliteratedWords?: Phrase[];
}

/**
 * Character index entry (no stage field - stage applies to words only)
 */
export interface IndexEntry {
  /** Key for grouping */
  key: string;
  /** Character ID */
  id: string;
  /** The character */
  character: string;
  /** Radical */
  radical: string;
  /** Stroke count */
  strokeCount: number;
  /** Jyutping */
  jyutping: string;
  /** In HK lexical lists */
  inLexicalListsHK: boolean;
}

/**
 * Word index entry (for stage.json - words grouped by learning stage)
 */
export interface WordIndexEntry {
  /** The word/phrase */
  word: string;
  /** Cantonese romanization */
  jyutping: string;
  /** Mandarin pinyin */
  pinyin: string;
  /** ID of the character this word is associated with */
  characterId: string;
  /** The character this word is associated with */
  character: string;
}

/**
 * Grouped index structure for characters
 */
export interface GroupedCharacterIndex<K extends string | number = string | number> {
  groups: Array<{
    key: K;
    entries: IndexEntry[];
  }>;
}

/**
 * Grouped index structure for words
 */
export interface GroupedWordIndex {
  groups: Array<{
    key: string;
    entries: WordIndexEntry[];
  }>;
}

/**
 * Flat character index structure
 */
export interface FlatCharacterIndex {
  entries: IndexEntry[];
}

/**
 * Summary statistics
 */
export interface IndexSummary {
  /** Total number of characters */
  totalCharacters: number;
  /** Characters in HK lexical lists */
  lexicalListsHKCount: number;
  /** Total Stage 1 (第一學習階段) words */
  stage1WordCount: number;
  /** Total Stage 2 (第二學習階段) words */
  stage2WordCount: number;
  /** Distribution of characters by stroke count */
  strokeCounts: Array<{
    strokes: number;
    count: number;
  }>;
  /** Distribution of radicals by stroke count */
  radicalCounts: Array<{
    strokes: number;
    radicalCount: number;
  }>;
}

/**
 * Learning stage type for words
 */
export type WordStage = "1" | "2";

// Legacy aliases for backwards compatibility
export type GroupedIndex<K extends string | number = string | number> = GroupedCharacterIndex<K>;
export type FlatIndex = FlatCharacterIndex;
