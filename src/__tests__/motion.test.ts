import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { motionClasses, useReducedMotion, useMotionClass } from '../lib/motion'

describe('motionClasses', () => {
  it('has reduced variants for all animated primitives', () => {
    const animated = ['pop', 'floatIn', 'cheer'] as const
    for (const p of animated) {
      const reducedKey = `${p}Reduced` as keyof typeof motionClasses
      expect(motionClasses[reducedKey]).toBeDefined()
    }
  })
  it('wiggle and confetti reduced variants are empty string (skip animation)', () => {
    expect(motionClasses.wiggleReduced).toBe('')
    expect(motionClasses.confettiReduced).toBe('')
  })
})

/** Helper: stub matchMedia so prefers-reduced-motion can be controlled in jsdom. */
function setReducedMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion: reduce') ? reduced : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }))
}

describe('useReducedMotion / useMotionClass (regression for prefers-reduced-motion)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false when user has not requested reduced motion', () => {
    setReducedMotion(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when user has requested reduced motion', () => {
    setReducedMotion(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('useMotionClass switches every primitive to its reduced variant when reduced motion is on', () => {
    setReducedMotion(true)
    const primitives = ['pop', 'wiggle', 'floatIn', 'cheer', 'confetti', 'parallax'] as const
    for (const p of primitives) {
      const { result } = renderHook(() => useMotionClass(p))
      const reducedKey = `${p}Reduced` as keyof typeof motionClasses
      expect(result.current).toBe(motionClasses[reducedKey])
    }
  })

  it('useMotionClass returns the animated class when reduced motion is off', () => {
    setReducedMotion(false)
    const { result } = renderHook(() => useMotionClass('pop'))
    expect(result.current).toBe(motionClasses.pop)
  })
})

/**
 * Regression: components that own user-visible animation paths (flashcard
 * card transition, decomposition feedback) must read animation classes via
 * useMotionClass / motionClasses so that the prefers-reduced-motion check
 * applies uniformly. We grep the source to make sure those imports stay
 * wired — a much cheaper signal than a full DOM render of those pages.
 */
import fs from 'node:fs'
import path from 'node:path'

describe('motion-primitive regression on key components', () => {
  const repoRoot = path.resolve(__dirname, '..', '..')
  const cases = [
    'app/components/learning/FlashcardRevision.tsx',
    'app/components/learning/DecompositionPlay.tsx',
    'app/components/learning/StrokeTracing.tsx',
  ]

  for (const rel of cases) {
    it(`${rel} routes its animations through @/lib/motion`, () => {
      const src = fs.readFileSync(path.join(repoRoot, rel), 'utf8')
      expect(src).toMatch(/from\s+['"]@\/lib\/motion['"]/)
      expect(src).toMatch(/use(MotionClass|ReducedMotion)/)
    })
  }
})
