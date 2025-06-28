// === Maze Constants ===
const WIDTH = 25;
const HEIGHT = 25;
const TRAP_COUNT = 18;
const WALL = "🟧";
const RABBIT = "🐰";
const CARROT = "🥕";
const TRAPS = ["🐍", "💣"];
const EMPTY = "🌿";

let maze = [],
  visited = [],
  rabbit = { x: 1, y: 1 },
  carrot = { x: 0, y: 0 };
let time = 0,
  timerInterval,
  gameOver = false;
let winCount = 0,
  loseCount = 0;

// === Game Setup ===
function initMaze() {
  maze = Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => WALL)
  );
  visited = Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => false)
  );
  gameOver = false;
  document.getElementById("result").innerHTML = "";
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateMaze(x, y) {
  visited[y][x] = true;
  maze[y][x] = EMPTY;
  for (const [dx, dy] of shuffle([
    [0, -2],
    [0, 2],
    [-2, 0],
    [2, 0],
  ])) {
    const nx = x + dx,
      ny = y + dy;
    if (
      ny > 0 &&
      ny < HEIGHT - 1 &&
      nx > 0 &&
      nx < WIDTH - 1 &&
      !visited[ny][nx]
    ) {
      maze[y + dy / 2][x + dx / 2] = EMPTY;
      generateMaze(nx, ny);
    }
  }
}

function placeCarrot() {
  let x, y;
  do {
    x = Math.floor(Math.random() * (WIDTH - 2)) + 1;
    y = Math.floor(Math.random() * (HEIGHT - 2)) + 1;
  } while (
    maze[y][x] !== EMPTY ||
    Math.abs(x - rabbit.x) + Math.abs(y - rabbit.y) < 10
  );
  carrot = { x, y };
  maze[y][x] = CARROT;
}

function placeTraps() {
  let placed = 0;
  while (placed < TRAP_COUNT) {
    const x = Math.floor(Math.random() * (WIDTH - 2)) + 1;
    const y = Math.floor(Math.random() * (HEIGHT - 2)) + 1;
    if (maze[y][x] === EMPTY && !(x === rabbit.x && y === rabbit.y)) {
      maze[y][x] = TRAPS[Math.floor(Math.random() * TRAPS.length)];
      placed++;
    }
  }
}

function drawMaze() {
  const mazeDiv = document.getElementById("maze");
  mazeDiv.innerHTML = "";
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      if (x === rabbit.x && y === rabbit.y) {
        tile.classList.add("rabbit");
        tile.textContent = RABBIT;
      } else if (maze[y][x] === WALL) {
        tile.classList.add("wall");
        tile.textContent = WALL;
      } else if (maze[y][x] === CARROT) {
        tile.classList.add("carrot");
        tile.textContent = CARROT;
      } else if (TRAPS.includes(maze[y][x])) {
        tile.classList.add("trap");
        tile.textContent = maze[y][x];
      } else {
        tile.classList.add("empty");
        tile.textContent = EMPTY;
      }
      mazeDiv.appendChild(tile);
    }
  }
}

function moveRabbit(dx, dy) {
  if (gameOver) return;
  const nx = rabbit.x + dx,
    ny = rabbit.y + dy;
  if (maze[ny]?.[nx] === WALL) return;

  const cell = maze[ny][nx];
  if (TRAPS.includes(cell)) return endGame(false);
  if (cell === CARROT) return endGame(true);

  rabbit.x = nx;
  rabbit.y = ny;
  drawMaze();
}

function disarmTrap() {
  if (gameOver) return;
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  for (const [dx, dy] of dirs) {
    const x = rabbit.x + dx;
    const y = rabbit.y + dy;
    if (TRAPS.includes(maze[y]?.[x])) maze[y][x] = EMPTY;
  }
  drawMaze();
}

function spawnParticles(x, y, color) {
  const num = 20;
  for (let i = 0; i < num; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.backgroundColor = color;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;

    const angle = Math.random() * 2 * Math.PI;
    const dist = 50 + Math.random() * 30;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;

    p.style.setProperty("--dx", dx);
    p.style.setProperty("--dy", dy);

    document.body.appendChild(p);
    setTimeout(() => {
      p.style.transform = `translate(${dx}px, ${dy}px)`;
      p.style.opacity = "0";
    }, 10);
    setTimeout(() => p.remove(), 1100);
  }
}

function endGame(won) {
  if (gameOver) return;
  gameOver = true;
  clearInterval(timerInterval);

  const mazeDiv = document.getElementById("maze");
  const tiles = mazeDiv.children;

  for (let tile of tiles) {
    if (tile.classList.contains("rabbit")) {
      tile.classList.remove("winning", "dying");
      void tile.offsetWidth;
      tile.classList.add(won ? "winning" : "dying");
      const rect = tile.getBoundingClientRect();
      spawnParticles(
        rect.left + tile.offsetWidth / 2,
        rect.top + tile.offsetHeight / 2,
        won ? "#0f0" : "red"
      );
      break;
    }
  }

  const resultText = won
    ? `🎉 You got the carrot!`
    : `<span style="color:red;">💥 You hit a trap!</span>`;
  document.getElementById("result").innerHTML = `
    <p>${resultText}</p>
    <button class="play-again" onclick="startGame()">Play Again</button>
    <p>Press <strong>Space</strong> to restart</p>
  `;

  if (won) {
    winCount++;
    document.getElementById("win-count").textContent = winCount;
  } else {
    loseCount++;
    document.getElementById("lose-count").textContent = loseCount;
  }
}

function startTimer() {
  time = 0;
  document.getElementById("timer").textContent = `Time: ${time}s`;
  timerInterval = setInterval(() => {
    time++;
    document.getElementById("timer").textContent = `Time: ${time}s`;
  }, 1000);
}

function startGame() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("game-container").style.display = "flex";
  initMaze();
  generateMaze(1, 1);
  rabbit = { x: 1, y: 1 };
  placeCarrot();
  placeTraps();
  drawMaze();
  startTimer();
}

// === Controls ===
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "w" || e.key === "ArrowUp") moveRabbit(0, -1);
  else if (key === "s" || e.key === "ArrowDown") moveRabbit(0, 1);
  else if (key === "a" || e.key === "ArrowLeft") moveRabbit(-1, 0);
  else if (key === "d" || e.key === "ArrowRight") moveRabbit(1, 0);
  else if (key === "e" || e.code === "ShiftRight") disarmTrap();
  else if (e.key === " " && gameOver) startGame();
});

// === Touch & UI Events ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start-btn").addEventListener("click", () => {
    startGame();
  });

  ["up", "down", "left", "right", "disarm"].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (id === "disarm") return disarmTrap();
      const move = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      moveRabbit(...move[id]);
    });
    btn.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        if (id === "disarm") disarmTrap();
        else
          moveRabbit(
            ...{ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[id]
          );
      },
      { passive: false }
    );
  });

  document
    .getElementById("toggle-instructions")
    .addEventListener("click", () => {
      const box = document.getElementById("instructions-box");
      box.style.display = box.style.display === "block" ? "none" : "block";
    });
});
