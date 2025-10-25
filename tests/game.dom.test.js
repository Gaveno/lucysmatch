/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('DOM result modal', () => {
  let game;

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    game = require('../src/game');
    const board = document.getElementById('gameBoard');
    game.setGameBoardElement(board);
    // keep fast tests
    if (typeof game.setMismatchDelay === 'function') game.setMismatchDelay(10);
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('shows title and 3 stars after perfect game', () => {
    game.initGame(8); // 4 pairs
    const cards = Array.from(document.querySelectorAll('.card'));
    const bySymbol = {};
    cards.forEach(card => {
      const s = card.dataset.symbol;
      bySymbol[s] = bySymbol[s] || [];
      bySymbol[s].push(card);
    });

    // click matching pairs perfectly
    Object.values(bySymbol).forEach(pair => {
      pair[0].click();
      pair[1].click();
    });

    const modal = document.getElementById('resultModal');
    expect(modal.classList.contains('show')).toBe(true);

    const title = document.getElementById('resultTitle').textContent;
    expect(title).toBe('AMAZING!');

    const stars = document.querySelectorAll('#starResult .star');
    expect(stars.length).toBe(3);
  });
});
