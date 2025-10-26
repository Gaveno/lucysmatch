// Extracted game logic with minimal DOM hooks so it can be imported by tests.
let misses = 0;
let matchesFound = 0;
const masterSymbols = ['🐶','🐱','🦄','🐼','🐵','🐤','🐸','🐙','🍰','🧸','🍓','🌈','🐯','🐻','🦊','🐝'];
let cards = [];
let activeSymbols = [];
let firstCard = null;
let lockBoard = false;
let mismatchDelay = 100; // milliseconds; tests use a short delay by default
let gameBoard = null;
let _focusTrapHandler = null;
let _lastFocusedElement = null;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function setGameBoardElement(el) {
  gameBoard = el;
}

function initGame(cardCount) {
  misses = 0;
  matchesFound = 0;
  firstCard = null;
  lockBoard = false;
  const pairCount = cardCount / 2;
  const shuffledMaster = shuffle([...masterSymbols]);
  activeSymbols = shuffledMaster.slice(0, pairCount);
  cards = shuffle([...activeSymbols, ...activeSymbols]);
  if (!gameBoard) return;
  gameBoard.innerHTML = '';
  cards.forEach(symbol => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">${symbol}</div>
        <div class="card-back"></div>
      </div>
    `;
    card.dataset.symbol = symbol;
    // Accessibility: make cards focusable and announceable
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Hidden card');
    // Keyboard support
    card.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        onCardClick({ currentTarget: card });
      }
    });
    card.addEventListener('click', onCardClick);
    gameBoard.appendChild(card);
  });
}

function startGame(cardCount) {
  const startModal = document.getElementById('startModal');
  if (startModal) startModal.style.display = 'none';
  // release focus trap for start modal when game starts
  if (typeof releaseFocus === 'function') {
    try { releaseFocus(startModal); } catch (e) {}
  }
  initGame(cardCount);
}

function onCardClick(e) {
  if (lockBoard) return;
  const card = e.currentTarget;
  if (card.classList.contains('flipped')) return;

  card.classList.add('flipped');
  // Update aria label when revealed
  card.setAttribute('aria-label', `Revealed card ${card.dataset.symbol}`);
  if (!firstCard) {
    firstCard = card;
    return;
  }

  if (firstCard.dataset.symbol === card.dataset.symbol) {
    firstCard.classList.add('matched');
    card.classList.add('matched');
    // small vibration on match (mobile)
    if (navigator.vibrate) navigator.vibrate(60);
    matchesFound++;
    firstCard = null;
    if (matchesFound === activeSymbols.length) {
      showResult();
    }
    return;
  }

  lockBoard = true;
  setTimeout(() => {
    card.classList.remove('flipped');
    firstCard.classList.remove('flipped');
    firstCard = null;
    lockBoard = false;
    misses++;
    // vibration on mismatch
    if (navigator.vibrate) navigator.vibrate([30,20,30]);
  }, mismatchDelay);
}

function confettiEffect(x, y) {
  // no-op in tests
}

function trapFocus(modal) {
  if (!modal) return;
  _lastFocusedElement = document.activeElement;
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const nodes = Array.from(modal.querySelectorAll(selector)).filter(n => !n.hasAttribute('disabled'));
  const focusables = nodes.length ? nodes : [modal];

  // focus first
  try { focusables[0].focus(); } catch (e) {}

  function handleKey(e) {
    if (e.key === 'Tab') {
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    } else if (e.key === 'Escape') {
      // Close modal on Escape
      if (modal.id === 'resultModal') restartGame();
      else if (modal.id === 'startModal') restartGame();
    }
  }

  _focusTrapHandler = handleKey;
  document.addEventListener('keydown', handleKey);
  modal.setAttribute('aria-hidden', 'false');
}

function releaseFocus(modal) {
  if (_focusTrapHandler) {
    document.removeEventListener('keydown', _focusTrapHandler);
    _focusTrapHandler = null;
  }
  if (modal) modal.setAttribute('aria-hidden', 'true');
  if (_lastFocusedElement && _lastFocusedElement.focus) {
    try { _lastFocusedElement.focus(); } catch (e) {}
  }
}

function _internals() {
  return { misses, matchesFound, activeSymbols };
}

function restartGame() {
  const modal = document.getElementById('resultModal');
  // release focus trap if active
  if (modal) releaseFocus(modal);
  if (modal) modal.classList.remove('show');
  const confettiContainer = document.getElementById('confetti-container');
  if (confettiContainer) confettiContainer.innerHTML = '';
  const startModal = document.getElementById('startModal');
  if (startModal) startModal.style.display = 'flex';
  // trap focus inside start modal so keyboard users can pick a difficulty
  if (startModal) trapFocus(startModal);
  const starContainer = document.getElementById('starResult');
  if (starContainer) starContainer.innerHTML = '';
  const titleEl = document.getElementById('resultTitle');
  if (titleEl) titleEl.textContent = 'Game Over!';
  const announcer = document.getElementById('sr-announcer');
  if (announcer) announcer.textContent = '';
}

function setMismatchDelay(ms) {
  mismatchDelay = ms;
}

function getStarRating(missCount) {
  let stars = 1;
  if (missCount <= 6) stars = 3;
  else if (missCount <= 10) stars = 2;
  return stars;
}

// --- Theme system (animated, persisted) ---
function applyTheme(theme) {
  if (typeof document === 'undefined' || !document.body) return;
  document.body.setAttribute('data-theme', theme);
  // also set inline CSS variables so tests can assert visual token values
  const tokens = theme === 'dark' ? {
    '--bg-start': '#0f1724',
    '--bg-end': '#071124',
    '--accent': '#7dd3fc',
    '--text': '#e6eef8',
    '--text-secondary': '#b0c4de',
    '--card-front-start': '#1f3a52',
    '--card-front-end': '#183247',
    '--card-back-start': '#223b44',
    '--card-back-end': '#183036',
    '--modal-bg-start': '#1a2332',
    '--modal-bg-end': '#0f1724',
    '--button-bg-start': '#2a3f5f',
    '--button-bg-end': '#1e2f47'
  } : {
    '--bg-start': '#fffaf0',
    '--bg-end': '#fef6f7',
    '--accent': '#ff6b81',
    '--text': '#4a2b3b',
    '--text-secondary': '#6b5563',
    '--card-front-start': '#b7f0e6',
    '--card-front-end': '#a3d2ca',
    '--card-back-start': '#ffd6e0',
    '--card-back-end': '#ffb6b9',
    '--modal-bg-start': '#ffffff',
    '--modal-bg-end': '#fff6f9',
    '--button-bg-start': '#ffd6e0',
    '--button-bg-end': '#ffb6b9'
  };
  Object.keys(tokens).forEach(k => document.body.style.setProperty(k, tokens[k]));
  // animate transition: toggle a class that triggers a subtle gradient shift
  document.body.classList.add('theme-animate');
  setTimeout(() => document.body.classList.remove('theme-animate'), 900);
  try { localStorage.setItem('lm_theme', theme); } catch (e) {}
}

function getTheme() {
  try { return localStorage.getItem('lm_theme') || 'system'; } catch (e) { return 'system'; }
}

function setTheme(theme) {
  // Accept 'system' which means follow OS preference
  if (theme === 'system') {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
    try { localStorage.setItem('lm_theme', 'system'); } catch (e) {}
    return;
  }
  applyTheme(theme);
  announceTheme(theme === 'system' ? (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme);
}

function toggleTheme() {
  // Cycle through light -> dark -> system
  const current = getTheme();
  let next;
  if (current === 'light') next = 'dark';
  else if (current === 'dark') next = 'system';
  else next = 'light';
  setTheme(next);
  return next;
}

function initTheme() {
  // Respect stored preference (including 'system'), else system pref
  try {
    const stored = localStorage.getItem('lm_theme');
    if (stored) {
      if (stored === 'system') {
        const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
      } else {
        applyTheme(stored);
      }
      return stored;
    }
  } catch (e) {}
  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = prefersDark ? 'dark' : 'light';
  applyTheme(theme);
  return theme;
}

// Announce theme changes to screen readers
function announceTheme(theme) {
  if (typeof document === 'undefined') return;
  const announcer = document.getElementById('sr-announcer');
  if (announcer) announcer.textContent = `Theme changed to ${theme}`;
}

function showResult() {
  // Determine star rating based on misses
  const stars = getStarRating(misses);

  // Map star count to title
  let title = 'Nice!';
  if (stars === 3) title = 'AMAZING!';
  else if (stars === 2) title = 'Great!';

  const titleEl = document.getElementById('resultTitle');
  if (titleEl) titleEl.textContent = title;

  const starContainer = document.getElementById('starResult');
  if (starContainer) {
    starContainer.innerHTML = '';
    // Add star icons immediately, then stagger a stamp-like entrance for each
    for (let i = 0; i < stars; i++) {
      const star = document.createElement('span');
      star.classList.add('star');
      star.textContent = '★';
      starContainer.appendChild(star);
      // apply stamp class slightly staggered to create sequential entrance
      (function(s, delay){
        setTimeout(() => { s.classList.add('stamp'); }, delay);
      })(star, i * 220);
    }
  }

  const modal = document.getElementById('resultModal');
  if (modal) modal.classList.add('show');
  // trap focus inside the result modal for accessibility
  if (modal) trapFocus(modal);
}

// Export for Node (tests). Guard so the file can also be loaded directly in a browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setGameBoardElement,
    initGame,
    startGame,
    onCardClick,
    confettiEffect,
    showResult,
    trapFocus,
    releaseFocus,
    // theme API
    setTheme,
    toggleTheme,
    getTheme,
    initTheme,
    // expose internals for assertions
    _internals,
    restartGame,
    setMismatchDelay,
    getStarRating,
  };
}

// If running in a browser, expose API to window for index.html to call
if (typeof window !== 'undefined') {
  window.setGameBoardElement = setGameBoardElement;
  window.initGame = initGame;
  window.startGame = startGame;
  window.onCardClick = onCardClick;
  window.confettiEffect = confettiEffect;
  window.showResult = showResult;
  window.trapFocus = trapFocus;
  window.releaseFocus = releaseFocus;
  // theme API
  window.setTheme = setTheme;
  window.toggleTheme = toggleTheme;
  window.getTheme = getTheme;
  window.initTheme = initTheme;
  window.restartGame = restartGame;
  window.setMismatchDelay = setMismatchDelay;
  window.getStarRating = getStarRating;
  window._gameInternals = _internals;
}
