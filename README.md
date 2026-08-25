# HaveSome TOML

A static, tactile TOML 1.1 learning lab. Edit source, inspect structure, move fields, practise a safe terminal workflow, and pass a five-check capstone.

## Run locally

```sh
npm ci
npm run dev
```

## Verify

```sh
npm run check
npx playwright install webkit
npm run test:e2e
```

`npm run check` runs unit tests, type-checking, lint, formatting checks, and the production build. The Playwright suite covers the full journey, accessibility, reduced motion, persistence, and the responsive widths named in `OPEN_DESIGN_BRIEF.md`.

## Architecture

- Vite + TypeScript static app
- `smol-toml` browser parser with TOML 1.1 fixtures
- localStorage-only progress and drafts
- simulated terminal; no command execution or backend
- Vitest unit tests and Playwright/WebKit e2e + axe checks
- GitHub Pages workflow with verification before deployment

## Learning contract

The 11 milestones and design tokens are specified in `DESIGN.md` and `OPEN_DESIGN_BRIEF.md`. Learner copy stays short; external reference links point to the official TOML 1.1 specification.
