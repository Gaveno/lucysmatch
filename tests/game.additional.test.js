/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('Additional game tests', () => {
  let game;

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    game = require('../src/game');
    const board = document.getElementById('gameBoard');
    game.setGameBoardElement(board);
    // keep fast tests
    if (typeof game.setMismatchDelay === 'function') game.setMismatchDelay(100);
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('misses increment on mismatch', async () => {
    game.initGame(8);
    const cards = Array.from(document.querySelectorAll('.card'));
    // find two cards that are different symbols
    let a, b;
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].dataset.symbol !== cards[j].dataset.symbol) {
          a = cards[i]; b = cards[j]; break;
        }
      }
      if (a) break;
    }
    expect(a && b).toBeTruthy();
    a.click();
    b.click();
    // wait for mismatchDelay + small buffer
    await new Promise(r => setTimeout(r, 150));
    const internals = game._internals();
    expect(internals.misses).toBeGreaterThanOrEqual(1);
  });

  test('getStarRating returns expected values', () => {
    const { getStarRating } = require('../src/game');
    expect(getStarRating(0)).toBe(3);
    expect(getStarRating(6)).toBe(3);
    expect(getStarRating(7)).toBe(2);
    expect(getStarRating(10)).toBe(2);
    expect(getStarRating(11)).toBe(1);
  });

  test('medium and hard build correct number of cards', () => {
    game.initGame(12);
    expect(document.querySelectorAll('.card').length).toBe(12);
    game.initGame(16);
    expect(document.querySelectorAll('.card').length).toBe(16);
  });
});
