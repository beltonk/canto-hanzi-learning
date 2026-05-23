/**
 * Canonical breakpoint contract for the app.
 *
 * These thresholds mirror Tailwind CSS 4's default screen breakpoints exactly,
 * so `sm:` in CSS == `breakpoint === 'sm'` in JS. Always derive device-tier
 * decisions from this single source of truth.
 *
 * | Token | Min px | Typical device                |
 * |-------|--------|-------------------------------|
 * | xs    |      0 | Phone portrait                |
 * | sm    |    480 | Phone landscape               |
 * | md    |    768 | iPad portrait / split-view    |
 * | lg    |   1024 | iPad landscape / small laptop |
 * | xl    |   1280 | Desktop                       |
 * | 2xl   |   1536 | Large desktop                 |
 */
export const BREAKPOINTS = {
  xs:  0,
  sm:  480,
  md:  768,
  lg:  1024,
  xl:  1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
export type Orientation = 'portrait' | 'landscape';

/** Returns the breakpoint token for a given viewport width. */
export function widthToBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl)    return 'xl';
  if (width >= BREAKPOINTS.lg)    return 'lg';
  if (width >= BREAKPOINTS.md)    return 'md';
  if (width >= BREAKPOINTS.sm)    return 'sm';
  return 'xs';
}
