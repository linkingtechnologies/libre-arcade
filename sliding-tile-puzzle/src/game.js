(function (global) {
  'use strict';

  function randomInt(rng, max) {
    if (rng && typeof rng.nextInt === 'function') return rng.nextInt(max);
    return Math.floor(rng() * max);
  }

  function createSolvedBoard(size) {
    return Array.from({ length: size * size }, (_, i) => i);
  }

  function isSolved(board) {
    for (let i = 0; i < board.length; i += 1) if (board[i] !== i) return false;
    return true;
  }

  function xy(index, size) {
    return { x: index % size, y: Math.floor(index / size) };
  }

  function flat(x, y, size) {
    return y * size + x;
  }

  function areAdjacent(a, b, size) {
    const pa = xy(a, size);
    const pb = xy(b, size);
    return Math.abs(pa.x - pb.x) + Math.abs(pa.y - pb.y) === 1;
  }

  function swap(board, a, b) {
    const t = board[a]; board[a] = board[b]; board[b] = t;
  }

  function slideUnchecked(state, tileIndex) {
    swap(state.board, tileIndex, state.blank);
    state.blank = tileIndex;
  }

  function slide(state, tileIndex) {
    if (state.solved || tileIndex < 0 || tileIndex >= state.board.length || tileIndex === state.blank) return false;
    if (!areAdjacent(tileIndex, state.blank, state.size)) return false;
    slideUnchecked(state, tileIndex);
    state.solved = isSolved(state.board);
    return true;
  }

  // Port of SliderHandler.moveMissingTileTo() from Virtual Toybox 2010.08.11.
  function moveBlankTo(state, target, rng) {
    const destination = xy(target, state.size);
    const direction = { x: 0, y: 0 };
    while (state.blank !== target) {
      const next = xy(state.blank, state.size);
      direction.x = 0; direction.y = 0;
      if (next.x === destination.x) {
        direction.y = destination.y > next.y ? 1 : -1;
      } else if (next.y === destination.y) {
        direction.x = destination.x > next.x ? 1 : -1;
      } else if (randomInt(rng, 2) === 0) {
        direction.y = destination.y > next.y ? 1 : -1;
      } else {
        direction.x = destination.x > next.x ? 1 : -1;
      }
      slideUnchecked(state, flat(next.x + direction.x, next.y + direction.y, state.size));
    }
    return direction;
  }

  // Faithful port of SliderHandler.mix(). The original contains random.nextInt(1),
  // which always yields 0; we intentionally preserve that directional bias.
  function mix(size, rng = Math.random) {
    const tileCount = size * size;
    const state = {
      size,
      board: createSolvedBoard(size),
      blank: randomInt(rng, tileCount),
      solved: false
    };
    const tiles = Array.from({ length: tileCount }, (_, i) => i);
    const cycles = Math.floor(24 / tileCount) + 3;

    for (let j = 0; j < cycles; j += 1) {
      for (let i = 0; i < tileCount; i += 1) {
        const t = randomInt(rng, tileCount);
        const tmp = tiles[t]; tiles[t] = tiles[i]; tiles[i] = tmp;
      }
      for (let i = 0; i < tiles.length; i += 1) {
        const direction = moveBlankTo(state, tiles[i], rng);
        const p = xy(tiles[i], size);
        if (direction.x === 0) {
          // Original: random.nextInt(1)*2 - 1 => always -1 away from edges.
          p.x += p.x === 0 ? 1 : p.x === size - 1 ? -1 : (randomInt(rng, 1) * 2 - 1);
        } else {
          p.y += p.y === 0 ? 1 : p.y === size - 1 ? -1 : (randomInt(rng, 1) * 2 - 1);
        }
        slideUnchecked(state, flat(p.x, p.y, size));
      }
    }
    state.solved = false; // matches the original even if a rare shuffle returns solved
    return state;
  }

  function layout(imageWidth, imageHeight, size) {
    const tile = Math.floor(Math.min(imageWidth, imageHeight) / size);
    const puzzle = tile * size;
    return {
      imageWidth, imageHeight, size, tile,
      puzzleWidth: puzzle,
      puzzleHeight: puzzle,
      offsetX: Math.floor((imageWidth - puzzle) / 2),
      offsetY: Math.floor((imageHeight - puzzle) / 2)
    };
  }

  function fitImage(width, height, maxWidth = 1100, maxHeight = 760) {
    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
  }

  function computeViewport(canvasWidth, canvasHeight, logicalWidth, logicalHeight, padding = 18) {
    const availW = Math.max(1, canvasWidth - padding * 2);
    const availH = Math.max(1, canvasHeight - padding * 2);
    const scale = Math.min(availW / logicalWidth, availH / logicalHeight);
    const width = logicalWidth * scale;
    const height = logicalHeight * scale;
    return { scale, x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2, width, height };
  }

  function canvasToLogical(x, y, viewport) {
    return { x: (x - viewport.x) / viewport.scale, y: (y - viewport.y) / viewport.scale };
  }

  // Keyboard accessibility: arrow keys move the blank one cell in that direction.
  // This is an alternate input path only; it still performs the same legal slide.
  function keyboardTarget(blank, size, key) {
    const p = xy(blank, size);
    if (key === 'ArrowLeft' && p.x > 0) return blank - 1;
    if (key === 'ArrowRight' && p.x < size - 1) return blank + 1;
    if (key === 'ArrowUp' && p.y > 0) return blank - size;
    if (key === 'ArrowDown' && p.y < size - 1) return blank + size;
    return -1;
  }

  // Java-compatible HSB conversion used by PuzzleCanvas.setMeanColor() in 2010.
  function rgbToHsb(r, g, b) {
    const cmax = Math.max(r, g, b);
    const cmin = Math.min(r, g, b);
    const brightness = cmax / 255;
    const saturation = cmax !== 0 ? (cmax - cmin) / cmax : 0;
    let hue = 0;
    if (saturation !== 0) {
      const redc = (cmax - r) / (cmax - cmin);
      const greenc = (cmax - g) / (cmax - cmin);
      const bluec = (cmax - b) / (cmax - cmin);
      if (r === cmax) hue = bluec - greenc;
      else if (g === cmax) hue = 2 + redc - bluec;
      else hue = 4 + greenc - redc;
      hue /= 6;
      if (hue < 0) hue += 1;
    }
    return { h: hue, s: saturation, b: brightness };
  }

  function hsbToHex(hue, saturation, brightness) {
    let r = 0, g = 0, b = 0;
    if (saturation === 0) {
      r = g = b = Math.floor(brightness * 255 + 0.5);
    } else {
      let h = (hue - Math.floor(hue)) * 6;
      const f = h - Math.floor(h);
      const p = brightness * (1 - saturation);
      const q = brightness * (1 - saturation * f);
      const t = brightness * (1 - saturation * (1 - f));
      switch (Math.floor(h)) {
        case 0: r = brightness; g = t; b = p; break;
        case 1: r = q; g = brightness; b = p; break;
        case 2: r = p; g = brightness; b = t; break;
        case 3: r = p; g = q; b = brightness; break;
        case 4: r = t; g = p; b = brightness; break;
        default: r = brightness; g = p; b = q; break;
      }
      r = Math.floor(r * 255 + 0.5);
      g = Math.floor(g * 255 + 0.5);
      b = Math.floor(b * 255 + 0.5);
    }
    return `#${[r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')}`;
  }

  function backgroundFromMean(r, g, b) {
    const hsb = rgbToHsb(r, g, b);
    const brightness = (hsb.b < 0.35 || hsb.b > 0.65) ? 0.5 : hsb.b + 0.15;
    return hsbToHex(hsb.h + 0.5, 1, brightness);
  }

  const api = {
    createSolvedBoard, isSolved, areAdjacent, slide, mix, layout, fitImage,
    computeViewport, canvasToLogical, keyboardTarget, backgroundFromMean
  };
  global.STPGame = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
