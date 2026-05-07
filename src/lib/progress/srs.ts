import type { CharacterMasteryRecord } from '../storage/types';

export function getDueCharacters(
  records: Record<string, CharacterMasteryRecord>,
  limit = 20
): string[] {
  const now = Date.now();
  return Object.entries(records)
    .filter(([, rec]) => rec.due <= now && rec.state !== 'unseen')
    .sort((a, b) => a[1].due - b[1].due)
    .slice(0, limit)
    .map(([char]) => char);
}
