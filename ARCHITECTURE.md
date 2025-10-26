# Lucy's Match - Architecture & Best Practices

## Project Structure

```
lucysmatch/
├── index.html              # Main HTML structure (minimal, references external files)
├── css/
│   ├── themes.css          # Theme variables (light/dark mode)
│   ├── main.css            # Base styles, layout, typography
│   ├── cards.css           # Card flip animations and styles
│   ├── modals.css          # All modal screens (title, mode, difficulty, time, result)
│   ├── hud.css             # Game HUD, score, timer, combo displays
│   └── animations.css      # All @keyframes animations
├── src/
│   ├── game.js             # Core game logic (existing)
│   └── ui.js               # UI initialization and event handlers
├── tests/
│   └── *.test.js          # Jest test suites
├── package.json
├── README.md
└── ARCHITECTURE.md         # This file
```

## Current Status (Pre-Refactor)

### File Sizes
- **index.html**: 1,402 lines
  - Inline CSS: ~1,145 lines (lines 9-1154)
  - HTML: ~120 lines
  - Inline JS: ~115 lines (lines 1274-1389)
- **src/game.js**: 919 lines

### Issues
- All CSS bundled in `<style>` tag
- UI initialization code duplicated (inline JS + game.js)
- Difficult to navigate and maintain
- No browser caching for CSS/JS

## Refactoring Plan

### Phase 1: Extract CSS Files ✅ STARTED

#### themes.css ✅ CREATED
**Purpose**: Theme variables and transitions  
**Contents**:
- Light mode CSS custom properties (`:root`)
- Dark mode overrides (`[data-theme="dark"]`)
- Theme transition animations (`themePulse`)
- Body theme animation classes

#### main.css ✅ CREATED  
**Purpose**: Base styles, layout, typography  
**Contents**:
- Global resets (`*`, `html`, `body`)
- Container and layout
- Typography (h1, h2, body text)
- Game board grid
- Blitz mode responsive scaling
- Accessibility (.sr-only)
- Mobile media queries

#### cards.css ⏳ TODO
**Purpose**: Card styles and flip animations  
**Contents**:
- `.card` container styles
- `.card-inner` flip mechanics
- `.card-front` and `.card-back` faces
- Card hover/active states
- Match pulse animation
- Blitz mode pair hint effects (5 variants)
- Confetti container

#### modals.css ⏳ TODO
**Purpose**: All modal screens  
**Contents**:
- Title/splash screen (.title-screen)
- Mode selection screen (.mode-screen)
- Difficulty selection (.start-modal)
- Time selection screen (.time-screen)
- Result modal (#resultModal)
- Modal animations (slide-in, fade, stamp)

#### hud.css ⏳ TODO
**Purpose**: Game HUD components  
**Contents**:
- `.game-hud` container
- Score, timer, combo displays
- Theme toggle button
- Combo popup animation

#### animations.css ⏳ TODO
**Purpose**: All @keyframes definitions  
**Contents**:
- Card animations (matchPulse, confettiExplosion)
- Hint animations (hintGlow1-5, hintPulse2, etc.)
- Star animations (fadeIn, breathe, stampIn)
- Mode button animations (gentleFloat, rapidBounce, etc.)
- Border effects (peacefulGlow, urgentPulse, explosiveFlash)
- Combo/HUD animations (comboPopup)

### Phase 2: Create UI Module ⏳ TODO

#### src/ui.js
**Purpose**: UI initialization and event handling  
**Responsibilities**:
- DOM element references
- Event listener setup
- Modal show/hide logic
- Mode/difficulty/time selection flow
- HUD updates (delegates to game.js for data)
- Theme toggle handling

**Key Functions**:
```javascript
// Initialization
export function initUI() { ... }

// Screen transitions
export function showModeScreen() { ... }
export function showTimeScreen() { ... }
export function showDifficultyScreen() { ... }
export function hideAllScreens() { ... }

// Event handlers
export function setupEventListeners() { ... }
export function handleModeSelection(mode) { ... }
export function handleTimeSelection(duration) { ... }
export function handleDifficultySelection(cardCount) { ... }

// HUD
export function updateHUDDisplay(hudData) { ... }
export function showComboPopup(combo, points) { ... }
```

### Phase 3: Update index.html ⏳ TODO

**New Structure**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lucy's Match</title>
  
  <!-- External CSS Files -->
  <link rel="stylesheet" href="css/themes.css">
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/cards.css">
  <link rel="stylesheet" href="css/modals.css">
  <link rel="stylesheet" href="css/hud.css">
  <link rel="stylesheet" href="css/animations.css">
  
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- HTML content only (~120 lines) -->
  ...
  
  <!-- External JavaScript -->
  <script src="src/game.js"></script>
  <script src="src/ui.js"></script>
  <script>
    // Minimal initialization only
    document.addEventListener('DOMContentLoaded', () => {
      initUI();
    });
  </script>
</body>
</html>
```

## Coding Best Practices

### CSS Organization

1. **File Order**: Import CSS in dependency order:
   - themes.css (variables first)
   - main.css (base styles)
   - Component-specific files
   - animations.css (last)

2. **Naming Conventions**:
   - Use kebab-case for classes (`.game-board`)
   - Use BEM for complex components (`.modal__header`, `.button--primary`)
   - Prefix animations with purpose (`hint`, `combo`, `modal`)

3. **Comments**:
   - Section headers for logical groupings
   - Explain non-obvious values or calculations
   - Document browser-specific workarounds

### JavaScript Organization

1. **Module Pattern**:
   - Use ES6 modules (export/import)
   - Keep game.js for pure logic
   - Keep ui.js for DOM manipulation
   - Minimize global scope pollution

2. **Separation of Concerns**:
   - **game.js**: Game state, rules, scoring
   - **ui.js**: DOM updates, event handling, animations

3. **Function Naming**:
   - Verbs for actions (`updateScore`, `showModal`)
   - Nouns for getters (`getGameState`)
   - Event handlers prefixed with `handle` or `on`

### Git Workflow

1. **Commit Strategy**:
   - One logical change per commit
   - Descriptive commit messages
   - Reference issues/features when applicable

2. **Testing**:
   - Run `npm test` before every commit
   - Add tests for new features
   - Maintain 100% pass rate

## Future Enhancements

### Possible Additions

1. **Build Process**:
   - CSS/JS minification for production
   - Asset bundling (Webpack/Vite)
   - Auto-prefixing for older browsers

2. **Code Quality Tools**:
   - ESLint for JavaScript
   - Stylelint for CSS
   - Prettier for formatting

3. **Performance**:
   - Lazy-load non-critical CSS
   - Code splitting for larger features
   - Service Worker for offline play

4. **Progressive Enhancement**:
   - Separate critical CSS (inline in `<head>`)
   - Defer non-critical resources
   - Optimize font loading

## Migration Notes

### Refactoring Checklist

When completing the refactoring:

- [ ] Extract all CSS to separate files
- [ ] Create ui.js module
- [ ] Update index.html to reference external files
- [ ] Verify all 56 tests still pass
- [ ] Test in multiple browsers
- [ ] Check mobile responsiveness
- [ ] Verify theme toggle works
- [ ] Test all game modes (Classic, Timed, Blitz)
- [ ] Validate accessibility features
- [ ] Update README.md with new structure

### Testing After Refactor

```bash
# Run all tests
npm test

# Manual testing checklist
# ✓ Title screen displays
# ✓ Mode selection works
# ✓ Time selection (Timed mode)
# ✓ Difficulty selection (Classic/Timed)
# ✓ Blitz mode starts immediately
# ✓ Cards flip correctly
# ✓ Pair hints appear (Blitz mode)
# ✓ Scoring and combos work
# ✓ Timer counts down
# ✓ Result screen animations
# ✓ Theme toggle switches correctly
# ✓ Mobile responsive layout
```

## Maintenance Guidelines

### Adding New Features

1. **New Game Mode**:
   - Add logic to `game.js`
   - Add UI elements to appropriate modal
   - Style in `modals.css`
   - Add animations to `animations.css`
   - Create tests in `tests/`

2. **New Card Effect**:
   - Add hint class to `cards.css`
   - Create animation in `animations.css`
   - Implement logic in `game.js`

3. **New Screen**:
   - Add HTML to `index.html`
   - Style in `modals.css`
   - Wire up in `ui.js`
   - Add transitions/animations

### Code Review Checklist

- [ ] Follows file organization structure
- [ ] CSS in appropriate file
- [ ] JavaScript in correct module
- [ ] No inline styles or scripts
- [ ] Consistent naming conventions
- [ ] Comments for complex logic
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No console errors
- [ ] Works in mobile viewport

## Summary

This architecture provides:

✅ **Separation of Concerns**: CSS, HTML, JS in separate files  
✅ **Maintainability**: Easy to find and modify specific features  
✅ **Performance**: Browser can cache static assets  
✅ **Scalability**: Clear structure for adding features  
✅ **Readability**: Smaller, focused files  
✅ **Testability**: Clean module boundaries  

The refactoring can be done incrementally - extract files one at a time, test after each step, and maintain backward compatibility throughout.
