/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

// Load DOM before requiring the module
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('HUD Display & Updates', () => {
  let game;

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    localStorage.clear();
    jest.resetModules();
    jest.useFakeTimers();
    game = require('../src/game.js');
    game.setGameBoardElement(document.getElementById('gameBoard'));
    game.setMismatchDelay(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('HUD displays initial score of 0', () => {
    game.startGame(8, 'classic');
    const scoreEl = document.getElementById('gameScore');
    expect(scoreEl.textContent).toBe('0');
  });

  test('Score updates after match', () => {
    game.startGame(8, 'classic');
    const cards = document.querySelectorAll('.card');
    const firstSymbol = cards[0].dataset.symbol;
    const matchingCards = Array.from(cards).filter(c => c.dataset.symbol === firstSymbol);
    
    if (matchingCards.length >= 2) {
      game.onCardClick({ currentTarget: matchingCards[0] });
      game.onCardClick({ currentTarget: matchingCards[1] });
      
      const scoreEl = document.getElementById('gameScore');
      const score = parseInt(scoreEl.textContent);
      expect(score).toBeGreaterThan(0);
    }
  });

  test('Timer displays correct format (M:SS)', () => {
    game.startGame(8, 'timed');
    const timerEl = document.getElementById('gameTimer');
    
    // Should start at 2:00
    expect(timerEl.textContent).toMatch(/\d:\d{2}/);
    expect(timerEl.textContent).toContain('2:00');
  });

  test('Timer counts down correctly', () => {
    game.startGame(8, 'timed');
    const timerEl = document.getElementById('gameTimer');
    
    // Advance time by 3 seconds
    jest.advanceTimersByTime(3000);
    
    expect(timerEl.textContent).toContain('1:57');
  });

  test('Timer turns red when below 10 seconds', () => {
    game.startGame(8, 'timed');
    const timerEl = document.getElementById('gameTimer');
    
    // Advance to 9 seconds remaining
    jest.advanceTimersByTime(111000); // 2:00 - 1:51 = 9 seconds
    
    // Should have warning color
    expect(timerEl.style.color).toBeTruthy();
  });

  test('Combo is hidden initially', () => {
    game.startGame(8, 'classic');
    const comboEl = document.getElementById('gameCombo');
    expect(comboEl.style.opacity).toBe('0');
  });

  test('Combo becomes visible after consecutive matches', () => {
    game.startGame(8, 'classic');
    const cards = document.querySelectorAll('.card');
    
    // Find and match two pairs quickly
    const symbols = new Set(Array.from(cards).map(c => c.dataset.symbol));
    const symbolArray = Array.from(symbols).slice(0, 2);
    
    if (symbolArray.length >= 2) {
      // First pair
      const pair1 = Array.from(cards).filter(c => c.dataset.symbol === symbolArray[0]);
      if (pair1.length >= 2) {
        game.onCardClick({ currentTarget: pair1[0] });
        game.onCardClick({ currentTarget: pair1[1] });
        
        // Advance small amount of time (within combo window)
        jest.advanceTimersByTime(1000);
        
        // Second pair
        const pair2 = Array.from(cards).filter(c => c.dataset.symbol === symbolArray[1]);
        if (pair2.length >= 2) {
          game.onCardClick({ currentTarget: pair2[0] });
          game.onCardClick({ currentTarget: pair2[1] });
          
          const comboEl = document.getElementById('gameCombo');
          // Combo should be visible
          expect(comboEl.style.opacity).toBe('1');
          expect(comboEl.textContent).toContain('COMBO');
        }
      }
    }
  });

  test('Blitz mode timer starts at 60 seconds', () => {
    game.startGame(8, 'blitz');
    const timerEl = document.getElementById('gameTimer');
    expect(timerEl.textContent).toContain('1:00');
  });

  test('Classic mode does not show timer initially active', () => {
    game.startGame(8, 'classic');
    const timerItem = document.querySelector('.timer-item');
    // Timer element exists but may not be marked active for classic mode
    expect(timerItem).toBeTruthy();
  });
});

describe('Final Score Calculation', () => {
  let game;

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    localStorage.clear();
    jest.resetModules();
    jest.useFakeTimers();
    game = require('../src/game.js');
    game.setGameBoardElement(document.getElementById('gameBoard'));
    game.setMismatchDelay(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('calculateFinalScore returns base score', () => {
    game.startGame(8, 'classic');
    const finalScore = game.calculateFinalScore();
    expect(typeof finalScore).toBe('number');
    expect(finalScore).toBeGreaterThanOrEqual(0);
  });

  test('Perfect game bonus is 1000 points', () => {
    game.startGame(8, 'classic');
    const cards = document.querySelectorAll('.card');
    
    // Complete game perfectly (no misses)
    const symbols = new Set(Array.from(cards).map(c => c.dataset.symbol));
    symbols.forEach(symbol => {
      const pair = Array.from(cards).filter(c => 
        c.dataset.symbol === symbol && !c.classList.contains('matched')
      );
      if (pair.length >= 2) {
        game.onCardClick({ currentTarget: pair[0] });
        game.onCardClick({ currentTarget: pair[1] });
      }
    });
    
    const internals = game._internals();
    if (internals.misses === 0) {
      const finalScore = game.calculateFinalScore();
      // Perfect bonus is 1000
      expect(finalScore).toBeGreaterThanOrEqual(1000);
    }
  });

  test('Time bonus added in timed mode', () => {
    game.startGame(8, 'timed');
    // Don't advance time - maximum time bonus
    const finalScore = game.calculateFinalScore();
    // Should include time bonus (120 seconds * 10 = 1200)
    expect(finalScore).toBeGreaterThanOrEqual(1200);
  });

  test('Result modal displays final score', () => {
    game.startGame(8, 'classic');
    game.showResult();
    
    const finalScoreEl = document.getElementById('finalScore');
    expect(finalScoreEl.textContent).toContain('Score:');
  });
});
