/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('Lucy\'s Match game', () => {
  let game;

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    // require after DOM is set up so getElementById works
    game = require('../src/game');
    const board = document.getElementById('gameBoard');
    game.setGameBoardElement(board);
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('shows result modal after completing easy mode', () => {
    game.initGame(8); // 4 pairs
    const cards = Array.from(document.querySelectorAll('.card'));
    // group cards by symbol
    const bySymbol = {};
    cards.forEach(card => {
      const s = card.dataset.symbol;
      bySymbol[s] = bySymbol[s] || [];
      bySymbol[s].push(card);
    });

    // click matching pairs
    Object.values(bySymbol).forEach(pair => {
      pair[0].click();
      pair[1].click();
    });

    const modal = document.getElementById('resultModal');
    expect(modal.classList.contains('show')).toBe(true);
  });
});
