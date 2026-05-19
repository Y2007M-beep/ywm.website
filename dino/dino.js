const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreDisplay = document.getElementById("finalScore");

let gameRunning = true;
let score = 0;
let startTime = Date.now();

// Dino object
const dino = {
  x: 50,
  y: 0,
  width: 40,
  height: 50,
  vy: 0,
  gravity: 0.6,
  jumpPower: 15,
  isDucking: false,
  duckHeight: 30,

  update() {
    // Apply gravity (increases with score to make it harder)
    const gravityIncrease = 1 + score / 2000;
    this.vy += this.gravity * gravityIncrease;
    this.y += this.vy;

    // Ground collision
    const groundLevel = canvas.height - 100;
    if (this.y + this.height > groundLevel) {
      this.y = groundLevel - this.height;
      this.vy = 0;
    }
  },

  jump() {
    const groundLevel = canvas.height - 100;
    if (this.y + this.height >= groundLevel && !this.isDucking) {
      this.vy = -this.jumpPower;
    }
  },

  duck() {
    this.isDucking = true;
  },

  stopDuck() {
    this.isDucking = false;
  },

  draw() {
    const actualHeight = this.isDucking ? this.duckHeight : this.height;
    const yOffset = this.isDucking ? this.height - this.duckHeight : 0;

    // Draw dino body
    ctx.fillStyle = "#90EE90";
    ctx.fillRect(this.x, this.y + yOffset, this.width, actualHeight);

    // Draw eyes
    ctx.fillStyle = "#000";
    ctx.fillRect(this.x + 8, this.y + yOffset + 10, 5, 5);
    ctx.fillRect(this.x + 20, this.y + yOffset + 10, 5, 5);

    // Draw tail
    if (!this.isDucking) {
      ctx.fillStyle = "#90EE90";
      ctx.beginPath();
      ctx.moveTo(this.x + this.width, this.y + 15);
      ctx.lineTo(this.x + this.width + 15, this.y + 5);
      ctx.lineTo(this.x + this.width + 10, this.y + 25);
      ctx.closePath();
      ctx.fill();
    }
  },
};

// Cactus object
class Cactus {
  constructor() {
    this.x = canvas.width;
    this.width = 25;
    // Height increases with score, but capped at 90 so dino can still jump over it
    this.height = Math.min(40 + score / 200, 90);
    this.y = canvas.height - 100 - this.height;
    this.speed = 8 + score / 800; // Speed increases with score
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw spikes
    ctx.fillStyle = "#654321";
    ctx.fillRect(this.x - 8, this.y + 10, 8, 8);
    ctx.fillRect(this.x + this.width, this.y + 10, 8, 8);
    ctx.fillRect(this.x - 8, this.y + 25, 8, 8);
    ctx.fillRect(this.x + this.width, this.y + 25, 8, 8);
  }

  isOffScreen() {
    return this.x + this.width < 0;
  }
}

let cacti = [];
let cactusSpawnCounter = 0;

function getCactusSpawnRate() {
  // Spawn rate decreases (faster spawning) as score increases
  return Math.max(40, 100 - score / 50);
}

function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

function gameOver() {
  gameRunning = false;
  gameOverScreen.style.display = "block";
  finalScoreDisplay.textContent = score;
}

function update() {
  if (!gameRunning) return;

  dino.update();

  // Spawn cacti (spawn rate increases with score)
  cactusSpawnCounter++;
  const currentSpawnRate = getCactusSpawnRate();
  if (cactusSpawnCounter >= currentSpawnRate) {
    cacti.push(new Cactus());
    cactusSpawnCounter = 0;
  }

  // Update cacti
  for (let i = cacti.length - 1; i >= 0; i--) {
    cacti[i].update();
    if (cacti[i].isOffScreen()) {
      cacti.splice(i, 1);
    }
  }

  // Collision detection
  const dinoRect = {
    x: dino.x,
    y: dino.y,
    width: dino.width,
    height: dino.isDucking ? dino.duckHeight : dino.height,
  };

  for (let cactus of cacti) {
    if (checkCollision(dinoRect, cactus)) {
      gameOver();
      return;
    }
  }

  // Update score (10 seconds = 100 points)
  const elapsedSeconds = (Date.now() - startTime) / 1000;
  score = Math.floor((elapsedSeconds / 10) * 100);
  scoreDisplay.textContent = score;
}

function draw() {
  // Clear canvas
  ctx.fillStyle = "#E0F6FF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw ground
  ctx.fillStyle = "#8B7355";
  ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

  // Draw grass line
  ctx.strokeStyle = "#90EE90";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 100);
  ctx.lineTo(canvas.width, canvas.height - 100);
  ctx.stroke();

  // Draw dino
  dino.draw();

  // Draw cacti
  for (let cactus of cacti) {
    cactus.draw();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Set initial dino position
dino.y = canvas.height - 100 - dino.height;

// Keyboard controls
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === " ") {
    dino.jump();
    e.preventDefault();
  }
  if (e.key === "ArrowDown") {
    dino.duck();
    e.preventDefault();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowDown") {
    dino.stopDuck();
  }
});

// Start game
gameLoop();
