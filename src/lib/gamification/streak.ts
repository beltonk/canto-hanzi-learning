interface StreakState {
  streak: number;
  lastActiveDay: string; // YYYY-MM-DD
  freezes: number;
}

function daysBetween(a: string, b: string): number {
  if (!a || !b) return 999;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round(Math.abs(db - da) / 86400000);
}

export function checkAndIncrementStreak(
  state: StreakState,
  todayStr: string
): StreakState {
  const { streak, lastActiveDay, freezes } = state;
  if (lastActiveDay === todayStr) return state; // already counted today

  const days = daysBetween(lastActiveDay, todayStr);

  if (days === 1) {
    // Consecutive day
    return { streak: streak + 1, lastActiveDay: todayStr, freezes };
  } else if (days > 1) {
    // Missed at least one day
    if (streak >= 7 && freezes > 0) {
      // Use a freeze
      return { streak: streak + 1, lastActiveDay: todayStr, freezes: freezes - 1 };
    }
    return { streak: 1, lastActiveDay: todayStr, freezes };
  }
  // days === 0 (shouldn't happen after same-day guard above, but defensive)
  return state;
}

export function shouldBreakStreak(state: StreakState, todayStr: string): boolean {
  if (!state.lastActiveDay) return false;
  const days = daysBetween(state.lastActiveDay, todayStr);
  return days > 1 && !(state.streak >= 7 && state.freezes > 0);
}

export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}
