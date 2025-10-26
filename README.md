# LUCY'S MATCH

A playful, kid-friendly memory match game built with HTML, CSS and vanilla JavaScript.

## What it is

Lucy's Match is a dynamic memory card matching game using colorful emoji and fun visual effects. Players flip cards to find matching pairs across multiple game modes. The game includes three difficulty levels, multiple game modes, and an engaging scoring system with combos and animations.

## Key features

### Game Modes
- **Classic Mode** 🎯 — Relaxed, untimed play. Perfect your strategy!
  - Choose difficulty: Easy (8 cards), Medium (12 cards), or Hard (16 cards)
- **Timed Mode** ⏱️ — Complete as many boards as possible before time runs out! Choose from:
  - ⏰ Quick (1 minute)
  - ⏲️ Standard (2 minutes)
  - ⏳ Marathon (3 minutes)
  - Then select difficulty for each round
- **Blitz Mode** ⚡ — Combo-focused 1-minute challenge!
  - Fixed 4×5 grid (20 cards, 10 pairs)
  - Visual hints appear when both cards in a pair have been discovered
  - 5 unique animated border effects (glow, pulse, shimmer, wave, spark)
  - Hints persist on matched cards to keep the board exciting
  - Perfect for building massive combo chains!

### Difficulty Levels
- Easy (8 cards) 🌱 — *Classic and Timed modes*
- Medium (12 cards) 🌿 — *Classic and Timed modes*
- Hard (16 cards) 🌳 — *Classic and Timed modes*
- Fixed 4×5 (20 cards) ⚡ — *Blitz mode only*

### Scoring & Progression
- **Combo System** — Chain consecutive matches for massive score multipliers (up to 8x!)
- **Continuous Challenge** (Timed Mode) — Boards automatically reset when completed; rack up multiple completions!
- **Star Ratings** — Earn 1-3 stars based on performance:
  - Classic/Blitz: Based on accuracy (fewer misses = more stars)
  - Timed: Based on boards completed (5+ boards = 3 stars!)
- **Score Breakdown** — Points from matches, combos, time bonuses, and board completion bonuses

### Visual Polish
- **Animated Result Screen** — Staggered animations reveal your stats in an exciting sequence
- **Smart UI** — Play Again button hidden until animations complete (no accidental dismissals!)
- **Time Selection Screen** — Each duration option has unique icons and idle animations
- **Blitz Mode Pair Hints** — 5 unique animated border effects that appear when both cards discovered:
  - 🔴 Glow (Rose Pink) - Pulsing intensity
  - 🔵 Pulse (Sky Blue) - Breathing with scale
  - 🟢 Shimmer (Pale Green) - Shimmering waves
  - 🟡 Wave (Golden) - Directional rotation
  - 🟣 Spark (Purple) - Bursting energy
- **Responsive Scaling** — Blitz mode grid automatically fits viewport height
- Sweet, pastel UI with playful fonts and smooth transitions
- Flip animations, match pulse effects, and confetti explosions
- Dark/Light theme toggle 🌙/🌞
- Mobile-friendly responsive layout

## Play

Open `index.html` in your browser:
1. Select your game mode (Classic, Timed, or Blitz)
2. For Timed mode, choose your duration (1-3 minutes)
3. For Classic/Timed, select difficulty level (Easy, Medium, Hard)
4. Blitz mode starts immediately with 20 cards
5. Match all pairs and watch your score soar!

**Blitz Mode Tips:**
- Flip cards to discover them — hints only appear after both cards in a pair have been seen
- Use the animated border hints to quickly identify matching pairs
- Chain matches rapidly to build massive combos (up to 8x multiplier!)
- Hints remain on matched cards, keeping the board colorful and exciting

In Timed mode, completed boards automatically reset — see how many you can finish before time expires!

## Project structure

- `index.html` — main page including styles, game board markup, and inline script for browser play
- `css/` — Stylesheets ⚠️ **Refactoring in progress** (see [ARCHITECTURE.md](ARCHITECTURE.md))
  - `themes.css` — Theme variables and transitions (light/dark mode) ✅
  - `main.css` — Base styles, layout, game board, cards ✅
  - Additional CSS files to be extracted from index.html
- `src/game.js` — extracted game logic with mode system, combo mechanics, and board reset functionality (exports hooks for testing)
- `src/ui.js` — ⚠️ **Planned**: UI initialization and event handlers (to be extracted from inline scripts)
- `tests/` — Comprehensive Jest/jsdom test suites:
  - `game.test.js` — Core game completion flow
  - `game.additional.test.js` — Edge cases and card interactions
  - `game.dom.test.js` — DOM updates and rendering
  - `modes.test.js` — Multi-mode gameplay (Classic, Timed, Blitz)
  - `hud-scoring.test.js` — HUD updates, combo system, scoring
  - `timed-mode-challenge.test.js` — Continuous board reset and completion tracking
  - `card-interaction.test.js` — Card flipping, matching, and lock behavior
  - `ui-flow.test.js` — Modal flows and game state transitions
  - `accessibility.test.js` — Focus management and ARIA attributes
  - `theme.test.js` — Dark/Light theme persistence
- `package.json` — test script + devDependencies (Jest, jsdom)
- `LICENSE` — project license file
- `ARCHITECTURE.md` — 📋 **Coding guidelines and best practices** for future development

**Note**: The project is undergoing refactoring to separate CSS and JavaScript into external files for better maintainability. See [ARCHITECTURE.md](ARCHITECTURE.md) for the complete plan and coding standards.

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

All 56 tests across 10 test suites validate game modes, scoring, combos, board resets, accessibility, and UI flows.

## Notes

- The test harness uses jsdom to create a DOM from `index.html` and the `src/game.js` module to drive game behavior.
- In the test environment, animations are skipped (confetti, result screen delays) and timeouts are shortened to keep tests fast.
- The timed mode's continuous challenge feature resets the board automatically when all pairs are matched, allowing players to complete multiple boards within the time limit.
- Custom time durations are stored and passed through the game initialization flow seamlessly.

## Contributing

Feature requests and PRs welcome! The codebase is fully tested with Jest and ready for extension.

---

Enjoy playing and testing Lucy's Match! 🎮✨
