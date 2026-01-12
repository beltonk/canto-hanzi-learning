import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Character, Decomposition, Example, LearningStage } from "@/types/character";

/**
 * Data Loader
 * 
 * Loads character data from processed JSON files.
 * In production, this could be replaced with database queries.
 */

interface CharacterData {
  characters: Character[];
  decompositions: Decomposition[];
  examples: Example[];
}

let cachedData: CharacterData | null = null;

/**
 * Load character data from JSON file
 * 
 * @param filePath - Path to JSON file (defaults to data/characters.json)
 * @returns Character data
 */
export function loadCharacterData(filePath?: string): CharacterData {
  // Use cached data if available
  if (cachedData) {
    return cachedData;
  }

  const defaultPath = join(process.cwd(), "data", "characters.json");
  const path = filePath || defaultPath;

  if (!existsSync(path)) {
    console.warn(`Character data file not found: ${path}. Returning empty data.`);
    return {
      characters: [],
      decompositions: [],
      examples: [],
    };
  }

  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    cachedData = {
      characters: data.characters || [],
      decompositions: data.decompositions || [],
      examples: data.examples || [],
    };
    return cachedData;
  } catch (error) {
    console.error(`Error loading character data:`, error);
    return {
      characters: [],
      decompositions: [],
      examples: [],
    };
  }
}

/**
 * Get characters by learning stage
 * 
 * @param stage - Learning stage (KS1 or KS2)
 * @returns Array of characters for the stage
 */
export function getCharactersByGrade(stage: LearningStage): Character[] {
  const data = loadCharacterData();
  return data.characters.filter((char) => char.grade === stage);
}

/**
 * Get characters by character list
 * 
 * @param chars - Array of character strings
 * @returns Array of characters matching the list
 */
export function getCharactersByList(chars: string[]): Character[] {
  const data = loadCharacterData();
  const charSet = new Set(chars);
  return data.characters.filter((char) => charSet.has(char.character));
}

/**
 * Get character with full data (including decomposition and examples)
 * 
 * @param character - Character string
 * @returns Character with associated data, or null if not found
 */
export function getCharacterWithData(character: string): {
  character: Character;
  decomposition?: Decomposition;
  examples: Example[];
} | null {
  const data = loadCharacterData();
  const char = data.characters.find((c) => c.character === character);

  if (!char) {
    return null;
  }

  const decomposition = data.decompositions.find((d) => d.character === character);
  const examples = data.examples.filter((e) => e.character === character);

  return {
    character: char,
    decomposition,
    examples,
  };
}

/**
 * Get all characters with full data
 * 
 * @param stage - Optional learning stage filter (KS1 or KS2)
 * @returns Array of characters with associated data
 */
export function getAllCharactersWithData(stage?: LearningStage): Array<{
  character: Character;
  decomposition?: Decomposition;
  examples: Example[];
}> {
  const data = loadCharacterData();
  let characters = data.characters;

  if (stage) {
    characters = characters.filter((c) => c.grade === stage);
  }

  return characters.map((char) => {
    const decomposition = data.decompositions.find((d) => d.character === char.character);
    const examples = data.examples.filter((e) => e.character === char.character);

    return {
      character: char,
      decomposition,
      examples,
    };
  });
}

/**
 * Clear cached data (useful for development/testing)
 */
export function clearCache(): void {
  cachedData = null;
}
