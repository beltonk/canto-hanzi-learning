import { describe, it, expect, beforeEach } from 'vitest'
import { loadRoot, saveRoot } from '../lib/storage'

beforeEach(() => {
  localStorage.clear()
})

describe('storage', () => {
  it('returns defaults on empty storage', () => {
    const root = loadRoot()
    expect(root.schemaVersion).toBe(2)
    expect(root.settings.kidMode).toBe(true)
    expect(root.settings.soundOn).toBe(true)
    expect(root.progress.favorites).toEqual([])
  })

  it('round-trips data', () => {
    const root = loadRoot()
    root.gamification.xp = 500
    saveRoot(root)
    const loaded = loadRoot()
    expect(loaded.gamification.xp).toBe(500)
  })

  it('migrates v0 to v2', () => {
    localStorage.setItem('cantoHanzi.v1', JSON.stringify({ schemaVersion: 0 }))
    const root = loadRoot()
    expect(root.schemaVersion).toBe(2)
    expect(root.progress.favorites).toEqual([])
  })

  it('migrates v1 to v2 by adding favorites', () => {
    localStorage.setItem('cantoHanzi.v1', JSON.stringify({
      schemaVersion: 1,
      progress: { characters: {}, log: [] },
    }))
    const root = loadRoot()
    expect(root.schemaVersion).toBe(2)
    expect(root.progress.favorites).toEqual([])
  })

  it('handles corrupt JSON gracefully', () => {
    localStorage.setItem('cantoHanzi.v1', 'not json')
    const root = loadRoot()
    expect(root.schemaVersion).toBe(2)
  })
})
