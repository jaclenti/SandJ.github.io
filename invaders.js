// ═══════════════════════════════════════════════════════
//  S & J — Space Invaders mini-game
//  "Difendi gli sposi dagli alieni!"
// ═══════════════════════════════════════════════════════

// ── CANVAS SETUP ────────────────────────────────────────
const canvas = document.getElementById("game");
const ctx    = canvas.getContext("2d");
const W = canvas.width;   // 320
const H = canvas.height;  // 240

// ── GAME STATES ──────────────────────────────────────────
const STATE_IDLE    = "idle";
const STATE_PLAYING = "playing";
const STATE_ENDED   = "ended";
let gameState = STATE_IDLE;
let wonGame   = false;

// ── GAME OBJECTS ─────────────────────────────────────────
let player, bullets, invaders, invaderDir;
let particles = []; // for explosion sparks
let startTime = 0;
let elapsed   = 0;
let lastTime  = performance.now();

// ── INPUT ─────────────────────────────────────────────────
const keys   = {};
let moveLeft  = false;
let moveRight = false;

// ── SPEEDS (pixels / second) ─────────────────────────────
const BULLET_SPEED = 180;
const SHIP_SPEED   = 130;
let   ALIEN_SPEED  = 40;  // increases as aliens are destroyed

// ── STARFIELD for background atmosphere ─────────────────
const stars = Array.from({ length: 45 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  r: Math.random() * 1.2 + 0.3,
  blink: Math.random() * Math.PI * 2,
}));

// ── KEYBOARD EVENTS ──────────────────────────────────────
document.addEventListener("keydown", e => { keys[e.code] = true; });
document.addEventListener("keyup",   e => { keys[e.code] = false; });

// ── TOUCH CONTROLS ────────────────────────────────────────
document.querySelectorAll("#touchControls button").forEach(btn => {
  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    const d = btn.dataset.dir;
    if (d === "left")  moveLeft  = true;
    if (d === "right") moveRight = true;
    if (d === "fire" && gameState === STATE_PLAYING) shoot();
  });
  btn.addEventListener("touchend", e => {
    e.preventDefault();
    const d = btn.dataset.dir;
    if (d === "left")  moveLeft  = false;
    if (d === "right") moveRight = false;
  });
});

// ── START ─────────────────────────────────────────────────
function startGame() {
  const btn = document.getElementById("startBtn");
  if (btn) btn.blur();

  initGame();
  gameState = STATE_PLAYING;
  wonGame   = false;
  startTime = performance.now();
  lastTime  = performance.now();

  // Glow the canvas while playing
  canvas.classList.add("glow-playing");
}

document.getElementById("startBtn").addEventListener("click", startGame);

function initGame() {
  player     = { x: W / 2 - 10, y: H - 26 };
  bullets    = [];
  particles  = [];
  invaders   = [];
  invaderDir = 1;
  ALIEN_SPEED = 40;

  // 3 rows × 6 columns of invaders
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      // Alternate emoji per row for visual variety
      const glyphs = ["👾", "🛸", "🤖"];
      invaders.push({
        x:     40 + c * 40,
        y:     30 + r * 30,
        glyph: glyphs[r],
      });
    }
  }
}

// ── SHOOT ─────────────────────────────────────────────────
function shoot() {
  // Prevent bullet spam — max 3 on screen at once
  if (bullets.length >= 3) return;
  bullets.push({ x: player.x + 8, y: player.y - 4 });
}

// ── PARTICLE EXPLOSION ────────────────────────────────────
function spawnExplosion(x, y) {
  const colors = ["#ff8a71", "#ffcc00", "#63a4ff", "#ffffff"];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const speed = 40 + Math.random() * 60;
    particles.push({
      x, y,
      vx:   Math.cos(angle) * speed,
      vy:   Math.sin(angle) * speed,
      life: 1,            // 0..1 (fades out)
      color: colors[Math.floor(Math.random() * colors.length)],
      r:    2 + Math.random() * 2,
    });
  }
}

// ── UPDATE ────────────────────────────────────────────────
function update(dt) {
  if (gameState !== STATE_PLAYING) return;

  // Fire on spacebar (single shot per press)
  if (keys["Space"]) {
    shoot();
    keys["Space"] = false;
  }

  // Move player
  if (keys["ArrowLeft"]  || moveLeft)  player.x -= SHIP_SPEED * dt;
  if (keys["ArrowRight"] || moveRight) player.x += SHIP_SPEED * dt;
  player.x = Math.max(0, Math.min(W - 22, player.x));

  // Move bullets upward
  bullets.forEach(b => (b.y -= BULLET_SPEED * dt));
  bullets = bullets.filter(b => b.y > 0);

  // Move particles
  particles.forEach(p => {
    p.x   += p.vx * dt;
    p.y   += p.vy * dt;
    p.vy  += 60 * dt;  // gravity
    p.life -= dt * 1.8;
  });
  particles = particles.filter(p => p.life > 0);

  // Move invaders — check edge
  let edge = false, reachedBottom = false;
  invaders.forEach(i => {
    i.x += (ALIEN_SPEED * invaderDir) * dt;
    if (i.x < 8 || i.x > W - 22) edge = true;
    if (i.y >= player.y - 10)      reachedBottom = true;
  });

  if (reachedBottom) { endGame(false); return; }

  if (edge) {
    invaderDir *= -1;
    invaders.forEach(i => {
      i.y += 10;
      i.x += invaderDir * 2;
    });
  }

  // Bullet ↔ invader collision
  bullets = bullets.filter(b => {
    let hit = false;
    invaders = invaders.filter(inv => {
      const collide = Math.abs(b.x - inv.x) < 13 && Math.abs(b.y - inv.y) < 13;
      if (collide) {
        hit = true;
        spawnExplosion(inv.x + 6, inv.y - 4);
        // Speed up remaining aliens as the herd thins
        ALIEN_SPEED = Math.min(140, 40 + (18 - invaders.length) * 6);
      }
      return !collide;
    });
    return !hit;
  });

  if (invaders.length === 0) endGame(true);
}

// ── DRAW ──────────────────────────────────────────────────
function draw(timestamp) {
  // ── Background — deep space gradient ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0a0e1a");
  bg.addColorStop(1, "#0d1b33");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Twinkling stars ──
  stars.forEach(s => {
    const alpha = 0.4 + 0.4 * Math.sin(s.blink + (timestamp || 0) * 0.0015);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.fill();
  });

  if (gameState === STATE_PLAYING || gameState === STATE_ENDED) {
    // ── HUD ──
    if (gameState === STATE_PLAYING) {
      elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "7px 'Press Start 2P'";
      ctx.textAlign = "left";
      ctx.fillText(`${elapsed}s`, 6, 12);

      // Remaining aliens counter
      ctx.textAlign = "right";
      ctx.fillText(`👾 ${invaders.length}`, W - 6, 12);
    }

    // ── Player ship ──
    ctx.font = "18px serif";
    ctx.textAlign = "left";
    ctx.fillText("🚀", player.x - 1, player.y + 14);

    // ── Bullets — glowing blue bolts ──
    bullets.forEach(b => {
      // Outer glow
      ctx.shadowColor = "#63a4ff";
      ctx.shadowBlur  = 8;
      ctx.fillStyle   = "#ffffff";
      ctx.fillRect(b.x, b.y, 3, 10);
      ctx.shadowBlur = 0;
    });

    // ── Invaders ──
    ctx.font = "14px serif";
    invaders.forEach(i => {
      ctx.fillText(i.glyph, i.x, i.y);
    });

    // ── Particles (explosions) ──
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // ── End screen drawn on top of space background ──
  if (gameState === STATE_ENDED) {
    drawEndScreen();
  }

  // ── Idle screen ──
  if (gameState === STATE_IDLE) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "8px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("PREMI START", W / 2, H / 2 - 8);
    ctx.fillText("PER GIOCARE", W / 2, H / 2 + 8);
  }
}

// ── END SCREEN ────────────────────────────────────────────
function drawEndScreen() {
  const af = "'Press Start 2P', monospace";

  ctx.textAlign = "center";

  if (wonGame) {
    // Animated rainbow gradient title
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0,   "#ffcc00");
    grad.addColorStop(0.5, "#ff8a71");
    grad.addColorStop(1,   "#63a4ff");
    ctx.fillStyle = grad;
    ctx.font = `11px ${af}`;
    ctx.fillText("MISSIONE COMPIUTA!", W / 2, 44);

    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `6px ${af}`;
    ctx.fillText("GRAZIE PER AVER", W / 2, 62);
    ctx.fillText("SALVATO LE NOZZE!", W / 2, 74);
  } else {
    ctx.fillStyle = "#ff4444";
    ctx.font = `12px ${af}`;
    ctx.fillText("GAME OVER!", W / 2, 38);

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = `5.5px ${af}`;
    ctx.fillText("UN ATTACCO ALIENO POTREBBE", W / 2, 56);
    ctx.fillText("MINACCIARE IL MATRIMONIO!", W / 2, 68);
  }

  // Leaderboard
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `6px ${af}`;
  ctx.fillText("── CLASSIFICA ──", W / 2, 100);

  const scores = JSON.parse(localStorage.getItem("weddingScores") || "[]");
  scores.slice(0, 5).forEach((s, i) => {
    const medal = ["🥇","🥈","🥉","  4.","  5."][i];
    ctx.fillStyle = i === 0 ? "#ffcc00" : "rgba(255,255,255,0.65)";
    ctx.font = `6px ${af}`;
    ctx.fillText(`${medal} ${s.name.toUpperCase().slice(0,8)}  ${s.time}S`, W / 2, 118 + i * 15);
  });

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = `5px ${af}`;
  ctx.fillText("PREMI START PER RIPROVARE", W / 2, H - 12);
}

// ── GAME LOOP ─────────────────────────────────────────────
function gameLoop(timestamp) {
  const raw = (timestamp - lastTime) / 1000;
  const dt  = Math.min(raw, 0.1); // cap delta to avoid spiral-of-death
  lastTime  = timestamp;

  update(dt);
  draw(timestamp);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// ── END GAME ──────────────────────────────────────────────
function endGame(success) {
  gameState = STATE_ENDED;
  wonGame   = success;
  canvas.classList.remove("glow-playing");

  if (success) {
    document.getElementById("nameModal").style.display = "flex";
    document.getElementById("playerName").focus();
  }
}

// ── SAVE SCORE ────────────────────────────────────────────
document.getElementById("saveScoreBtn").addEventListener("click", () => {
  const input = document.getElementById("playerName");
  const name  = input.value.trim() || "Anonimo";
  const scores = JSON.parse(localStorage.getItem("weddingScores") || "[]");
  scores.push({ name, time: parseFloat(elapsed) });
  scores.sort((a, b) => a.time - b.time);
  localStorage.setItem("weddingScores", JSON.stringify(scores));
  document.getElementById("nameModal").style.display = "none";
  input.value = "";
});
