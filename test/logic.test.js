// Orbital Drift — unit tests for the pure game logic in logic.js.
// Run with: npm test  (node --test test/)

const { test } = require('node:test');
const assert = require('node:assert');

const {
  duoPositions,
  sphereHitsRect,
  sphereHitsBlock,
  sphereHitsLaser,
  sphereHitsNarrow,
  sphereHitsObstacle,
  difficultyMultiplier,
  obstaclePassed,
} = require('../logic.js');

const CONFIG_LIKE = {
  difficulty: { rampSeconds: 30, maxMultiplier: 4 },
};

test('duoPositions: theta=0 puts red on the right and blue on the left', () => {
  const xc = 450;
  const yc = 300;
  const r = 120;
  const pos = duoPositions(0, xc, yc, r);
  assert.strictEqual(pos.x1, xc + r);
  assert.strictEqual(pos.y1, yc);
  assert.strictEqual(pos.x2, xc - r);
  assert.strictEqual(pos.y2, yc);
});

test('duoPositions: theta=PI/2 puts red below and blue above', () => {
  const xc = 450;
  const yc = 300;
  const r = 120;
  const pos = duoPositions(Math.PI / 2, xc, yc, r);
  assert.strictEqual(pos.x1, xc);
  assert.strictEqual(pos.y1, yc + r);
  assert.strictEqual(pos.x2, xc);
  assert.strictEqual(pos.y2, yc - r);
});

test('duoPositions: spheres stay in antiphase (PI apart)', () => {
  const xc = 0;
  const yc = 0;
  const r = 50;
  const theta = Math.PI / 4;
  const atTheta = duoPositions(theta, xc, yc, r);
  const shifted = duoPositions(theta + Math.PI, xc, yc, r);
  assert.ok(Math.abs(shifted.x1 - atTheta.x2) < 1e-9);
  assert.ok(Math.abs(shifted.y1 - atTheta.y2) < 1e-9);
  assert.ok(Math.abs(shifted.x2 - atTheta.x1) < 1e-9);
  assert.ok(Math.abs(shifted.y2 - atTheta.y1) < 1e-9);
});

test('sphereHitsRect: sphere center inside the rect is a hit', () => {
  const rect = { x: 0, y: 0, width: 100, height: 100 };
  assert.strictEqual(sphereHitsRect(50, 50, 12, rect), true);
});

test('sphereHitsRect: sphere far away is not a hit', () => {
  const rect = { x: 0, y: 0, width: 100, height: 100 };
  assert.strictEqual(sphereHitsRect(300, 300, 12, rect), false);
});

test('sphereHitsRect: center just outside the edge within radius is a hit', () => {
  const rect = { x: 0, y: 0, width: 100, height: 100 };
  assert.strictEqual(sphereHitsRect(100, 50, 5, rect), true);
  assert.strictEqual(sphereHitsRect(103, 50, 5, rect), true);
});

test('sphereHitsBlock: sphere in the gap does not hit', () => {
  const obstacle = { x: 0, y: 100, width: 200, height: 40, gapX: 100, gapWidth: 40 };
  assert.strictEqual(sphereHitsBlock(100, 120, 12, obstacle), false);
});

test('sphereHitsBlock: sphere inside the left solid segment hits', () => {
  const obstacle = { x: 0, y: 100, width: 200, height: 40, gapX: 100, gapWidth: 40 };
  assert.strictEqual(sphereHitsBlock(20, 120, 12, obstacle), true);
});

test('sphereHitsLaser: sphere in the gap safe zone does not hit', () => {
  const obstacle = {
    x: 0,
    y: 100,
    width: 200,
    topH: 40,
    gapY: 40,
    gapH: 60,
    botH: 40,
  };
  assert.strictEqual(sphereHitsLaser(100, 170, 12, obstacle), false);
});

test('sphereHitsLaser: sphere inside the top band hits', () => {
  const obstacle = {
    x: 0,
    y: 100,
    width: 200,
    topH: 40,
    gapY: 40,
    gapH: 60,
    botH: 40,
  };
  assert.strictEqual(sphereHitsLaser(100, 110, 12, obstacle), true);
});

test('sphereHitsNarrow: sphere against the wall in the narrowed part hits', () => {
  const obstacle = {
    x: 0,
    y: 100,
    width: 200,
    height: 200,
    gapCenterX: 100,
    gapTopWidth: 100,
    gapBottomWidth: 40,
    rects: [
      { left: 0, top: 0, right: 50, bottom: 100 },
      { left: 150, top: 0, right: 200, bottom: 100 },
      { left: 0, top: 100, right: 80, bottom: 200 },
      { left: 120, top: 100, right: 200, bottom: 200 },
    ],
  };
  assert.strictEqual(sphereHitsNarrow(25, 250, 12, obstacle), true);
});

test('sphereHitsNarrow: sphere centered in the opening passes clear', () => {
  const obstacle = {
    x: 0,
    y: 100,
    width: 200,
    height: 200,
    gapCenterX: 100,
    gapTopWidth: 100,
    gapBottomWidth: 40,
    rects: [
      { left: 0, top: 0, right: 50, bottom: 100 },
      { left: 150, top: 0, right: 200, bottom: 100 },
      { left: 0, top: 100, right: 80, bottom: 200 },
      { left: 120, top: 100, right: 200, bottom: 200 },
    ],
  };
  assert.strictEqual(sphereHitsNarrow(100, 250, 12, obstacle), false);
});

test('sphereHitsObstacle: dispatches by obstacle type', () => {
  const block = { type: 'block', x: 0, y: 100, width: 200, height: 40, gapX: 100, gapWidth: 40 };
  const laser = { type: 'laser', x: 0, y: 100, width: 200, topH: 40, gapY: 40, gapH: 60, botH: 40 };
  const narrow = {
    type: 'narrow',
    x: 0,
    y: 100,
    width: 200,
    height: 200,
    rects: [
      { left: 0, top: 0, right: 50, bottom: 100 },
      { left: 150, top: 0, right: 200, bottom: 100 },
    ],
  };
  assert.strictEqual(sphereHitsObstacle(20, 120, 12, block), true);
  assert.strictEqual(sphereHitsObstacle(100, 110, 12, laser), true);
  assert.strictEqual(sphereHitsObstacle(25, 150, 12, narrow), true);
  assert.strictEqual(sphereHitsObstacle(300, 300, 12, block), false);
});

test('difficultyMultiplier: t=0 gives 1', () => {
  assert.strictEqual(difficultyMultiplier(0, CONFIG_LIKE), 1);
});

test('difficultyMultiplier: t=30 gives 2', () => {
  assert.strictEqual(difficultyMultiplier(30, CONFIG_LIKE), 2);
});

test('difficultyMultiplier: t=300 is capped at maxMultiplier', () => {
  assert.strictEqual(difficultyMultiplier(300, CONFIG_LIKE), CONFIG_LIKE.difficulty.maxMultiplier);
});

test('obstaclePassed: bottom edge below threshold counts as passed', () => {
  const obstacle = { y: 10, height: 20 };
  assert.strictEqual(obstaclePassed(obstacle, 25), true);
});

test('obstaclePassed: bottom edge at or above threshold is not passed', () => {
  const obstacle = { y: 0, height: 20 };
  assert.strictEqual(obstaclePassed(obstacle, 25), false);
  assert.strictEqual(obstaclePassed({ y: 5, height: 20 }, 25), false);
});
