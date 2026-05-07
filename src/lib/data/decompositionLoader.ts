import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface DecompositionEntry {
  components: string[];
  structureType: string;
}

let cache: Record<string, DecompositionEntry> | null = null;

export function loadDecompositionDict(): Record<string, DecompositionEntry> {
  if (cache) return cache;
  const path = join(process.cwd(), 'data', 'decomposition.json');
  if (!existsSync(path)) {
    cache = {};
    return cache;
  }
  try {
    cache = JSON.parse(readFileSync(path, 'utf-8'));
    return cache!;
  } catch {
    cache = {};
    return cache;
  }
}

export function getDecomposableCharacters(): string[] {
  return Object.keys(loadDecompositionDict());
}

export function getDecomposition(char: string): DecompositionEntry | null {
  return loadDecompositionDict()[char] ?? null;
}
