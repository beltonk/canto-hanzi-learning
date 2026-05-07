/**
 * recordActivity - single entry point for logging activity, awarding XP, and touching mastery.
 * Call this from any learning activity when a character is shown or answered.
 */
import type { ActivityLogEntry } from '../storage/types';
import { loadRoot, saveRoot } from '../storage';
import { appendLog } from '../progress/log';
import { touchCharacter, recordWin } from '../progress/mastery';
import { xpForAction, type XpAction } from '../gamification/xpTable';
import { levelForXp } from '../gamification/levelCurve';
import { awardLevelUpRewards } from '../gamification/rewards';
import { checkAndIncrementStreak, getTodayString } from '../gamification/streak';

export interface ActivityResult {
  /** How much XP was awarded */
  xpAwarded: number;
  /** Whether the user leveled up */
  leveledUp: boolean;
  /** New level (if leveled up) */
  newLevel: number;
  /** New stickers awarded on level up */
  newStickers: string[];
}

/**
 * Record a character interaction from any activity.
 *
 * @param entry  - Log entry to append
 * @param xpAction - XP action key to award (optional)
 * @param charWin - If true, call recordWin for the char (counts toward mastery)
 */
export function recordActivity(
  entry: ActivityLogEntry,
  xpAction?: XpAction,
  charWin = false,
): ActivityResult {
  const root = loadRoot();
  const prevLevel = levelForXp(root.gamification.xp).level;

  // 1. Log
  const newLog = appendLog(root.progress.log, entry);

  // 2. Touch mastery
  let chars = root.progress.characters;
  if (entry.char) {
    chars = charWin
      ? recordWin(entry.char, chars)
      : touchCharacter(entry.char, chars);
  }

  // 3. Award XP
  const xpAwarded = xpAction ? xpForAction(xpAction) : 0;
  const newXp = root.gamification.xp + xpAwarded;

  // 4. Check streak
  const todayStr = getTodayString();
  const { streak, lastActiveDay, freezes } = checkAndIncrementStreak(
    {
      streak: root.gamification.streak,
      lastActiveDay: root.gamification.lastActiveDay,
      freezes: root.gamification.freezes,
    },
    todayStr,
  );

  // 5. Check level up
  const newLevelInfo = levelForXp(newXp);
  const leveledUp = newLevelInfo.level > prevLevel;
  let newStickers: string[] = [];
  let garden = root.gamification.garden;
  let stickers = root.gamification.stickers;
  if (leveledUp) {
    const rewards = awardLevelUpRewards(newLevelInfo.level, stickers);
    newStickers = rewards.stickersToAdd;
    stickers = [...stickers, ...rewards.stickersToAdd];
    garden = [...garden, ...rewards.gardenItemsToAdd];
  }

  // 6. Save
  saveRoot({
    ...root,
    gamification: {
      ...root.gamification,
      xp: newXp,
      level: newLevelInfo.level,
      streak,
      lastActiveDay,
      freezes,
      stickers,
      garden,
    },
    progress: {
      ...root.progress,
      characters: chars,
      log: newLog,
    },
  });

  return {
    xpAwarded,
    leveledUp,
    newLevel: newLevelInfo.level,
    newStickers,
  };
}
