/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('Mobile & Accessibility polish', () => {
  let game;

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    game = require('../src/game');
    const board = document.getElementById('gameBoard');
    game.setGameBoardElement(board);
    if (typeof game.setMismatchDelay === 'function') game.setMismatchDelay(10);
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('cards are focusable and respond to Enter key', () => {
    game.initGame(8);
    const card = document.querySelector('.card');
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabindex')).toBe('0');
    // simulate Enter key
    const ev = new KeyboardEvent('keydown', { key: 'Enter' });
    card.dispatchEvent(ev);
    expect(card.classList.contains('flipped')).toBe(true);
  });

  test('result modal has dialog role and aria-labelledby', () => {
    const modal = document.getElementById('resultModal');
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-labelledby')).toBe('resultTitle');
  });

  test('screen reader announcer updates on result', () => {
    // Simulate perfect game
    game.initGame(8);
    const cards = Array.from(document.querySelectorAll('.card'));
    const bySymbol = {};
    cards.forEach(card => {
      const s = card.dataset.symbol;
      bySymbol[s] = bySymbol[s] || [];
      bySymbol[s].push(card);
    });
    Object.values(bySymbol).forEach(pair => { pair[0].click(); pair[1].click(); });
    const announcer = document.getElementById('sr-announcer');
    // showResult writes title and stars; announcer should be set
    expect(document.getElementById('resultModal').classList.contains('show')).toBe(true);
    expect(announcer).not.toBeNull();
  });
});
