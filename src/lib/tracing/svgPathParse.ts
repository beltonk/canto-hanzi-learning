// CreateJS encodes paths using its own compact encoding.
// We decode it to get a polyline of sample points for stroke matching.

/**
 * Decode a CreateJS encoded path string to a series of commands.
 * The CreateJS encoding uses: each char maps to 6 bits.
 * Characters 'A' through 'Z' = 0-25, 'a'-'z' = 26-51, '0'-'9' = 52-61, '+' = 62, '/' = 63
 * But the actual CreateJS decoding is more complex. We use an approximation for our purposes.
 */

function base64CharValue(ch: string): number {
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) return code - 65;       // A-Z: 0-25
  if (code >= 97 && code <= 122) return code - 97 + 26; // a-z: 26-51
  if (code >= 48 && code <= 57) return code - 48 + 52;  // 0-9: 52-61
  if (ch === '+') return 62;
  if (ch === '/') return 63;
  return -1;
}

/**
 * Decode a CreateJS encoded number from the path string at position i.
 * Returns [value, newIndex]
 */
function decodeValue(path: string, i: number): [number, number] {
  let result = 0;
  let shift = 0;
  let sign = 1;
  while (i < path.length) {
    const ch = path[i++];
    const v = base64CharValue(ch);
    if (v < 0) continue;
    const hasMore = v & 32; // bit 5 = continuation
    const bits = v & 31;    // lower 5 bits
    if (shift === 0 && (bits & 16)) sign = -1;
    result |= (bits & (shift === 0 ? 15 : 31)) << (shift === 0 ? 0 : shift - 1);
    shift += shift === 0 ? 4 : 5;
    if (!hasMore) break;
  }
  return [result * sign, i];
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Parse a CreateJS encoded path + transform into a polyline.
 * We sample N points along the decoded path commands.
 *
 * Since full CreateJS decoding is complex, we use the transform x/y as the
 * start point and generate a simplified representative polyline. For more
 * accurate results, the actual canvas rendering path from StrokeAnimation is used.
 */
export function parsePathToPolyline(pathData: string, transform: { x: number; y: number }): Point[] {
  const points: Point[] = [];
  let x = transform.x;
  let y = transform.y;
  let i = 0;

  points.push({ x, y });

  // Decode path - simplified decoder for the common commands in EDB stroke data
  while (i < pathData.length) {
    const ch = pathData[i];
    const v = base64CharValue(ch);
    if (v < 0) { i++; continue; }

    // Every few decoded values, add a sample point
    const [dx, ni] = decodeValue(pathData, i);
    i = ni;
    const [dy, ni2] = decodeValue(pathData, i);
    i = ni2;

    x += dx * 0.01; // scale factor approximation
    y += dy * 0.01;
    points.push({ x, y });

    if (points.length >= 64) break;
  }

  return points.length > 1 ? points : [{ x: transform.x, y: transform.y }, { x: transform.x + 100, y: transform.y }];
}

/**
 * Resample a polyline to exactly N equidistant points.
 */
export function resamplePolyline(points: Point[], n = 32): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(n).fill(points[0]) as Point[];

  // Compute total length
  let totalLen = 0;
  const lengths: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalLen += Math.sqrt(dx * dx + dy * dy);
    lengths.push(totalLen);
  }

  if (totalLen === 0) return Array(n).fill(points[0]) as Point[];

  const result: Point[] = [];
  for (let k = 0; k < n; k++) {
    const targetLen = (k / (n - 1)) * totalLen;
    // Find segment
    let seg = 0;
    for (let j = 1; j < lengths.length; j++) {
      if (lengths[j] >= targetLen) { seg = j - 1; break; }
      seg = j - 1;
    }
    const segLen = lengths[seg + 1] - lengths[seg];
    const t = segLen === 0 ? 0 : (targetLen - lengths[seg]) / segLen;
    const p0 = points[seg];
    const p1 = points[Math.min(seg + 1, points.length - 1)];
    result.push({
      x: p0.x + t * (p1.x - p0.x),
      y: p0.y + t * (p1.y - p0.y),
    });
  }
  return result;
}

/**
 * Normalize points to unit box [0,1]×[0,1].
 */
export function normalizePolyline(points: Point[]): Point[] {
  if (points.length === 0) return [];
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const scale = Math.max(w, h);
  return points.map(p => ({
    x: (p.x - minX) / scale,
    y: (p.y - minY) / scale,
  }));
}
