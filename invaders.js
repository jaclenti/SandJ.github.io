const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

let player = { x: W / 2 - 10, y: H - 20 };
let bullets = [];
let invaders = [];

for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 6; c++) {
    invaders.push({ x: 40 + c * 40, y: 30 + r * 30 });
  }
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") player.x -= 10;
  if (e.key === "ArrowRight") player.x += 10;
  if (e.key === " ") bullets.push({ x: player.x + 8, y: player.y });
});

function update() {
  bullets.forEach(b => b.y -= 4);

  bullets = bullets.filter(b => b.y > 0);
  invaders = invaders.filter(i => {
    return !bullets.some(b =>
      Math.abs(b.x - i.x) < 10 && Math.abs(b.y - i.y) < 10
    );
  });
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // player
  ctx.fillRect(player.x, player.y, 20, 6);

  // bullets
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 2, 6));

  // invaders
  invaders.forEach(i => ctx.fillRect(i.x, i.y, 14, 10));
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
