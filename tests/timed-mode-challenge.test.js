/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

// Load DOM before requiring the module
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('Timed Mode - Continuous Challenge', () => {
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

  test('Timed mode resets board after completing all matches', (done) => {
    game.startGame(8, 'timed');
    const initialCards = document.querySelectorAll('.card');
    expect(initialCards.length).toBe(8);

    // Complete all matches
    const symbols = new Set(Array.from(initialCards).map(c => c.dataset.symbol));
    symbols.forEach(symbol => {
      const pair = Array.from(document.querySelectorAll('.card')).filter(c => 
        c.dataset.symbol === symbol && !c.classList.contains('matched')
      );
      if (pair.length >= 2) {
        game.onCardClick({ currentTarget: pair[0] });
        game.onCardClick({ currentTarget: pair[1] });
      }
    });

    // Advance timers to allow board reset
    jest.advanceTimersByTime(600);

    // Should have new board with 8 cards
    setTimeout(() => {
      const newCards = document.querySelectorAll('.card');
      expect(newCards.length).toBe(8);
      
      // Boards completed should be 1
      const internals = game._internals();
      expect(internals.boardsCompleted).toBe(1);
      done();
    }, 100);

    jest.advanceTimersByTime(100);
  });

  test('Boards completed counter increments with each completion', () => {
    game.startGame(8, 'timed');
    
    // Complete first board
    const completeBoard = () => {
      const cards = document.querySelectorAll('.card:not(.matched)');
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
      jest.advanceTimersByTime(600);
    };

    completeBoard();
    let internals = game._internals();
    expect(internals.boardsCompleted).toBe(1);

    // Complete second board
    completeBoard();
    internals = game._internals();
    expect(internals.boardsCompleted).toBe(2);
  });

  test('Timed mode gives board completion bonus to score', () => {
    game.startGame(8, 'timed');
    
    // Complete one board
    const cards = document.querySelectorAll('.card');
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
    
    jest.advanceTimersByTime(600);
    
    const internals = game._internals();
    expect(internals.boardsCompleted).toBe(1);
    
    // Calculate final score - should include 500 point board bonus
    const finalScore = game.calculateFinalScore();
    expect(finalScore).toBeGreaterThanOrEqual(500);
  });

  test('Star rating based on boards completed in timed mode', () => {
    game.startGame(8, 'timed');
    
    // Mock completing 5 boards
    for (let i = 0; i < 5; i++) {
      const cards = document.querySelectorAll('.card:not(.matched)');
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
      jest.advanceTimersByTime(600);
    }
    
    const internals = game._internals();
    expect(internals.boardsCompleted).toBe(5);
    
    // End game and check result
    game.showResult();
    
    const stars = document.querySelectorAll('.star');
    expect(stars.length).toBe(3); // Should get 3 stars for 5+ boards
  });

  test('Game ends when timer reaches zero in timed mode', () => {
    game.startGame(8, 'timed');
    
    // Fast forward to end of time
    jest.advanceTimersByTime(120000); // 2 minutes
    
    // Result modal should be shown
    const modal = document.getElementById('resultModal');
    expect(modal.classList.contains('show')).toBe(true);
  });

  test('Timer continues running across board resets', () => {
    game.startGame(8, 'timed');
    
    // Advance 10 seconds
    jest.advanceTimersByTime(10000);
    
    const timerEl = document.getElementById('gameTimer');
    expect(timerEl.textContent).toContain('1:50');
    
    // Complete board
    const cards = document.querySelectorAll('.card');
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
    
    jest.advanceTimersByTime(600);
    
    // Timer should still be running
    jest.advanceTimersByTime(5000);
    expect(timerEl.textContent).toContain('1:45');
  });

  test('Final score displays boards completed in timed mode', () => {
    game.startGame(8, 'timed');
    
    // Complete 2 boards
    for (let i = 0; i < 2; i++) {
      const cards = document.querySelectorAll('.card:not(.matched)');
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
      jest.advanceTimersByTime(600);
    }
    
    game.showResult();
    
    const scoreEl = document.getElementById('finalScore');
    expect(scoreEl.textContent).toContain('Boards: 2');
  });
});
