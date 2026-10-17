// A torch for The Lost Path. Not part of upstream: upstream draws walls and
// corridors in the same colour as the background, so the maze is invisible
// unless Shift+D (debug) is on, and its README lists a "Player Torch" under
// the unbuilt version 2. This file draws a second, transparent canvas over
// the game canvas showing the corridors within a few tiles of the player,
// fading out with distance. It only reads script.js's globals (maze, player,
// tileSize, finish, canvas, debugModeCheat) and never changes them.
(function () {
  const game = document.getElementById('gameCanvas');
  const layer = document.createElement('canvas');
  const ctx = layer.getContext('2d');
  // Torch radius in tiles; difficulty.js sets it per level.
  const radiusTiles = () => (globalThis.LPCurrent ? globalThis.LPCurrent.torch : 3.5);

  // On levels with `hideFinish`, an opaque layer (normal blending, unlike the
  // torch) paints over the blue finish dot until it is inside the torch's
  // reach; upstream draws it anywhere on screen.
  const fog = document.createElement('canvas');
  const fogCtx = fog.getContext('2d');

  fog.id = 'fogLayer';
  layer.id = 'torchLayer';
  document.body.insertBefore(fog, game.nextSibling);
  document.body.insertBefore(layer, fog.nextSibling);

  function drawFog() {
    fogCtx.clearRect(0, 0, fog.width, fog.height);
    const level = globalThis.LPCurrent;
    if (!level || !level.hideFinish || debugModeCheat || !maze.length) return;
    if (Math.hypot(player.x - finish.x, player.y - finish.y) <= radiusTiles()) return;
    const x = finish.x * tileSize - (player.x * tileSize - game.width / 2 + tileSize / 2) + tileSize / 2;
    const y = finish.y * tileSize - (player.y * tileSize - game.height / 2 + tileSize / 2) + tileSize / 2;
    fogCtx.fillStyle = '#0b0b0b'; // upstream's background colour
    fogCtx.beginPath();
    fogCtx.arc(x, y, tileSize / 3, 0, Math.PI * 2);
    fogCtx.fill();
  }

  function draw() {
    if (layer.width !== game.width || layer.height !== game.height) {
      layer.width = game.width;
      layer.height = game.height;
      fog.width = game.width;
      fog.height = game.height;
    }
    drawFog();
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, layer.width, layer.height);
    // Debug mode already lights every corridor by itself.
    if (debugModeCheat || !maze.length) return;

    // Same world-to-screen mapping as gameLoop() in script.js.
    const offsetX = player.x * tileSize - game.width / 2 + tileSize / 2;
    const offsetY = player.y * tileSize - game.height / 2 + tileSize / 2;
    const cx = game.width / 2;
    const cy = game.height / 2;
    const reach = Math.ceil(radiusTiles()) + 1;
    const pr = Math.floor(player.y);
    const pc = Math.floor(player.x);

    ctx.fillStyle = '#6b7fa8';
    for (let row = Math.max(0, pr - reach); row <= Math.min(maze.length - 1, pr + reach); row++) {
      for (let col = Math.max(0, pc - reach); col <= Math.min(maze[row].length - 1, pc + reach); col++) {
        if (maze[row][col] === 0) {
          ctx.fillRect(col * tileSize - offsetX, row * tileSize - offsetY, tileSize, tileSize);
        }
      }
    }

    // Fade the corridors out with distance from the player.
    const r = radiusTiles() * tileSize;
    const glow = ctx.createRadialGradient(cx, cy, tileSize / 2, cx, cy, r);
    glow.addColorStop(0, 'rgba(0,0,0,1)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, layer.width, layer.height);
  }

  function frame() {
    draw();
    requestAnimationFrame(frame);
  }

  draw();
  frame();
})();
