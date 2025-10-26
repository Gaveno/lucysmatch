/**
 * @jest-environment jsdom
 */

const { PlayerState, ACHIEVEMENTS } = require('../src/playerState');

describe('PlayerState', () => {
  let playerState;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    playerState = new PlayerState();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      expect(playerState.state.xp).toBe(0);
      expect(playerState.state.level).toBe(1);
      expect(playerState.state.gamesPlayed).toBe(0);
      expect(playerState.state.totalMatches).toBe(0);
    });

    test('should initialize all achievements as locked', () => {
      const achievements = playerState.getAllAchievements();
      achievements.forEach(achievement => {
        expect(achievement.unlocked).toBe(false);
      });
    });

    test('should persist state to localStorage', () => {
      const saved = localStorage.getItem('lucysmatch_player_state');
      expect(saved).toBeTruthy();
      const data = JSON.parse(saved);
      expect(data.level).toBe(1);
    });

    test('should load existing state from localStorage', () => {
      const testState = {
        xp: 150,
        level: 3,
        gamesPlayed: 10,
        achievements: {},
        highScores: {}
      };
      localStorage.setItem('lucysmatch_player_state', JSON.stringify(testState));
      
      const loadedState = new PlayerState();
      expect(loadedState.state.xp).toBe(150);
      expect(loadedState.state.level).toBe(3);
      expect(loadedState.state.gamesPlayed).toBe(10);
    });
  });

  describe('XP and Leveling', () => {
    test('should add XP correctly', () => {
      const result = playerState.addXP(50);
      expect(playerState.state.xp).toBe(50);
      expect(result.xp).toBe(50);
    });

    test('should level up at 100 XP', () => {
      const result = playerState.addXP(100);
      expect(playerState.state.level).toBe(2);
      expect(result.leveledUp).toBe(true);
      expect(result.level).toBe(2);
    });

    test('should calculate level correctly', () => {
      expect(playerState.calculateLevel(0)).toBe(1);
      expect(playerState.calculateLevel(99)).toBe(1);
      expect(playerState.calculateLevel(100)).toBe(2);
      expect(playerState.calculateLevel(150)).toBe(3);
      expect(playerState.calculateLevel(200)).toBe(4);
    });

    test('should return XP needed for next level', () => {
      expect(playerState.getXPForNextLevel()).toBe(100);
      
      playerState.addXP(100);
      expect(playerState.getXPForNextLevel()).toBe(150);
      
      playerState.addXP(50);
      expect(playerState.getXPForNextLevel()).toBe(200);
    });
  });

  describe('Game Recording', () => {
    test('should record a game and increase stats', () => {
      const gameData = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 2,
        timeElapsed: 45,
        maxCombo: 3,
        matches: 4
      };

      playerState.recordGame(gameData);

      expect(playerState.state.gamesPlayed).toBe(1);
      expect(playerState.state.totalMatches).toBe(4);
      expect(playerState.state.currentStreak).toBe(1);
    });

    test('should award XP for completing a game', () => {
      const gameData = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        maxCombo: 2,
        matches: 4
      };

      const result = playerState.recordGame(gameData);
      
      expect(result.xpGained).toBeGreaterThan(0);
      expect(playerState.state.xp).toBe(result.xpGained);
    });

    test('should give more XP for perfect game', () => {
      const perfectGame = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        maxCombo: 2,
        matches: 4
      };

      const imperfectGame = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 3,
        maxCombo: 2,
        matches: 4
      };

      playerState.reset();
      const perfectResult = playerState.recordGame(perfectGame);
      
      playerState.reset();
      const imperfectResult = playerState.recordGame(imperfectGame);

      expect(perfectResult.xpGained).toBeGreaterThan(imperfectResult.xpGained);
    });

    test('should give bonus XP for blitz mode', () => {
      const classicGame = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        maxCombo: 2,
        matches: 4
      };

      const blitzGame = {
        ...classicGame,
        mode: 'blitz'
      };

      playerState.reset();
      const classicResult = playerState.recordGame(classicGame);
      
      playerState.reset();
      const blitzResult = playerState.recordGame(blitzGame);

      expect(blitzResult.xpGained).toBeGreaterThan(classicResult.xpGained);
    });
  });

  describe('Achievements', () => {
    test('should unlock first match achievement', () => {
      const gameData = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        maxCombo: 1,
        matches: 4
      };

      const result = playerState.recordGame(gameData);

      expect(result.newAchievements.length).toBeGreaterThan(0);
      expect(result.newAchievements.some(a => a.id === 'first_match')).toBe(true);
      expect(playerState.isAchievementUnlocked('first_match')).toBe(true);
    });

    test('should unlock perfect game achievement', () => {
      const gameData = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        maxCombo: 1,
        matches: 4
      };

      const result = playerState.recordGame(gameData);

      expect(result.newAchievements.some(a => a.id === 'perfect_game')).toBe(true);
      expect(playerState.isAchievementUnlocked('perfect_game')).toBe(true);
    });

    test('should unlock speed demon achievement for fast game', () => {
      const gameData = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 1,
        timeElapsed: 25,
        maxCombo: 1,
        matches: 4
      };

      const result = playerState.recordGame(gameData);

      expect(result.newAchievements.some(a => a.id === 'speed_demon')).toBe(true);
    });

    test('should unlock combo master for 5x combo', () => {
      const gameData = {
        mode: 'blitz',
        difficulty: 'easy',
        score: 200,
        mistakes: 0,
        maxCombo: 5,
        matches: 10
      };

      const result = playerState.recordGame(gameData);

      expect(result.newAchievements.some(a => a.id === 'combo_master')).toBe(true);
    });

    test('should unlock blitz champion for 500+ score', () => {
      const gameData = {
        mode: 'blitz',
        difficulty: 'medium',
        score: 550,
        mistakes: 2,
        maxCombo: 4,
        matches: 10
      };

      const result = playerState.recordGame(gameData);

      expect(result.newAchievements.some(a => a.id === 'blitz_champion')).toBe(true);
    });

    test('should not unlock same achievement twice', () => {
      const gameData = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        maxCombo: 1,
        matches: 4
      };

      const result1 = playerState.recordGame(gameData);
      const result2 = playerState.recordGame(gameData);

      // First game unlocks achievements
      expect(result1.newAchievements.length).toBeGreaterThan(0);
      // Second game doesn't unlock same achievements
      expect(result2.newAchievements.length).toBe(0);
    });

    test('should award achievement XP', () => {
      const gameData = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        maxCombo: 1,
        matches: 4
      };

      const result = playerState.recordGame(gameData);
      
      // XP should include base game XP plus achievement rewards
      const achievementXP = result.newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
      expect(result.xpGained).toBeGreaterThanOrEqual(achievementXP);
    });
  });

  describe('High Scores', () => {
    test('should record high score', () => {
      const gameData = {
        mode: 'classic',
        difficulty: 'easy',
        score: 150,
        mistakes: 1,
        timeElapsed: 45,
        maxCombo: 3,
        matches: 4
      };

      playerState.recordGame(gameData);

      const highScore = playerState.getHighScore('classic', 'easy');
      expect(highScore).toBeTruthy();
      expect(highScore.score).toBe(150);
      expect(highScore.mistakes).toBe(1);
    });

    test('should update high score when beaten', () => {
      const game1 = {
        mode: 'classic',
        difficulty: 'medium',
        score: 100,
        mistakes: 2,
        maxCombo: 2,
        matches: 6
      };

      const game2 = {
        mode: 'classic',
        difficulty: 'medium',
        score: 200,
        mistakes: 0,
        maxCombo: 4,
        matches: 6
      };

      playerState.recordGame(game1);
      playerState.recordGame(game2);

      const highScore = playerState.getHighScore('classic', 'medium');
      expect(highScore.score).toBe(200);
      expect(highScore.mistakes).toBe(0);
    });

    test('should not update high score when not beaten', () => {
      const game1 = {
        mode: 'blitz',
        difficulty: 'hard',
        score: 500,
        mistakes: 1,
        maxCombo: 5,
        matches: 8
      };

      const game2 = {
        mode: 'blitz',
        difficulty: 'hard',
        score: 300,
        mistakes: 3,
        maxCombo: 3,
        matches: 8
      };

      playerState.recordGame(game1);
      playerState.recordGame(game2);

      const highScore = playerState.getHighScore('blitz', 'hard');
      expect(highScore.score).toBe(500);
    });

    test('should track high scores separately by mode and difficulty', () => {
      const classicEasy = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        maxCombo: 2,
        matches: 4
      };

      const timedHard = {
        mode: 'timed',
        difficulty: 'hard',
        score: 200,
        mistakes: 2,
        maxCombo: 3,
        matches: 8
      };

      playerState.recordGame(classicEasy);
      playerState.recordGame(timedHard);

      const classicScore = playerState.getHighScore('classic', 'easy');
      const timedScore = playerState.getHighScore('timed', 'hard');

      expect(classicScore.score).toBe(100);
      expect(timedScore.score).toBe(200);
    });
  });

  describe('Stats', () => {
    test('should track fastest game', () => {
      const game1 = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        timeElapsed: 60,
        maxCombo: 2,
        matches: 4
      };

      const game2 = {
        mode: 'classic',
        difficulty: 'easy',
        score: 90,
        mistakes: 1,
        timeElapsed: 45,
        maxCombo: 2,
        matches: 4
      };

      playerState.recordGame(game1);
      playerState.recordGame(game2);

      const stats = playerState.getStats();
      expect(stats.fastestGame).toBe(45);
    });

    test('should track highest combo', () => {
      const game1 = {
        mode: 'blitz',
        difficulty: 'medium',
        score: 200,
        mistakes: 0,
        maxCombo: 3,
        matches: 6
      };

      const game2 = {
        mode: 'blitz',
        difficulty: 'medium',
        score: 250,
        mistakes: 0,
        maxCombo: 7,
        matches: 6
      };

      playerState.recordGame(game1);
      playerState.recordGame(game2);

      const stats = playerState.getStats();
      expect(stats.highestCombo).toBe(7);
    });

    test('should track current streak', () => {
      const gameData = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        maxCombo: 2,
        matches: 4
      };

      playerState.recordGame(gameData);
      playerState.recordGame(gameData);
      playerState.recordGame(gameData);

      const stats = playerState.getStats();
      expect(stats.currentStreak).toBe(3);
    });

    test('should unlock streak master at 5 games', () => {
      const gameData = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        maxCombo: 2,
        matches: 4
      };

      for (let i = 0; i < 4; i++) {
        playerState.recordGame(gameData);
      }

      expect(playerState.isAchievementUnlocked('streak_master')).toBe(false);

      const result = playerState.recordGame(gameData);

      expect(result.newAchievements.some(a => a.id === 'streak_master')).toBe(true);
      expect(playerState.isAchievementUnlocked('streak_master')).toBe(true);
    });
  });

  describe('Theme Tracking', () => {
    test('should record theme switches', () => {
      playerState.recordThemeSwitch();
      expect(playerState.state.themeSwitches).toBe(1);

      playerState.recordThemeSwitch();
      expect(playerState.state.themeSwitches).toBe(2);
    });

    test('should unlock theme explorer achievement after 2 switches', () => {
      expect(playerState.isAchievementUnlocked('theme_explorer')).toBe(false);

      playerState.recordThemeSwitch();
      expect(playerState.isAchievementUnlocked('theme_explorer')).toBe(false);

      playerState.recordThemeSwitch();
      expect(playerState.isAchievementUnlocked('theme_explorer')).toBe(true);
    });
  });

  describe('Reset', () => {
    test('should reset all player data', () => {
      const gameData = {
        mode: 'classic',
        difficulty: 'easy',
        score: 100,
        mistakes: 0,
        maxCombo: 2,
        matches: 4
      };

      playerState.recordGame(gameData);
      playerState.addXP(50);

      expect(playerState.state.xp).toBeGreaterThan(0);
      expect(playerState.state.gamesPlayed).toBe(1);

      playerState.reset();

      expect(playerState.state.xp).toBe(0);
      expect(playerState.state.level).toBe(1);
      expect(playerState.state.gamesPlayed).toBe(0);
      expect(playerState.state.totalMatches).toBe(0);
    });
  });
});
