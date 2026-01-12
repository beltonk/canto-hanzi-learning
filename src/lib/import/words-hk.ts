import type { Character, Example } from "@/types/character";
import { validateCharacter, validateExample, isTraditional } from "@/lib/validation/character";

/**
 * Words.hk dataset import
 * 
 * This module handles importing Cantonese lexical data from the Words.hk dataset.
 * It extracts Traditional characters, Jyutping pronunciations, and example sentences.
 * 
 * Note: This is a framework implementation. The actual parsing logic will depend
 * on the specific format of the Words.hk dataset.
 */

export interface WordsHkEntry {
  /** Traditional character */
  char: string;
  /** Jyutping pronunciation */
  jyutping: string;
  /** Example sentences */
  examples?: Array<{
    sentence: string;
    jyutping: string;
    englishGloss?: string;
  }>;
  /** Tags or categories */
  tags?: string[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Parse Words.hk dataset file
 * 
 * @param data - Raw dataset data (format depends on Words.hk export format)
 * @returns Array of parsed entries
 */
export function parseWordsHkData(data: unknown): WordsHkEntry[] {
  // TODO: Implement actual parsing based on Words.hk dataset format
  // This is a placeholder that expects JSON array format
  if (!Array.isArray(data)) {
    throw new Error("Words.hk data must be an array");
  }

  return data.map((entry) => {
    // Basic validation and extraction
    if (typeof entry !== "object" || entry === null) {
      throw new Error("Invalid entry format");
    }

    const e = entry as Record<string, unknown>;
    return {
      char: String(e.char || ""),
      jyutping: String(e.jyutping || ""),
      examples: Array.isArray(e.examples) ? e.examples as WordsHkEntry["examples"] : undefined,
      tags: Array.isArray(e.tags) ? (e.tags as string[]) : undefined,
      metadata: typeof e.metadata === "object" && e.metadata !== null ? (e.metadata as Record<string, unknown>) : undefined,
    };
  });
}

/**
 * Convert Words.hk entries to Character entities
 * 
 * @param entries - Parsed Words.hk entries
 * @param grade - Learning stage to assign (defaults to KS1 if not specified in data)
 * @returns Array of Character entities
 */
export function convertToCharacters(
  entries: WordsHkEntry[],
  grade: "KS1" | "KS2" = "KS1"
): Character[] {
  const characters: Character[] = [];
  const errors: string[] = [];

  for (const entry of entries) {
    // Filter for Traditional characters only
    if (!isTraditional(entry.char)) {
      continue; // Skip simplified characters
    }

    try {
      const character: Character = {
        character: entry.char,
        grade,
        radical: "", // Will be filled from decomposition data or manual entry
        strokeCount: 0, // Will be filled from decomposition data or manual entry
        jyutping: entry.jyutping,
        meanings: [], // Will be extracted from metadata if available
        tags: entry.tags || [],
      };

      const validation = validateCharacter(character);
      if (validation.valid) {
        characters.push(character);
      } else {
        errors.push(`Invalid character ${entry.char}: ${validation.errors.join(", ")}`);
      }
    } catch (error) {
      errors.push(`Error processing ${entry.char}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length > 0) {
    console.warn("Import warnings:", errors);
  }

  return characters;
}

/**
 * Convert Words.hk entries to Example entities
 * 
 * @param entries - Parsed Words.hk entries
 * @returns Array of Example entities
 */
export function convertToExamples(entries: WordsHkEntry[]): Example[] {
  const examples: Example[] = [];
  const errors: string[] = [];

  for (const entry of entries) {
    if (!entry.examples || entry.examples.length === 0) {
      continue;
    }

    for (const exampleData of entry.examples) {
      try {
        const example: Example = {
          character: entry.char,
          sentence: exampleData.sentence,
          jyutping: exampleData.jyutping,
          englishGloss: exampleData.englishGloss,
        };

        const validation = validateExample(example);
        if (validation.valid) {
          examples.push(example);
        } else {
          errors.push(`Invalid example for ${entry.char}: ${validation.errors.join(", ")}`);
        }
      } catch (error) {
        errors.push(`Error processing example for ${entry.char}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  if (errors.length > 0) {
    console.warn("Example import warnings:", errors);
  }

  return examples;
}

/**
 * Import Words.hk dataset and return Character and Example entities
 * 
 * @param data - Raw dataset data
 * @param grade - Learning stage to assign
 * @returns Object with characters and examples arrays
 */
export function importWordsHk(
  data: unknown,
  grade: "KS1" | "KS2" = "KS1"
): { characters: Character[]; examples: Example[]; errors: string[] } {
  const errors: string[] = [];

  try {
    const entries = parseWordsHkData(data);
    const characters = convertToCharacters(entries, grade);
    const examples = convertToExamples(entries);

    return { characters, examples, errors };
  } catch (error) {
    errors.push(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    return { characters: [], examples: [], errors };
  }
}
