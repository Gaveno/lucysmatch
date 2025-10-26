# Copilot / Contributor Instructions

This file documents a compact development workflow and rules to follow when adding or modifying features in this repository. The goal: every code change should include tests, and tests must be run and pass before committing.

## Project Structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for the complete project structure and coding guidelines. Key points:

### File Organization
- `index.html` - Main application file (HTML structure only, NO inline CSS or JavaScript)
- `css/` - All stylesheets organized by concern:
  - `themes.css` - Theme variables and dark mode
  - `main.css` - Base styles, layout, game board
  - `cards.css` - Card styles and flip animations
  - `hud.css` - Heads-up display and controls
  - `modals.css` - All modal dialogs and screens
  - `animations.css` - All @keyframes animations
- `src/` - JavaScript modules:
  - `game.js` - Core game logic and state management
- `tests/` - Jest test suites

### Architecture Principles
1. **Separation of Concerns**: Keep CSS, HTML, and JavaScript in separate files
2. **Modular CSS**: Each CSS file handles a specific aspect of the UI
3. **No Inline Styles**: All styling must be in external CSS files
4. **Testable Code**: Keep game logic in `src/game.js` for easy testing

## Core rules

1. Always add tests for new behavior
   - If you add or change functionality in `src/` or `index.html`, add corresponding tests under `tests/`.
   - Tests should be written using Jest and the jsdom test environment (existing tests use `@jest-environment jsdom`).
   - Keep tests small and focused (one logical assertion per test where possible).

2. Make tests deterministic and fast
   - Avoid long timeouts or flaky timing-based assertions. Where the runtime uses animations/timeouts, prefer test-friendly hooks or reduce the timeout in the test module.
   - Mock or no-op heavy visual effects (e.g., `confettiEffect`) in `src/` when driving logic from tests.

3. Run tests locally before committing
   - After installing dependencies (see below), run:
     ```powershell
     npm test
     ```
   - If you changed dependencies, run `npm install` first.

4. Update documentation where appropriate
   - If you add features or commands, update `README.md` and `TESTS.md` with concise instructions so others can run and verify the change.
   - Follow the structure defined in `ARCHITECTURE.md` for new files and features.

5. Commit all modified files together
   - When your changes are ready and tests pass, commit all modified and new files in a single commit. This ensures the repository remains consistent on the main branch.

6. Follow the established architecture
   - New CSS goes in the appropriate file in `css/` directory
   - New animations go in `css/animations.css`
   - New modal styles go in `css/modals.css`
   - Card-related styles go in `css/cards.css`
   - HUD/UI controls go in `css/hud.css`
   - Theme changes go in `css/themes.css`
   - NO inline styles or scripts in `index.html`

## Commit message guidance

Use a short, conventional commit-style message that is informative. Examples:

- feat(game): add medium-difficulty scoring and tests
- fix(game): correct game-over detection; add test
- test(game): add unit tests for miss counting
- chore(deps): bump jest and jsdom to remove deprecation warnings

Commit message structure (recommended):
- Subject line (50 chars or less): type(scope): short description
- Blank line
- One-paragraph body (optional): what and why
- If tests were added or changed, add a short `Tests:` line describing what was added and how to run them

Example full commit message:

```
feat(game): wire src/game.js into index.html and add tests

Move core game logic into `src/game.js` so it can be imported by the test harness.

Tests: added `tests/game.test.js` verifying easy-mode completion causes the result modal to show.
Run locally: `npm install && npm test`
```

## Dependency changes

- If you modify `package.json` or update dependencies, run `npm install` and ensure tests still pass.
- Try to keep dependency upgrades minimal and justified. If you must override transitive dependencies (e.g., via `overrides`), document the reason in the commit message.

## Quick checklist before committing

- [ ] Code implements the feature and follows repository style
- [ ] Tests added or updated for new/changed behavior
- [ ] `npm install` run if dependencies changed
- [ ] `npm test` passes locally
- [ ] `README.md` or `TESTS.md` updated if needed
- [ ] Commit contains all modified files and a clear commit message

## Commands reference (PowerShell)

Install dependencies:
```powershell
npm install
```

Run tests:
```powershell
npm test
```

Run a single test file (Jest):
```powershell
npx jest tests/game.test.js
```

Disable funding message for installs:
```powershell
npm config set fund false
```

## When in doubt

Open an issue describing the change, or create a draft PR and request a review. Prefer small, reviewable commits and keep tests passing.

---

Thank you for helping keep this project tested and stable!