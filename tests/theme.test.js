/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

// Load DOM before requiring the module so our functions can interact with document
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('Theme API', () => {
  let game;

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    // reset localStorage
    localStorage.clear();
    // require the module fresh
    jest.resetModules();
    game = require('../src/game.js');
  });

  test('setTheme applies data-theme and persists', () => {
    game.setTheme('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
    // compiled tokens set on body style should match our token values
    expect(document.body.style.getPropertyValue('--bg-start').trim()).toBe('#0f1724');
    expect(localStorage.getItem('lm_theme')).toBe('dark');
  });

  test('initTheme system preference applies correct tokens', () => {
    localStorage.setItem('lm_theme', 'system');
    // pretend prefer dark by mocking matchMedia
    window.matchMedia = jest.fn().mockImplementation(query => ({ matches: true }));
    const chosen = game.initTheme();
    expect(chosen).toBe('system');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
    expect(document.body.style.getPropertyValue('--bg-start').trim()).toBe('#0f1724');
  });

  test('toggleTheme flips theme', () => {
    // Cycle: light -> dark -> system -> light
    game.setTheme('light');
    const next = game.toggleTheme();
    expect(next).toBe('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
    const second = game.toggleTheme();
    expect(second).toBe('system');
    // system applies OS preference; in jsdom without matchMedia this falls back to light
    expect(['system', 'light', 'dark']).toContain(document.body.getAttribute('data-theme'));
    const third = game.toggleTheme();
    expect(third).toBe('light');
    expect(document.body.getAttribute('data-theme')).toBe('light');
  });

  test('initTheme respects stored preference', () => {
    localStorage.setItem('lm_theme', 'dark');
    const chosen = game.initTheme();
    expect(chosen).toBe('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
  });
});
