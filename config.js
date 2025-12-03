// Orbital Drift — game configuration
// Tweak these constants to balance difficulty and visuals.

const CONFIG = {
  canvas: {
    width: 900,
    height: 600,
  },

  orbit: {
    radius: 120,
    centerX: 450,
    centerY: 300,
  },

  sphere: {
    radius: 12,
    redColor: '#ff2a6d',
    blueColor: '#05d9e8',
  },

  rotation: {
    baseSpeed: 0.03,
  },

  obstacle: {
    baseFallSpeed: 2,
    spawnInterval: 1200,
    radius: 8,
    color: '#c4fcef',
    width: 900,
    height: 40,
    gapWidth: 120,
    laserChance: 0.3,
    laserColor: '#ff2a6d',
    laserTopH: 40,
    laserGapH: 130,
    laserBotH: 40,
    narrowChance: 0.25,
    gapTopWidth: 190,
    gapBottomWidth: 70,
    narrowSegments: 5,
    narrowColor: '#a8ff3e',
    gapGlowColor: '#05d9e8',
  },

  particles: {
    trailPerFrame: [2, 4],
    trailSpeed: 28,
    trailLife: 0.6,
    trailSize: 3,
    burstCount: 26,
    burstSpeed: 260,
    burstLife: 0.9,
    burstSize: 4,
  },

  difficulty: {
    speedMultiplier: 1.15,
    spawnRateMultiplier: 0.9,
    rampSeconds: 30,
    maxMultiplier: 4,
  },

  defaultTheme: 'neon-classic',

  themes: {
    'neon-classic': {
      name: 'Neon Classic',
      background: '#000000',
      sphereColors: { red: '#ff2a6d', blue: '#05d9e8' },
      orbitColor: '#c4fcef',
      obstacleColor: '#c4fcef',
      laserColor: '#ff2a6d',
      narrowColor: '#a8ff3e',
      gapGlowColor: '#05d9e8',
    },
    acid: {
      name: 'Acid',
      background: '#0a0f00',
      sphereColors: { red: '#ff00ff', blue: '#b6ff00' },
      orbitColor: '#8dff00',
      obstacleColor: '#5c8a00',
      laserColor: '#ff00ff',
      narrowColor: '#2bff88',
      gapGlowColor: '#b6ff00',
    },
    sunset: {
      name: 'Sunset',
      background: '#14000a',
      sphereColors: { red: '#ff7b00', blue: '#ff2a6d' },
      orbitColor: '#ffb347',
      obstacleColor: '#ff5e3a',
      laserColor: '#ff7b00',
      narrowColor: '#ff2a6d',
      gapGlowColor: '#ffd166',
    },
    ocean: {
      name: 'Ocean',
      background: '#000a14',
      sphereColors: { red: '#00d0ff', blue: '#00ffcc' },
      orbitColor: '#7ef9ff',
      obstacleColor: '#0077b6',
      laserColor: '#00d0ff',
      narrowColor: '#48cae4',
      gapGlowColor: '#00ffcc',
    },
  },
};

const THEME_STORAGE_KEY = 'od-theme';

function getSelectedTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && CONFIG.themes[stored]) {
      return stored;
    }
  } catch (e) {
    // localStorage unavailable — fall through to default
  }
  return CONFIG.defaultTheme;
}

function setSelectedTheme(themeId) {
  if (!themeId || !CONFIG.themes[themeId]) {
    return;
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (e) {
    // localStorage unavailable — ignore
  }
}
