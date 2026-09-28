// GPL-3.0-or-later. Browser-native save format for the HTML5 restoration.
export const SAVE_FORMAT='libre-jigsaw-html5';
export const SAVE_VERSION=2;

function finiteNumber(v,name){
  if(typeof v!=='number'||!Number.isFinite(v))throw new Error(`Invalid ${name}`);
  return v;
}
function finiteInt(v,name){
  finiteNumber(v,name);
  if(!Number.isInteger(v))throw new Error(`Invalid ${name}`);
  return v;
}
export function createSaveData(state){
  return {
    format:SAVE_FORMAT,
    formatVersion:SAVE_VERSION,
    game:'Libre Jigsaw',
    savedAt:new Date().toISOString(),
    shape:state.shape,
    requestedPieces:state.requestedPieces,
    actualPieces:state.pieces.length,
    seed:state.seed>>>0,
    board:{width:state.board.width,height:state.board.height},
    playfield:{width:state.playfield.width,height:state.playfield.height},
    currentLayer:state.currentLayer,
    complete:Boolean(state.complete),
    image:state.image,
    pieces:state.pieces.map(p=>({
      index:p.index,x:p.x,y:p.y,rotation:p.rotation,
      group:p.group,z:p.z,layer:p.layer
    }))
  };
}
export function validateSaveData(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Invalid save');
  if(raw.format!==SAVE_FORMAT||![1,SAVE_VERSION].includes(raw.formatVersion))throw new Error('Unsupported save');
  if(raw.game!=='Libre Jigsaw')throw new Error('Wrong game');
  if(raw.shape!=='square'&&raw.shape!=='hex')throw new Error('Invalid shape');
  finiteInt(raw.requestedPieces,'requestedPieces');
  if(![12,24,48,96].includes(raw.requestedPieces))throw new Error('Unsupported requestedPieces');
  finiteInt(raw.actualPieces,'actualPieces');
  finiteInt(raw.seed,'seed');
  if(raw.seed<0||raw.seed>0xffffffff)throw new Error('Invalid seed');
  if(!raw.board||typeof raw.board!=='object')throw new Error('Invalid board');
  if(finiteNumber(raw.board.width,'board.width')<=0||finiteNumber(raw.board.height,'board.height')<=0)throw new Error('Invalid board');
  if(raw.formatVersion>=2){
    if(!raw.playfield||typeof raw.playfield!=='object')throw new Error('Invalid playfield');
    if(finiteNumber(raw.playfield.width,'playfield.width')<=0||finiteNumber(raw.playfield.height,'playfield.height')<=0)throw new Error('Invalid playfield');
  }
  finiteInt(raw.currentLayer,'currentLayer');
  if(raw.currentLayer<0||raw.currentLayer>2)throw new Error('Invalid currentLayer');
  if(!raw.image||typeof raw.image!=='object')throw new Error('Invalid image');
  if(raw.image.kind==='gallery'){
    if(typeof raw.image.file!=='string'||!raw.image.file.endsWith('.jpg'))throw new Error('Invalid gallery image');
  }else if(raw.image.kind==='embedded'){
    if(typeof raw.image.data!=='string'||!raw.image.data.startsWith('data:image/'))throw new Error('Invalid embedded image');
  }else throw new Error('Invalid image kind');
  if(!Array.isArray(raw.pieces)||raw.pieces.length!==raw.actualPieces||raw.pieces.length<1)throw new Error('Invalid pieces');
  const seen=new Set();
  for(const p of raw.pieces){
    if(!p||typeof p!=='object')throw new Error('Invalid piece');
    finiteInt(p.index,'piece.index');
    if(seen.has(p.index))throw new Error('Duplicate piece');
    seen.add(p.index);
    finiteNumber(p.x,'piece.x');finiteNumber(p.y,'piece.y');
    finiteInt(p.rotation,'piece.rotation');finiteInt(p.group,'piece.group');finiteInt(p.z,'piece.z');finiteInt(p.layer,'piece.layer');
    if(p.layer<0||p.layer>2)throw new Error('Invalid piece layer');
  }
  return raw;
}
export function parseSaveText(text){
  if(typeof text!=='string'||!text.trim())throw new Error('Empty save');
  if(/^\s*version:/i.test(text)){
    const e=new Error('Legacy Java save');e.code='LEGACY_LJF';throw e;
  }
  let raw;
  try{raw=JSON.parse(text)}catch{throw new Error('Invalid JSON save')}
  return validateSaveData(raw);
}
export function stringifySaveData(data){return JSON.stringify(validateSaveData(data),null,2)+'\n';}
