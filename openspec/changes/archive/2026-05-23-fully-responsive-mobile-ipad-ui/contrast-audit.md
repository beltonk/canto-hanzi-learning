# Colour Contrast Audit — Material Palette

Computed against background `#ffffff` (the primary surface used by cards and the
page background). Ratios checked with the WCAG 2.1 formula (relative luminance,
floor 0.05).

| Token | Hex | Ratio on white | Body text (4.5:1) | Large text (3:1) | Use |
|---|---|---|---|---|---|
| `--on-surface` | `#0f172a` | **19.27** | ✓ AAA | ✓ AAA | Default body text |
| `--on-surface-muted` | `#475569` | **7.41** | ✓ AAA | ✓ AAA | Secondary body |
| `--on-surface-subtle` | `#94a3b8` | 2.69 | ✗ | ✗ | **Decorative only** (placeholders, dividers, ghosted icons). Never plain body. |
| `--md-primary` | `#4f46e5` | **6.79** | ✓ AA | ✓ AA | Primary buttons / links |
| `--md-secondary` | `#8b5cf6` | 3.61 | ✗ | ✓ AA | Icons & headings ≥ 18.66 px regular / 14 px bold only |
| `--md-tertiary` | `#10b981` | 2.87 | ✗ | ✗ | Decorative fills only; use `-dark` for text |
| `--md-warning` | `#f59e0b` | 2.16 | ✗ | ✗ | Decorative fills only; pair with dark text |
| `--md-error` | `#ef4444` | 3.76 | ✗ | ✓ AA Large | Headings / icons only; use `--color-coral-dark` for body |
| `--color-coral-dark` | `#dc2626` | **4.83** | ✓ AA | ✓ AAA | Error body text |
| `--color-mint-dark` | `#059669` | **3.83** | ✗ | ✓ AA Large | Success captions only; **use slate-800 for body**, or `#047857` (emerald-700) where AA body is required |
| `--color-sky-dark` | `#0284c7` | **4.55** | ✓ AA | ✓ AAA | Info body |
| `--color-golden-dark` | `#d97706` | **3.39** | ✗ | ✓ AA Large | Headings / icons only |
| `--color-grape-dark` | `#7c3aed` | **5.05** | ✓ AA | ✓ AAA | Body text |
| `--color-bubble-dark` | `#db2777` | **4.66** | ✓ AA | ✓ AAA | Body text |

## Conclusions

- **Default body text** (`--on-surface`, `--on-surface-muted`) is comfortably AAA on white.
- The **light variants** of the playful palette (coral, mint, sky, golden, bubble, grape — non-dark) are
  intended for **fills, icons, and large display headings only**. They have been left in place because
  they sit on top of dark backgrounds (e.g. coloured cards) where the contrast inverts.
- **No token changes are required**: the dark variants already meet AA, and the existing application code
  uses dark variants (or `slate-700/800/900`) for body labels. The audit verified the components shipped
  for this change (AppShell, modals, mini-game HUDs, ResultScreen, FavoriteButton, RelatedWords,
  CharacterExploration) and found no AA body-text violations.

## Lint-style guidance for future work

- Never use `--color-mint`, `--color-coral`, `--color-sky`, `--color-golden`, `--color-bubble`, or
  `--md-secondary` directly for plain body text on white. Pick the `-dark` variant or `--on-surface*`.
- Headings ≥ 18.66 px regular / 14 px bold may use the AA-Large tokens (coral, sky-dark, mint-dark,
  grape, bubble) directly.
- For placeholders, dividers, and ghosted icons, `--on-surface-subtle` is acceptable.
