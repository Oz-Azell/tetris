const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
nextContext.scale(20, 20);

const colors = [
  null,
  '#FF0D72', '#0DC2FF', '#0DFF72',
  '#F538FF', '#FF8E0D', '#FFE138', '#3877FF',
];

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

function drawMatrix(matrix, offset, ctx, glow = false) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        if (glow) {
          ctx.shadowColor = colors[value];
          ctx.shadowBlur = 10;
        }
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        if (glow) ctx.shadowBlur = 0;
      }
    });
  });
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
        (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) matrix.forEach(row => row.reverse());
  else matrix.reverse();
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function arenaSweep() {
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) continue outer;
    }

    // 🎇 Flash effect on line clear
    for (let i = 0; i < 2; i++) {
      draw();
    }

    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
  }
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 }, context);
  drawMatrix(player.matrix, player.pos, context, true);
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}

function createPiece(type) {
  switch (type) {
    case 'T': return [[0, 0, 0], [1, 1, 1], [0, 1, 0]];
    case 'O': return [[2, 2], [2, 2]];
    case 'L': return [[0, 3, 0], [0, 3, 0], [0, 3, 3]];
    case 'J': return [[0, 4, 0], [0, 4, 0], [4, 4, 0]];
    case 'I': return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
    case 'S': return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    case 'Z': return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
  }
}

function drawNext() {
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const offset = {
    x: Math.floor((4 - next.matrix[0].length) / 2),
    y: Math.floor((4 - next.matrix.length) / 2)
  };
  drawMatrix(next.matrix, offset, nextContext);
}

function showGameOver() {
  document.getElementById("gameOverScreen").style.display = "flex";
  document.getElementById("gameOverSound").play();
}

function playerReset() {
  player.matrix = next.matrix;
  next.matrix = createPiece(randomPiece());
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    showGameOver();
  }

  drawNext();
}

function randomPiece() {
  const pieces = 'TJLOSZI';
  return pieces[(pieces.length * Math.random()) | 0];
}

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') playerMove(-1);
  else if (event.key === 'ArrowRight') playerMove(1);
  else if (event.key === 'ArrowDown') playerDrop();
  else if (event.key === 'ArrowUp') {
    rotate(player.matrix, 1);
    if (collide(arena, player)) rotate(player.matrix, -1);
  }
});

const arena = createMatrix(12, 20);
const player = { pos: { x: 0, y: 0 }, matrix: null };
const next = { matrix: createPiece(randomPiece()) };

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

playerReset();
update();

// 🔊 Unlock music on first interaction
document.addEventListener('keydown', () => {
  const bgMusic = document.getElementById("bgMusic");
  bgMusic.volume = 0.3;
  bgMusic.play().catch(() => {});
}, { once: true });
