import { Grid } from './grid.js';

function encodeModifiedUTF(s){
  const a=[];
  for(let i=0;i<s.length;i++){
    const c=s.charCodeAt(i);
    if(c>=1&&c<=0x7f)a.push(c);
    else if(c<=0x7ff)a.push(0xc0|((c>>6)&0x1f),0x80|(c&0x3f));
    else a.push(0xe0|((c>>12)&0x0f),0x80|((c>>6)&0x3f),0x80|(c&0x3f));
  }
  return Uint8Array.from(a);
}
function decodeModifiedUTF(bytes){
  let out='';
  for(let i=0;i<bytes.length;){
    const b=bytes[i++]&255;
    if((b&0x80)===0) out+=String.fromCharCode(b);
    else if((b&0xe0)===0xc0){const b2=bytes[i++]&0x3f;out+=String.fromCharCode(((b&0x1f)<<6)|b2);}
    else {const b2=bytes[i++]&0x3f,b3=bytes[i++]&0x3f;out+=String.fromCharCode(((b&0x0f)<<12)|(b2<<6)|b3);}
  }
  return out;
}
export function gridToBytes(grid){
  const utf=encodeModifiedUTF(grid.getType());
  const pm=[];
  for(let d=0;d<9;d++){
    let wrote=false;
    for(let r=0;r<9;r++)for(let c=0;c<9;c++) if(grid.getSlot(r,c).isPencilMark(d)){
      if(!wrote){pm.push(100+d);wrote=true;} pm.push(r*9+c);
    }
  }
  pm.push(110);
  const out=new Uint8Array(81+8+2+utf.length+pm.length); let p=0;
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const s=grid.getSlot(r,c); out[p++]=(s.getAnswer()+s.getShown()*10+(s.isOriginalDigit()?100:0))&255;
  }
  const dv=new DataView(out.buffer); dv.setBigInt64(p,BigInt(grid.getElapsedTime()),false);p+=8;
  dv.setUint16(p,utf.length,false);p+=2;out.set(utf,p);p+=utf.length;out.set(pm,p);
  return out;
}
export function gridFromBytes(bytes){
  const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes); let p=0;
  const g=new Grid('');
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const v=b[p++]; const s=g.getSlot(r,c); s.setOriginalDigit(v>=100);s.setShown(Math.trunc(v/10)%10);s.setAnswer(v%10);
  }
  const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);g.setElapsedTime(Number(dv.getBigInt64(p,false)));p+=8;
  const n=dv.getUint16(p,false);p+=2;g.setType(decodeModifiedUTF(b.subarray(p,p+n)));p+=n;
  let digit=0,x=0; do {x=b[p++]; if(x>=100)digit=x-100; else {const r=Math.trunc(x/9),c=x%9;g.getSlot(r,c).setPencilMark(digit,true);}} while(x!==110);
  return g;
}
