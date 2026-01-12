import type { Character, Decomposition, Example } from "@/types/character";

/**
 * Data merging utilities
 * 
 * Combines character data from multiple sources (Words.hk, decomposition datasets)
 * into unified character entities.
 */

export interface MergedCharacterData {
  characters: Character[];
  decompositions: Decomposition[];
  examples: Example[];
  errors: string[];
}

/**
 * Merge character data from multiple sources
 * 
 * @param sources - Object containing characters, decompositions, and examples from different sources
 * @returns Merged data with unified character entities
 */
export function mergeCharacterData(sources: {
  characters: Character[];
  decompositions: Decomposition[];
  examples: Example[];
}): MergedCharacterData {
  const { characters, decompositions, examples } = sources;
  const errors: string[] = [];

  // Create a map of characters by character string for quick lookup
  const characterMap = new Map<string, Character>();
  const decompositionMap = new Map<string, Decomposition>();

  // Index characters
  for (const char of characters) {
    characterMap.set(char.character, char);
  }

  // Index decompositions
  for (const decomp of decompositions) {
    decompositionMap.set(decomp.character, decomp);
  }

  // Merge decomposition data into characters
  const mergedCharacters: Character[] = [];
  for (const char of characters) {
    const merged = { ...char };
    const decomp = decompositionMap.get(char.character);

    if (decomp) {
      // Update character with decomposition data
      merged.decompositionRef = decomp.character;
      // If radical/stroke count not set, try to infer from decomposition
      // (This is a placeholder - actual logic would be more sophisticated)
      if (!merged.radical && decomp.components.length > 0) {
        // Use first component as radical hint (simplified approach)
        merged.radical = decomp.components[0];
      }
    }

    mergedCharacters.push(merged);
  }

  // Filter examples to only include those for characters we have
  const characterSet = new Set(characters.map((c) => c.character));
  const filteredExamples = examples.filter((ex) => characterSet.has(ex.character));

  return {
    characters: mergedCharacters,
    decompositions,
    examples: filteredExamples,
    errors,
  };
}

/**
 * Filter data by grade level
 * 
 * @param data - Merged character data
 * @param grades - Array of grade levels to include (e.g., ["P1", "P2"])
 * @returns Filtered data containing only specified grades
 */
export function filterByGrade(
  data: MergedCharacterData,
  grades: ("P1" | "P2" | "P3")[]
): MergedCharacterData {
  const gradeSet = new Set(grades);

  const filteredCharacters = data.characters.filter((char) => gradeSet.has(char.grade));
  const characterSet = new Set(filteredCharacters.map((c) => c.character));

  const filteredDecompositions = data.decompositions.filter((decomp) =>
    characterSet.has(decomp.character)
  );
  const filteredExamples = data.examples.filter((ex) => characterSet.has(ex.character));

  return {
    characters: filteredCharacters,
    decompositions: filteredDecompositions,
    examples: filteredExamples,
    errors: data.errors,
  };
}

/**
 * Export merged data to JSON format
 * 
 * @param data - Merged character data
 * @returns JSON string representation
 */
export function exportToJSON(data: MergedCharacterData): string {
  return JSON.stringify(data, null, 2);
}
