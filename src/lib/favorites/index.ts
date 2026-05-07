/**
 * Favorites helpers for "我的收藏" — the user's personal collection of
 * characters and words to revisit (e.g. mistakes from games, dictation,
 * anything they want to remember).
 */
import { loadRoot, saveRoot } from '../storage';
import type { FavoriteEntry } from '../storage/types';

export interface AddFavoriteInput {
  text: string;
  kind?: 'char' | 'word';
  source?: string;
  jyutping?: string;
  reason?: 'mistake' | 'manual';
}

function inferKind(text: string): 'char' | 'word' {
  // Treat any input longer than 1 character as a word/phrase.
  return [...text].length === 1 ? 'char' : 'word';
}

export function getFavorites(): FavoriteEntry[] {
  const root = loadRoot();
  return root.progress.favorites ?? [];
}

export function isFavorite(text: string): boolean {
  return getFavorites().some(f => f.text === text);
}

export function addFavorite(input: AddFavoriteInput): FavoriteEntry {
  const root = loadRoot();
  const existing = (root.progress.favorites ?? []).find(f => f.text === input.text);
  if (existing) {
    // Update the existing entry (latest source / jyutping wins; keep first addedAt)
    const updated: FavoriteEntry = {
      ...existing,
      source: input.source ?? existing.source,
      jyutping: input.jyutping ?? existing.jyutping,
      reason: input.reason ?? existing.reason,
    };
    saveRoot({
      ...root,
      progress: {
        ...root.progress,
        favorites: (root.progress.favorites ?? []).map(f =>
          f.text === input.text ? updated : f,
        ),
      },
    });
    return updated;
  }

  const entry: FavoriteEntry = {
    text: input.text,
    kind: input.kind ?? inferKind(input.text),
    source: input.source,
    jyutping: input.jyutping,
    reason: input.reason ?? 'manual',
    reviewCount: 0,
    addedAt: Date.now(),
  };
  saveRoot({
    ...root,
    progress: {
      ...root.progress,
      favorites: [entry, ...(root.progress.favorites ?? [])],
    },
  });
  return entry;
}

export function removeFavorite(text: string): void {
  const root = loadRoot();
  saveRoot({
    ...root,
    progress: {
      ...root.progress,
      favorites: (root.progress.favorites ?? []).filter(f => f.text !== text),
    },
  });
}

export function toggleFavorite(input: AddFavoriteInput): boolean {
  if (isFavorite(input.text)) {
    removeFavorite(input.text);
    return false;
  }
  addFavorite(input);
  return true;
}

export function markReviewed(text: string): void {
  const root = loadRoot();
  saveRoot({
    ...root,
    progress: {
      ...root.progress,
      favorites: (root.progress.favorites ?? []).map(f =>
        f.text === text ? { ...f, reviewCount: f.reviewCount + 1, lastReviewedAt: Date.now() } : f,
      ),
    },
  });
}

export function getFavoritesCount(): number {
  return getFavorites().length;
}
