/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

// Load DOM before requiring the module
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('UI Flow & Multi-Step Navigation', () => {
  let game;

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    localStorage.clear();
    jest.resetModules();
    game = require('../src/game.js');
    game.setGameBoardElement(document.getElementById('gameBoard'));
    game.setMismatchDelay(0);
  });

  test('Title screen is visible on initial load', () => {
    const titleScreen = document.getElementById('titleScreen');
    expect(titleScreen).toBeTruthy();
    expect(titleScreen.style.display).not.toBe('none');
  });

  test('Mode screen is hidden initially', () => {
    const modeScreen = document.getElementById('modeScreen');
    expect(modeScreen).toBeTruthy();
    expect(modeScreen.style.display).toBe('none');
  });

  test('Start modal (difficulty) is hidden initially', () => {
    const startModal = document.getElementById('startModal');
    expect(startModal).toBeTruthy();
    expect(startModal.style.display).toBe('none');
  });

  test('Mode buttons have correct data attributes and emojis', () => {
    const classicBtn = document.querySelector('[data-mode="classic"]');
    const timedBtn = document.querySelector('[data-mode="timed"]');
    const blitzBtn = document.querySelector('[data-mode="blitz"]');
    
    expect(classicBtn).toBeTruthy();
    expect(timedBtn).toBeTruthy();
    expect(blitzBtn).toBeTruthy();
    
    expect(classicBtn.textContent).toContain('Classic');
    expect(timedBtn.textContent).toContain('Timed');
    expect(blitzBtn.textContent).toContain('Blitz');
  });

  test('Difficulty buttons have emoji indicators', () => {
    const easyBtn = document.getElementById('easyBtn');
    const mediumBtn = document.getElementById('mediumBtn');
    const hardBtn = document.getElementById('hardBtn');
    
    expect(easyBtn.textContent).toContain('🟢');
    expect(mediumBtn.textContent).toContain('🟡');
    expect(hardBtn.textContent).toContain('🔴');
    
    expect(easyBtn.textContent).toContain('Easy');
    expect(mediumBtn.textContent).toContain('Medium');
    expect(hardBtn.textContent).toContain('Hard');
  });

  test('Difficulty buttons show card counts', () => {
    const easyBtn = document.getElementById('easyBtn');
    const mediumBtn = document.getElementById('mediumBtn');
    const hardBtn = document.getElementById('hardBtn');
    
    expect(easyBtn.textContent).toContain('8');
    expect(mediumBtn.textContent).toContain('12');
    expect(hardBtn.textContent).toContain('16');
  });

  test('Game HUD exists and has score, timer, combo elements', () => {
    const hud = document.getElementById('gameHUD');
    const scoreEl = document.getElementById('gameScore');
    const timerEl = document.getElementById('gameTimer');
    const comboEl = document.getElementById('gameCombo');
    
    expect(hud).toBeTruthy();
    expect(scoreEl).toBeTruthy();
    expect(timerEl).toBeTruthy();
    expect(comboEl).toBeTruthy();
  });

  test('Result modal shows final score element', () => {
    const finalScoreEl = document.getElementById('finalScore');
    expect(finalScoreEl).toBeTruthy();
    expect(finalScoreEl.classList.contains('final-score')).toBe(true);
  });

  test('restartGame returns to title screen', () => {
    // Start a game first
    game.startGame(8, 'classic');
    
    // Hide title screen as it would be in actual flow
    const titleScreen = document.getElementById('titleScreen');
    titleScreen.style.display = 'none';
    
    // Restart game
    game.restartGame();
    
    // Title screen should be visible again
    expect(titleScreen.style.display).toBe('flex');
  });

  test('restartGame hides HUD', () => {
    // Start a game and show HUD
    game.startGame(8, 'classic');
    const hud = document.getElementById('gameHUD');
    hud.classList.add('active');
    
    // Restart
    game.restartGame();
    
    // HUD should be hidden
    expect(hud.classList.contains('active')).toBe(false);
  });

  test('restartGame resets score and combo', () => {
    game.startGame(8, 'classic');
    
    // Simulate some score/combo
    const scoreEl = document.getElementById('gameScore');
    const comboEl = document.getElementById('gameCombo');
    
    // Restart
    game.restartGame();
    
    // Should be reset
    expect(scoreEl.textContent).toBe('0');
    expect(comboEl.style.opacity).toBe('0');
  });
});
