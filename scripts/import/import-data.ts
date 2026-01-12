#!/usr/bin/env node

/**
 * Data Import Script
 * 
 * This script imports character data from external sources (Words.hk, CJK decomposition)
 * and outputs processed data in the internal format.
 * 
 * Usage:
 *   npm run import:words-hk <path-to-words-hk-data.json> [grade]
 *   npm run import:cjk-decomp <path-to-cjk-decomp-data.json>
 *   npm run import:merge <output-path.json>
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { importWordsHk } from "@/lib/import/words-hk";
import { importCJKDecomp } from "@/lib/import/cjk-decomp";
import { mergeCharacterData, filterByGrade, exportToJSON } from "@/lib/import/merger";
import type { GradeLevel } from "@/types/character";

// Simple CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.error("Usage:");
  console.error("  import-data words-hk <file> [grade]");
  console.error("  import-data cjk-decomp <file>");
  console.error("  import-data merge <words-hk-file> <cjk-decomp-file> <output-file> [grades...]");
  process.exit(1);
}

try {
  if (command === "words-hk") {
    const filePath = args[1];
    const grade = (args[2] as GradeLevel) || "P1";

    if (!filePath) {
      console.error("Error: Words.hk file path required");
      process.exit(1);
    }

    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    const result = importWordsHk(data, grade);

    console.log(`Imported ${result.characters.length} characters`);
    console.log(`Imported ${result.examples.length} examples`);
    if (result.errors.length > 0) {
      console.warn(`Errors: ${result.errors.length}`);
      result.errors.forEach((err) => console.warn(`  - ${err}`));
    }

    const output = {
      characters: result.characters,
      examples: result.examples,
    };

    const outputPath = join(process.cwd(), "data", `words-hk-${grade}.json`);
    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Output written to ${outputPath}`);
  } else if (command === "cjk-decomp") {
    const filePath = args[1];

    if (!filePath) {
      console.error("Error: CJK decomposition file path required");
      process.exit(1);
    }

    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    const result = importCJKDecomp(data);

    console.log(`Imported ${result.decompositions.length} decompositions`);
    if (result.errors.length > 0) {
      console.warn(`Errors: ${result.errors.length}`);
      result.errors.forEach((err) => console.warn(`  - ${err}`));
    }

    const outputPath = join(process.cwd(), "data", "cjk-decomp.json");
    writeFileSync(outputPath, JSON.stringify({ decompositions: result.decompositions }, null, 2));
    console.log(`Output written to ${outputPath}`);
  } else if (command === "merge") {
    const wordsHkPath = args[1];
    const cjkDecompPath = args[2];
    const outputPath = args[3];
    const grades = (args.slice(4) as GradeLevel[]) || ["P1", "P2", "P3"];

    if (!wordsHkPath || !cjkDecompPath || !outputPath) {
      console.error("Error: All file paths required for merge");
      process.exit(1);
    }

    // Load and import both datasets
    const wordsHkData = JSON.parse(readFileSync(wordsHkPath, "utf-8"));
    const cjkDecompData = JSON.parse(readFileSync(cjkDecompPath, "utf-8"));

    // Import all grades from Words.hk (we'll filter later)
    const wordsHkResult = importWordsHk(wordsHkData, "P1"); // Grade will be set per entry
    const cjkDecompResult = importCJKDecomp(cjkDecompData);

    // Merge data
    const merged = mergeCharacterData({
      characters: wordsHkResult.characters,
      decompositions: cjkDecompResult.decompositions,
      examples: wordsHkResult.examples,
    });

    // Filter by grade
    const filtered = filterByGrade(merged, grades);

    console.log(`Merged ${filtered.characters.length} characters`);
    console.log(`Merged ${filtered.decompositions.length} decompositions`);
    console.log(`Merged ${filtered.examples.length} examples`);

    // Write output
    writeFileSync(outputPath, exportToJSON(filtered));
    console.log(`Output written to ${outputPath}`);
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
} catch (error) {
  console.error("Error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}
