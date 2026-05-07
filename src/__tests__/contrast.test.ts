import { describe, it, expect } from 'vitest'

/**
 * WCAG 2.1 contrast ratio check for the kid-mode palette tokens defined in
 * app/globals.css. Pure JS (no DOM) so we can pin the contrast values in
 * a unit test instead of relying on a manual check.
 *
 * Reference: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 *   AA normal text: ≥ 4.5
 *   AA large text:  ≥ 3.0
 */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(v.slice(0, 2), 16)
  const g = parseInt(v.slice(2, 4), 16)
  const b = parseInt(v.slice(4, 6), 16)
  return [r, g, b]
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(fg: string, bg: string): number {
  const L1 = relLuminance(hexToRgb(fg))
  const L2 = relLuminance(hexToRgb(bg))
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (hi + 0.05) / (lo + 0.05)
}

const PALETTE = {
  primary:        '#4f46e5',
  primaryHover:   '#4338ca',
  secondary:      '#8b5cf6',
  tertiary:       '#10b981',
  tertiaryDark:   '#059669',
  // emerald-700 — the colour we actually use for status/success body text
  // (e.g. DecompositionPlay's "答對了！" callout). emerald-500 fails AA on
  // its own tint, so we use the darker shade for text + the lighter shade
  // for backgrounds.
  emerald700:     '#15803d',
  warning:        '#f59e0b',
  warningDark:    '#d97706',
  error:          '#ef4444',
  errorDark:      '#dc2626',
  // rose-700 — body text colour for error callouts on rose-50 backgrounds.
  rose700:        '#be123c',
  bubble:         '#ec4899',
  bubbleDark:     '#db2777',
  grape:          '#8b5cf6',
  grapeDark:      '#7c3aed',
  // text
  onSurface:      '#0f172a',
  onSurfaceMuted: '#475569',
  // surfaces
  white:          '#ffffff',
  surfaceVariant: '#f8fafc',
  primaryTint:    '#eef2ff',
  tertiaryTint:   '#ecfdf5',
  errorTint:      '#fef2f2',
}

const AA_NORMAL = 4.5
const AA_LARGE  = 3.0

describe('palette contrast meets WCAG AA', () => {
  // Body / muted text on app surfaces must meet AA-normal.
  const bodyTextPairs: Array<[string, string, string]> = [
    ['on-surface on white',           PALETTE.onSurface,      PALETTE.white],
    ['on-surface on surface-variant', PALETTE.onSurface,      PALETTE.surfaceVariant],
    ['muted text on white',           PALETTE.onSurfaceMuted, PALETTE.white],
    ['muted text on primary tint',    PALETTE.onSurfaceMuted, PALETTE.primaryTint],
  ]
  for (const [label, fg, bg] of bodyTextPairs) {
    it(`AA-normal: ${label} (≥ ${AA_NORMAL})`, () => {
      const r = contrastRatio(fg, bg)
      expect(r, `contrast for ${label} was ${r.toFixed(2)}`).toBeGreaterThanOrEqual(AA_NORMAL)
    })
  }

  // White-on-color buttons + chips: large/bold text uses AA-large.
  const whiteOnColor: Array<[string, string]> = [
    ['white on primary',       PALETTE.primary],
    ['white on primary hover', PALETTE.primaryHover],
    ['white on tertiary-dark', PALETTE.tertiaryDark],
    ['white on warning-dark',  PALETTE.warningDark],
    ['white on error',         PALETTE.error],
    ['white on error-dark',    PALETTE.errorDark],
    ['white on bubble-dark',   PALETTE.bubbleDark],
    ['white on grape-dark',    PALETTE.grapeDark],
  ]
  for (const [label, bg] of whiteOnColor) {
    it(`AA-large: ${label} (≥ ${AA_LARGE})`, () => {
      const r = contrastRatio(PALETTE.white, bg)
      expect(r, `contrast for ${label} was ${r.toFixed(2)}`).toBeGreaterThanOrEqual(AA_LARGE)
    })
  }

  // Status text on tinted callouts.
  const statusTextPairs: Array<[string, string, string]> = [
    ['emerald-700 on emerald-50 (success)', PALETTE.emerald700, PALETTE.tertiaryTint],
    ['rose-700 on rose-50 (error)',          PALETTE.rose700,    PALETTE.errorTint],
  ]
  for (const [label, fg, bg] of statusTextPairs) {
    it(`AA-normal: ${label} (≥ ${AA_NORMAL})`, () => {
      const r = contrastRatio(fg, bg)
      expect(r, `contrast for ${label} was ${r.toFixed(2)}`).toBeGreaterThanOrEqual(AA_NORMAL)
    })
  }
})
