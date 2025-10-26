// Extracted game logic with minimal DOM hooks so it can be imported by tests.
let misses = 0;
let matchesFound = 0;
const masterSymbols = ['🐶','🐱','🦄','🐼','🐵','🐤','🐸','🐙','🍰','🧸','🍓','🌈','🐯','🐻','🦊','🐝'];
let cards = [];
let activeSymbols = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let mismatchTimeout = null; // Track the setTimeout for mismatch delay
let mismatchDelay = 100; // milliseconds; tests use a short delay by default
let gameBoard = null;
let _focusTrapHandler = null;
let _lastFocusedElement = null;

// Game mode and scoring state
let gameMode = 'classic'; // classic, timed, blitz
let score = 0;
let combo = 0;
let maxCombo = 0;
let lastMatchTime = null;
let comboWindow = 3000; // ms to maintain combo
let timerInterval = null;
let timeRemaining = 0;
let gameStartTime = null;
let isPaused = false;
let boardsCompleted = 0; // Track how many full boards completed in timed mode
let currentCardCount = 8; // Track current difficulty level

// Blitz mode: Track discovered cards and pair hint assignments
let discoveredCardElements = new Set(); // Store card DOM elements that have been seen
let pairHintMap = new Map(); // Map symbol to hint class (pair-hint-1, pair-hint-2, etc.)
let nextHintIndex = 1; // Cycle through 5 hint styles

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
  secondCard = null;
  lockBoard = false;
  mismatchTimeout = null;
  
  // Only reset these on initial game start, not board resets
  if (!currentCardCount || currentCardCount !== cardCount) {
    score = 0;
    combo = 0;
    maxCombo = 0;
    boardsCompleted = 0;
    currentCardCount = cardCount;
  }
  
  lastMatchTime = null;
  gameStartTime = gameStartTime || Date.now();
  isPaused = false;
  
  const pairCount = cardCount / 2;
  const shuffledMaster = shuffle([...masterSymbols]);
  activeSymbols = shuffledMaster.slice(0, pairCount);
  cards = shuffle([...activeSymbols, ...activeSymbols]);
  
  // Initialize timer for timed/blitz modes (only on first init)
  if (!timerInterval && gameMode === 'timed') {
    // Use custom duration if provided, otherwise default to 120 seconds
    const duration = window.customTimedDuration || 120;
    timeRemaining = duration;
    startTimer();
  } else if (!timerInterval && gameMode === 'blitz') {
    timeRemaining = 60; // 1 minute for blitz mode
    startTimer();
  }
  
  updateHUD();
  
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

function startGame(cardCount, mode = 'classic', customDuration = null) {
  gameMode = mode;
  boardsCompleted = 0;
  currentCardCount = cardCount;
  score = 0;
  combo = 0;
  maxCombo = 0;
  gameStartTime = null;
  timerInterval = null;
  
  // Blitz mode: Reset discovery tracking
  discoveredCardElements.clear();
  pairHintMap.clear();
  nextHintIndex = 1;
  
  // Store custom duration for timed mode
  if (mode === 'timed' && customDuration) {
    window.customTimedDuration = customDuration;
  }
  
  const startModal = document.getElementById('startModal');
  if (startModal) startModal.style.display = 'none';
  // release focus trap for start modal when game starts
  if (typeof releaseFocus === 'function') {
    try { releaseFocus(startModal); } catch (e) {}
  }
  initGame(cardCount);
}

function onCardClick(e) {
  if (isPaused) return;
  const card = e.currentTarget;
  if (card.classList.contains('flipped')) return;

  // If board is locked (cards flipping back), immediately resolve the mismatch and process this click
  if (lockBoard) {
    // Clear any pending timeout so it doesn't flip cards later
    if (mismatchTimeout) {
      clearTimeout(mismatchTimeout);
      mismatchTimeout = null;
    }
    
    // Flip back the specific mismatched cards (not the new card being clicked)
    if (firstCard && secondCard) {
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      misses++;
      combo = 0;
      updateHUD();
    }
    // Reset state completely
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    
    // Blitz mode: Reapply hints after immediate flip back
    if (gameMode === 'blitz') {
      applyPairHints();
    }
  }

  // NOW flip the new card (after old ones are flipped back)
  card.classList.add('flipped');
  // Update aria label when revealed
  card.setAttribute('aria-label', `Revealed card ${card.dataset.symbol}`);
  
  // Blitz mode: Track this specific card element as discovered
  if (gameMode === 'blitz') {
    if (!discoveredCardElements.has(card)) {
      discoveredCardElements.add(card);
      // Check if both cards of this symbol have now been discovered
      checkAndAssignPairHint(card.dataset.symbol);
    }
  }
  
  // If no first card, this becomes the first card
  if (!firstCard) {
    firstCard = card;
    return;
  }

  // This is the second card
  secondCard = card;

  if (firstCard.dataset.symbol === card.dataset.symbol) {
    firstCard.classList.add('matched');
    card.classList.add('matched');
    // small vibration on match (mobile)
    if (navigator.vibrate) navigator.vibrate(60);
    matchesFound++;
    
    // Calculate combo and score
    const now = Date.now();
    if (lastMatchTime && (now - lastMatchTime) < comboWindow) {
      combo++;
    } else {
      combo = 1;
    }
    maxCombo = Math.max(maxCombo, combo);
    lastMatchTime = now;
    
    // Award points: base + combo multiplier
    const basePoints = 100;
    const comboBonus = combo > 1 ? (combo - 1) * 50 : 0;
    const points = basePoints + comboBonus;
    score += points;
    
    // Show combo if > 1
    if (combo > 1) showComboPopup(combo, points);
    
    updateHUD();
    
    // Blitz mode: Keep pair hints visible on matched cards
    if (gameMode === 'blitz') {
      applyPairHints();
    }
    
    firstCard = null;
    secondCard = null;
    
    // Check if board is complete
    if (matchesFound === activeSymbols.length) {
      // In timed mode, increment boards and reset for another round
      if (gameMode === 'timed') {
        boardsCompleted++;
        // Give a brief moment to see the final match, then reset
        setTimeout(() => {
          if (timeRemaining > 0) {
            resetBoardForNextRound();
          } else {
            stopTimer();
            showResult();
          }
        }, 500);
      } else {
        // Classic and Blitz modes end the game
        stopTimer();
        showResult();
      }
    }
    return;
  }

  lockBoard = true;
  mismatchTimeout = setTimeout(() => {
    if (secondCard) secondCard.classList.remove('flipped');
    if (firstCard) firstCard.classList.remove('flipped');
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    mismatchTimeout = null;
    misses++;
    // Reset combo on mismatch
    combo = 0;
    updateHUD();
    // Blitz mode: Reapply hints after cards flip back
    if (gameMode === 'blitz') {
      applyPairHints();
    }
    // vibration on mismatch
    if (navigator.vibrate) navigator.vibrate([30,20,30]);
  }, mismatchDelay);
}

function confettiEffect(x, y) {
  // no-op in tests
}

// Blitz mode: Check if both cards in a pair have been discovered, assign hint class
function checkAndAssignPairHint(symbol) {
  if (gameMode !== 'blitz' || !gameBoard) return;
  
  // Get both cards with this symbol
  const allCards = Array.from(gameBoard.querySelectorAll('.card'));
  const symbolCards = allCards.filter(c => c.dataset.symbol === symbol);
  
  // Check if BOTH individual card elements have been discovered
  const bothSeen = symbolCards.length === 2 && 
                   symbolCards.every(c => discoveredCardElements.has(c));
  
  if (bothSeen && !pairHintMap.has(symbol)) {
    // Assign a hint class (cycle through 5 styles)
    const hintClass = `pair-hint-${nextHintIndex}`;
    pairHintMap.set(symbol, hintClass);
    nextHintIndex = (nextHintIndex % 5) + 1; // Cycle 1-5
    
    // Apply hint class to both cards of this pair
    applyPairHints();
  }
}

// Blitz mode: Apply hint classes to all discovered but unmatched pairs
function applyPairHints() {
  if (gameMode !== 'blitz' || !gameBoard) return;
  
  const allCards = Array.from(gameBoard.querySelectorAll('.card'));
  
  allCards.forEach(card => {
    const symbol = card.dataset.symbol;
    const hintClass = pairHintMap.get(symbol);
    
    // Remove all existing hint classes first
    for (let i = 1; i <= 5; i++) {
      card.classList.remove(`pair-hint-${i}`);
    }
    
    // Apply hint class if this symbol has a hint assigned (meaning both cards discovered)
    // Keep the hint even if matched (to keep board exciting)
    if (hintClass) {
      card.classList.add(hintClass);
    }
  });
}

function resetBoardForNextRound() {
  // Clear the board visually
  if (gameBoard) {
    gameBoard.innerHTML = '';
  }
  
  // Reset game state for new board but keep score, combo, and timer
  misses = 0;
  matchesFound = 0;
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  
  // Generate new random pairs
  const pairCount = currentCardCount / 2;
  const shuffledMaster = shuffle([...masterSymbols]);
  activeSymbols = shuffledMaster.slice(0, pairCount);
  cards = shuffle([...activeSymbols, ...activeSymbols]);
  
  // Render new board with same structure as initGame
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
  
  updateHUD();
}

// Timer system
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isPaused) return;
    timeRemaining--;
    updateHUD();
    if (timeRemaining <= 0) {
      stopTimer();
      showResult();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function pauseGame() {
  isPaused = true;
}

function resumeGame() {
  isPaused = false;
}

// HUD updates
function updateHUD() {
  const scoreEl = document.getElementById('gameScore');
  const timerEl = document.getElementById('gameTimer');
  const comboEl = document.getElementById('gameCombo');
  
  if (scoreEl) scoreEl.textContent = score.toString();
  
  if (timerEl && (gameMode === 'timed' || gameMode === 'blitz')) {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    // Warning color when low on time
    if (timeRemaining <= 10) {
      timerEl.style.color = 'var(--accent)';
    }
  }
  
  if (comboEl) {
    if (combo > 1) {
      comboEl.textContent = `×${combo} COMBO!`;
      comboEl.style.opacity = '1';
    } else {
      comboEl.style.opacity = '0';
    }
  }
}

// Show combo popup animation
function showComboPopup(comboCount, points) {
  if (typeof document === 'undefined') return;
  const popup = document.createElement('div');
  popup.className = 'combo-popup';
  popup.textContent = `×${comboCount} +${points}`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1000);
}

// Calculate final score with bonuses
function calculateFinalScore() {
  let finalScore = score;
  
  // Board completion bonus for timed mode
  if (gameMode === 'timed') {
    const boardBonus = boardsCompleted * 500; // 500 points per completed board
    finalScore += boardBonus;
  }
  
  // Time bonus for timed/blitz modes
  if ((gameMode === 'timed' || gameMode === 'blitz') && timeRemaining > 0) {
    const timeBonus = timeRemaining * 10;
    finalScore += timeBonus;
  }
  
  // Perfect game bonus (no misses) - only for classic/blitz
  if (gameMode !== 'timed' && misses === 0) {
    finalScore += 1000;
  }
  
  // Max combo bonus
  if (maxCombo >= 3) {
    finalScore += maxCombo * 100;
  }
  
  return finalScore;
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
  return { 
    misses, 
    matchesFound, 
    activeSymbols, 
    boardsCompleted, 
    gameMode, 
    score, 
    combo, 
    maxCombo,
    discoveredCardElements,
    pairHintMap,
    nextHintIndex
  };
}

function restartGame() {
  const modal = document.getElementById('resultModal');
  // release focus trap if active
  if (modal) releaseFocus(modal);
  if (modal) modal.classList.remove('show');
  const confettiContainer = document.getElementById('confetti-container');
  if (confettiContainer) confettiContainer.innerHTML = '';
  
  // Hide HUD
  const hud = document.getElementById('gameHUD');
  if (hud) hud.classList.remove('active');
  
  // Remove blitz-mode class from game board
  const gameBoard = document.getElementById('gameBoard');
  if (gameBoard) gameBoard.classList.remove('blitz-mode');
  
  // Return to title screen instead of start modal
  const titleScreen = document.getElementById('titleScreen');
  if (titleScreen) titleScreen.style.display = 'flex';
  
  const starContainer = document.getElementById('starResult');
  if (starContainer) starContainer.innerHTML = '';
  const titleEl = document.getElementById('resultTitle');
  if (titleEl) titleEl.textContent = 'Game Over!';
  const announcer = document.getElementById('sr-announcer');
  if (announcer) announcer.textContent = '';
  
  // Reset game state
  stopTimer();
  gameMode = 'classic';
  score = 0;
  combo = 0;
  maxCombo = 0;
  boardsCompleted = 0;
  currentCardCount = 8;
  timeRemaining = 0;
  
  // Blitz mode: Reset discovery tracking
  discoveredCardElements.clear();
  pairHintMap.clear();
  nextHintIndex = 1;
  
  updateHUD();
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
  // Calculate final score with bonuses
  const finalScore = calculateFinalScore();
  
  // Calculate game duration
  const gameEndTime = Date.now();
  const timeElapsed = gameStartTime ? (gameEndTime - gameStartTime) / 1000 : 0;
  
  // Record game completion for progression system (if available in browser)
  if (typeof window !== 'undefined' && window.playerState) {
    const gameData = {
      mode: gameMode,
      difficulty: currentCardCount === 8 ? 'easy' : (currentCardCount === 12 ? 'medium' : 'hard'),
      score: finalScore,
      mistakes: misses,
      timeElapsed: timeElapsed,
      timeRemaining: timeRemaining,
      maxCombo: maxCombo,
      matches: matchesFound,
      boardsCompleted: boardsCompleted
    };
    
    const progressResult = window.playerState.recordGame(gameData);
    
    // Show achievement notifications
    if (progressResult.newAchievements && progressResult.newAchievements.length > 0) {
      progressResult.newAchievements.forEach((achievement, index) => {
        setTimeout(() => {
          if (typeof window.showAchievementNotification === 'function') {
            window.showAchievementNotification(achievement);
          }
        }, index * 500); // Stagger notifications
      });
    }
    
    // Show level up notification
    if (progressResult.leveledUp && typeof window.showLevelUpNotification === 'function') {
      setTimeout(() => {
        window.showLevelUpNotification(progressResult.level);
      }, progressResult.newAchievements.length * 500 + 500);
    }
  }
  
  // Determine star rating based on performance
  let stars;
  if (gameMode === 'timed') {
    // Stars based on boards completed
    if (boardsCompleted >= 5) stars = 3;
    else if (boardsCompleted >= 3) stars = 2;
    else stars = 1;
  } else {
    // Stars based on misses for classic/blitz
    stars = getStarRating(misses);
  }

  // Map star count to title
  let title = 'Nice!';
  if (stars === 3) title = 'AMAZING!';
  else if (stars === 2) title = 'Great!';

  const modal = document.getElementById('resultModal');
  const titleEl = document.getElementById('resultTitle');
  const scoreEl = document.getElementById('finalScore');
  const starContainer = document.getElementById('starResult');
  
  // Check if we're in a test environment
  const isTest = typeof jest !== 'undefined' || typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  
  // Get the play again button
  const playAgainBtn = document.getElementById('playAgainBtn');
  
  if (isTest) {
    // Instant display for tests
    if (titleEl) titleEl.textContent = title;
    
    if (scoreEl) {
      scoreEl.textContent = `Score: ${finalScore}`;
      if (gameMode === 'timed') {
        scoreEl.textContent += ` | Boards: ${boardsCompleted}`;
      }
      if (maxCombo > 1) {
        scoreEl.textContent += ` | Max Combo: ×${maxCombo}`;
      }
    }
    
    if (starContainer) {
      starContainer.innerHTML = '';
      for (let i = 0; i < stars; i++) {
        const star = document.createElement('span');
        star.classList.add('star');
        star.textContent = '★';
        star.classList.add('stamp');
        starContainer.appendChild(star);
      }
    }
    
    if (playAgainBtn) playAgainBtn.style.display = 'block';
    if (modal) modal.classList.add('show');
    if (modal) trapFocus(modal);
    return;
  }
  
  // Animated display for browser
  // Hide play again button initially
  if (playAgainBtn) {
    playAgainBtn.style.opacity = '0';
    playAgainBtn.style.transform = 'scale(0.8)';
    playAgainBtn.style.pointerEvents = 'none';
  }
  
  // Show modal first but hide all content
  if (modal) {
    modal.classList.add('show');
    modal.style.pointerEvents = 'none'; // Disable clicking initially
  }
  
  // Reset and hide all animated elements
  if (titleEl) {
    titleEl.textContent = title;
    titleEl.style.opacity = '0';
    titleEl.style.transform = 'scale(0.5)';
  }
  
  if (scoreEl) {
    scoreEl.style.opacity = '0';
    scoreEl.style.transform = 'translateY(20px)';
  }
  
  if (starContainer) {
    starContainer.innerHTML = '';
    starContainer.style.opacity = '0';
  }
  
  // Staggered animation sequence
  // 1. Title appears (500ms delay)
  setTimeout(() => {
    if (titleEl) {
      titleEl.style.transition = 'opacity 400ms ease, transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      titleEl.style.opacity = '1';
      titleEl.style.transform = 'scale(1)';
    }
  }, 500);
  
  // 2. Stars appear one by one (starting at 1000ms)
  setTimeout(() => {
    if (starContainer) {
      starContainer.style.transition = 'opacity 300ms ease';
      starContainer.style.opacity = '1';
      
      // Add star icons and stagger their entrance
      for (let i = 0; i < stars; i++) {
        const star = document.createElement('span');
        star.classList.add('star');
        star.textContent = '★';
        star.style.opacity = '0';
        star.style.transform = 'scale(0) rotate(-180deg)';
        starContainer.appendChild(star);
        
        // Animate each star
        setTimeout(() => {
          star.style.transition = 'opacity 300ms ease, transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)';
          star.style.opacity = '1';
          star.style.transform = 'scale(1) rotate(0deg)';
          star.classList.add('stamp');
        }, i * 300);
      }
    }
  }, 1000);
  
  // 3. Score info appears (after stars, ~2200ms)
  const scoreDelay = 1000 + (stars * 300) + 200;
  setTimeout(() => {
    if (scoreEl) {
      scoreEl.textContent = `Score: ${finalScore}`;
      if (gameMode === 'timed') {
        scoreEl.textContent += ` | Boards: ${boardsCompleted}`;
      }
      if (maxCombo > 1) {
        scoreEl.textContent += ` | Max Combo: ×${maxCombo}`;
      }
      scoreEl.style.transition = 'opacity 400ms ease, transform 400ms ease';
      scoreEl.style.opacity = '1';
      scoreEl.style.transform = 'translateY(0)';
    }
  }, scoreDelay);
  
  // 4. Enable clicking after all animations complete
  const enableClickDelay = scoreDelay + 600;
  setTimeout(() => {
    if (modal) {
      modal.style.pointerEvents = 'auto';
    }
    // Show and animate play again button
    if (playAgainBtn) {
      playAgainBtn.style.transition = 'opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      playAgainBtn.style.opacity = '1';
      playAgainBtn.style.transform = 'scale(1)';
      playAgainBtn.style.pointerEvents = 'auto';
    }
  }, enableClickDelay);
  
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
    // game modes & scoring
    startTimer,
    stopTimer,
    pauseGame,
    resumeGame,
    updateHUD,
    calculateFinalScore,
    resetBoardForNextRound,
    // Blitz mode pair hints
    checkAndAssignPairHint,
    applyPairHints,
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
  // game modes & scoring
  window.startTimer = startTimer;
  window.stopTimer = stopTimer;
  window.pauseGame = pauseGame;
  window.resumeGame = resumeGame;
  window.updateHUD = updateHUD;
  window.calculateFinalScore = calculateFinalScore;
  window.resetBoardForNextRound = resetBoardForNextRound;
  // Blitz mode pair hints
  window.checkAndAssignPairHint = checkAndAssignPairHint;
  window.applyPairHints = applyPairHints;
  window.restartGame = restartGame;
  window.setMismatchDelay = setMismatchDelay;
  window.getStarRating = getStarRating;
  window._gameInternals = _internals;
}
