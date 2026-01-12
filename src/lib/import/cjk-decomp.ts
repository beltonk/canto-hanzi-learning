import type { Decomposition, StructureType } from "@/types/character";
import { validateDecomposition, isTraditional } from "@/lib/validation/character";

/**
 * CJK Decomposition dataset import
 * 
 * This module handles importing character decomposition data from various
 * CJK decomposition datasets (amake/cjk-decomp, gundramleifert/CJK-decomposition, djuretic/Hanzi).
 * It normalizes different formats into a simple internal format.
 */

export interface CJKDecompEntry {
  /** Target character */
  character: string;
  /** Components (format depends on source) */
  components: string | string[];
  /** Structure information (format depends on source) */
  structure?: string;
  /** Source dataset identifier */
  source?: string;
}

/**
 * Normalize structure type from various formats
 */
function normalizeStructureType(structure: string | undefined): StructureType {
  if (!structure) return "other";

  const normalized = structure.toLowerCase().trim();

  if (normalized.includes("left") && normalized.includes("right")) {
    return "left-right";
  }
  if (normalized.includes("top") && normalized.includes("bottom")) {
    return "top-bottom";
  }
  if (normalized.includes("surround") || normalized.includes("enclose")) {
    return "surround";
  }
  if (normalized.includes("single") || normalized === "1") {
    return "single";
  }

  return "other";
}

/**
 * Parse components from various formats
 */
function parseComponents(components: string | string[]): string[] {
  if (Array.isArray(components)) {
    return components.filter((c) => c && c.length > 0);
  }

  if (typeof components === "string") {
    // Handle various string formats:
    // - Comma-separated: "人,水"
    // - Space-separated: "人 水"
    // - No separator: "人水"
    // - With brackets or other markers
    const cleaned = components
      .replace(/[\[\](){}]/g, "") // Remove brackets
      .trim();

    // Try comma separation first
    if (cleaned.includes(",")) {
      return cleaned.split(",").map((c) => c.trim()).filter((c) => c.length > 0);
    }

    // Try space separation
    if (cleaned.includes(" ")) {
      return cleaned.split(/\s+/).filter((c) => c.length > 0);
    }

    // Single component or no separator - split by character
    return cleaned.split("").filter((c) => c.length > 0);
  }

  return [];
}

/**
 * Parse CJK decomposition dataset
 * 
 * @param data - Raw dataset data (format depends on source)
 * @returns Array of parsed entries
 */
export function parseCJKDecompData(data: unknown): CJKDecompEntry[] {
  // TODO: Implement actual parsing based on specific dataset format
  // This is a placeholder that expects JSON array format
  if (!Array.isArray(data)) {
    throw new Error("CJK decomposition data must be an array");
  }

  return data.map((entry) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error("Invalid entry format");
    }

    const e = entry as Record<string, unknown>;
    return {
      character: String(e.character || e.char || ""),
      components: (e.components as string | string[]) || [],
      structure: e.structure ? String(e.structure) : undefined,
      source: e.source ? String(e.source) : undefined,
    };
  });
}

/**
 * Convert CJK decomposition entries to Decomposition entities
 * 
 * @param entries - Parsed decomposition entries
 * @returns Array of Decomposition entities
 */
export function convertToDecompositions(entries: CJKDecompEntry[]): Decomposition[] {
  const decompositions: Decomposition[] = [];
  const errors: string[] = [];

  for (const entry of entries) {
    // Filter for Traditional characters only
    if (!isTraditional(entry.character)) {
      continue; // Skip simplified characters
    }

    try {
      const components = parseComponents(entry.components);
      const structureType = normalizeStructureType(entry.structure);

      const decomposition: Decomposition = {
        character: entry.character,
        components,
        structureType,
      };

      const validation = validateDecomposition(decomposition);
      if (validation.valid) {
        decompositions.push(decomposition);
      } else {
        errors.push(`Invalid decomposition for ${entry.character}: ${validation.errors.join(", ")}`);
      }
    } catch (error) {
      errors.push(`Error processing decomposition for ${entry.character}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length > 0) {
    console.warn("Decomposition import warnings:", errors);
  }

  return decompositions;
}

/**
 * Import CJK decomposition dataset
 * 
 * @param data - Raw dataset data
 * @returns Object with decompositions array and errors
 */
export function importCJKDecomp(data: unknown): { decompositions: Decomposition[]; errors: string[] } {
  const errors: string[] = [];

  try {
    const entries = parseCJKDecompData(data);
    const decompositions = convertToDecompositions(entries);

    return { decompositions, errors };
  } catch (error) {
    errors.push(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    return { decompositions: [], errors };
  }
}
