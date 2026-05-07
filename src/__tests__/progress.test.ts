import { describe, it, expect } from 'vitest'
import { touchCharacter, recordWin } from '../lib/progress/mastery'
import { getDueCharacters } from '../lib/progress/srs'
import { appendLog } from '../lib/progress/log'
import { recommendItems } from '../lib/progress/recommend'
import type { ActivityLogEntry } from '../lib/storage/types'

describe('mastery', () => {
  it('touch moves unseen to introduced', () => {
    const records = touchCharacter('一', {})
    expect(records['一'].state).toBe('introduced')
  })
  it('3 wins on 2 distinct days promotes to mastered', () => {
    let records = recordWin('一', {})
    records = recordWin('一', records)
    // Simulate second day by manually changing lastWinDay
    records['一'].lastWinDay = '2020-01-01'
    records = recordWin('一', records)
    expect(records['一'].state).toBe('mastered')
  })
  it('win does not demote state', () => {
    let records = recordWin('一', {})
    records['一'].state = 'mastered'
    records = recordWin('一', records)
    expect(records['一'].state).toBe('mastered')
  })
})

describe('SRS getDueCharacters', () => {
  it('returns empty array on no characters', () => {
    expect(getDueCharacters({}, 10)).toEqual([])
  })
  it('returns characters whose due date is past', () => {
    const records = { '一': { state: 'practiced' as const, lastSeen: 0, wins: 1, distinctDaysWon: 1, lastWinDay: '2020-01-01', due: Date.now() - 1000, intervalIndex: 0 } }
    expect(getDueCharacters(records, 10)).toContain('一')
  })
})

describe('log', () => {
  it('appends entries', () => {
    const log = appendLog([], { type: 'trace', char: '一', stars: 3, at: Date.now() })
    expect(log).toHaveLength(1)
    expect(log[0].char).toBe('一')
  })
  it('caps at 1000 entries', () => {
    let log: ActivityLogEntry[] = Array.from({ length: 1000 }, (_, i) => ({ type: 'explore' as const, at: i }))
    log = appendLog(log, { type: 'trace', char: '二', at: Date.now() })
    expect(log).toHaveLength(1000)
    expect((log[log.length - 1] as { char?: string }).char).toBe('二')
  })
})

describe('recommend', () => {
  it('cold start returns N items from available list', () => {
    const items = recommendItems({}, ['一', '二', '三', '四', '五'], 3)
    expect(items).toHaveLength(3)
  })
  it('returns empty if available list too small', () => {
    const items = recommendItems({}, ['一'], 3)
    expect(items.length).toBeLessThanOrEqual(1)
  })
})
