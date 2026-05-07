import { describe, it, expect } from 'vitest'
import { getIllustration } from '../lib/illustrations'

describe('illustrations registry', () => {
  it('has all mascot + pose combinations', () => {
    const mascots = ['panda', 'rabbit', 'monkey', 'owl', 'cat', 'tiger']
    const poses = ['idle', 'happy', 'cheer', 'oops']
    for (const m of mascots) {
      for (const p of poses) {
        expect(getIllustration(`${m}_${p}`)).toBeDefined()
      }
    }
  })
  it('has 10 garden plants', () => {
    for (let i = 1; i <= 10; i++) {
      expect(getIllustration(`garden_plant_${i}`)).toBeDefined()
    }
  })
  it('returns undefined for unknown id', () => {
    expect(getIllustration('nonexistent_id')).toBeUndefined()
  })
})
