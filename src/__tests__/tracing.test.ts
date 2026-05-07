import { describe, it, expect } from 'vitest'
import { resamplePolyline, normalizePolyline, type Point } from '../lib/tracing/svgPathParse'
import {
  matchStroke,
  computeStars,
  buildExpectedMask,
  computeDistanceField,
  matchStrokeByMask,
} from '../lib/tracing/match'

const makePoints = (coords: [number, number][]): Point[] => coords.map(([x, y]) => ({ x, y }))

/** Helper: build a fake RGBA buffer where the supplied pixels are fully opaque black. */
function rgbaWithPixels(w: number, h: number, on: Array<[number, number]>): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(w * h * 4)
  for (const [x, y] of on) {
    const idx = (y * w + x) * 4
    buf[idx + 3] = 255
  }
  return buf
}

describe('resamplePolyline', () => {
  it('returns N points for a simple line', () => {
    const pts = makePoints([[0,0],[100,100],[200,0]])
    expect(resamplePolyline(pts, 10)).toHaveLength(10)
  })
  it('handles single point', () => {
    expect(resamplePolyline([{x:0,y:0}], 5)).toHaveLength(5)
  })
})

describe('normalizePolyline', () => {
  it('outputs values in [0,1] range', () => {
    const pts = makePoints([[0,0],[100,50],[200,100]])
    const norm = normalizePolyline(pts)
    for (const p of norm) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(1)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(1)
    }
  })
})

describe('matchStroke', () => {
  it('returns too_short for very short traces', () => {
    const result = matchStroke(makePoints([[0,0]]), [], 0, 0)
    expect(result.reason).toBe('too_short')
  })
})

describe('computeStars', () => {
  it('returns 3 for perfect results', () => {
    const results = Array(5).fill({ passed: true, retries: 0, similarity: 0.95 })
    expect(computeStars(results)).toBe(3)
  })
  it('returns 1 for failed results', () => {
    const results = Array(5).fill({ passed: false, retries: 3, similarity: 0.1 })
    expect(computeStars(results)).toBe(1)
  })
})

describe('matchStrokeByMask (pixel-based)', () => {
  // Build a 100x100 canvas with a horizontal expected stroke from (20,50) to (80,50)
  const W = 100, H = 100
  const expectedPixels: Array<[number, number]> = []
  for (let x = 20; x <= 80; x++) {
    for (let dy = -2; dy <= 2; dy++) expectedPixels.push([x, 50 + dy])
  }
  const rgba = rgbaWithPixels(W, H, expectedPixels)
  const mask = buildExpectedMask(rgba, W, H)
  const distField = computeDistanceField(mask, 50)

  it('mask captures the expected bounding box', () => {
    expect(mask.bbox).toEqual({ minX: 20, minY: 48, maxX: 80, maxY: 52 })
    expect(mask.count).toBeGreaterThan(0)
  })

  it('passes a trace drawn directly on top of the expected stroke', () => {
    const trace = makePoints(
      Array.from({ length: 30 }, (_, i) => [20 + i * 2, 50] as [number, number]),
    )
    const result = matchStrokeByMask(trace, mask, distField)
    expect(result.passed).toBe(true)
    expect(result.similarity).toBeGreaterThan(0.6)
  })

  it('passes a slightly wobbly but on-track trace (kids are not perfect)', () => {
    const trace = makePoints(
      Array.from({ length: 30 }, (_, i) => [20 + i * 2, 50 + (i % 4 === 0 ? 4 : -3)] as [number, number]),
    )
    const result = matchStrokeByMask(trace, mask, distField)
    expect(result.passed).toBe(true)
  })

  it('rejects a trace that misses the expected stroke entirely', () => {
    const trace = makePoints(
      Array.from({ length: 20 }, (_, i) => [20 + i * 3, 10] as [number, number]),
    )
    const result = matchStrokeByMask(trace, mask, distField)
    expect(result.passed).toBe(false)
  })

  it('rejects a tiny dab even if it is on the expected stroke', () => {
    const trace = makePoints([[50, 50], [51, 50], [52, 50]])
    const result = matchStrokeByMask(trace, mask, distField)
    expect(result.passed).toBe(false)
  })

  it('passes optimistically when expected mask is empty', () => {
    const emptyMask = buildExpectedMask(new Uint8ClampedArray(W * H * 4), W, H)
    const emptyField = computeDistanceField(emptyMask, 50)
    const trace = makePoints([[10, 10], [20, 20], [30, 30]])
    const result = matchStrokeByMask(trace, emptyMask, emptyField)
    expect(result.passed).toBe(true)
  })

  it('returns too_short for very short traces', () => {
    const result = matchStrokeByMask(makePoints([[50, 50]]), mask, distField)
    expect(result.reason).toBe('too_short')
    expect(result.passed).toBe(false)
  })
})
