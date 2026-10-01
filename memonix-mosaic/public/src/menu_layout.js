// Historical Memonix 1.6 main-menu geometry.
// The four 128x128 mode windows keep their original coordinates; in the
// standalone Mosaic restoration they are reassigned to Mosaic + navigation.

const slot = (x,y,labelX,labelY,labelW=150,labelH=32) => Object.freeze({
  x,y,w:128,h:128,labelX,labelY,labelW,labelH
});

export const MENU_LAYOUT = Object.freeze({
  slots: Object.freeze({
    instructions: slot(176,66,165,198),
    options:      slot(496,66,485,198),
    play:         slot(56,255,45,387),
    credits:      slot(616,255,605,387),
  }),
  utilities: Object.freeze({
    buttonW:198,
    buttonH:41,
    language:Object.freeze({x:10,y:474}),
    audio:Object.freeze({x:10,y:524}),
    scores:Object.freeze({x:591,y:474}),
    play:Object.freeze({x:591,y:524}),
  }),
});

export function allMenuRects(layout=MENU_LAYOUT){
  const rects=[];
  for(const s of Object.values(layout.slots)){
    rects.push({x:s.x,y:s.y,w:s.w,h:s.h});
    rects.push({x:s.labelX,y:s.labelY,w:s.labelW,h:s.labelH});
  }
  for(const u of Object.values(layout.utilities)){
    if(u&&typeof u==='object'&&'x' in u) rects.push({x:u.x,y:u.y,w:layout.utilities.buttonW,h:layout.utilities.buttonH});
  }
  return rects;
}
