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

function update(dt) {
  // Advance simulation time and apply per-frame logic (spheres, obstacles, scoring).
  GAME_STATE.time += dt;
}

function draw() {
  // Clear the frame before painting the scene.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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
