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
let lastTime = performance.now();

// ====== INPUT HANDLING ======
const keys = {};
let moveLeft = false;
let moveRight = false;

// ====== GAME SPEED (Pixels per second) ======
const bullet_speed = 100; 
const ship_speed = 100;   
const alien_speed = 50;   

// Keyboard Listeners
document.addEventListener("keydown", e => { keys[e.code] = true; });
document.addEventListener("keyup", e => { keys[e.code] = false; });

// Touch Listeners
document.querySelectorAll("#touchControls button").forEach(btn => {
  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    const dir = btn.dataset.dir;
    if (dir === "left") moveLeft = true;
    if (dir === "right") moveRight = true;
    if (dir === "fire" && gameState === STATE_PLAYING) shoot();
  });
  btn.addEventListener("touchend", e => {
    e.preventDefault();
    const dir = btn.dataset.dir;
    if (dir === "left") moveLeft = false;
    if (dir === "right") moveRight = false;
  });
});

// ====== SHOOT LOGIC ======
function shoot() {
  // Fixed: Bullet now spawns at ship's X, not X + 400!
  bullets.push({ x: player.x + 8, y: player.y });
}

// ====== START GAME ======
function startGame() {
  const startBtn = document.getElementById("startBtn");
  if(startBtn) startBtn.blur(); 
  
  initGame();
  gameState = STATE_PLAYING;
  startTime = performance.now();
  lastTime = performance.now(); // Reset lastTime to avoid huge DT jump
}

document.getElementById("startBtn").addEventListener("click", startGame);

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

// ====== UPDATE ======
function update(dt) {
  if (gameState !== STATE_PLAYING) return;

  // Spacebar shoot (with debounce)
  if (keys["Space"]) {
    shoot();
    keys["Space"] = false; 
  }

  // Ship movement
  if (keys["ArrowLeft"] || moveLeft) player.x -= ship_speed * dt;
  if (keys["ArrowRight"] || moveRight) player.x += ship_speed * dt;
  player.x = Math.max(0, Math.min(W - 20, player.x));

  // Bullets
  bullets.forEach(b => (b.y -= bullet_speed * dt));
  bullets = bullets.filter(b => b.y > 0);

  // Invaders
  let edge = false;
  invaders.forEach(i => {
    i.x += (alien_speed * invaderDir) * dt;
    // Check if any invader is hitting the bounds
    if (i.x < 5 || i.x > W - 15) edge = true;
  });

  if (edge) {
    invaderDir *= -1; // Reverse horizontal direction
    invaders.forEach(i => {
      i.y += 10; // Drop down    
      i.x += (invaderDir * 2); 
    });
  }
  
  
  // Collision
  bullets = bullets.filter(b => {
    let hit = false;
    invaders = invaders.filter(i => {
      const isHit = Math.abs(b.x - i.x) < 12 && Math.abs(b.y - i.y) < 12;
      if (isHit) hit = true;
      return !isHit;
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
    ctx.textAlign = "left";
    ctx.fillText(`Time: ${elapsed}s`, 6, 12);

    ctx.font = "16px serif";
    ctx.fillText("🚀", player.x, player.y + 14);

    ctx.fillStyle = "#387dc9";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 2, 6));

    ctx.font = "14px serif";
    invaders.forEach(i => ctx.fillText("👾", i.x, i.y));
  } else if (gameState === STATE_ENDED) {
    drawEndScreen();
  }
}

// ====== MAIN LOOP ======
function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    const capDt = Math.min(dt, 0.1); 

    update(capDt);
    draw();

    requestAnimationFrame(gameLoop);
}

// Start the loop skeleton immediately
requestAnimationFrame(gameLoop);

function endGame() {
  gameState = STATE_ENDED;
  document.getElementById("nameModal").style.display = "block";
  document.getElementById("playerName").focus();
}

// ====== LEADERBOARD ======
function drawEndScreen() {
  ctx.fillStyle = "#e8f4ff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "12px sans-serif";
  ctx.fillText("GRAZIE PER AVER", W / 2, 60);
  ctx.fillText("SALVATO LE NOZZE!", W / 2, 80);

  const scores = JSON.parse(localStorage.getItem("weddingScores") || "[]");
  ctx.font = "10px sans-serif";
  ctx.fillText("CLASSIFICA (TOP 5)", W / 2, 110);

  scores.slice(0, 5).forEach((s, i) => {
    ctx.fillText(`${i + 1}. ${s.name} - ${s.time}s`, W / 2, 130 + i * 14);
  });
}

document.getElementById("saveScoreBtn").addEventListener("click", () => {
  const nameInput = document.getElementById("playerName");
  const name = nameInput.value.trim() || "Anonimo";
  const scores = JSON.parse(localStorage.getItem("weddingScores") || "[]");
  scores.push({ name, time: parseFloat(elapsed) });
  scores.sort((a, b) => a.time - b.time);
  localStorage.setItem("weddingScores", JSON.stringify(scores));
  document.getElementById("nameModal").style.display = "none";
  nameInput.value = "";
});