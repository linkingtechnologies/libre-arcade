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
