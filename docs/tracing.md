# Stroke Tracing System

## Overview

The stroke tracing system allows students to trace Chinese character strokes using touch or mouse input. It validates each stroke against the expected stroke data using a deterministic geometric algorithm — no machine learning required.

## Data Source

Each character JSON file includes a `strokeVectors` array. Each element has:
- `pathData`: A simplified CreateJS-like path string encoding the stroke shape
- `strokeNumber`: 1-indexed stroke order

Example path data: `"M 200 300 L 400 500 Q 600 700 800 900"`

## Path Parsing (`src/lib/tracing/svgPathParse.ts`)

The `parsePath(pathData)` function converts a CreateJS path string into a raw polyline (array of `[x, y]` points).

`resamplePolyline(points, n)` resamples the polyline to exactly `n` evenly-spaced points along the path, ensuring consistent comparison regardless of how many control points the original path has. Default `n = 64`.

`normalizePolyline(points)` translates and scales the polyline to fit within a unit box `[0,1] × [0,1]`, making comparisons rotation-agnostic at the same scale.

## Stroke Matching (`src/lib/tracing/match.ts`)

`matchStroke(traced, expected, opts)` compares a traced polyline against the expected stroke polyline with three independent checks:

### 1. Order Check
Verifies that the stroke is being drawn in the correct sequence. The stroke index passed by the caller must match the expected stroke number (1-indexed).

### 2. Endpoint Check
Compares the start and end points of the normalized traced polyline against the expected polyline. If either endpoint is further than `endpointTolerance` (default: 0.35) from the expected point, the check fails.

### 3. Shape Similarity
Computes the average Euclidean distance between corresponding points of the resampled, normalized polylines. If the mean distance exceeds `shapeTolerance` (default: 0.25), the check fails.

### Return Value

```ts
interface MatchResult {
  ok: boolean;
  orderOk: boolean;
  endpointsOk: boolean;
  shapeOk: boolean;
  score: number; // 0–1, higher is better
}
```

## Star Scoring (`computeStars`)

After all strokes of a character are traced:

```ts
computeStars(results: MatchResult[]): 1 | 2 | 3
```

| Condition | Stars |
|-----------|-------|
| All strokes correct on first try | 3 ⭐⭐⭐ |
| ≥ 70% correct | 2 ⭐⭐ |
| Any attempt completes the character | 1 ⭐ |

## Component (`app/components/learning/StrokeTracing.tsx`)

Renders a canvas-based tracing interface. On each `pointerup`:
1. The captured polyline is passed to `matchStroke()`
2. If correct: advance to the next stroke, play success audio, animate mascot
3. If incorrect: allow retry, play failure audio

On character completion:
- Computes stars via `computeStars()`
- Calls `recordActivity({ type: 'trace', char, stars })` to log the result
- Awards XP via `xpForAction('trace_Nstar')`

## Extending the Matching Algorithm

To tune matching sensitivity, adjust the tolerances in `src/lib/tracing/match.ts`:

```ts
const DEFAULT_OPTS = {
  endpointTolerance: 0.35,  // lower = stricter endpoint checking
  shapeTolerance: 0.25,     // lower = stricter shape matching
  resamplePoints: 64,       // more points = finer comparison
};
```

To add a new matching dimension (e.g., direction of stroke), add a new check to `matchStroke()` and update `MatchResult` accordingly.

## Debug Mode

Add `?debug=trace` to the URL when Kid Mode is off to see:
- Expected polyline drawn in blue
- Traced polyline drawn in red
- Score components printed as text overlay

This is automatically hidden in Kid Mode to avoid confusing students.
