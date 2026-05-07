import type { StrokeVector } from '@/types/fullCharacter';
import { resamplePolyline, normalizePolyline, parsePathToPolyline, type Point } from './svgPathParse';

export interface StrokeMatchResult {
  passed: boolean;
  reason: 'correct' | 'wrong_order' | 'reversed' | 'shape_mismatch' | 'too_short';
  similarity: number;  // 0-1, higher is better
  endpointScore: number;
}

const CANVAS_SIZE = 1080;
// Children are still developing fine motor control — be forgiving so that
// recognisable strokes pass even if the start/end points wander.
const ENDPOINT_TOLERANCE = 0.32; // 32% of canvas min side (was 0.20)
const SHAPE_THRESHOLD = 0.50;    // mean distance threshold after normalization (was 0.35)
const N_SAMPLES = 32;

/**
 * Pre-computed expected stroke information sourced from the rasterised
 * createjs render. This is far more reliable than decoding the EaselJS
 * Toolkit path data, because the raster is what the user actually sees on
 * screen — so a user who traces the visible grey stroke will pass.
 */
export interface ExpectedStrokeMask {
  /** Width / height of the source canvas in internal coordinates (e.g. 1080). */
  canvasW: number;
  canvasH: number;
  /** Bitmap mask: 1 where the expected stroke is drawn, 0 elsewhere. */
  mask: Uint8Array;
  /** Bounding box of dark pixels (inclusive). */
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
  /** Number of "on" pixels — used to scale tolerances. */
  count: number;
}

export function getExpectedPolyline(strokeVector: StrokeVector): Point[] {
  const raw = parsePathToPolyline(strokeVector.pathData, strokeVector.transform);
  return resamplePolyline(raw, N_SAMPLES);
}

function endpointDistance(traced: Point[], expected: Point[]): { startDist: number; endDist: number } {
  const ts = traced[0], te = traced[traced.length - 1];
  const es = expected[0], ee = expected[expected.length - 1];
  const scale = CANVAS_SIZE;
  return {
    startDist: Math.hypot(ts.x - es.x, ts.y - es.y) / scale,
    endDist: Math.hypot(te.x - ee.x, te.y - ee.y) / scale,
  };
}

function shapeSimilarity(traced: Point[], expected: Point[]): number {
  const tNorm = normalizePolyline(resamplePolyline(traced, N_SAMPLES));
  const eNorm = normalizePolyline(resamplePolyline(expected, N_SAMPLES));
  if (tNorm.length !== eNorm.length) return 0;
  let totalDist = 0;
  for (let i = 0; i < tNorm.length; i++) {
    const dx = tNorm[i].x - eNorm[i].x;
    const dy = tNorm[i].y - eNorm[i].y;
    totalDist += Math.sqrt(dx * dx + dy * dy);
  }
  const meanDist = totalDist / tNorm.length;
  return Math.max(0, 1 - meanDist / SHAPE_THRESHOLD);
}

export function matchStroke(
  tracedPoints: Point[],
  expectedStrokeGroup: StrokeVector[],
  expectedIndex: number,
  currentIndex: number,
): StrokeMatchResult {
  if (tracedPoints.length < 3) {
    return { passed: false, reason: 'too_short', similarity: 0, endpointScore: 0 };
  }

  if (currentIndex !== expectedIndex) {
    return { passed: false, reason: 'wrong_order', similarity: 0, endpointScore: 0 };
  }

  if (expectedStrokeGroup.length === 0) {
    return { passed: false, reason: 'shape_mismatch', similarity: 0, endpointScore: 0 };
  }

  // Use the last segment (most complete shape)
  const lastSeg = expectedStrokeGroup[expectedStrokeGroup.length - 1];
  const expectedPolyline = getExpectedPolyline(lastSeg);

  const { startDist, endDist } = endpointDistance(tracedPoints, expectedPolyline);
  const tol = ENDPOINT_TOLERANCE;

  // Check reversed (start near expected end, end near expected start)
  const { startDist: revStart, endDist: revEnd } = endpointDistance(
    tracedPoints,
    [...expectedPolyline].reverse()
  );
  if (revStart <= tol && revEnd <= tol && (startDist > tol || endDist > tol)) {
    return { passed: false, reason: 'reversed', similarity: 0, endpointScore: 0 };
  }

  const endpointScore = Math.max(0, 1 - (startDist + endDist) / (2 * tol));
  const similarity = shapeSimilarity(tracedPoints, expectedPolyline);

  // Loosened pass criteria: kid-friendly. Shape similarity threshold halved.
  const passed = startDist <= tol && endDist <= tol && similarity > 0.1;

  return {
    passed,
    reason: passed ? 'correct' : (startDist > tol || endDist > tol ? 'reversed' : 'shape_mismatch'),
    similarity,
    endpointScore,
  };
}

export function computeStars(
  strokeResults: Array<{ passed: boolean; retries: number; similarity: number }>
): 1 | 2 | 3 {
  const total = strokeResults.length;
  if (total === 0) return 1;
  const wrongOrderCount = strokeResults.filter(r => !r.passed || r.retries > 0).length;
  const avgSimilarity = strokeResults.reduce((s, r) => s + r.similarity, 0) / total;

  if (wrongOrderCount === 0 && avgSimilarity >= 0.85) return 3;
  if (wrongOrderCount <= Math.ceil(total * 0.3) && avgSimilarity >= 0.6) return 2;
  return 1;
}

/**
 * Build an ExpectedStrokeMask from raw RGBA pixel data of just the current
 * expected stroke (rendered to an offscreen canvas).
 *
 * A pixel is considered "on" if its alpha is above the threshold. We do not
 * care about colour because the source render is single-colour.
 */
export function buildExpectedMask(
  rgba: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  alphaThreshold = 32,
): ExpectedStrokeMask {
  const mask = new Uint8Array(canvasW * canvasH);
  let minX = canvasW, minY = canvasH, maxX = -1, maxY = -1, count = 0;
  for (let y = 0; y < canvasH; y++) {
    for (let x = 0; x < canvasW; x++) {
      const idx = (y * canvasW + x) * 4;
      const a = rgba[idx + 3];
      if (a > alphaThreshold) {
        mask[y * canvasW + x] = 1;
        count++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (count === 0) {
    return { canvasW, canvasH, mask, bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }, count: 0 };
  }
  return { canvasW, canvasH, mask, bbox: { minX, minY, maxX, maxY }, count };
}

/**
 * Compute a Manhattan distance transform on the mask: each pixel stores the
 * shortest pixel distance to a foreground (mask=1) pixel, capped at `cap`.
 * This lets us cheaply test "how close is the user's pen to the expected
 * stroke?" — the signal we actually care about for kid-friendly matching.
 *
 * Two-pass distance transform with L∞-ish neighbourhood — good enough for
 * radial tolerance checks at canvas resolution.
 */
export function computeDistanceField(mask: ExpectedStrokeMask, cap = 200): Uint16Array {
  const { canvasW: w, canvasH: h, mask: m } = mask;
  const dist = new Uint16Array(w * h);
  const INF = 65535;
  for (let i = 0; i < dist.length; i++) dist[i] = m[i] ? 0 : INF;

  // Forward pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let d = dist[i];
      if (x > 0) d = Math.min(d, dist[i - 1] + 1);
      if (y > 0) d = Math.min(d, dist[i - w] + 1);
      if (x > 0 && y > 0) d = Math.min(d, dist[i - w - 1] + 1);
      if (x < w - 1 && y > 0) d = Math.min(d, dist[i - w + 1] + 1);
      dist[i] = d;
    }
  }
  // Backward pass
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let d = dist[i];
      if (x < w - 1) d = Math.min(d, dist[i + 1] + 1);
      if (y < h - 1) d = Math.min(d, dist[i + w] + 1);
      if (x < w - 1 && y < h - 1) d = Math.min(d, dist[i + w + 1] + 1);
      if (x > 0 && y < h - 1) d = Math.min(d, dist[i + w - 1] + 1);
      dist[i] = d;
    }
  }
  // Cap so that very-far pixels saturate to the same value
  if (cap < INF) {
    for (let i = 0; i < dist.length; i++) if (dist[i] > cap) dist[i] = cap;
  }
  return dist;
}

/**
 * Sample a polyline densely so that distance checks aren't biased by where
 * the user paused / moved fast. We add intermediate points proportional to
 * pixel distance.
 */
function densifyPolyline(points: Point[], maxStepPx: number): Point[] {
  if (points.length < 2) return points.slice();
  const out: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len <= maxStepPx) {
      out.push(b);
      continue;
    }
    const steps = Math.ceil(len / maxStepPx);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      out.push({ x: a.x + dx * t, y: a.y + dy * t });
    }
  }
  return out;
}

/**
 * Pixel-mask-based stroke matcher. Far more reliable than the polyline
 * approach because it uses exactly what the user sees rendered on screen.
 *
 * Pass criteria (kid-friendly):
 *   1. ≥60% of densified user samples land within `tolerancePx` of an
 *      expected pixel (i.e. they were drawing roughly on top of the stroke).
 *   2. The user's bounding box reaches at least 35% of the expected stroke's
 *      length on its dominant axis (i.e. they didn't just dab one corner).
 *   3. Length isn't absurdly larger than expected (avoid scribbling).
 */
export function matchStrokeByMask(
  tracedPoints: Point[],
  mask: ExpectedStrokeMask,
  distField: Uint16Array,
  options: { tolerancePx?: number; minCoverage?: number; minReach?: number } = {},
): StrokeMatchResult {
  if (tracedPoints.length < 3) {
    return { passed: false, reason: 'too_short', similarity: 0, endpointScore: 0 };
  }
  if (mask.count === 0) {
    // No expected pixels to compare against — fall back to "always pass" so
    // that characters with broken render data don't block the user forever.
    return { passed: true, reason: 'correct', similarity: 1, endpointScore: 1 };
  }

  const { canvasW: w, canvasH: h, bbox } = mask;
  const minSide = Math.min(w, h);
  // Generous radial tolerance — about 9% of canvas side. On a 1080px stage
  // that's ~97px, comfortably wider than the visible 24px stroke (so any
  // pen-trace on top of the highlighted stroke will count as "on stroke").
  const tolerancePx = options.tolerancePx ?? Math.round(minSide * 0.09);
  const minCoverage = options.minCoverage ?? 0.6;
  const minReach = options.minReach ?? 0.35;

  // Densify so a long line segment can't sneak past with only two endpoints.
  const samples = densifyPolyline(tracedPoints, Math.max(2, tolerancePx / 4));

  let onStroke = 0;
  for (const p of samples) {
    const x = Math.max(0, Math.min(w - 1, Math.round(p.x)));
    const y = Math.max(0, Math.min(h - 1, Math.round(p.y)));
    const d = distField[y * w + x];
    if (d <= tolerancePx) onStroke++;
  }
  const coverage = onStroke / samples.length;

  // User bounding box vs. expected bounding box on its dominant axis.
  let uMinX = Infinity, uMinY = Infinity, uMaxX = -Infinity, uMaxY = -Infinity;
  for (const p of tracedPoints) {
    if (p.x < uMinX) uMinX = p.x;
    if (p.y < uMinY) uMinY = p.y;
    if (p.x > uMaxX) uMaxX = p.x;
    if (p.y > uMaxY) uMaxY = p.y;
  }
  const expW = Math.max(1, bbox.maxX - bbox.minX);
  const expH = Math.max(1, bbox.maxY - bbox.minY);
  const userW = uMaxX - uMinX;
  const userH = uMaxY - uMinY;
  // Dominant axis: whichever side of the expected box is bigger
  const expDom = Math.max(expW, expH);
  const userDom = expW >= expH ? userW : userH;
  const reach = userDom / expDom;

  // Sanity: user shouldn't have travelled wildly beyond the expected stroke.
  const oversize = Math.max(userW / expW, userH / expH);
  const tooBig = oversize > 3.0;

  const similarity = Math.min(1, coverage * 0.7 + Math.min(reach, 1) * 0.3);
  const passed = coverage >= minCoverage && reach >= minReach && !tooBig;

  return {
    passed,
    reason: passed ? 'correct' : 'shape_mismatch',
    similarity,
    endpointScore: coverage,
  };
}
