// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let highScore = localStorage.getItem('pacmanHighScore') || 0;

// Game dimensions
const TILE_SIZE = 20;
const MAZE_WIDTH = Math.floor(canvas.width / TILE_SIZE);
const MAZE_HEIGHT = Math.floor(canvas.height / TILE_SIZE);

// Game entities
let pacman = {
    x: 1,
    y: 1,
    direction: 'right',
    nextDirection: 'right',
    mouthOpen: true,
    animationCounter: 0
};

let ghosts = [
    {
        x: MAZE_WIDTH - 2,
        y: MAZE_HEIGHT - 2,
        direction: 'left',
        speed: 0.648,
        color: '#ff0000'
    },
    {
        x: MAZE_WIDTH - 2,
        y: 1,
        direction: 'down',
        speed: 0.648,
        color: '#ff69b4'
    },
    {
        x: 1,
        y: MAZE_HEIGHT - 2,
        direction: 'up',
        speed: 0.648,
        color: '#00ffff'
    }
];

// Maze layout (1 = wall, 0 = dot, 2 = empty space)
let maze = [];
let totalDots = 0;
let dotsEaten = 0;

// Initialize maze
function createMaze() {
    maze = [];
    totalDots = 0;
    dotsEaten = 0;
    
    // Create a simple maze pattern
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        maze[y] = [];
        for (let x = 0; x < MAZE_WIDTH; x++) {
            // Border walls
            if (x === 0 || x === MAZE_WIDTH - 1 || y === 0 || y === MAZE_HEIGHT - 1) {
                maze[y][x] = 1;
            }
            // Internal walls pattern
            else if ((x % 4 === 0 && y % 4 === 0) || 
                     (x % 8 === 4 && y % 8 === 4) ||
                     (x % 6 === 3 && y % 3 === 0) ||
                     (x % 3 === 0 && y % 6 === 3)) {
                maze[y][x] = 1;
            }
            // Empty spaces near starting positions
            else if ((x <= 2 && y <= 2) || (x >= MAZE_WIDTH - 3 && y >= MAZE_HEIGHT - 3)) {
                maze[y][x] = 2;
            }
            // Dots everywhere else
            else {
                maze[y][x] = 0;
                totalDots++;
            }
        }
    }
    
    // Ensure starting positions are clear
    maze[1][1] = 2; // Pacman start
    maze[MAZE_HEIGHT - 2][MAZE_WIDTH - 2] = 2; // Ghost 1 start
    maze[1][MAZE_WIDTH - 2] = 2; // Ghost 2 start  
    maze[MAZE_HEIGHT - 2][1] = 2; // Ghost 3 start
}

// Drawing functions
function drawMaze() {
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;
            
            if (maze[y][x] === 1) {
                // Draw walls
                ctx.fillStyle = '#0000ff';
                ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#4444ff';
                ctx.lineWidth = 1;
                ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            } else if (maze[y][x] === 0) {
                // Draw dots
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(tileX + TILE_SIZE / 2, tileY + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function drawPacman() {
    const centerX = pacman.x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = pacman.y * TILE_SIZE + TILE_SIZE / 2;
    const radius = TILE_SIZE / 2 - 2;
    
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    
    if (pacman.mouthOpen) {
        // Draw Pacman with mouth open
        let startAngle, endAngle;
        switch (pacman.direction) {
            case 'right':
                startAngle = 0.2 * Math.PI;
                endAngle = 1.8 * Math.PI;
                break;
            case 'left':
                startAngle = 1.2 * Math.PI;
                endAngle = 0.8 * Math.PI;
                break;
            case 'up':
                startAngle = 1.7 * Math.PI;
                endAngle = 1.3 * Math.PI;
                break;
            case 'down':
                startAngle = 0.7 * Math.PI;
                endAngle = 0.3 * Math.PI;
                break;
        }
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
    } else {
        // Draw closed mouth (full circle)
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    }
    
    ctx.fill();
    
    // Animate mouth
    pacman.animationCounter++;
    if (pacman.animationCounter % 10 === 0) {
        pacman.mouthOpen = !pacman.mouthOpen;
    }
}

function drawGhost(ghost) {
    const centerX = ghost.x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = ghost.y * TILE_SIZE + TILE_SIZE / 2;
    const radius = TILE_SIZE / 2 - 2;
    
    // Ghost body
    ctx.fillStyle = ghost.color;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 2, radius, Math.PI, 0);
    ctx.fillRect(centerX - radius, centerY - 2, radius * 2, radius + 2);
    
    // Ghost bottom wavy part
    const waveHeight = 4;
    const waveWidth = radius / 2;
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY + radius);
    for (let i = 0; i < 4; i++) {
        const x = centerX - radius + (i * waveWidth);
        const y = centerY + radius + (i % 2 === 0 ? -waveHeight : 0);
        ctx.lineTo(x, y);
    }
    ctx.lineTo(centerX + radius, centerY + radius);
    ctx.lineTo(centerX + radius, centerY - 2);
    ctx.lineTo(centerX - radius, centerY - 2);
    ctx.fill();
    
    // Ghost eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX - 6, centerY - 8, 4, 6);
    ctx.fillRect(centerX + 2, centerY - 8, 4, 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 5, centerY - 6, 2, 2);
    ctx.fillRect(centerX + 3, centerY - 6, 2, 2);
}

function drawAllGhosts() {
    ghosts.forEach(ghost => drawGhost(ghost));
}

// Game logic
function canMove(x, y) {
    return x >= 0 && x < MAZE_WIDTH && y >= 0 && y < MAZE_HEIGHT && maze[y][x] !== 1;
}

function movePacman() {
    if (!gameRunning || gamePaused) return;
    
    let newX = pacman.x;
    let newY = pacman.y;
    
    // Try to change direction if a new direction is queued
    if (pacman.nextDirection !== pacman.direction) {
        let testX = pacman.x;
        let testY = pacman.y;
        
        switch (pacman.nextDirection) {
            case 'up': testY--; break;
            case 'down': testY++; break;
            case 'left': testX--; break;
            case 'right': testX++; break;
        }
        
        if (canMove(testX, testY)) {
            pacman.direction = pacman.nextDirection;
        }
    }
    
    // Move in current direction
    switch (pacman.direction) {
        case 'up': newY--; break;
        case 'down': newY++; break;
        case 'left': newX--; break;
        case 'right': newX++; break;
    }
    
    if (canMove(newX, newY)) {
        pacman.x = newX;
        pacman.y = newY;
        
        // Check if Pacman ate a dot
        if (maze[pacman.y][pacman.x] === 0) {
            maze[pacman.y][pacman.x] = 2;
            score += 10;
            dotsEaten++;
            updateScore();
            
            // Check win condition
            if (dotsEaten >= totalDots) {
                gameWin();
            }
        }
    }
}

function moveGhosts() {
    if (!gameRunning || gamePaused) return;
    
    ghosts.forEach(ghost => {
        const directions = ['up', 'down', 'left', 'right'];
        let bestDirection = ghost.direction;
        
        // Add randomness to ghost behavior (30% chance to move randomly)
        const randomChance = Math.random();
        
        if (randomChance < 0.3) {
            // Random movement - pick a random valid direction
            const validDirections = directions.filter(dir => {
                let testX = ghost.x;
                let testY = ghost.y;
                
                switch (dir) {
                    case 'up': testY -= ghost.speed; break;
                    case 'down': testY += ghost.speed; break;
                    case 'left': testX -= ghost.speed; break;
                    case 'right': testX += ghost.speed; break;
                }
                
                return canMove(Math.floor(testX), Math.floor(testY));
            });
            
            if (validDirections.length > 0) {
                bestDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
            }
        } else {
            // Chase behavior - move towards Pacman but with some randomness
            let minDistance = Infinity;
            const possibleMoves = [];
            
            for (let dir of directions) {
                let testX = ghost.x;
                let testY = ghost.y;
                
                switch (dir) {
                    case 'up': testY -= ghost.speed; break;
                    case 'down': testY += ghost.speed; break;
                    case 'left': testX -= ghost.speed; break;
                    case 'right': testX += ghost.speed; break;
                }
                
                if (canMove(Math.floor(testX), Math.floor(testY))) {
                    const distance = Math.abs(testX - pacman.x) + Math.abs(testY - pacman.y);
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                    possibleMoves.push({ direction: dir, distance: distance });
                }
            }
            
            // Pick from the best 2 directions (not just the absolute best)
            possibleMoves.sort((a, b) => a.distance - b.distance);
            const topMoves = possibleMoves.slice(0, Math.min(2, possibleMoves.length));
            
            if (topMoves.length > 0) {
                const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
                bestDirection = selectedMove.direction;
            }
        }
        
        ghost.direction = bestDirection;
        
        // Move ghost
        switch (ghost.direction) {
            case 'up': ghost.y -= ghost.speed; break;
            case 'down': ghost.y += ghost.speed; break;
            case 'left': ghost.x -= ghost.speed; break;
            case 'right': ghost.x += ghost.speed; break;
        }
        
        // Keep ghost in bounds
        ghost.x = Math.max(0, Math.min(MAZE_WIDTH - 1, ghost.x));
        ghost.y = Math.max(0, Math.min(MAZE_HEIGHT - 1, ghost.y));
    });
}

function checkCollision() {
    for (let ghost of ghosts) {
        const distance = Math.abs(pacman.x - ghost.x) + Math.abs(pacman.y - ghost.y);
        if (distance < 1) {
            lives--;
            updateLives();
            
            if (lives <= 0) {
                gameOver();
            } else {
                // Reset positions
                pacman.x = 1;
                pacman.y = 1;
                ghosts[0].x = MAZE_WIDTH - 2;
                ghosts[0].y = MAZE_HEIGHT - 2;
                ghosts[1].x = MAZE_WIDTH - 2;
                ghosts[1].y = 1;
                ghosts[2].x = 1;
                ghosts[2].y = MAZE_HEIGHT - 2;
            }
            break; // Only lose one life per collision
        }
    }
}

// UI functions
function updateScore() {
    document.getElementById('score').textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('pacmanHighScore', highScore);
        document.getElementById('high-score').textContent = highScore;
    }
}

function updateLives() {
    document.getElementById('lives').textContent = lives;
}

function gameOver() {
    gameRunning = false;
    document.getElementById('gameOverTitle').textContent = 'Game Over!';
    document.getElementById('gameOverMessage').textContent = 'You ran out of lives!';
    document.getElementById('gameOverModal').classList.remove('hidden');
}

function gameWin() {
    gameRunning = false;
    document.getElementById('gameOverTitle').textContent = 'You Win!';
    document.getElementById('gameOverMessage').textContent = 'You ate all the dots!';
    document.getElementById('gameOverModal').classList.remove('hidden');
}

function resetGame() {
    gameRunning = false;
    gamePaused = false;
    score = 0;
    lives = 3;
    
    pacman.x = 1;
    pacman.y = 1;
    pacman.direction = 'right';
    pacman.nextDirection = 'right';
    
    ghosts[0].x = MAZE_WIDTH - 2;
    ghosts[0].y = MAZE_HEIGHT - 2;
    ghosts[0].direction = 'left';
    
    ghosts[1].x = MAZE_WIDTH - 2;
    ghosts[1].y = 1;
    ghosts[1].direction = 'down';
    
    ghosts[2].x = 1;
    ghosts[2].y = MAZE_HEIGHT - 2;
    ghosts[2].direction = 'up';
    
    createMaze();
    updateScore();
    updateLives();
    document.getElementById('gameOverModal').classList.add('hidden');
}

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        gameLoop();
    }
}

function pauseGame() {
    gamePaused = !gamePaused;
    document.getElementById('pauseBtn').textContent = gamePaused ? 'Resume' : 'Pause';
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    if (!gamePaused) {
        movePacman();
        moveGhosts();
        checkCollision();
    }
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw everything
    drawMaze();
    drawPacman();
    drawAllGhosts();
    
    // Continue loop
    setTimeout(() => gameLoop(), 167);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch (e.key) {
        case 'ArrowUp':
            pacman.nextDirection = 'up';
            e.preventDefault();
            break;
        case 'ArrowDown':
            pacman.nextDirection = 'down';
            e.preventDefault();
            break;
        case 'ArrowLeft':
            pacman.nextDirection = 'left';
            e.preventDefault();
            break;
        case 'ArrowRight':
            pacman.nextDirection = 'right';
            e.preventDefault();
            break;
        case ' ':
            pauseGame();
            e.preventDefault();
            break;
    }
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', pauseGame);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('playAgainBtn').addEventListener('click', () => {
    resetGame();
    startGame();
});

// Initialize game
document.getElementById('high-score').textContent = highScore;
createMaze();

// Draw initial state
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
drawMaze();
drawPacman();
drawAllGhosts();
