# Project Context

## Purpose
A web application for learning Cantonese (粵語) and Chinese characters (漢字/Hanzi). The project aims to provide an interactive learning experience for users studying Cantonese pronunciation, vocabulary, and character recognition.

## Tech Stack
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **ESLint** - Code linting with Next.js configs
- **Geist Fonts** - Sans and Mono font families from Vercel

## Project Conventions

### Code Style
- **TypeScript**: Strict mode enabled (`strict: true` in tsconfig.json)
- **Naming**: 
  - Components use PascalCase (e.g., `Home`, `RootLayout`)
  - Files use kebab-case or match component names
  - Path aliases: `@/*` maps to project root
- **Formatting**: ESLint with Next.js core-web-vitals and TypeScript configs
- **Imports**: ES modules with `esModuleInterop: true`
- **JSX**: React 17+ transform (`jsx: "react-jsx"`)

### Architecture Patterns
- **App Router**: Next.js App Router architecture (`app/` directory)
- **Server Components**: Default React Server Components pattern
- **File-based Routing**: Routes defined by folder structure in `app/`
- **CSS**: Tailwind CSS with custom theme variables for dark mode support
- **Fonts**: Optimized font loading via `next/font/google`
- **Styling**: Utility-first approach with Tailwind, supports dark mode via `prefers-color-scheme`

### Testing Strategy
- **Unit / integration**: Vitest + @testing-library/react (run with `npm run check`)
- **E2E responsive matrix**: Playwright (`npm run test:e2e`) — 6 device profiles × all routes; see `tests/e2e/responsive/README.md`

### Important Constraints
- **Canonical breakpoints**: xs=0, sm=480, md=768, lg=1024, xl=1280, 2xl=1536 px — always use these via `src/lib/viewport/breakpoints.ts` and matching Tailwind classes
- **Hong Kong font stack invariant**: The `font-family` on `.font-chinese`, `.hanzi-display`, `.hanzi-medium`, `.hanzi-sentence` MUST start with `'Free HK Kai'` and must never be changed. This is enforced by the Playwright invariant `assertHKFontFirst`.
- **Safe-area insets**: Use `.pt-safe`, `.pb-safe`, `.pl-safe`, `.pr-safe` CSS utilities (defined in `app/globals.css`) for any sticky header, bottom nav, or full-screen overlay.
- **Audio engine**: Do not modify `src/lib/audio/AudioEngine.ts` or `src/lib/audio/context.tsx` during UI work — the iPad audio unlock path is fragile.

### Git Workflow
- Git workflow not yet defined
- Consider establishing:
  - Branch naming conventions (e.g., `feature/`, `fix/`, `refactor/`)
  - Commit message conventions (e.g., Conventional Commits)
  - PR review process

## Domain Context
- **Cantonese (粵語)**: A variety of Chinese spoken primarily in Hong Kong, Macau, and Guangdong province
- **Hanzi (漢字)**: Chinese characters used in written Chinese
- **Learning Focus**: The application will help users learn:
  - Cantonese pronunciation (Jyutping romanization system)
  - Character recognition and meaning
  - Vocabulary building
  - Character stroke order (potentially)

## Important Constraints
- **Browser Support**: Modern browsers that support ES2017+ features
- **Type Safety**: TypeScript strict mode must be maintained
- **Performance**: Next.js optimizations (Image, Font, etc.) should be utilized
- **Accessibility**: WCAG guidelines should be followed, especially for language learning content

## External Dependencies
- **Vercel**: Recommended deployment platform (Next.js creators)
- **Google Fonts**: Geist Sans and Geist Mono fonts
- No external APIs or services currently integrated
