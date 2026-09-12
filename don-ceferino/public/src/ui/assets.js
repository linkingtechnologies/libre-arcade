export const ASSET_DEFS = {
  // libgrafico.cc: ima_gaucho->iniciar("gaucho.png", 3, 8, 43, 105, modo_video);
  player: { file:'gaucho.png', rows:3, cols:8, px:43, py:105 },
  ball1: { file:'pelota_1.png', rows:1, cols:3, px:9, py:9 },
  ball2: { file:'pelota_2.png', rows:1, cols:3, px:18, py:18 },
  ball3: { file:'pelota_3.png', rows:1, cols:3, px:37, py:37 },
  ball4: { file:'pelota_4.png', rows:1, cols:3, px:75, py:75 },
  level: { file:'niveles.png', rows:3, cols:7, px:0, py:0 },
  background: { file:'fondos.jpg', rows:1, cols:1, px:0, py:0 },
  shots: { file:'tiros.png', rows:12, cols:1, px:7, py:0 },
  items: { file:'items.png', rows:3, cols:7, px:16, py:32 },
  bomb: { file:'mate.png', rows:1, cols:4, px:30, py:27 },
  bar: { file:'barra.png', rows:2, cols:10, px:0, py:0 },
  menu: { file:'menu.jpg', rows:1, cols:1, px:0, py:0 },
  title1: { file:'tit_1.png', rows:1, cols:1, px:0, py:0 },
  title2: { file:'tit_2.png', rows:1, cols:1, px:0, py:0 },
  title3: { file:'tit_3.png', rows:1, cols:1, px:0, py:0 },
  howTo: { file:'how_to_play.png', rows:1, cols:1, px:0, py:0 },
  intro0: { file:'pres_losers.jpg', rows:1, cols:1, px:0, py:0 },
  intro1: { file:'pres_sentado.jpg', rows:1, cols:1, px:0, py:0 },
  intro2: { file:'pres_lee.jpg', rows:1, cols:1, px:0, py:0 },
  intro3: { file:'pres_casa.jpg', rows:1, cols:1, px:0, py:0 },
  intro4: { file:'pres_rapto.jpg', rows:1, cols:1, px:0, py:0 },
  intro5: { file:'pres_vs.jpg', rows:1, cols:1, px:0, py:0 },
  final0: { file:'final1.jpg', rows:1, cols:1, px:0, py:0 },
  final1: { file:'final2.jpg', rows:1, cols:1, px:0, py:0 },
  final2: { file:'final3.jpg', rows:1, cols:1, px:0, py:0 },
  final3: { file:'final4.jpg', rows:1, cols:1, px:0, py:0 },
  final4: { file:'final5.jpg', rows:1, cols:1, px:0, py:0 },
  final5: { file:'final6.jpg', rows:1, cols:1, px:0, py:0 }
};

function waitForImage(image) {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    image.addEventListener('load', resolve, { once:true });
    image.addEventListener('error', () => reject(new Error(`Unable to load ${image.src}`)), { once:true });
  });
}

export async function loadAssets() {
  const result = {};
  await Promise.all(Object.entries(ASSET_DEFS).map(async ([key, def]) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = `assets/graphics/${def.file}`;
    try {
      await image.decode();
    } catch {
      await waitForImage(image);
    }
    if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Invalid image ${def.file}`);
    if (image.naturalWidth % def.cols !== 0 || image.naturalHeight % def.rows !== 0) {
      throw new Error(`Invalid sprite sheet geometry for ${def.file}: ${image.naturalWidth}x${image.naturalHeight} is not divisible by ${def.cols}x${def.rows}`);
    }
    result[key] = { ...def, image, cellW:image.naturalWidth/def.cols, cellH:image.naturalHeight/def.rows };
  }));
  return result;
}
