// Orbital Drift — game configuration
// Tweak these constants to balance difficulty and visuals.

const CONFIG = {
  DEBUG: true,

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
    // rad per second (applied as baseSpeed * dt, dt in seconds)
    baseSpeed: 1.8,
  },

  obstacle: {
    // px per second (applied as speed * dt, dt in seconds)
    baseFallSpeed: 105,
    // ms between spawns; ~126px spacing between obstacles at base fall speed
    spawnInterval: 1200,
    // min seconds between spawns; keeps gaps playable as difficulty ramps up
    minSpawnInterval: 0.85,
    radius: 8,
    color: '#c4fcef',
    width: 900,
    height: 40,
    gapWidth: 120,
    // Vertical-gap center stays within [blockGapMinX, blockGapMaxX], so the gap
    // always overlaps the orbit center (xc) and stays reachable by the duo.
    blockGapMinX: 390,
    blockGapMaxX: 510,
    laserChance: 0.2,
    laserColor: '#ff2a6d',
    // Vertical gates: two columns with a fixed central gap, always centered on
    // x=450 so the passable window [387, 513] overlaps the orbit (r=120).
    laserGapWidth: 150,
    laserHeight: 200,
    narrowChance: 0.15,
    gapTopWidth: 190,
    gapBottomWidth: 100,
    narrowSegments: 5,
    // Narrowing-corridor center stays within [narrowCenterMinX, narrowCenterMaxX],
    // keeping the tapering gap navigable around the orbit center.
    narrowCenterMinX: 430,
    narrowCenterMaxX: 470,
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
    rampSeconds: 45,
    maxMultiplier: 3,
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

function isValidThemeId(themeId, themes) {
  return !!themeId && !!themes && Object.prototype.hasOwnProperty.call(themes, themeId);
}

function getSelectedTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidThemeId(stored, CONFIG.themes)) {
      return stored;
    }
  } catch (e) {
    // localStorage unavailable — fall through to default
  }
  return CONFIG.defaultTheme;
}

function setSelectedTheme(themeId) {
  if (!isValidThemeId(themeId, CONFIG.themes)) {
    return;
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (e) {
    // localStorage unavailable — ignore
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, THEME_STORAGE_KEY, isValidThemeId, getSelectedTheme, setSelectedTheme };
}
