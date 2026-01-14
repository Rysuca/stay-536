// Orbital Drift — game loop skeleton
// Owns the canvas, the game state and the requestAnimationFrame loop.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

const GAME_STATE = {
  running: false,
  dying: false,
  score: 0,
  theta: 0,
  time: 0,
  obstacles: [],
  particles: [],
  spawnTimer: 0,
  colors: null,
};

let currentThemeId = getSelectedTheme();

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyTheme(themeId) {
  currentThemeId = themeId;
  const theme = CONFIG.themes[themeId] || CONFIG.themes[CONFIG.defaultTheme];
  GAME_STATE.colors = {
    sphereColors: {
      red: theme.sphereColors.red,
      blue: theme.sphereColors.blue,
    },
    orbitColor: theme.orbitColor,
    obstacleColor: theme.obstacleColor,
    laserColor: theme.laserColor,
    narrowColor: theme.narrowColor,
    gapGlowColor: theme.gapGlowColor,
    background: theme.background,
  };
}

applyTheme(currentThemeId);

function buildThemePicker() {
  const container = document.getElementById('themeButtons');
  if (!container) return;

  for (const themeId of Object.keys(CONFIG.themes)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'themeBtn';
    btn.dataset.theme = themeId;
    btn.textContent = CONFIG.themes[themeId].name;
    btn.addEventListener('click', () => {
      setSelectedTheme(themeId);
      applyTheme(themeId);
      highlightThemeButton(themeId);
    });
    container.appendChild(btn);
  }

  highlightThemeButton(currentThemeId);
}

function highlightThemeButton(themeId) {
  const buttons = document.querySelectorAll('#themeButtons .themeBtn');
  for (const btn of buttons) {
    btn.classList.toggle('active', btn.dataset.theme === themeId);
  }
}

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  KeyA: false,
  KeyD: false,
};

window.addEventListener('keydown', (e) => {
  if (e.code in keys) {
    keys[e.code] = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code in keys) {
    keys[e.code] = false;
  }
});

function difficultyMultiplier(t) {
  const { rampSeconds, maxMultiplier } = CONFIG.difficulty;
  return Math.min(1 + t / rampSeconds, maxMultiplier);
}

function spawnObstacle() {
  const { obstacle, canvas: canvasCfg } = CONFIG;
  const multiplier = difficultyMultiplier(GAME_STATE.time);

  const blockWidth = obstacle.width || canvasCfg.width;
  const blockHeight = obstacle.height;
  const gapWidth = obstacle.gapWidth;

  const roll = Math.random();
  const laserThreshold = obstacle.laserChance;
  const narrowThreshold = obstacle.laserChance + obstacle.narrowChance;

  // With a set chance, spawn a laser instead of a block with a gap.
  if (roll < laserThreshold) {
    const topH = obstacle.laserTopH;
    const gapH = obstacle.laserGapH;
    const botH = obstacle.laserBotH;
    const gapY = topH;
    const laserHeight = gapY + gapH + botH;

    GAME_STATE.obstacles.push({
      x: 0,
      y: -laserHeight,
      width: blockWidth,
      height: laserHeight,
      topH,
      gapY,
      gapH,
      botH,
      speed: obstacle.baseFallSpeed * multiplier,
      type: 'laser',
      passed: false,
      counted: false,
    });
    return;
  }

  // With a set chance, spawn a narrowing corridor: the gap shrinks top to bottom.
  if (roll < narrowThreshold) {
    const gapCenterX =
      obstacle.narrowCenterMinX +
      Math.random() * (obstacle.narrowCenterMaxX - obstacle.narrowCenterMinX);
    const segCount = obstacle.narrowSegments || 5;
    const segH = blockHeight / segCount;
    const topHalf = obstacle.gapTopWidth / 2;
    const bottomHalf = obstacle.gapBottomWidth / 2;
    const rects = [];

    for (let i = 0; i < segCount; i++) {
      const segTop = i * segH;
      const t = (segTop + segH / 2) / blockHeight;
      const half = topHalf + (bottomHalf - topHalf) * t;
      rects.push(
        { left: 0, top: segTop, right: gapCenterX - half, bottom: segTop + segH },
        { left: gapCenterX + half, top: segTop, right: blockWidth, bottom: segTop + segH },
      );
    }

    GAME_STATE.obstacles.push({
      x: 0,
      y: -blockHeight,
      width: blockWidth,
      height: blockHeight,
      gapCenterX,
      gapTopWidth: obstacle.gapTopWidth,
      gapBottomWidth: obstacle.gapBottomWidth,
      speed: obstacle.baseFallSpeed * multiplier,
      type: 'narrow',
      passed: false,
      counted: false,
      rects,
    });
    return;
  }

  // Randomly position the single vertical gap so it always covers the orbit
  // center, keeping it reachable by the duo at any rotation.
  const gapX =
    obstacle.blockGapMinX +
    Math.random() * (obstacle.blockGapMaxX - obstacle.blockGapMinX);

  // Two solid segments: left and right of the gap.
  const segments = [
    { x: 0, w: gapX - gapWidth / 2 },
    { x: gapX + gapWidth / 2, w: blockWidth - gapX - gapWidth / 2 },
  ];

  GAME_STATE.obstacles.push({
    x: 0,
    y: -blockHeight,
    width: blockWidth,
    height: blockHeight,
    gapX,
    gapWidth,
    speed: obstacle.baseFallSpeed * multiplier,
    type: 'block',
    passed: false,
    counted: false,
    segments,
  });
}

function gameOver(cx, cy, color) {
  const { particles } = CONFIG;
  if (typeof cx === 'number' && typeof cy === 'number' && color) {
    emitParticles(cx, cy, particles.burstCount, '#ffffff', particles.burstSpeed, particles.burstLife, particles.burstSize);
    emitParticles(cx, cy, Math.floor(particles.burstCount * 0.6), color, particles.burstSpeed * 0.7, particles.burstLife * 1.3, particles.burstSize * 1.4);
  }
  GAME_STATE.running = false;
  GAME_STATE.dying = true;
  const finalScore = document.getElementById('finalScore');
  if (finalScore) {
    finalScore.textContent = GAME_STATE.score;
  }
  const gameOverScreen = document.getElementById('gameOverScreen');
  if (gameOverScreen) {
    gameOverScreen.style.display = 'flex';
  }
}

function sphereHitsObstacle(sx, sy, obstacle) {
  const radius = CONFIG.sphere.radius;
  const rects = [];

  if (obstacle.type === 'laser') {
    const { x, y, width, topH, gapY, gapH, botH } = obstacle;
    rects.push(
      { left: x, top: y, right: x + width, bottom: y + topH },
      {
        left: x,
        top: y + gapY + gapH,
        right: x + width,
        bottom: y + gapY + gapH + botH,
      },
    );
  } else if (obstacle.type === 'narrow') {
    for (const r of obstacle.rects) {
      rects.push({
        left: r.left,
        top: r.top + obstacle.y,
        right: r.right,
        bottom: r.bottom + obstacle.y,
      });
    }
  } else {
    const { x, y, width, height, gapX, gapWidth } = obstacle;
    const gapHalf = gapWidth / 2;

    rects.push(
      { left: x, top: y, right: gapX - gapHalf, bottom: y + height },
      { left: gapX + gapHalf, top: y, right: x + width, bottom: y + height },
    );
  }

  for (const rect of rects) {
    if (rect.right <= rect.left || rect.bottom <= rect.top) continue;
    const nearestX = Math.max(rect.left, Math.min(sx, rect.right));
    const nearestY = Math.max(rect.top, Math.min(sy, rect.bottom));
    const dx = sx - nearestX;
    const dy = sy - nearestY;
    if (dx * dx + dy * dy < radius * radius) {
      return true;
    }
  }

  return false;
}

function checkCollisions() {
  if (GAME_STATE.obstacles.length === 0) return;

  const { orbit } = CONFIG;
  const xc = orbit.centerX;
  const yc = orbit.centerY;
  const r = orbit.radius;
  const cos = Math.cos(GAME_STATE.theta);
  const sin = Math.sin(GAME_STATE.theta);

  const spheres = [
    { x: xc + r * cos, y: yc + r * sin, color: GAME_STATE.colors.sphereColors.red },
    { x: xc - r * cos, y: yc - r * sin, color: GAME_STATE.colors.sphereColors.blue },
  ];

  for (const ob of GAME_STATE.obstacles) {
    for (const sphere of spheres) {
      if (sphereHitsObstacle(sphere.x, sphere.y, ob)) {
        gameOver(sphere.x, sphere.y, sphere.color);
        return;
      }
    }
  }
}

function emitParticles(x, y, count, color, speed, life, size) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    GAME_STATE.particles.push({
      x,
      y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life,
      size: size * (0.6 + Math.random() * 0.8),
      color,
    });
  }
}

function updateParticles(dt) {
  const list = GAME_STATE.particles;
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      list.splice(i, 1);
    }
  }
}

function drawParticles() {
  const list = GAME_STATE.particles;
  if (list.length === 0) return;

  ctx.save();
  for (const p of list) {
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function update(dt) {
  // Advance simulation time and apply per-frame logic (spheres, obstacles, scoring).
  GAME_STATE.time += dt;

  const { baseSpeed } = CONFIG.rotation;
  if (keys.ArrowLeft || keys.KeyA) {
    GAME_STATE.theta -= baseSpeed * dt;
  }
  if (keys.ArrowRight || keys.KeyD) {
    GAME_STATE.theta += baseSpeed * dt;
  }

  // Spawn obstacles on an interval that shortens as difficulty grows.
  const multiplier = difficultyMultiplier(GAME_STATE.time);
  const spawnInterval =
    CONFIG.obstacle.spawnInterval / (1 + (multiplier - 1) * 0.5);
  GAME_STATE.spawnTimer -= dt * 1000;
  if (GAME_STATE.spawnTimer <= 0) {
    spawnObstacle();
    GAME_STATE.spawnTimer = spawnInterval;
  }

  // Move obstacles downward, mark passed ones and drop those that left the screen.
  const passLine = canvas.height / 2 + CONFIG.orbit.radius + CONFIG.sphere.radius;
  for (let i = GAME_STATE.obstacles.length - 1; i >= 0; i--) {
    const ob = GAME_STATE.obstacles[i];
    ob.y += ob.speed * dt;
    if (!ob.passed && ob.y > passLine) {
      ob.passed = true;
    }
    if (ob.y > canvas.height + ob.height) {
      GAME_STATE.obstacles.splice(i, 1);
    }
  }

  // Award a point for every obstacle the player has cleared.
  for (const ob of GAME_STATE.obstacles) {
    if (ob.passed && !ob.counted) {
      ob.counted = true;
      GAME_STATE.score += 1;
    }
  }

  // Emit glowing particle trails from both spheres.
  const { orbit, sphere, particles: pcfg } = CONFIG;
  const cos = Math.cos(GAME_STATE.theta);
  const sin = Math.sin(GAME_STATE.theta);
  const positions = [
    { x: orbit.centerX + orbit.radius * cos, y: orbit.centerY + orbit.radius * sin, color: GAME_STATE.colors.sphereColors.red },
    { x: orbit.centerX - orbit.radius * cos, y: orbit.centerY - orbit.radius * sin, color: GAME_STATE.colors.sphereColors.blue },
  ];
  const [minTrail, maxTrail] = pcfg.trailPerFrame;
  for (const pos of positions) {
    const count = minTrail + Math.floor(Math.random() * (maxTrail - minTrail + 1));
    emitParticles(pos.x, pos.y, count, pos.color, pcfg.trailSpeed, pcfg.trailLife, pcfg.trailSize);
  }

  checkCollisions();
  updateParticles(dt);
}

function drawOrbit() {
  const { orbit } = CONFIG;

  ctx.save();
  ctx.strokeStyle = hexToRgba(GAME_STATE.colors.orbitColor, 0.35);
  ctx.lineWidth = 1;
  ctx.shadowBlur = 10;
  ctx.shadowColor = GAME_STATE.colors.orbitColor;
  ctx.beginPath();
  ctx.arc(orbit.centerX, orbit.centerY, orbit.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSphere(x, y, color) {
  ctx.save();
  ctx.shadowBlur = 24;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, CONFIG.sphere.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fill();
  ctx.restore();
}

function drawDuo() {
  const { orbit, sphere } = CONFIG;
  const { theta } = GAME_STATE;

  const xc = orbit.centerX;
  const yc = orbit.centerY;
  const r = orbit.radius;

  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  // Center of mass.
  ctx.save();
  ctx.fillStyle = hexToRgba(GAME_STATE.colors.orbitColor, 0.8);
  ctx.shadowBlur = 8;
  ctx.shadowColor = GAME_STATE.colors.orbitColor;
  ctx.beginPath();
  ctx.arc(xc, yc, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawSphere(xc + r * cos, yc + r * sin, GAME_STATE.colors.sphereColors.red);
  drawSphere(xc - r * cos, yc - r * sin, GAME_STATE.colors.sphereColors.blue);
}

function drawObstacles() {
  const color = GAME_STATE.colors.obstacleColor;
  const laserColor = GAME_STATE.colors.laserColor;
  const narrowColor = GAME_STATE.colors.narrowColor;

  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = color;
  ctx.fillStyle = color;

  for (const ob of GAME_STATE.obstacles) {
    if (ob.type === 'laser') {
      const bands = [
        { bx: ob.x, by: ob.y, bw: ob.width, bh: ob.topH },
        { bx: ob.x, by: ob.y + ob.gapY + ob.gapH, bw: ob.width, bh: ob.botH },
      ];
      ctx.shadowBlur = 22;
      ctx.shadowColor = laserColor;
      ctx.fillStyle = laserColor;
      for (const band of bands) {
        ctx.fillRect(band.bx, band.by, band.bw, band.bh);
        ctx.fillRect(band.bx, band.by, band.bw, band.bh);
      }
      continue;
    }

    if (ob.type === 'narrow') {
      const topHalf = ob.gapTopWidth / 2;
      const bottomHalf = ob.gapBottomWidth / 2;
      const topY = ob.y;
      const bottomY = ob.y + ob.height;
      ctx.shadowBlur = 22;
      ctx.shadowColor = narrowColor;
      ctx.fillStyle = narrowColor;
      const left = [ob.x, topY, ob.gapCenterX - topHalf, topY, ob.gapCenterX - bottomHalf, bottomY, ob.x, bottomY];
      const right = [ob.gapCenterX + topHalf, topY, ob.x + ob.width, topY, ob.x + ob.width, bottomY, ob.gapCenterX + bottomHalf, bottomY];
      for (const poly of [left, right]) {
        ctx.beginPath();
        ctx.moveTo(poly[0], poly[1]);
        for (let i = 2; i < poly.length; i += 2) ctx.lineTo(poly[i], poly[i + 1]);
        ctx.closePath();
        ctx.fill();
        ctx.fill();
      }
      continue;
    }

    ctx.shadowBlur = 14;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    for (const seg of ob.segments) {
      ctx.fillRect(ob.x + seg.x, ob.y, seg.w, ob.height);
    }

    // Soft neon glow along the center of the gap so the safe lane reads clearly.
    const gapHalf = ob.gapWidth / 2;
    const gapLeft = ob.gapX - gapHalf;
    const glowColor = GAME_STATE.colors.gapGlowColor;
    ctx.save();
    const glow = ctx.createLinearGradient(gapLeft, 0, ob.gapX + gapHalf, 0);
    glow.addColorStop(0, hexToRgba(GAME_STATE.colors.gapGlowColor, 0));
    glow.addColorStop(0.5, hexToRgba(GAME_STATE.colors.gapGlowColor, 0.18));
    glow.addColorStop(1, hexToRgba(GAME_STATE.colors.gapGlowColor, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(gapLeft, ob.y, ob.gapWidth, ob.height);
    ctx.strokeStyle = glowColor;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 12;
    ctx.shadowColor = glowColor;
    ctx.beginPath();
    ctx.moveTo(ob.gapX, ob.y);
    ctx.lineTo(ob.gapX, ob.y + ob.height);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function updateHUD() {
  const scoreEl = document.getElementById('hudScore');
  if (scoreEl) {
    scoreEl.textContent = GAME_STATE.score;
  }

  const timeEl = document.getElementById('hudTime');
  if (timeEl) {
    const total = Math.floor(GAME_STATE.time);
    const mm = String(Math.floor(total / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    timeEl.textContent = `${mm}:${ss}`;
  }
}

function draw() {
  // Translucent fill instead of a full clear leaves a fading trail behind.
  ctx.fillStyle = hexToRgba(GAME_STATE.colors.background, 0.1);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawOrbit();
  drawDuo();
  drawObstacles();
  drawParticles();
  updateHUD();
}

let lastTime = 0;
let rafId = null;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.05);

  if (GAME_STATE.running) {
    update(dt);
    draw();
  } else if (GAME_STATE.dying) {
    // Keep animating the collision burst behind the game-over screen.
    updateParticles(dt);
    draw();
    if (GAME_STATE.particles.length === 0) {
      GAME_STATE.dying = false;
      cancelAnimationFrame(rafId);
      rafId = null;
      return;
    }
  }

  lastTime = timestamp;
  rafId = requestAnimationFrame(gameLoop);
}

function start() {
  if (GAME_STATE.running) return;

  GAME_STATE.running = true;
  GAME_STATE.dying = false;
  GAME_STATE.score = 0;
  GAME_STATE.theta = 0;
  GAME_STATE.time = 0;
  GAME_STATE.obstacles = [];
  GAME_STATE.particles = [];
  GAME_STATE.spawnTimer = 0;

  const gameOverScreen = document.getElementById('gameOverScreen');
  if (gameOverScreen) {
    gameOverScreen.style.display = 'none';
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = GAME_STATE.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = hexToRgba(GAME_STATE.colors.background, 0.1);

  lastTime = performance.now();
  if (rafId == null) {
    rafId = requestAnimationFrame(gameLoop);
  }
}

function stop() {
  GAME_STATE.running = false;
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function startGame() {
  start();
  const startScreen = document.getElementById('startScreen');
  if (startScreen) {
    startScreen.style.display = 'none';
  }
}

function bindStartControls() {
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }

  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', start);
  }

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Enter' && e.code !== 'Space') return;
    const startScreen = document.getElementById('startScreen');
    const startVisible = startScreen && startScreen.style.display !== 'none';
    if (startVisible) {
      e.preventDefault();
      startGame();
      return;
    }
    const gameOverScreen = document.getElementById('gameOverScreen');
    const overVisible = gameOverScreen && gameOverScreen.style.display !== 'none';
    if (overVisible) {
      e.preventDefault();
      start();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bindStartControls();
    buildThemePicker();
  });
} else {
  bindStartControls();
  buildThemePicker();
}
