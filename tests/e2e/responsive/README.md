# Responsive E2E Viewport Matrix

This suite asserts six layout invariants on every route × device profile combination.

## Running the tests

```bash
# Start the dev server first (or set PLAYWRIGHT_BASE_URL to a deployed URL)
npm run dev &

# Run the full matrix
npm run test:e2e

# Run on a single project (device)
npx playwright test --project=ipad-mini-portrait

# Update visual baselines after intentional UI changes
npx playwright test --update-snapshots
```

## Device profiles (defined in `playwright.config.ts`)

| Project name         | Viewport       | Notes                        |
|----------------------|----------------|------------------------------|
| `iphone-se-portrait` | 375×667        | Phone portrait, scale 2      |
| `iphone-landscape`   | 932×430        | Phone landscape              |
| `ipad-mini-portrait` | 768×1024       | iPad portrait / split-view   |
| `ipad-pro-portrait`  | 834×1194       | iPad Pro 11 portrait         |
| `ipad-pro-landscape` | 1194×834       | iPad Pro 11 landscape        |
| `desktop-1440`       | 1440×900       | Desktop                      |

## Adding a new route

1. Open `tests/e2e/responsive/matrix.ts`.
2. Add the route path to the `ROUTES` array.
3. Run `npm run test:e2e --update-snapshots` to capture baselines.

## Adding a new viewport

1. Open `playwright.config.ts`.
2. Add a new entry to the `projects` array.
3. Rerun the suite to capture baselines for the new project.

## Layout invariants (all checked per cell)

1. **No horizontal scroll** — `scrollWidth === innerWidth`.
2. **No safe-area overlap** — no interactive element overlaps `env(safe-area-inset-top)`.
3. **Touch targets ≥ 44 px** — every button/link meets WCAG 2.5.5 (soft warning, not hard fail).
4. **HK font first in stack** — computed `font-family` on `.font-chinese` starts with `Free HK Kai`.
5. **No inline overflow** — no element's right edge exceeds viewport width by more than 4 px.
6. **No vertical page scroll** — `scrollHeight <= innerHeight + 1.5px` (checks that the main document does not scroll vertically, keeping primary chrome and landing pages above the fold; sub-regions still scroll internally).

## Opt-out Mechanism for Vertical Page Scroll

If a specific route legitimately requires standard document-level vertical scrolling (such as deep informational pages, articles, or large read-only docs), you can opt out of the vertical-scroll invariant by setting the `data-allow-scroll="true"` attribute on the `<body>` element.

The `<PageScaffold>` component handles this automatically if configured, or you can manage the attribute directly:

```typescript
// Inside a component or route's useEffect:
useEffect(() => {
  document.body.setAttribute('data-allow-scroll', 'true');
  return () => {
    document.body.removeAttribute('data-allow-scroll');
  };
}, []);
```

## Baselines

Screenshots are stored under `tests/e2e/__screenshots__/`. They are checked into the repository so CI can diff against them. Re-baseline after deliberate visual changes with `--update-snapshots`.
