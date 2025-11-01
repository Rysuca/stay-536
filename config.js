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
  },

  difficulty: {
    speedMultiplier: 1.15,
    spawnRateMultiplier: 0.9,
    rampSeconds: 30,
    maxMultiplier: 4,
  },
};
