TESTS for LUCY'S MATCH

Overview
--------
This project includes a small Jest/jsdom test that verifies the core gameplay: when all matching pairs for the chosen difficulty are revealed, the result modal becomes visible.

Files
-----
- `tests/game.test.js` — The test file. It:
  - loads `index.html` into a jsdom document
  - requires `src/game.js` (the extracted game logic used for tests)
  - calls `initGame(8)` to build an Easy board (8 cards / 4 pairs)
  - programmatically clicks matching card pairs
  - asserts the `#resultModal` element has the `show` class after all pairs are matched

Test environment and setup
--------------------------
Requirements:
- Node.js (v14+ recommended)
- npm

Install dependencies locally in the repository root:

```powershell
npm install
```

Run tests:

```powershell
npm test
```

Notes and limitations
---------------------
- The tests use the `jsdom` environment (Jest's `@jest-environment jsdom` directive at the top of the test file).
- `src/game.js` contains a simplified version of the game logic for deterministic testing:
  - `confettiEffect` is a no-op (so tests are not affected by DOM animation timing)
  - the mismatch delay in this module is short (100ms) to keep tests fast. The production page (`index.html`) still uses its original UI scripts and timings.

Extending tests
----------------
Possible next tests to add:
- Verify misses increment on incorrect picks
- Verify star calculation (3/2/1) for given miss counts
- Test Medium and Hard difficulties build the correct number of cards
- Accessibility checks (focus management and ARIA attributes)

If you want, I can also:
- Wire `src/game.js` into `index.html` so the app uses the same runtime module as the tests
- Add a small npm script to open the game in a browser for development

---
Helpful quick commands (PowerShell):

```powershell
# install dev deps
npm install

# run tests
npm test
```
