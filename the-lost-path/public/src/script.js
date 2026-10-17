const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// constants
const tileSize = 50;
// Libre Arcade: rows, cols and the two timer settings are `let` so that
// menu.js can change them for the difficulty levels (specs/design.md).
// The defaults reproduce upstream exactly.
let rows = 20;
let cols = 20;
let timeBase = 0;
let timePerTile = 5;
const movementSpeed = 3;

// game variables
let maze = [];
let player = { x: 1, y: 1, vx: 0, vy: 0 };
let finish = { x: cols - 2, y: rows - 2 };
let trail = [];
let debugMode = false;
let debugModeCheat = false;
let gameFinished = false;
let keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
let overlay = null;
let startTime = null;
let lastTime = 0;

// timer element
const timerElement = document.createElement('div');
timerElement.setAttribute('id', 'timer');
document.body.appendChild(timerElement);

// initial dimensions
canvas.width = cols * tileSize;
canvas.height = rows * tileSize;

// event listeners
document.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
        // start the timer when the user starts playing
        if (!startTime) {
            startTime = Date.now();
            updateTimer();
        }
    }
    if (e.shiftKey && e.key === 'D') { // "Shift + d" for debug mode
        debugModeCheat = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

// functions
function generateMaze() {
    maze = Array(rows).fill().map(() => Array(cols).fill(1));

    function carvePath(x, y) {
        maze[x][y] = 0;
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]].sort(() => Math.random() - 0.5);

        for (let [dx, dy] of directions) {
            const nx = x + dx * 2;
            const ny = y + dy * 2;

            if (nx > 0 && ny > 0 && nx < rows - 1 && ny < cols - 1 && maze[nx][ny] === 1) {
                maze[x + dx][y + dy] = 0;
                carvePath(nx, ny);
            }
        }
    }

    carvePath(1, 1);

    for (let i = 0; i < 5; i++) { 
        let x = Math.floor(Math.random() * (rows - 2)) + 1;
        let y = Math.floor(Math.random() * (cols - 2)) + 1;
        if (maze[x][y] === 0){
            carvePath(x, y)
        } else i--;
    }

    finish = findReachableEndPoint();

    player = { x: 1, y: 1 };
    trail = [];
    gameFinished = false;
}

// finding the open paths to plant elements
function findReachableEndPoint() {
    const potentialEndPoints = [];
    for (let row = rows - 2; row > 0; row--) {
      for (let col = cols - 2; col > 0; col--) {
        if (maze[row][col] === 0) { // checking if path cell is open
          potentialEndPoints.push({x: col, y:row});
        }
      }
    }
    const randomIndex = Math.floor(Math.random() * potentialEndPoints.length);
    return potentialEndPoints[randomIndex];
}

function createRestartButton() {
    const restartButton = document.createElement('button');
    restartButton.setAttribute('id', 'restartButton');
    restartButton.textContent = 'Restart';
    document.body.appendChild(restartButton);
    return restartButton;
}

// calculating possible time needed to solve the puzzle
function calculateTotalTime() {
    const path = findShortestPath(maze, player, finish);
    if (path) {
        totalTime = Math.max(timeBase + path.length * timePerTile, 5); // ensuring totalTime is never less than 5 sec
    } else {
        totalTime = 60; // if no path found, set a default time of 60 sec
    }
}

// finding the shortest path to the solution for calculateTotalTime()
function findShortestPath(maze, start, end) {
    const queue = [[start, []]];
    const visited = new Set();

    while (queue.length > 0) {
        const [{ x, y }, path] = queue.shift();
        const posKey = `${x},${y}`;

        if (visited.has(posKey)) continue;
        visited.add(posKey);

        if (x === end.x && y === end.y) {
            return path; // found the shortest path
        }

        const neighbors = [
            { x: x + 1, y },
            { x: x - 1, y },
            { x, y: y + 1 },
            { x, y: y - 1 },
        ];

        for (const neighbor of neighbors) {
            const nx = neighbor.x;
            const ny = neighbor.y;

            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] === 0) {
                queue.push([{ x: nx, y: ny }, [...path, { x: nx, y: ny }]]);
            }
        }
    }

    return null; // no path found
}

function restartGame() {
    gameFinished = false;
    
    player = { x: 1, y: 1, vx: 0, vy: 0 };
    trail = [];

    generateMaze();
    calculateTotalTime(); // calculate total time after maze is generated

    startTime = null; // Reset startTime to null
    lastTime = 0;

    // Initial canvas setup
    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;

    if (overlay) {
        document.body.removeChild(overlay);
        overlay = null;
    }

    timerElement.classList.remove('red');

    if (!debugMode){
        debugModeCheat = false;
    }else{
        debugModeCheat = true;
    }

    // Initial drawing
    drawMaze(); // No need to pass offsetX, offsetY here
    drawPlayer(); // No need to pass offsetX, offsetY here

    updateTimer(); // Initialize the timer display
    requestAnimationFrame(gameLoop); // Start the game loop
}

function movePlayer(deltaTime) {
    player.vx = 0;
    player.vy = 0;

    if (keys.ArrowUp) player.vy = -movementSpeed;
    if (keys.ArrowDown) player.vy = movementSpeed;
    if (keys.ArrowLeft) player.vx = -movementSpeed;
    if (keys.ArrowRight) player.vx = movementSpeed;

    let nextX = player.x + player.vx * deltaTime;
    let nextY = player.y + player.vy * deltaTime;

    const nextRow = Math.floor(nextY);
    const nextCol = Math.floor(nextX);

    if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols && maze[nextRow][nextCol] === 0) {
        player.x = nextX;
        player.y = nextY;

        const alreadyExists = trail.find((t) => t.x === nextCol && t.y === nextRow);
        if (!alreadyExists) {
            trail.push({ x: nextCol, y: nextRow });
        }
    }

    if (Math.floor(player.x) === finish.x && Math.floor(player.y) === finish.y) {
        gameFinished = true;
        overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        overlay.style.color = '#fff';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontSize = '2rem';
        if (debugModeCheat) {
            overlay.textContent = "You Won! But at what cost :(";
        } else {
            overlay.textContent = 'Congratulations! You finished the maze :)';
        }
        document.body.appendChild(overlay);

        setTimeout(restartGame, 3000);
    }
}

function drawMaze(offsetX, offsetY) {
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (debugModeCheat) { //Display all possible paths in debug mode
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (maze[row][col] === 0) {  // Path
                    ctx.fillStyle = 'white'; // Highlight path
                    ctx.fillRect(col * tileSize - offsetX, row * tileSize - offsetY, tileSize, tileSize);
                } 
            }
        }
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * tileSize - offsetX;
          const y = row * tileSize - offsetY;
    
          if (maze[row][col] === 1) {
            ctx.fillStyle = '#0b0b0b';
            ctx.fillRect(x, y, tileSize, tileSize);
          }
        }
    }

    // Draw trail (grey dots)
    trail.forEach(({ x, y }) => {
    const trailX = x * tileSize - offsetX;
    const trailY = y * tileSize - offsetY;
    ctx.fillStyle = 'grey';
    ctx.beginPath();
    ctx.arc(trailX + tileSize / 2, trailY + tileSize / 2, tileSize / 8, 0, Math.PI * 2);
    ctx.fill();
    });
}

function drawPlayer(offsetX, offsetY) {
    const x = player.x * tileSize - offsetX;
    const y = player.y * tileSize - offsetY;
  
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(x, y, tileSize / 4, 0, Math.PI * 2);
    ctx.fill();
  
    // Draw the finish point (blue dot)
    const finishX = finish.x * tileSize - offsetX;
    const finishY = finish.y * tileSize - offsetY;
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(finishX + tileSize / 2, finishY + tileSize / 2, tileSize / 4, 0, Math.PI * 2);
    ctx.fill();
}

// Display the congratulations screen
function drawCongratulationsScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Congratulations!', canvas.width / 2, canvas.height / 2);
}

function gameLoop(time) {
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    if (!gameFinished) {
        movePlayer(deltaTime);

        // Centering the player:
        const offsetX = player.x * tileSize - canvas.width / 2 + tileSize / 2;
        const offsetY = player.y * tileSize - canvas.height / 2 + tileSize / 2;

        drawMaze(offsetX, offsetY); // Pass offsets to drawMaze and drawPlayer
        drawPlayer(offsetX, offsetY);
    }

    if (restartButton.clicked) { // Reset keys after restart and win only.
         keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
         restartButton.clicked = false;
    }       

    requestAnimationFrame(gameLoop);
}

function updateTimer() {
    if (gameFinished) return;

    // Use startTime for elapsed time calculation:
    const elapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const remainingTime = Math.max(0, totalTime - elapsedTime);

    const minutes = Math.floor(remainingTime / 60);
    const seconds = Math.floor(remainingTime % 60);
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    timerElement.textContent = `Time: ${formattedTime}`;

    // Add or remove "red" class based on remaining time
    if (remainingTime <= 10) {
        timerElement.classList.add('red');
    } else {
        timerElement.classList.remove('red');
    }

    if (remainingTime === 0) {
        gameFinished = true;
        overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        overlay.style.color = '#fff';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontSize = '2rem';
        overlay.textContent = 'Time\'s Up! Try Again.';
        document.body.appendChild(overlay);

        setTimeout(restartGame, 5000);
        return; // Stop the timer
    }

    requestAnimationFrame(updateTimer);
}

createRestartButton();
const restartButton = document.querySelector('button');
restartButton.addEventListener('click', () => {
    restartGame();
});

restartGame();
gameLoop();
updateTimer();