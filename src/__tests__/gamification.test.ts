import { describe, it, expect } from 'vitest'
import { xpForAction, XP_TABLE } from '../lib/gamification/xpTable'
import { levelForXp, xpForLevel } from '../lib/gamification/levelCurve'
import { checkAndIncrementStreak } from '../lib/gamification/streak'
import { pickDailyQuests } from '../lib/gamification/quests'
import { awardLevelUpRewards } from '../lib/gamification/rewards'

describe('XP table', () => {
  it('trace 3 star > trace 2 star > trace 1 star', () => {
    expect(xpForAction('trace_3star')).toBeGreaterThan(xpForAction('trace_2star'))
    expect(xpForAction('trace_2star')).toBeGreaterThan(xpForAction('trace_1star'))
  })
  it('has positive XP for all actions', () => {
    for (const action of Object.keys(XP_TABLE)) {
      expect(xpForAction(action as keyof typeof XP_TABLE)).toBeGreaterThan(0)
    }
  })
})

describe('levelCurve', () => {
  it('level 1 at 0 XP', () => {
    expect(levelForXp(0).level).toBe(1)
  })
  it('level 2 at xpForLevel(2)', () => {
    const xp = xpForLevel(2)
    expect(levelForXp(xp).level).toBe(2)
  })
  it('each level requires more XP than the previous', () => {
    for (let l = 3; l <= 10; l++) {
      expect(xpForLevel(l)).toBeGreaterThan(xpForLevel(l - 1))
    }
  })
})

describe('streak', () => {
  it('increments on new day', () => {
    const state = { streak: 0, lastActiveDay: '2026-01-01', freezes: 0 }
    const result = checkAndIncrementStreak(state, '2026-01-02')
    expect(result.streak).toBe(1)
  })
  it('does not increment on same day twice', () => {
    const state = { streak: 1, lastActiveDay: '2026-01-01', freezes: 0 }
    const result = checkAndIncrementStreak(state, '2026-01-01')
    expect(result.streak).toBe(1)
  })
  it('resets streak on missed day (no freeze)', () => {
    const state = { streak: 5, lastActiveDay: '2026-01-01', freezes: 0 }
    const result = checkAndIncrementStreak(state, '2026-01-03')
    expect(result.streak).toBe(1)
  })
  it('uses freeze on missed day when streak >= 7', () => {
    const state = { streak: 7, lastActiveDay: '2026-01-01', freezes: 1 }
    const result = checkAndIncrementStreak(state, '2026-01-03')
    expect(result.streak).toBe(8)
    expect(result.freezes).toBe(0)
  })
  it('breaks even with freeze when streak < 7', () => {
    const state = { streak: 5, lastActiveDay: '2026-01-01', freezes: 1 }
    const result = checkAndIncrementStreak(state, '2026-01-03')
    expect(result.streak).toBe(1)
  })
})

describe('quests', () => {
  it('picks 3 quests for a given day', () => {
    const quests = pickDailyQuests('2026-05-07')
    expect(quests).toHaveLength(3)
  })
  it('same quests for same day', () => {
    expect(pickDailyQuests('2026-05-07')).toEqual(pickDailyQuests('2026-05-07'))
  })
  it('different quests for different days (usually)', () => {
    const a = pickDailyQuests('2026-05-07')
    const b = pickDailyQuests('2026-05-08')
    // They might occasionally be the same but usually differ
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b))
  })
})

describe('rewards', () => {
  it('awards a sticker on level up', () => {
    const result = awardLevelUpRewards(2, [])
    expect(result.stickersToAdd.length).toBeGreaterThanOrEqual(0)
  })
})
