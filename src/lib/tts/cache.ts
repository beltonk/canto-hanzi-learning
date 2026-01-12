import type { AudioCategory } from "@/types/character";
import type { AudioAsset } from "@/types/character";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * TTS Audio Cache
 * 
 * Manages caching of generated audio files to avoid redundant TTS API calls.
 * Uses file-based storage with a simple JSON index.
 */

interface CacheEntry {
  text: string;
  category: AudioCategory;
  voice: string;
  url: string;
  timestamp: number;
}

const CACHE_DIR = join(process.cwd(), "data", "audio-cache");
const CACHE_INDEX_FILE = join(CACHE_DIR, "index.json");

/**
 * Initialize cache directory
 */
function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Generate cache key from text, category, and voice
 */
function generateCacheKey(text: string, category: AudioCategory, voice: string): string {
  return `${text}:${category}:${voice}`;
}

/**
 * Load cache index
 */
function loadCacheIndex(): Map<string, CacheEntry> {
  ensureCacheDir();

  if (!existsSync(CACHE_INDEX_FILE)) {
    return new Map();
  }

  try {
    const data = JSON.parse(readFileSync(CACHE_INDEX_FILE, "utf-8"));
    const entries = Array.isArray(data) ? data : [];
    return new Map(entries.map((entry: CacheEntry) => [generateCacheKey(entry.text, entry.category, entry.voice), entry]));
  } catch {
    return new Map();
  }
}

/**
 * Save cache index
 */
function saveCacheIndex(index: Map<string, CacheEntry>): void {
  ensureCacheDir();
  const entries = Array.from(index.values());
  writeFileSync(CACHE_INDEX_FILE, JSON.stringify(entries, null, 2));
}

/**
 * Get cached audio URL
 * 
 * @param text - Text that was converted to speech
 * @param category - Audio category
 * @param voice - Voice identifier
 * @returns Cached URL if found, null otherwise
 */
export function getCachedAudio(
  text: string,
  category: AudioCategory,
  voice: string
): string | null {
  const index = loadCacheIndex();
  const key = generateCacheKey(text, category, voice);
  const entry = index.get(key);

  if (entry) {
    // Check if file still exists
    if (entry.url.startsWith("http")) {
      // Remote URL - assume still valid
      return entry.url;
    } else if (existsSync(entry.url)) {
      // Local file - check if exists
      return entry.url;
    } else {
      // File missing - remove from cache
      index.delete(key);
      saveCacheIndex(index);
    }
  }

  return null;
}

/**
 * Cache audio URL
 * 
 * @param text - Text that was converted to speech
 * @param category - Audio category
 * @param voice - Voice identifier
 * @param url - Audio file URL or path
 */
export function cacheAudio(
  text: string,
  category: AudioCategory,
  voice: string,
  url: string
): void {
  const index = loadCacheIndex();
  const key = generateCacheKey(text, category, voice);

  const entry: CacheEntry = {
    text,
    category,
    voice,
    url,
    timestamp: Date.now(),
  };

  index.set(key, entry);
  saveCacheIndex(index);
}

/**
 * Clear old cache entries (older than specified days)
 * 
 * @param maxAgeDays - Maximum age in days (default: 30)
 */
export function clearOldCache(maxAgeDays: number = 30): void {
  const index = loadCacheIndex();
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  let cleared = 0;
  for (const [key, entry] of index.entries()) {
    if (now - entry.timestamp > maxAge) {
      index.delete(key);
      cleared++;
    }
  }

  if (cleared > 0) {
    saveCacheIndex(index);
    console.log(`Cleared ${cleared} old cache entries`);
  }
}
