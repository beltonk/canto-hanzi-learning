/**
 * Route × device matrix for the responsive viewport test suite.
 *
 * Add new routes here and they will automatically be tested across
 * all device profiles defined in playwright.config.ts.
 */

export const ROUTES = [
  '/',
  '/learn',
  '/learn/explore',
  '/learn/flashcard',
  '/learn/decompose',
  '/learn/dictation',
  '/learn/trace',
  '/play',
  '/favorites',
  '/progress',
  '/stickers',
] as const;

export type Route = (typeof ROUTES)[number];
