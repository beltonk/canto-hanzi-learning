/**
 * Validation Tests
 * 
 * Basic unit tests for data model validation.
 * 
 * Note: This project doesn't have a test framework configured yet.
 * These tests serve as examples and should be run with a proper test runner
 * (Jest, Vitest, etc.) once configured.
 */

import {
  validateCharacter,
  validateExample,
  validateDecomposition,
  validateAudioAsset,
  isTraditional,
} from "@/lib/validation/character";
import type { Character, Example, Decomposition, AudioAsset } from "@/types/character";

// Example test structure (requires test framework setup)
export const validationTests = {
  "validateCharacter should accept valid character": () => {
    const char: Character = {
      character: "人",
      grade: "KS1",
      radical: "人",
      strokeCount: 2,
      jyutping: "jan4",
      meanings: ["person"],
      tags: [],
    };

    const result = validateCharacter(char);
    // Assert: result.valid === true
    return result.valid === true;
  },

  "validateCharacter should reject invalid grade": () => {
    const char: Character = {
      character: "人",
      grade: "P4" as "KS1", // Invalid grade
      radical: "人",
      strokeCount: 2,
      jyutping: "jan4",
      meanings: ["person"],
      tags: [],
    };

    const result = validateCharacter(char);
    // Assert: result.valid === false
    return result.valid === false;
  },

  "isTraditional should identify Traditional characters": () => {
    // Assert: isTraditional("人") === true
    // Assert: isTraditional("人") === true (Traditional)
    // Note: Simplified "人" is the same, but in general this would differ
    return isTraditional("人") === true;
  },
};

// Manual test runner (for development)
if (require.main === module) {
  console.log("Running validation tests...");
  let passed = 0;
  let failed = 0;

  for (const [name, test] of Object.entries(validationTests)) {
    try {
      const result = test();
      if (result) {
        console.log(`✓ ${name}`);
        passed++;
      } else {
        console.log(`✗ ${name}`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${name}: ${error}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
}
