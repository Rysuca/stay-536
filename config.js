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
  },

  difficulty: {
    speedMultiplier: 1.15,
    spawnRateMultiplier: 0.9,
  },
};
