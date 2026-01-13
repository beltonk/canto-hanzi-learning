/**
 * Index-Based Data Loader
 * 
 * Loads character data using pre-generated indexes for fast filtering,
 * grouping, sorting, and searching operations.
 * 
 * Index files:
 * - all.json: All characters
 * - lexical-lists-hk.json: Characters in HK Lexical Lists
 * - strokes.json: Characters grouped by stroke count
 * - radical.json: Characters grouped by radical
 * - stage.json: WORDS (not characters) grouped by learning stage
 * - summary.json: Statistics
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type {
  FullCharacterData,
  IndexEntry,
  WordIndexEntry,
  GroupedCharacterIndex,
  GroupedWordIndex,
  FlatCharacterIndex,
  IndexSummary,
  WordStage,
} from "@/types/fullCharacter";

const DATA_DIR = join(process.cwd(), "data");
const CHARACTERS_DIR = join(DATA_DIR, "characters");
const INDEXES_DIR = join(DATA_DIR, "indexes");

// Cache for loaded data
const cache = {
  allIndex: null as FlatCharacterIndex | null,
  lexicalListsHKIndex: null as FlatCharacterIndex | null,
  stageWordIndex: null as GroupedWordIndex | null,
  strokesIndex: null as GroupedCharacterIndex<number> | null,
  radicalIndex: null as GroupedCharacterIndex<string> | null,
  summary: null as IndexSummary | null,
  characters: new Map<string, FullCharacterData>(),
};

/**
 * Load a JSON file
 */
function loadJSON<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return null;
  }
}

// ============================================
// Character Index Loaders
// ============================================

/**
 * Load the flat "all" index (all characters)
 */
export function loadAllIndex(): FlatCharacterIndex | null {
  if (!cache.allIndex) {
    cache.allIndex = loadJSON<FlatCharacterIndex>(join(INDEXES_DIR, "all.json"));
  }
  return cache.allIndex;
}

/**
 * Load the lexical-lists-hk index (characters with inLexicalListsHK == true)
 */
export function loadLexicalListsHKIndex(): FlatCharacterIndex | null {
  if (!cache.lexicalListsHKIndex) {
    cache.lexicalListsHKIndex = loadJSON<FlatCharacterIndex>(join(INDEXES_DIR, "lexical-lists-hk.json"));
  }
  return cache.lexicalListsHKIndex;
}

/**
 * Load the stroke-grouped index
 */
export function loadStrokesIndex(): GroupedCharacterIndex<number> | null {
  if (!cache.strokesIndex) {
    cache.strokesIndex = loadJSON<GroupedCharacterIndex<number>>(join(INDEXES_DIR, "strokes.json"));
  }
  return cache.strokesIndex;
}

/**
 * Load the radical-grouped index
 */
export function loadRadicalIndex(): GroupedCharacterIndex<string> | null {
  if (!cache.radicalIndex) {
    cache.radicalIndex = loadJSON<GroupedCharacterIndex<string>>(join(INDEXES_DIR, "radical.json"));
  }
  return cache.radicalIndex;
}

// ============================================
// Word Index Loaders
// ============================================

/**
 * Load the word stage index (words grouped by learning stage)
 * Note: stage.json now contains WORDS, not characters
 */
export function loadStageWordIndex(): GroupedWordIndex | null {
  if (!cache.stageWordIndex) {
    cache.stageWordIndex = loadJSON<GroupedWordIndex>(join(INDEXES_DIR, "stage.json"));
  }
  return cache.stageWordIndex;
}

/**
 * Get words by learning stage
 */
export function getWordsByStage(stage: WordStage): WordIndexEntry[] {
  const stageIndex = loadStageWordIndex();
  if (!stageIndex) return [];
  
  const group = stageIndex.groups.find(g => g.key === stage);
  return group?.entries || [];
}

// ============================================
// Summary Loader
// ============================================

/**
 * Load summary statistics
 */
export function loadSummary(): IndexSummary | null {
  if (!cache.summary) {
    cache.summary = loadJSON<IndexSummary>(join(INDEXES_DIR, "summary.json"));
  }
  return cache.summary;
}

// ============================================
// Character Loaders
// ============================================

/**
 * Load full character data by ID
 */
export function loadCharacterById(id: string): FullCharacterData | null {
  if (cache.characters.has(id)) {
    return cache.characters.get(id)!;
  }
  
  const filePath = join(CHARACTERS_DIR, `${id}.json`);
  const data = loadJSON<FullCharacterData>(filePath);
  
  if (data) {
    cache.characters.set(id, data);
  }
  
  return data;
}

/**
 * Load full character data by character string
 */
export function loadCharacterByChar(char: string): FullCharacterData | null {
  // First check cache
  for (const [, data] of cache.characters) {
    if (data.character === char) {
      return data;
    }
  }
  
  // Look up in index
  const allIndex = loadAllIndex();
  if (!allIndex) return null;
  
  const entry = allIndex.entries.find(e => e.character === char);
  if (!entry) return null;
  
  return loadCharacterById(entry.id);
}

/**
 * Load multiple characters by IDs
 */
export function loadCharactersByIds(ids: string[]): FullCharacterData[] {
  return ids
    .map(id => loadCharacterById(id))
    .filter((data): data is FullCharacterData => data !== null);
}

// ============================================
// Index-Based Queries (Characters)
// ============================================

export interface CharacterFilter {
  /** Minimum stroke count (inclusive) */
  minStrokes?: number;
  /** Maximum stroke count (inclusive) */
  maxStrokes?: number;
  /** Filter by radical */
  radical?: string;
  /** Filter by inLexicalListsHK */
  inLexicalListsHK?: boolean;
  /** Search by character */
  character?: string;
  /** Search by jyutping (partial match) */
  jyutping?: string;
}

/**
 * Query character index entries with filters
 */
export function queryIndexEntries(filter: CharacterFilter = {}): IndexEntry[] {
  // Use lexical-lists-hk index if filtering by inLexicalListsHK === true
  let entries: IndexEntry[];
  
  if (filter.inLexicalListsHK === true) {
    const lexicalIndex = loadLexicalListsHKIndex();
    if (!lexicalIndex) return [];
    entries = [...lexicalIndex.entries];
  } else {
    const allIndex = loadAllIndex();
    if (!allIndex) return [];
    entries = [...allIndex.entries];
    
    // Apply inLexicalListsHK filter if explicitly false
    if (filter.inLexicalListsHK === false) {
      entries = entries.filter(e => !e.inLexicalListsHK);
    }
  }
  
  // Stroke count filters
  if (filter.minStrokes !== undefined) {
    entries = entries.filter(e => e.strokeCount >= filter.minStrokes!);
  }
  if (filter.maxStrokes !== undefined) {
    entries = entries.filter(e => e.strokeCount <= filter.maxStrokes!);
  }
  
  // Radical filter
  if (filter.radical) {
    entries = entries.filter(e => e.radical === filter.radical);
  }
  
  // Character search
  if (filter.character) {
    entries = entries.filter(e => e.character === filter.character);
  }
  
  // Jyutping search (partial match)
  if (filter.jyutping) {
    const search = filter.jyutping.toLowerCase();
    entries = entries.filter(e => 
      e.jyutping.toLowerCase().includes(search)
    );
  }
  
  return entries;
}

/**
 * Query full character data with filters
 */
export function queryCharacters(
  filter: CharacterFilter = {},
  options: {
    limit?: number;
    offset?: number;
    shuffle?: boolean;
  } = {}
): FullCharacterData[] {
  let entries = queryIndexEntries(filter);
  
  // Shuffle if requested
  if (options.shuffle) {
    entries = shuffleArray(entries);
  }
  
  // Pagination
  if (options.offset !== undefined) {
    entries = entries.slice(options.offset);
  }
  if (options.limit !== undefined) {
    entries = entries.slice(0, options.limit);
  }
  
  // Load full data
  return entries
    .map(e => loadCharacterById(e.id))
    .filter((data): data is FullCharacterData => data !== null);
}

/**
 * Get characters by stroke count (using strokes index for efficiency)
 */
export function getCharactersByStrokeCount(strokeCount: number): IndexEntry[] {
  const strokesIndex = loadStrokesIndex();
  if (!strokesIndex) return [];
  
  const group = strokesIndex.groups.find(g => g.key === strokeCount);
  return group?.entries || [];
}

/**
 * Get characters by radical (using radical index for efficiency)
 */
export function getCharactersByRadical(radical: string): IndexEntry[] {
  const radicalIndex = loadRadicalIndex();
  if (!radicalIndex) return [];
  
  const group = radicalIndex.groups.find(g => g.key === radical);
  return group?.entries || [];
}

/**
 * Get all unique radicals
 */
export function getAllRadicals(): string[] {
  const radicalIndex = loadRadicalIndex();
  if (!radicalIndex) return [];
  
  return radicalIndex.groups.map(g => g.key);
}

/**
 * Get all unique stroke counts
 */
export function getAllStrokeCounts(): number[] {
  const summary = loadSummary();
  if (!summary) return [];
  
  return summary.strokeCounts.map(s => s.strokes).sort((a, b) => a - b);
}

// ============================================
// Utilities
// ============================================

/**
 * Fisher-Yates shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Clear all caches (for development/testing)
 */
export function clearCache(): void {
  cache.allIndex = null;
  cache.lexicalListsHKIndex = null;
  cache.stageWordIndex = null;
  cache.strokesIndex = null;
  cache.radicalIndex = null;
  cache.summary = null;
  cache.characters.clear();
}

// ============================================
// Legacy/Compatibility (deprecated)
// ============================================

/**
 * @deprecated Use loadLexicalListsHKIndex() instead. Stage applies to words, not characters.
 */
export function loadStageIndex(): GroupedWordIndex | null {
  console.warn("loadStageIndex() is deprecated. Stage applies to words, not characters. Use loadStageWordIndex() instead.");
  return loadStageWordIndex();
}

/**
 * @deprecated Stage applies to words, not characters. Use getWordsByStage() instead.
 */
export function getCharactersByStage(stage: "1" | "2"): IndexEntry[] {
  console.warn("getCharactersByStage() is deprecated. Stage applies to words, not characters.");
  // Return empty array - stage no longer applies to characters
  return [];
}
