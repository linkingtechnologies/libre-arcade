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


(function (global) {
  'use strict';
  global.STPI18N = {
    en: {
      gameMenu:'Game', newGame:'New puzzle', puzzleMenu:'Puzzle', gallery:'Gallery', myImage:'My image', size:'Size', preview:'Preview', backgroundColor:'Background', helpMenu:'Help', help:'Instructions', credits:'Credits', changeLanguage:'Change language', gameControls:'Game controls', boardLabel:'Sliding tile puzzle board', boardHint:'Use click or tap. With the keyboard, the arrow keys move the empty space.', choosePicture:'Choose a picture', galleryIntro:'The original collection included these ten photographs.', helpTitle:'How to play', help1:'Rebuild the picture by sliding tiles into the empty space.', help2:'Click or tap a tile next to the empty space. Only adjacent tiles can move.', help3:'Choose 3×3, 4×4 or 5×5 for a different challenge.', help4:'When the picture is complete, click or tap the board to shuffle it again.', help5:'Choose Gallery for one of the original photographs, or My image for a picture from your device.', help6:'Keyboard: the arrow keys move the empty space. Enter or Space shuffles again after completion.', complete:'Puzzle complete! Tap the board to shuffle again.', closeLabel:'Close', restorationCredit:'HTML5 restoration and preservation by', originalCredit:'Original Sliding Tile Puzzle from Virtual Toybox Puzzle Collection © 2010 Jonathan Hulka. GNU GPL v3 or later.', photosCredit:'Photographs ©', licensedUnder:'licensed under', imageError:'This image could not be opened.', loading:'Loading image…', previewTitle:'Picture preview', previewAlt:'Puzzle image preview'
    },
    it: {
      gameMenu:'Partita', newGame:'Nuovo puzzle', puzzleMenu:'Puzzle', gallery:'Galleria', myImage:'Mia immagine', size:'Dimensione', preview:'Anteprima', backgroundColor:'Sfondo', helpMenu:'Aiuto', help:'Istruzioni', credits:'Crediti', changeLanguage:'Cambia lingua', gameControls:'Controlli di gioco', boardLabel:'Tavola dello Sliding Tile Puzzle', boardHint:'Usa clic o tocco. Con la tastiera, le frecce spostano lo spazio vuoto.', choosePicture:'Scegli un’immagine', galleryIntro:'La raccolta originale includeva queste dieci fotografie.', helpTitle:'Come si gioca', help1:'Ricostruisci l’immagine facendo scorrere le tessere nello spazio vuoto.', help2:'Fai clic o tocca una tessera accanto allo spazio vuoto. Possono muoversi solo le tessere adiacenti.', help3:'Scegli 3×3, 4×4 o 5×5 per cambiare difficoltà.', help4:'Quando l’immagine è completa, fai clic o tocca il tavolo per mescolarla di nuovo.', help5:'Scegli Galleria per una delle fotografie originali, oppure Mia immagine per una foto dal tuo dispositivo.', help6:'Tastiera: le frecce spostano lo spazio vuoto. Invio o Spazio rimescolano dopo il completamento.', complete:'Puzzle completato! Tocca il tavolo per mescolare di nuovo.', closeLabel:'Chiudi', restorationCredit:'Restauro e preservazione HTML5 di', originalCredit:'Sliding Tile Puzzle originale da Virtual Toybox Puzzle Collection © 2010 Jonathan Hulka. GNU GPL v3 o successiva.', photosCredit:'Fotografie ©', licensedUnder:'distribuite con licenza', imageError:'Impossibile aprire questa immagine.', loading:'Caricamento immagine…', previewTitle:'Anteprima immagine', previewAlt:'Anteprima dell’immagine del puzzle'
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);


(function () {
  'use strict';
  const G = globalThis.STPGame;
  const I18N = globalThis.STPI18N;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const complete = document.getElementById('complete');
  const status = document.getElementById('loadStatus');
  const langBtn = document.getElementById('langBtn');
  const sizeSelect = document.getElementById('sizeSelect');
  const backgroundInput = document.getElementById('backgroundInput');
  const imageInput = document.getElementById('imageInput');
  const galleryDialog = document.getElementById('galleryDialog');
  const galleryGrid = document.getElementById('galleryGrid');
  const helpDialog = document.getElementById('helpDialog');
  const creditsDialog = document.getElementById('creditsDialog');
  const previewDialog = document.getElementById('previewDialog');
  const previewImage = document.getElementById('previewImage');

  // Mean RGB values are preserved from pics.xml in Virtual Toybox 2010.08.11.
  const photos = [
    ['Full-202-Tiger-Swallowtail.jpg','Tiger Swallowtail',[98,114,72]],
    ['Full-24-The-Maroon-Bells.jpg','The Maroon Bells',[104,103,100]],
    ['Full-237-Hanging-Lake.jpg','Hanging Lake',[78,102,68]],
    ['Full-261-Yellow-Flower.jpg','Yellow Flower',[84,95,4]],
    ['Full-266-Cascading-Falls.jpg','Cascading Falls',[77,68,38]],
    ['Full-288-Tennessee-Sunset.jpg','Tennessee Sunset',[82,46,47]],
    ['Full-333-Ladybug-in-the-Field.jpg','Ladybug in the Field',[46,64,9]],
    ['Full-334-Light-of-the-Sky.jpg','Light of the Sky',[102,116,137]],
    ['Full-446-Along-the-Banks.jpg','Along the Banks',[70,67,67]],
    ['Full-454-ONeil-Bridge-in-the-Morning.jpg',"O'Neil Bridge in the Morning",[87,97,109]]
  ];

  let lang = 'en';
  let image = new Image();
  let imageSrc = 'assets/photos/Full-202-Tiger-Swallowtail.jpg';
  let logical = null;
  let layout = null;
  let state = null;
  let viewport = null;
  let background = G.backgroundFromMean(98,114,72);
  let activePointer = null;

  function t(key) { return I18N[lang][key] || key; }
  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.querySelectorAll('[data-i18n-alt]').forEach(el => { el.setAttribute('alt', t(el.dataset.i18nAlt)); });
    langBtn.textContent = lang === 'en' ? 'IT' : 'EN';
  }

  function closeMenus() { document.querySelectorAll('.toolbarMenu[open]').forEach(d => d.removeAttribute('open')); }
  document.addEventListener('click', e => { if (!e.target.closest('.toolbarMenu')) closeMenus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });
  document.querySelectorAll('.toolbarMenu').forEach(menu => menu.addEventListener('toggle', () => {
    if (menu.open) document.querySelectorAll('.toolbarMenu').forEach(other => { if (other !== menu) other.removeAttribute('open'); });
  }));

  function resizeCanvas() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    if (logical) viewport = G.computeViewport(r.width, r.height, logical.width, logical.height, 16);
    render();
  }

  function setBackground(color) {
    background = color;
    backgroundInput.value = color;
    render();
  }

  function loadImage(src, mean = null) {
    status.textContent = t('loading'); status.classList.remove('hidden');
    const next = new Image();
    next.onload = () => {
      image = next;
      imageSrc = src;
      // The 2010 app used stored mean colors for bundled photos and neutral gray
      // for a user-selected image, then PuzzleCanvas.setMeanColor() derived the background.
      const rgb = mean || [128,128,128];
      background = G.backgroundFromMean(rgb[0],rgb[1],rgb[2]);
      backgroundInput.value = background;
      status.classList.add('hidden');
      newGame();
    };
    next.onerror = () => { status.textContent=t('imageError'); status.classList.remove('hidden'); };
    next.src = src;
  }

  function newGame() {
    if (!image.naturalWidth) return;
    const fit = G.fitImage(image.naturalWidth, image.naturalHeight);
    logical = fit;
    const size = Number(sizeSelect.value);
    layout = G.layout(logical.width, logical.height, size);
    state = G.mix(size);
    complete.classList.add('hidden');
    const r=canvas.getBoundingClientRect(); viewport=G.computeViewport(r.width,r.height,logical.width,logical.height,16);
    render();
  }

  function render() {
    const cssW=canvas.clientWidth, cssH=canvas.clientHeight;
    const dpr=Math.max(1,window.devicePixelRatio||1);
    ctx.save(); ctx.setTransform(dpr,0,0,dpr,0,0);
    // PuzzleCanvas erased the entire board to its chosen background color.
    ctx.fillStyle=background; ctx.fillRect(0,0,cssW,cssH);
    if (!state || !viewport) { ctx.restore(); return; }
    ctx.translate(viewport.x, viewport.y); ctx.scale(viewport.scale, viewport.scale);
    // SliderHandler leaves the non-square strips of the full photograph visible.
    ctx.drawImage(image,0,0,logical.width,logical.height);
    ctx.fillStyle=background;
    ctx.fillRect(layout.offsetX,layout.offsetY,layout.puzzleWidth,layout.puzzleHeight);
    const tile=layout.tile;
    const edge=Math.max(1,1/viewport.scale);
    for(let pos=0; pos<state.board.length; pos+=1){
      if(!state.solved && pos===state.blank) continue;
      const original=state.board[pos];
      const sx=layout.offsetX+(original%state.size)*tile;
      const sy=layout.offsetY+Math.floor(original/state.size)*tile;
      const dx=layout.offsetX+(pos%state.size)*tile;
      const dy=layout.offsetY+Math.floor(pos/state.size)*tile;
      ctx.drawImage(image, sx/logical.width*image.naturalWidth, sy/logical.height*image.naturalHeight,
        tile/logical.width*image.naturalWidth, tile/logical.height*image.naturalHeight,
        dx,dy,tile,tile);
      // PuzzleCanvas 2010 used a 1 px translucent light/shadow bevel on tiles.
      ctx.lineWidth=edge;
      ctx.strokeStyle='rgba(255,255,255,.376)';
      ctx.beginPath(); ctx.moveTo(dx,dy+tile); ctx.lineTo(dx,dy); ctx.lineTo(dx+tile,dy); ctx.stroke();
      ctx.strokeStyle='rgba(0,0,0,.376)';
      ctx.beginPath(); ctx.moveTo(dx+tile,dy); ctx.lineTo(dx+tile,dy+tile); ctx.lineTo(dx,dy+tile); ctx.stroke();
    }
    ctx.restore();
  }

  function pointerToCell(e) {
    if(!state||!viewport) return -1;
    const r=canvas.getBoundingClientRect();
    const p=G.canvasToLogical(e.clientX-r.left,e.clientY-r.top,viewport);
    if(p.x<layout.offsetX||p.y<layout.offsetY||p.x>=layout.offsetX+layout.puzzleWidth||p.y>=layout.offsetY+layout.puzzleHeight) return -1;
    const col=Math.floor((p.x-layout.offsetX)/layout.tile);
    const row=Math.floor((p.y-layout.offsetY)/layout.tile);
    return row*state.size+col;
  }

  function activateCell(cell) {
    if(!state) return;
    if(state.solved){ state=G.mix(state.size); complete.classList.add('hidden'); render(); return; }
    if(cell>=0 && G.slide(state,cell)){
      if(state.solved) complete.classList.remove('hidden');
      render();
    }
  }

  canvas.addEventListener('pointerdown', e => {
    if(!state) return;
    activePointer={id:e.pointerId,x:e.clientX,y:e.clientY,cell:pointerToCell(e)};
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  canvas.addEventListener('pointerup', e => {
    if(!activePointer || activePointer.id!==e.pointerId) return;
    const moved=Math.hypot(e.clientX-activePointer.x,e.clientY-activePointer.y);
    const cell=pointerToCell(e);
    const startCell=activePointer.cell;
    activePointer=null;
    if(moved<=12 && cell===startCell) activateCell(cell);
  });
  canvas.addEventListener('pointercancel',()=>{activePointer=null;});
  canvas.addEventListener('pointermove', e => {
    if(e.pointerType && e.pointerType!=='mouse') return;
    const cell=pointerToCell(e);
    canvas.style.cursor = state && !state.solved && cell>=0 && G.areAdjacent(cell,state.blank,state.size) ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerleave',()=>{canvas.style.cursor='default';});
  canvas.addEventListener('keydown', e => {
    if(!state) return;
    if(state.solved && (e.key==='Enter'||e.key===' ')) { e.preventDefault(); activateCell(-1); return; }
    const target=G.keyboardTarget(state.blank,state.size,e.key);
    if(target>=0){ e.preventDefault(); activateCell(target); }
  });

  document.getElementById('newBtn').addEventListener('click',()=>{newGame();closeMenus();});
  sizeSelect.addEventListener('change',()=>{newGame();closeMenus();});
  backgroundInput.addEventListener('input',()=>setBackground(backgroundInput.value));
  document.getElementById('galleryBtn').addEventListener('click',()=>{galleryDialog.showModal();closeMenus();});
  document.getElementById('previewBtn').addEventListener('click',()=>{previewImage.src=imageSrc;previewDialog.showModal();closeMenus();});
  document.getElementById('helpBtn').addEventListener('click',()=>{helpDialog.showModal();closeMenus();});
  document.getElementById('creditsBtn').addEventListener('click',()=>{creditsDialog.showModal();closeMenus();});
  document.querySelectorAll('dialog .close').forEach(btn=>btn.addEventListener('click',()=>btn.closest('dialog').close()));
  langBtn.addEventListener('click',()=>{lang=lang==='en'?'it':'en';applyI18n();});
  imageInput.addEventListener('change',()=>{
    const file=imageInput.files&&imageInput.files[0]; if(!file) return;
    const reader=new FileReader(); reader.onload=()=>loadImage(String(reader.result)); reader.onerror=()=>{status.textContent=t('imageError');status.classList.remove('hidden');}; reader.readAsDataURL(file); imageInput.value=''; closeMenus();
  });

  photos.forEach(([file,name,mean])=>{
    const b=document.createElement('button'); b.className='photoChoice'; b.type='button';
    b.innerHTML=`<img src="assets/photos/thumbs/${file}" alt=""><span>${name}</span>`;
    b.addEventListener('click',()=>{galleryDialog.close();loadImage(`assets/photos/${file}`,mean);}); galleryGrid.appendChild(b);
  });

  window.addEventListener('resize',resizeCanvas);
  applyI18n();
  requestAnimationFrame(()=>{resizeCanvas();loadImage(imageSrc,photos[0][2]);});
})();

