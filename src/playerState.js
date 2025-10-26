/**
 * PlayerState module - Manages player progression, achievements, and high scores
 * Persists data to localStorage
 */

const ACHIEVEMENTS = {
  FIRST_MATCH: {
    id: 'first_match',
    name: 'First Match',
    description: 'Complete your first match',
    icon: '🎯',
    xpReward: 10
  },
  PERFECT_GAME: {
    id: 'perfect_game',
    name: 'Perfect Memory',
    description: 'Complete a game with no mistakes',
    icon: '⭐',
    xpReward: 50
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a game in under 30 seconds',
    icon: '⚡',
    xpReward: 75
  },
  COMBO_MASTER: {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Achieve a 5x combo or higher',
    icon: '🔥',
    xpReward: 100
  },
  BLITZ_CHAMPION: {
    id: 'blitz_champion',
    name: 'Blitz Champion',
    description: 'Score 500+ points in Blitz mode',
    icon: '💥',
    xpReward: 100
  },
  TIME_TRIAL_EXPERT: {
    id: 'time_trial_expert',
    name: 'Time Trial Expert',
    description: 'Complete a timed game with 30+ seconds remaining',
    icon: '⏱️',
    xpReward: 75
  },
  HARD_MODE_VICTOR: {
    id: 'hard_mode_victor',
    name: 'Hard Mode Victor',
    description: 'Complete a game on Hard difficulty',
    icon: '🏆',
    xpReward: 100
  },
  STREAK_MASTER: {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Play 5 games in a row',
    icon: '📈',
    xpReward: 50
  },
  HUNDRED_MATCHES: {
    id: 'hundred_matches',
    name: 'Century Club',
    description: 'Complete 100 matches',
    icon: '💯',
    xpReward: 200
  },
  THEME_EXPLORER: {
    id: 'theme_explorer',
    name: 'Theme Explorer',
    description: 'Switch between light and dark themes',
    icon: '🌓',
    xpReward: 25
  }
};

class PlayerState {
  constructor() {
    this.storageKey = 'lucysmatch_player_state';
    this.load();
  }

  /**
   * Load player state from localStorage or initialize new state
   */
  load() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.state = data;
      } catch (e) {
        console.error('Failed to load player state:', e);
        this.initializeState();
      }
    } else {
      this.initializeState();
    }
  }

  /**
   * Initialize a new player state
   */
  initializeState() {
    this.state = {
      xp: 0,
      level: 1,
      gamesPlayed: 0,
      totalMatches: 0,
      perfectGames: 0,
      currentStreak: 0,
      longestStreak: 0,
      themeSwitches: 0,
      achievements: {},
      highScores: {
        classic: { easy: null, medium: null, hard: null },
        timed: { easy: null, medium: null, hard: null },
        blitz: { easy: null, medium: null, hard: null }
      },
      stats: {
        fastestGame: null,
        highestCombo: 0,
        totalScore: 0
      }
    };

    // Initialize achievements as locked
    Object.keys(ACHIEVEMENTS).forEach(key => {
      this.state.achievements[ACHIEVEMENTS[key].id] = {
        unlocked: false,
        unlockedAt: null,
        progress: 0
      };
    });

    this.save();
  }

  /**
   * Save player state to localStorage
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save player state:', e);
    }
  }

  /**
   * Add XP and check for level up
   */
  addXP(amount) {
    this.state.xp += amount;
    const newLevel = this.calculateLevel(this.state.xp);
    const leveledUp = newLevel > this.state.level;
    this.state.level = newLevel;
    this.save();
    return { leveledUp, level: newLevel, xp: this.state.xp };
  }

  /**
   * Calculate level based on XP (requires 100 XP for level 2, then +50 per level)
   */
  calculateLevel(xp) {
    if (xp < 100) return 1;
    return Math.floor((xp - 100) / 50) + 2;
  }

  /**
   * Get XP needed for next level
   */
  getXPForNextLevel() {
    if (this.state.level === 1) return 100;
    return 100 + (this.state.level - 1) * 50;
  }

  /**
   * Record a completed game and check for achievements
   */
  recordGame(gameData) {
    const {
      mode,
      difficulty,
      score,
      mistakes,
      timeElapsed,
      timeRemaining,
      maxCombo,
      matches
    } = gameData;

    this.state.gamesPlayed++;
    this.state.totalMatches += matches || 0;
    this.state.currentStreak++;
    this.state.stats.totalScore += score || 0;

    if (this.state.currentStreak > this.state.longestStreak) {
      this.state.longestStreak = this.state.currentStreak;
    }

    // Track perfect games
    if (mistakes === 0) {
      this.state.perfectGames++;
    }

    // Track fastest game
    if (timeElapsed && (!this.state.stats.fastestGame || timeElapsed < this.state.stats.fastestGame)) {
      this.state.stats.fastestGame = timeElapsed;
    }

    // Track highest combo
    if (maxCombo > this.state.stats.highestCombo) {
      this.state.stats.highestCombo = maxCombo;
    }

    // Update high score if better
    this.updateHighScore(mode, difficulty, {
      score,
      date: new Date().toISOString(),
      mistakes,
      timeElapsed,
      timeRemaining,
      maxCombo
    });

    // Check and unlock achievements
    const newAchievements = this.checkAchievements(gameData);

    // Award base XP
    let xpGained = this.calculateGameXP(gameData);

    // Award achievement XP
    newAchievements.forEach(achievement => {
      xpGained += achievement.xpReward;
    });

    const levelResult = this.addXP(xpGained);

    this.save();

    return {
      xpGained,
      ...levelResult,
      newAchievements
    };
  }

  /**
   * Calculate XP earned from a game
   */
  calculateGameXP(gameData) {
    const { score, mistakes, maxCombo, mode } = gameData;
    
    let baseXP = 10; // Base XP for completing a game
    
    // Bonus for score
    baseXP += Math.floor(score / 10);
    
    // Bonus for perfect game
    if (mistakes === 0) {
      baseXP += 20;
    }
    
    // Bonus for combos
    if (maxCombo >= 3) {
      baseXP += maxCombo * 5;
    }
    
    // Mode multipliers
    if (mode === 'blitz') {
      baseXP = Math.floor(baseXP * 1.5);
    } else if (mode === 'timed') {
      baseXP = Math.floor(baseXP * 1.2);
    }
    
    return baseXP;
  }

  /**
   * Check and unlock achievements based on game data
   */
  checkAchievements(gameData) {
    const newAchievements = [];

    // First Match
    if (this.state.totalMatches > 0 && !this.isAchievementUnlocked('first_match')) {
      newAchievements.push(this.unlockAchievement('first_match'));
    }

    // Perfect Game
    if (gameData.mistakes === 0 && !this.isAchievementUnlocked('perfect_game')) {
      newAchievements.push(this.unlockAchievement('perfect_game'));
    }

    // Speed Demon (under 30 seconds)
    if (gameData.timeElapsed && gameData.timeElapsed < 30 && !this.isAchievementUnlocked('speed_demon')) {
      newAchievements.push(this.unlockAchievement('speed_demon'));
    }

    // Combo Master
    if (gameData.maxCombo >= 5 && !this.isAchievementUnlocked('combo_master')) {
      newAchievements.push(this.unlockAchievement('combo_master'));
    }

    // Blitz Champion
    if (gameData.mode === 'blitz' && gameData.score >= 500 && !this.isAchievementUnlocked('blitz_champion')) {
      newAchievements.push(this.unlockAchievement('blitz_champion'));
    }

    // Time Trial Expert
    if (gameData.mode === 'timed' && gameData.timeRemaining >= 30 && !this.isAchievementUnlocked('time_trial_expert')) {
      newAchievements.push(this.unlockAchievement('time_trial_expert'));
    }

    // Hard Mode Victor
    if (gameData.difficulty === 'hard' && !this.isAchievementUnlocked('hard_mode_victor')) {
      newAchievements.push(this.unlockAchievement('hard_mode_victor'));
    }

    // Streak Master
    if (this.state.currentStreak >= 5 && !this.isAchievementUnlocked('streak_master')) {
      newAchievements.push(this.unlockAchievement('streak_master'));
    }

    // Hundred Matches
    if (this.state.totalMatches >= 100 && !this.isAchievementUnlocked('hundred_matches')) {
      newAchievements.push(this.unlockAchievement('hundred_matches'));
    }

    return newAchievements;
  }

  /**
   * Unlock an achievement
   */
  unlockAchievement(achievementId) {
    const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
    if (achievement && !this.state.achievements[achievementId].unlocked) {
      this.state.achievements[achievementId] = {
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        progress: 100
      };
      this.save();
      return achievement;
    }
    return null;
  }

  /**
   * Check if an achievement is unlocked
   */
  isAchievementUnlocked(achievementId) {
    return this.state.achievements[achievementId]?.unlocked || false;
  }

  /**
   * Record theme switch for achievement
   */
  recordThemeSwitch() {
    this.state.themeSwitches++;
    if (this.state.themeSwitches >= 2 && !this.isAchievementUnlocked('theme_explorer')) {
      const achievement = this.unlockAchievement('theme_explorer');
      if (achievement) {
        this.addXP(achievement.xpReward);
      }
    }
    this.save();
  }

  /**
   * Reset current streak (when player doesn't finish a game)
   */
  resetStreak() {
    this.state.currentStreak = 0;
    this.save();
  }

  /**
   * Update high score for a mode/difficulty combination
   */
  updateHighScore(mode, difficulty, scoreData) {
    const current = this.state.highScores[mode]?.[difficulty];
    if (!current || scoreData.score > current.score) {
      if (!this.state.highScores[mode]) {
        this.state.highScores[mode] = {};
      }
      this.state.highScores[mode][difficulty] = scoreData;
    }
  }

  /**
   * Get high score for a mode/difficulty
   */
  getHighScore(mode, difficulty) {
    return this.state.highScores[mode]?.[difficulty] || null;
  }

  /**
   * Get all high scores
   */
  getAllHighScores() {
    return this.state.highScores;
  }

  /**
   * Get all achievements with unlock status
   */
  getAllAchievements() {
    return Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      ...this.state.achievements[achievement.id]
    }));
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements() {
    return this.getAllAchievements().filter(a => a.unlocked);
  }

  /**
   * Get player stats
   */
  getStats() {
    return {
      level: this.state.level,
      xp: this.state.xp,
      xpForNextLevel: this.getXPForNextLevel(),
      gamesPlayed: this.state.gamesPlayed,
      totalMatches: this.state.totalMatches,
      perfectGames: this.state.perfectGames,
      currentStreak: this.state.currentStreak,
      longestStreak: this.state.longestStreak,
      fastestGame: this.state.stats.fastestGame,
      highestCombo: this.state.stats.highestCombo,
      totalScore: this.state.stats.totalScore,
      achievementsUnlocked: this.getUnlockedAchievements().length,
      totalAchievements: Object.keys(ACHIEVEMENTS).length
    };
  }

  /**
   * Reset all player data (for testing or player request)
   */
  reset() {
    this.initializeState();
  }
}

// Export for use in browser and tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PlayerState, ACHIEVEMENTS };
} else {
  window.PlayerState = PlayerState;
  window.ACHIEVEMENTS = ACHIEVEMENTS;
}
