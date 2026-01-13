# Study: Rendering CreateJS Stroke Paths as Real Character Strokes

## Problem
We have extracted stroke vector data from EDB Chinese website, but the paths are in CreateJS's compact format (`Graphics.p()`), not standard SVG format. We need to decode and render these as actual character strokes.

## Current Data Structure
```json
{
  "strokeNumber": 1,
  "segment": 1,
  "frame": 24,
  "pathData": "Am/GWQk1hUmwlWQiDiYCoguINqg/IR0h9QLpC7q+FRQl4BDk9BBQogCdhoAAIgMgBg",
  "transform": { "x": 239.2, "y": 566.5 },
  "color": "#000000"
}
```

## CreateJS Path Format
- **Format**: Compact, proprietary encoding used by CreateJS Graphics.p() method
- **Not SVG**: Different from standard SVG path format (M, L, C, Q, Z commands)
- **Canvas Size**: 1080x1080 pixels
- **Transform**: Each path has a transform position (x, y) where it's placed on canvas

## Approaches to Render Real Strokes

### Option 1: Use CreateJS Library (Recommended)
**Pros:**
- Can directly decode and render the paths
- Accurate representation
- Can extract rendered paths

**Implementation:**
1. Load CreateJS library in browser
2. Create Shape objects with Graphics.p(pathData)
3. Apply transforms
4. Render to canvas
5. Optionally trace canvas to extract SVG paths

**File**: `scripts/render-strokes-with-createjs.html`

### Option 2: Reverse Engineer Format
**Pros:**
- No external dependencies
- Full control

**Cons:**
- Complex - CreateJS format is proprietary
- Time-consuming to decode
- May not be complete

### Option 3: Use Transform Positions Only
**Current Approach:**
- Visualize transform positions as anchor points
- Connect with lines
- Limited accuracy - doesn't show actual stroke paths

**Limitation:**
- Transform positions are just anchor points
- Actual paths extend from these points in ways we can't see without decoding

### Option 4: Extract from Rendered Canvas
**Process:**
1. Use CreateJS to render paths to canvas
2. Use canvas API to trace/get path data
3. Convert to SVG paths

**Tools:**
- `canvas.toDataURL()` for image export
- Canvas path tracing libraries
- SVG conversion tools

## Recommended Solution

**Hybrid Approach:**
1. **For Visualization**: Use CreateJS in browser to render paths accurately
2. **For Storage**: Keep raw pathData (CreateJS format) in JSON
3. **For Export**: Use CreateJS to render, then convert to SVG if needed

## Implementation Steps

1. ✅ Extract pathData and transforms from JavaScript files
2. ✅ Store in JSON format
3. 🔄 Create browser-based renderer using CreateJS
4. ⏳ Extract SVG paths from rendered canvas (if needed)
5. ⏳ Create visualization that shows actual stroke paths

## Files Created

1. `scripts/render-strokes-with-createjs.html` - Browser-based renderer using CreateJS
2. `scripts/decode-createjs-path.ts` - Analysis script
3. `scripts/test-stroke-visualization-simple.ts` - Current visualization (transform positions only)

## Next Steps

1. Open `render-strokes-with-createjs.html` in browser
2. Verify paths render correctly
3. Extract SVG paths from rendered canvas
4. Update visualization to use actual stroke paths instead of transform positions
