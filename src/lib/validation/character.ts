import type { Character, GradeLevel, Example, Decomposition, AudioAsset, AudioCategory, StructureType } from "@/types/character";

/**
 * Valid grade levels
 */
const VALID_GRADES: GradeLevel[] = ["P1", "P2", "P3"];

/**
 * Valid structure types
 */
const VALID_STRUCTURE_TYPES: StructureType[] = ["left-right", "top-bottom", "surround", "single", "other"];

/**
 * Valid audio categories
 */
const VALID_AUDIO_CATEGORIES: AudioCategory[] = ["character", "word", "sentence"];

/**
 * Check if a string is a Traditional Chinese character
 * Simple check: Traditional characters are typically in specific Unicode ranges
 * This is a basic validation - more sophisticated checking may be needed
 */
function isTraditionalCharacter(char: string): boolean {
  if (char.length !== 1) return false;
  const code = char.charCodeAt(0);
  // Traditional Chinese characters are primarily in these ranges:
  // CJK Unified Ideographs: U+4E00–U+9FFF
  // CJK Extension A: U+3400–U+4DBF
  // CJK Extension B: U+20000–U+2A6DF
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df)
  );
}

/**
 * Validate a Character entity
 */
export function validateCharacter(char: Character): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!char.character || char.character.length !== 1) {
    errors.push("Character must be a single character string");
  } else if (!isTraditionalCharacter(char.character)) {
    errors.push("Character must be a Traditional Chinese character");
  }

  if (!VALID_GRADES.includes(char.grade)) {
    errors.push(`Grade must be one of: ${VALID_GRADES.join(", ")}`);
  }

  if (!char.radical || char.radical.length === 0) {
    errors.push("Radical is required");
  }

  if (typeof char.strokeCount !== "number" || char.strokeCount < 1) {
    errors.push("Stroke count must be a positive integer");
  }

  if (!char.jyutping || char.jyutping.length === 0) {
    errors.push("Jyutping is required");
  }

  if (!Array.isArray(char.meanings) || char.meanings.length === 0) {
    errors.push("At least one meaning is required");
  }

  if (!Array.isArray(char.tags)) {
    errors.push("Tags must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an Example entity
 */
export function validateExample(example: Example): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!example.character || example.character.length !== 1) {
    errors.push("Character must be a single character string");
  }

  if (!example.sentence || example.sentence.length === 0) {
    errors.push("Sentence is required");
  }

  if (!example.jyutping || example.jyutping.length === 0) {
    errors.push("Jyutping is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a Decomposition entity
 */
export function validateDecomposition(decomp: Decomposition): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!decomp.character || decomp.character.length !== 1) {
    errors.push("Character must be a single character string");
  } else if (!isTraditionalCharacter(decomp.character)) {
    errors.push("Character must be a Traditional Chinese character");
  }

  if (!Array.isArray(decomp.components) || decomp.components.length === 0) {
    errors.push("Components must be a non-empty array");
  }

  if (!VALID_STRUCTURE_TYPES.includes(decomp.structureType)) {
    errors.push(`Structure type must be one of: ${VALID_STRUCTURE_TYPES.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an AudioAsset entity
 */
export function validateAudioAsset(asset: AudioAsset): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!asset.textSource || asset.textSource.length === 0) {
    errors.push("Text source is required");
  }

  if (!VALID_AUDIO_CATEGORIES.includes(asset.category)) {
    errors.push(`Category must be one of: ${VALID_AUDIO_CATEGORIES.join(", ")}`);
  }

  if (!asset.voice || asset.voice.length === 0) {
    errors.push("Voice identifier is required");
  }

  if (!asset.url || asset.url.length === 0) {
    errors.push("Audio URL is required");
  }

  // Basic URL validation
  try {
    new URL(asset.url);
  } catch {
    errors.push("Audio URL must be a valid URL");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a character string is Traditional (not Simplified)
 * This is a simplified check - a more sophisticated implementation
 * would use a Traditional/Simplified mapping database
 */
export function isTraditional(char: string): boolean {
  return isTraditionalCharacter(char);
}
