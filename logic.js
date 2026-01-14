// Orbital Drift — pure, testable game logic.
// This module contains no DOM/canvas access and is shared with the browser game.
//
// NOTE: The formulas below intentionally mirror the math implemented in game.js
// (orbit positions, clamp circle-vs-rect collision, difficulty ramp, pass line).
// If you change any collision or orbit math here, update game.js to match so the
// tested behaviour stays identical to what the player experiences.

function duoPositions(theta, xc, yc, r) {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return {
    x1: xc + r * cos,
    y1: yc + r * sin,
    x2: xc - r * cos,
    y2: yc - r * sin,
  };
}

function rectFromEdges(left, top, right, bottom) {
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function sphereHitsRect(sx, sy, radius, rect) {
  const left = rect.x;
  const top = rect.y;
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;

  if (right <= left || bottom <= top) return false;

  const nearestX = Math.max(left, Math.min(sx, right));
  const nearestY = Math.max(top, Math.min(sy, bottom));
  const dx = sx - nearestX;
  const dy = sy - nearestY;

  return dx * dx + dy * dy < radius * radius;
}

function sphereHitsBlock(sx, sy, radius, obstacle) {
  const { x, y, width, height, gapX, gapWidth } = obstacle;
  const gapHalf = gapWidth / 2;

  return (
    sphereHitsRect(sx, sy, radius, rectFromEdges(x, y, gapX - gapHalf, y + height)) ||
    sphereHitsRect(sx, sy, radius, rectFromEdges(gapX + gapHalf, y, x + width, y + height))
  );
}

function sphereHitsLaser(sx, sy, radius, obstacle) {
  const { x, y, width, topH, gapY, gapH, botH } = obstacle;

  return (
    sphereHitsRect(sx, sy, radius, rectFromEdges(x, y, x + width, y + topH)) ||
    sphereHitsRect(
      sx,
      sy,
      radius,
      rectFromEdges(x, y + gapY + gapH, x + width, y + gapY + gapH + botH),
    )
  );
}

function sphereHitsNarrow(sx, sy, radius, obstacle) {
  for (const r of obstacle.rects) {
    const rect = rectFromEdges(r.left, r.top + obstacle.y, r.right, r.bottom + obstacle.y);
    if (sphereHitsRect(sx, sy, radius, rect)) {
      return true;
    }
  }
  return false;
}

function sphereHitsObstacle(sx, sy, radius, obstacle) {
  if (obstacle.type === 'laser') {
    return sphereHitsLaser(sx, sy, radius, obstacle);
  }
  if (obstacle.type === 'narrow') {
    return sphereHitsNarrow(sx, sy, radius, obstacle);
  }
  return sphereHitsBlock(sx, sy, radius, obstacle);
}

function difficultyMultiplier(t, config) {
  const { rampSeconds, maxMultiplier, speedMultiplier } = config.difficulty;
  return Math.min(Math.pow(speedMultiplier, t / rampSeconds), maxMultiplier);
}

function spawnIntervalForTime(t, config) {
  const { spawnInterval, minSpawnInterval } = config.obstacle;
  const { rampSeconds, spawnRateMultiplier } = config.difficulty;
  const minMs = minSpawnInterval * 1000;
  return Math.max(minMs, spawnInterval * Math.pow(spawnRateMultiplier, t / rampSeconds));
}

function obstaclePassed(obstacle, thresholdY) {
  return obstacle.y + obstacle.height > thresholdY;
}

module.exports = {
  duoPositions,
  sphereHitsRect,
  sphereHitsBlock,
  sphereHitsLaser,
  sphereHitsNarrow,
  sphereHitsObstacle,
  difficultyMultiplier,
  spawnIntervalForTime,
  obstaclePassed,
};
