# LUCY'S MATCH

A playful, kid-friendly memory match game built with HTML, CSS and vanilla JavaScript.

## What it is

Lucy’s Match is a simple memory card matching game using colorful emoji and fun visual effects. Players flip cards to find matching pairs. The game includes three difficulty levels and a star-based scoring system.

## Key features

- 3 difficulty levels: Easy (8 cards), Medium (12 cards), Hard (16 cards)
- Sweet, pastel UI and playful fonts
- Flip animation, match pulse animation, and confetti explosion on matches
- Star rating at the end based on number of misses
- Simple, mobile-friendly layout

## Play

Open `index.html` in your browser. Select a difficulty and match all pairs. When you complete all pairs the result modal will appear showing your star rating.

## Project structure

- `index.html` — main page including styles and game board markup (contains the original inline script for the browser version).
- `src/game.js` — extracted game logic used by automated tests (exports small hooks so it can be driven by tests).
- `tests/game.test.js` — Jest/jsdom based test covering the easy-mode game completion.
- `package.json` — test script + devDependencies (Jest, jsdom).
- `LICENSE` — project license file.

Note: `index.html` still contains the browser-facing inline script. `src/game.js` is used by the test harness so tests can require and drive the logic in Node/jsdom.

## Development

Requirements:

- Node.js (14+ recommended)
- npm

Install dev dependencies:

```powershell
npm install
```

Run tests:

```powershell
npm test
```

## Notes

- The test harness uses jsdom to create a DOM from `index.html` and the `src/game.js` module to drive game behavior. In the test environment, the confetti effect is a no-op and the mismatch timeout is shortened to keep tests fast.
- If you'd like the `src/game.js` logic wired into the production `index.html` (to avoid duplication), I can refactor the page to import the module and keep a single source of truth.

## Contributing

If you'd like more tests (edge cases, accessibility checks, visual regression), I can add them. Open a PR with changes or request features here.

---

Enjoy playing and testing Lucy's Match!