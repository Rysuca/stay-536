// Orbital Drift — game loop skeleton
// Owns the canvas, the game state and the requestAnimationFrame loop.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

const GAME_STATE = {
  running: false,
  score: 0,
  theta: 0,
  time: 0,
  obstacles: [],
  particles: [],
  spawnTimer: 0,
};

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

function spawnObstacle() {
  const { obstacle, canvas: canvasCfg } = CONFIG;

  const blockWidth = obstacle.width || canvasCfg.width;
  const blockHeight = obstacle.height;
  const gapWidth = obstacle.gapWidth;

  // Randomly position the single vertical gap, keeping it fully on-screen.
  const gapX = gapWidth / 2 + Math.random() * (blockWidth - gapWidth);

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
    speed: obstacle.baseFallSpeed,
    type: 'block',
    passed: false,
    segments,
  });
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

  // Spawn obstacles on a fixed interval.
  GAME_STATE.spawnTimer -= dt * 1000;
  if (GAME_STATE.spawnTimer <= 0) {
    spawnObstacle();
    GAME_STATE.spawnTimer = CONFIG.obstacle.spawnInterval;
  }

  // Move obstacles downward and drop those that left the screen.
  for (let i = GAME_STATE.obstacles.length - 1; i >= 0; i--) {
    const ob = GAME_STATE.obstacles[i];
    ob.y += ob.speed * dt;
    if (ob.y > canvas.height) {
      GAME_STATE.obstacles.splice(i, 1);
    }
  }
}

function drawOrbit() {
  const { orbit } = CONFIG;

  ctx.save();
  ctx.strokeStyle = 'rgba(5, 217, 232, 0.35)';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 10;
  ctx.shadowColor = CONFIG.sphere.blueColor;
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
  ctx.fillStyle = 'rgba(196, 252, 239, 0.8)';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#c4fcef';
  ctx.beginPath();
  ctx.arc(xc, yc, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawSphere(xc + r * cos, yc + r * sin, sphere.redColor);
  drawSphere(xc - r * cos, yc - r * sin, sphere.blueColor);
}

function drawObstacles() {
  const color = CONFIG.obstacle.color;

  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = color;
  ctx.fillStyle = color;

  for (const ob of GAME_STATE.obstacles) {
    for (const seg of ob.segments) {
      ctx.fillRect(ob.x + seg.x, ob.y, seg.w, ob.height);
    }
  }

  ctx.restore();
}

function draw() {
  // Translucent fill instead of a full clear leaves a fading trail behind.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawOrbit();
  drawDuo();
  drawObstacles();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.05);

  if (GAME_STATE.running) {
    update(dt);
    draw();
  }

  lastTime = timestamp;
  requestAnimationFrame(gameLoop);
}

let lastTime = 0;

function start() {
  if (GAME_STATE.running) return;

  GAME_STATE.running = true;
  GAME_STATE.score = 0;
  GAME_STATE.theta = 0;
  GAME_STATE.time = 0;
  GAME_STATE.obstacles = [];
  GAME_STATE.particles = [];
  GAME_STATE.spawnTimer = 0;

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function stop() {
  GAME_STATE.running = false;
}
