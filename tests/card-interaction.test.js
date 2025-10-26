/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

// Load DOM before requiring the module
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('Improved Card Click Behavior', () => {
  let game;

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    localStorage.clear();
    jest.resetModules();
    jest.useFakeTimers();
    game = require('../src/game.js');
    game.setGameBoardElement(document.getElementById('gameBoard'));
    game.setMismatchDelay(1000); // Set delay for these tests
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Clicking new card during mismatch delay immediately flips back previous cards', () => {
    game.startGame(8, 'classic');
    const cards = document.querySelectorAll('.card');
    
    // Find two non-matching cards
    let card1, card2, card3;
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].dataset.symbol !== cards[j].dataset.symbol) {
          card1 = cards[i];
          card2 = cards[j];
          // Find a third card different from first two
          card3 = Array.from(cards).find(c => 
            c !== card1 && 
            c !== card2 && 
            !c.classList.contains('matched')
          );
          break;
        }
      }
      if (card1 && card2 && card3) break;
    }
    
    if (card1 && card2 && card3) {
      // Click first card
      game.onCardClick({ currentTarget: card1 });
      expect(card1.classList.contains('flipped')).toBe(true);
      
      // Click second card (mismatch)
      game.onCardClick({ currentTarget: card2 });
      expect(card2.classList.contains('flipped')).toBe(true);
      
      // Don't advance timer yet - cards are still flipped
      expect(card1.classList.contains('flipped')).toBe(true);
      expect(card2.classList.contains('flipped')).toBe(true);
      
      // Click third card BEFORE delay completes
      game.onCardClick({ currentTarget: card3 });
      
      // Previous cards should be immediately flipped back
      expect(card1.classList.contains('flipped')).toBe(false);
      expect(card2.classList.contains('flipped')).toBe(false);
      
      // New card should be flipped
      expect(card3.classList.contains('flipped')).toBe(true);
    }
  });

  test('Rapid clicking increments misses correctly', () => {
    game.startGame(8, 'classic');
    const cards = document.querySelectorAll('.card');
    
    // Find three different non-matching cards
    const differentCards = [];
    const seenSymbols = new Set();
    for (const card of cards) {
      if (!seenSymbols.has(card.dataset.symbol)) {
        differentCards.push(card);
        seenSymbols.add(card.dataset.symbol);
        if (differentCards.length === 3) break;
      }
    }
    
    if (differentCards.length === 3) {
      // Click first card
      game.onCardClick({ currentTarget: differentCards[0] });
      
      // Click second (mismatch)
      game.onCardClick({ currentTarget: differentCards[1] });
      
      // Click third before delay (should count the mismatch and start new pair)
      game.onCardClick({ currentTarget: differentCards[2] });
      
      const internals = game._internals();
      // Should have counted one miss
      expect(internals.misses).toBe(1);
    }
  });

  test('Clicking matched card does nothing', () => {
    game.startGame(8, 'classic');
    const cards = document.querySelectorAll('.card');
    
    // Find a matching pair
    const firstSymbol = cards[0].dataset.symbol;
    const matchingCards = Array.from(cards).filter(c => c.dataset.symbol === firstSymbol);
    
    if (matchingCards.length >= 2) {
      // Make a match
      game.onCardClick({ currentTarget: matchingCards[0] });
      game.onCardClick({ currentTarget: matchingCards[1] });
      
      expect(matchingCards[0].classList.contains('matched')).toBe(true);
      expect(matchingCards[1].classList.contains('matched')).toBe(true);
      
      // Try clicking matched card again
      game.onCardClick({ currentTarget: matchingCards[0] });
      
      // Should still only be flipped once (no change)
      expect(matchingCards[0].classList.contains('matched')).toBe(true);
      expect(matchingCards[0].classList.contains('flipped')).toBe(true);
    }
  });

  test('Paused game ignores card clicks', () => {
    game.startGame(8, 'classic');
    game.pauseGame();
    
    const cards = document.querySelectorAll('.card');
    const firstCard = cards[0];
    
    game.onCardClick({ currentTarget: firstCard });
    
    // Card should not flip when paused
    expect(firstCard.classList.contains('flipped')).toBe(false);
    
    // Resume and try again
    game.resumeGame();
    game.onCardClick({ currentTarget: firstCard });
    
    // Now it should flip
    expect(firstCard.classList.contains('flipped')).toBe(true);
  });
});
