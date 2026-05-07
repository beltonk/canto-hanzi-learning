import type { CharacterMasteryRecord } from '../storage/types';

interface RecommendHint {
  masteredRatio?: number;   // default 0.70
  practicedRatio?: number;  // default 0.25
  newRatio?: number;        // default 0.05
}

export function recommendItems(
  records: Record<string, CharacterMasteryRecord>,
  available: string[],
  n: number,
  hint: RecommendHint = {}
): string[] {
  if (available.length === 0) return [];
  const { masteredRatio = 0.70, practicedRatio = 0.25 } = hint;

  const mastered = available.filter(c => records[c]?.state === 'mastered');
  const practiced = available.filter(c => records[c]?.state === 'practiced');
  const newChars = available.filter(c => !records[c] || records[c].state === 'unseen' || records[c].state === 'introduced');

  function pick(arr: string[], count: number): string[] {
    if (arr.length <= count) return [...arr];
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  const wantMastered = Math.round(n * masteredRatio);
  const wantPracticed = Math.round(n * practicedRatio);
  const wantNew = Math.max(0, n - wantMastered - wantPracticed);

  const result = [
    ...pick(mastered, wantMastered),
    ...pick(practiced, wantPracticed),
    ...pick(newChars, wantNew),
  ];

  // If we didn't get enough, fill from available
  if (result.length < n) {
    const remaining = available.filter(c => !result.includes(c));
    result.push(...pick(remaining, n - result.length));
  }

  return result.slice(0, n);
}
