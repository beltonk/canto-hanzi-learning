import { defineConfig, devices } from '@playwright/test';

/**
 * Viewport matrix for the fully-responsive-mobile-ipad-ui change.
 *
 * Run:  npm run test:e2e
 * See:  tests/e2e/responsive/README.md
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/__results__',
  snapshotDir: './tests/e2e/__screenshots__',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    /* Phone portrait — iPhone SE (375×667, scale 2) */
    {
      name: 'iphone-se-portrait',
      use: { ...devices['iPhone SE'] },
    },

    /* Phone landscape — iPhone 14 Pro in landscape */
    {
      name: 'iphone-landscape',
      use: {
        ...devices['iPhone 14 Pro'],
        viewport: { width: 932, height: 430 },
      },
    },

    /* iPad Mini portrait (768×1024, scale 2) */
    {
      name: 'ipad-mini-portrait',
      use: { ...devices['iPad Mini'] },
    },

    /* iPad Pro 11 portrait (834×1194) */
    {
      name: 'ipad-pro-portrait',
      use: { ...devices['iPad Pro 11'] },
    },

    /* iPad Pro 11 landscape (1194×834) */
    {
      name: 'ipad-pro-landscape',
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 1194, height: 834 },
      },
    },

    /* Desktop 1440 */
    {
      name: 'desktop-1440',
      use: {
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        isMobile: false,
      },
    },
  ],

  /* Start the Next.js dev server automatically when running locally */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
