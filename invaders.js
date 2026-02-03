// ====== CANVAS ======
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// ====== GAME STATES ======
const STATE_IDLE = "idle";
const STATE_PLAYING = "playing";
const STATE_ENDED = "ended";
let gameState = STATE_IDLE;

// ====== GAME DATA ======
let player, bullets, invaders, invaderDir;
let startTime = 0;
let elapsed = 0;
let animationId = null;

// ====== INPUT ======
const keys = {};

document.addEventListener("keydown", e => {
  keys[e.code] = true;
});

document.addEventListener("keyup", e => {
  keys[e.code] = false;
});

document.addEventListener("keydown", e => {
  if (gameState !== STATE_PLAYING) return;
  keys[e.code] = true;
});

document.addEventListener("keyup", e => {
  keys[e.code] = false;
});

document.getElementById("startBtn").addEventListener("click", e => {
  e.target.blur();   // 🔥 THIS LINE FIXES THE RESTART BUG
  startGame();
});


// ====== INIT ======
function initGame() {
  player = { x: W / 2 - 10, y: H - 24 };
  bullets = [];
  invaders = [];
  invaderDir = 1;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      invaders.push({ x: 40 + c * 40, y: 30 + r * 30 });
    }
  }
}

// ====== START ======
function startGame() {
  cancelAnimationFrame(animationId);
  initGame();
  startTime = performance.now();
  gameState = STATE_PLAYING;
  loop();
}

document.getElementById("startBtn").addEventListener("click", startGame);

// ====== UPDATE ======
function update() {
  if (gameState !== STATE_PLAYING) return;

  // Movement
  if (keys["ArrowLeft"]) player.x -= 4;
  if (keys["ArrowRight"]) player.x += 4;
  player.x = Math.max(0, Math.min(W - 20, player.x));

  // Shoot (single press)
  if (keys["Space"]) {
    bullets.push({ x: player.x + 8, y: player.y });
    keys["Space"] = false;
  }

  bullets.forEach(b => (b.y -= 5));
  bullets = bullets.filter(b => b.y > 0);

  // Invader movement
  let edge = false;
  invaders.forEach(i => {
    i.x += invaderDir;
    if (i.x < 10 || i.x > W - 20) edge = true;
  });

  if (edge) {
    invaderDir *= -1;
    invaders.forEach(i => (i.y += 10));
  }

  // Collision (1 bullet = 1 alien)
  bullets = bullets.filter(b => {
    let hit = false;
    invaders = invaders.filter(i => {
      const c = Math.abs(b.x - i.x) < 12 && Math.abs(b.y - i.y) < 12;
      if (c) hit = true;
      return !c;
    });
    return !hit;
  });

  if (invaders.length === 0) endGame();
}

// ====== DRAW ======
function draw() {
  ctx.fillStyle = "#e8f4ff";
  ctx.fillRect(0, 0, W, H);

  if (gameState === STATE_PLAYING) {
    elapsed = ((performance.now() - startTime) / 1000).toFixed(1);

    ctx.fillStyle = "#333";
    ctx.font = "10px sans-serif";
    ctx.fillText(`Time: ${elapsed}s`, 6, 12);

    ctx.font = "16px serif";
    ctx.fillText("🚀", player.x, player.y + 14);

    bullets.forEach(b => ctx.fillRect(b.x, b.y, 2, 6));

    ctx.font = "14px serif";
    invaders.forEach(i => ctx.fillText("👾", i.x, i.y));
  }

  if (gameState === STATE_ENDED) {
    drawEndScreen();
  }
}

// ====== LOOP ======
function loop() {
  update();
  draw();
  if (gameState === STATE_PLAYING) {
    animationId = requestAnimationFrame(loop);
  }
}

function endGame() {
  gameState = STATE_ENDED;
  cancelAnimationFrame(animationId);

  document.getElementById("nameModal").style.display = "block";
  document.getElementById("playerName").focus();
}


// ====== END SCREEN ======
function drawEndScreen() {
  ctx.fillStyle = "#e8f4ff";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#000";
  ctx.textAlign = "center";

  ctx.font = "12px 'Press Start 2P'";
  ctx.fillText("Grazie per aver", W / 2, 60);
  ctx.fillText("salvato il matrimonio!", W / 2, 80);

  const scores = JSON.parse(localStorage.getItem("weddingScores") || "[]");

  ctx.font = "8px 'Press Start 2P'";
  ctx.fillText("Classifica", W / 2, 110);

  scores.slice(0, 5).forEach((s, i) => {
    ctx.fillText(`${i + 1}. ${s.name} - ${s.time}s`, W / 2, 130 + i * 14);
  });

  ctx.textAlign = "left";
}

document.getElementById("saveScoreBtn").addEventListener("click", () => {
  const nameInput = document.getElementById("playerName");
  const name = nameInput.value.trim() || "Anonimo";

  const scores = JSON.parse(localStorage.getItem("weddingScores") || "[]");
  scores.push({ name, time: elapsed });
  scores.sort((a, b) => a.time - b.time);
  localStorage.setItem("weddingScores", JSON.stringify(scores));

  document.getElementById("nameModal").style.display = "none";
  nameInput.value = "";

  drawEndScreen();
});
