// Level curve: each level requires more XP
// Level 1 = 0 XP required (starting), Level 2 = 100 XP, increasing by 50% per level
export const MAX_LEVEL = 30;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Sum of 100 * 1.5^(n-2) for n=2..level
  let total = 0;
  for (let n = 2; n <= level; n++) {
    total += Math.floor(100 * Math.pow(1.4, n - 2));
  }
  return total;
}

export function levelForXp(xp: number): { level: number; nextLevelXp: number; currentLevelXp: number } {
  let level = 1;
  for (let l = 2; l <= MAX_LEVEL; l++) {
    if (xp >= xpForLevel(l)) level = l;
    else break;
  }
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = level < MAX_LEVEL ? xpForLevel(level + 1) : Infinity;
  return { level, nextLevelXp, currentLevelXp };
}
