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
    card.addEventListener('click', onCardClick);
    gameBoard.appendChild(card);
  });
}

function startGame(cardCount) {
  const startModal = document.getElementById('startModal');
  if (startModal) startModal.style.display = 'none';
  initGame(cardCount);
}

function onCardClick(e) {
  if (lockBoard) return;
  const card = e.currentTarget;
  if (card.classList.contains('flipped')) return;

  card.classList.add('flipped');
  if (!firstCard) {
    firstCard = card;
    return;
  }

  if (firstCard.dataset.symbol === card.dataset.symbol) {
    firstCard.classList.add('matched');
    card.classList.add('matched');
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
  }, mismatchDelay);
}

function confettiEffect(x, y) {
  // no-op in tests
}

function _internals() {
  return { misses, matchesFound, activeSymbols };
}

function restartGame() {
  const modal = document.getElementById('resultModal');
  if (modal) modal.classList.remove('show');
  const confettiContainer = document.getElementById('confetti-container');
  if (confettiContainer) confettiContainer.innerHTML = '';
  const startModal = document.getElementById('startModal');
  if (startModal) startModal.style.display = 'flex';
  const starContainer = document.getElementById('starResult');
  if (starContainer) starContainer.innerHTML = '';
  const titleEl = document.getElementById('resultTitle');
  if (titleEl) titleEl.textContent = 'Game Over!';
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
  window.restartGame = restartGame;
  window.setMismatchDelay = setMismatchDelay;
  window.getStarRating = getStarRating;
  window._gameInternals = _internals;
}
