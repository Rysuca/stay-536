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

function draw() {
  // Translucent fill instead of a full clear leaves a fading trail behind.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawOrbit();
  drawDuo();
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

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function stop() {
  GAME_STATE.running = false;
}
