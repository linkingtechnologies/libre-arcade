import { measureArcadeText, fitArcadeTextSize } from '../public/js/arcade-text.mjs';

const listMaxWidth = 244;
const labels = [
  ...Array.from({length:17},(_,i)=>`LIVELLO ${i+1}`),
  ...Array.from({length:17},(_,i)=>`LEVEL ${i+1}`),
  'INDIETRO','BACK'
];
for (const label of labels) {
  const size=fitArcadeTextSize(label,32,listMaxWidth,26);
  const width=measureArcadeText(label,size);
  if(width>listMaxWidth+1e-6) throw new Error(`${label} overflows selector: ${width} > ${listMaxWidth}`);
  if(size<26-1e-6) throw new Error(`${label} fell below minimum size: ${size}`);
}

const levelNames=[
 'Introduzione','Di lato…','Dietro l’angolo','Su!','Attento allo scivolo!',
 'Attento a quel muro','Schiva!','Prendi la rincorsa','Buchi','Sotto e sopra',
 'Resta in pista','Giù e su','Buchi neri!','Livello 14','Livello 15','Livello 16','Livello 17'
];
for(const name of levelNames){
 const size=fitArcadeTextSize(name,22,340,14);
 const width=measureArcadeText(name,size);
 if(width>340+1e-6) throw new Error(`${name} overflows preview caption: ${width}`);
}
console.log('PASS: M6.2 selector labels stay inside the left column');
console.log('PASS: M6.2 preview captions fit within the preview width');
