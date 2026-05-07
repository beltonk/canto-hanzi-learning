import type { CharacterMasteryRecord } from '../storage/types';

export const SRS_INTERVALS = [1, 3, 7, 21, 60]; // days

export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(daysMs: number): number {
  return Date.now() + daysMs * 86400000;
}

export function getOrCreateRecord(char: string, records: Record<string, CharacterMasteryRecord>): CharacterMasteryRecord {
  return records[char] ?? {
    state: 'unseen',
    lastSeen: 0,
    wins: 0,
    distinctDaysWon: 0,
    lastWinDay: '',
    due: Date.now(),
    intervalIndex: 0,
  };
}

export function touchCharacter(
  char: string,
  records: Record<string, CharacterMasteryRecord>
): Record<string, CharacterMasteryRecord> {
  const rec = getOrCreateRecord(char, records);
  const updated: CharacterMasteryRecord = {
    ...rec,
    lastSeen: Date.now(),
    state: rec.state === 'unseen' ? 'introduced' : rec.state,
  };
  return { ...records, [char]: updated };
}

export function recordWin(
  char: string,
  records: Record<string, CharacterMasteryRecord>
): Record<string, CharacterMasteryRecord> {
  const rec = getOrCreateRecord(char, records);
  const today = getTodayString();
  const newWins = rec.wins + 1;
  const isNewDay = rec.lastWinDay !== today;
  const distinctDaysWon = isNewDay ? rec.distinctDaysWon + 1 : rec.distinctDaysWon;

  // Promote state
  let newState = rec.state;
  if (newState === 'unseen' || newState === 'introduced') {
    newState = 'practiced';
  }
  if (newWins >= 3 && distinctDaysWon >= 2) {
    newState = 'mastered';
  }

  // Advance SRS interval
  const nextIntervalIndex = Math.min(rec.intervalIndex + 1, SRS_INTERVALS.length - 1);
  const nextDue = addDays(SRS_INTERVALS[nextIntervalIndex]);

  return {
    ...records,
    [char]: {
      ...rec,
      wins: newWins,
      distinctDaysWon,
      lastWinDay: today,
      lastSeen: Date.now(),
      state: newState as CharacterMasteryRecord['state'],
      intervalIndex: nextIntervalIndex,
      due: nextDue,
    },
  };
}
