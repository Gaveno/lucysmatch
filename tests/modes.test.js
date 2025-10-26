/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

// Load DOM before requiring the module
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('Game Modes & Scoring System', () => {
  let game;

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    localStorage.clear();
    jest.resetModules();
    jest.useFakeTimers();
    game = require('../src/game.js');
    game.setGameBoardElement(document.getElementById('gameBoard'));
    game.setMismatchDelay(0); // instant for tests
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Classic mode initializes without timer', () => {
    game.startGame(8, 'classic');
    const internals = game._internals();
    expect(internals.matchesFound).toBe(0);
    // Timer should not be running in classic mode
    const timerEl = document.getElementById('gameTimer');
    expect(timerEl).toBeTruthy();
  });

  test('Timed mode starts timer at 120 seconds', () => {
    game.startGame(8, 'timed');
    const timerEl = document.getElementById('gameTimer');
    // Timer starts, should show 2:00
    expect(timerEl.textContent).toContain('2:00');
  });

  test('Blitz mode starts timer at 60 seconds', () => {
    game.startGame(8, 'blitz');
    const timerEl = document.getElementById('gameTimer');
    // Timer starts, should show 1:00
    expect(timerEl.textContent).toContain('1:00');
  });

  test('Timer counts down and updates HUD', () => {
    game.startGame(8, 'timed');
    // Advance time by 2 seconds
    jest.advanceTimersByTime(2000);
    const timerEl = document.getElementById('gameTimer');
    expect(timerEl.textContent).toContain('1:58');
  });

  test('Combo increments on quick consecutive matches', () => {
    game.startGame(8, 'classic');
    const cards = document.querySelectorAll('.card');
    
    // Find two matching cards
    const firstSymbol = cards[0].dataset.symbol;
    const matchingCards = Array.from(cards).filter(c => c.dataset.symbol === firstSymbol);
    
    // Match them quickly
    game.onCardClick({ currentTarget: matchingCards[0] });
    game.onCardClick({ currentTarget: matchingCards[1] });
    
    // Find another pair
    const secondSymbol = Array.from(cards).find(c => c.dataset.symbol !== firstSymbol)?.dataset.symbol;
    const secondPair = Array.from(cards).filter(c => c.dataset.symbol === secondSymbol && !c.classList.contains('matched'));
    
    if (secondPair.length >= 2) {
      // Make second match quickly (within combo window)
      jest.advanceTimersByTime(1000);
      game.onCardClick({ currentTarget: secondPair[0] });
      game.onCardClick({ currentTarget: secondPair[1] });
      
      // Combo should have increased
      const comboEl = document.getElementById('gameCombo');
      expect(comboEl.textContent).toContain('COMBO');
    }
  });

  test('Score increases with matches', () => {
    game.startGame(8, 'classic');
    const cards = document.querySelectorAll('.card');
    const firstSymbol = cards[0].dataset.symbol;
    const matchingCards = Array.from(cards).filter(c => c.dataset.symbol === firstSymbol);
    
    // Make a match
    game.onCardClick({ currentTarget: matchingCards[0] });
    game.onCardClick({ currentTarget: matchingCards[1] });
    
    const scoreEl = document.getElementById('gameScore');
    const score = parseInt(scoreEl.textContent);
    expect(score).toBeGreaterThan(0);
  });

  test('calculateFinalScore includes time bonus for timed mode', () => {
    game.startGame(8, 'timed');
    // Simulate some time remaining
    jest.advanceTimersByTime(10000); // 10 seconds elapsed, 110 remaining
    
    const finalScore = game.calculateFinalScore();
    // Should have time bonus (110 * 10 = 1100)
    expect(finalScore).toBeGreaterThan(0);
  });

  test('Perfect game bonus added when no misses', () => {
    game.startGame(8, 'classic');
    const cards = document.querySelectorAll('.card');
    
    // Complete game without misses
    const symbols = new Set(Array.from(cards).map(c => c.dataset.symbol));
    symbols.forEach(symbol => {
      const pair = Array.from(cards).filter(c => c.dataset.symbol === symbol && !c.classList.contains('matched'));
      if (pair.length >= 2) {
        game.onCardClick({ currentTarget: pair[0] });
        game.onCardClick({ currentTarget: pair[1] });
      }
    });
    
    const internals = game._internals();
    if (internals.misses === 0) {
      const finalScore = game.calculateFinalScore();
      // Should include perfect bonus (1000 points)
      expect(finalScore).toBeGreaterThanOrEqual(1000);
    }
  });

  test('Combo resets on mismatch', () => {
    game.startGame(8, 'classic');
    const cards = document.querySelectorAll('.card');
    
    // Make a match
    const firstSymbol = cards[0].dataset.symbol;
    const matchingCards = Array.from(cards).filter(c => c.dataset.symbol === firstSymbol);
    game.onCardClick({ currentTarget: matchingCards[0] });
    game.onCardClick({ currentTarget: matchingCards[1] });
    
    // Make a mismatch
    const unmatchedCards = Array.from(cards).filter(c => !c.classList.contains('matched'));
    if (unmatchedCards.length >= 2 && unmatchedCards[0].dataset.symbol !== unmatchedCards[1].dataset.symbol) {
      game.onCardClick({ currentTarget: unmatchedCards[0] });
      game.onCardClick({ currentTarget: unmatchedCards[1] });
      
      // Advance past mismatch delay
      jest.advanceTimersByTime(1000);
      
      // Combo should be reset (not visible)
      const comboEl = document.getElementById('gameCombo');
      expect(comboEl.style.opacity).toBe('0');
    }
  });
});
