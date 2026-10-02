const numbers=[];
for(let n=1;n<=72;n++) if(n!==15) numbers.push(n);
export const FACE_IDS=Object.freeze(numbers.map(n=>`toys-${String(n).padStart(3,'0')}`));
export const PAIR_ASSETS=Object.freeze(Object.fromEntries([
 ['back',{path:'assets/pair/back.png'}],
 ...FACE_IDS.map(id=>[id,{path:`assets/pair/${id}.png`}])
]));
