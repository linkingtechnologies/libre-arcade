export const strengthLevels=[
  {id:'beginner',name:{en:'Beginner',it:'Principiante'},description:{en:'Learning the board',it:'Per imparare il campo'},members:[
    {playerId:'michael-bell-bota',setting:10000,rating:1026},{playerId:'aman-virmani-qlearning',setting:10000,rating:1026},{playerId:'jacob-downing-genetic-nn',setting:100,rating:1110},{playerId:'zeta36-alpha-zero',setting:2,rating:1198},
  ]},
  {id:'easy',name:{en:'Easy',it:'Facile'},description:{en:'A relaxed challenge',it:'Una sfida tranquilla'},members:[
    {playerId:'childsplay-fourrow-3.3',setting:5,rating:1311},{playerId:'uci-connect4-naive-bayes',setting:1,rating:1348},{playerId:'marco-melilli-minimax',setting:4,rating:1393},{playerId:'gcompris-4stattack-random-minimax',setting:4,rating:1410},
  ]},
  {id:'medium',name:{en:'Medium',it:'Medio'},description:{en:'Balanced opponents',it:'Avversari equilibrati'},members:[
    {playerId:'markus-thill-mcts',setting:500,rating:1522},{playerId:'allis-threat-space-cleanroom',setting:5,rating:1525},{playerId:'gnome-velena-proof-number',setting:1000,rating:1533},{playerId:'gnome-velena-full-integration',setting:2,rating:1535},
  ]},
  {id:'hard',name:{en:'Hard',it:'Difficile'},description:{en:'Strong tactical play',it:'Gioco tattico forte'},members:[
    {playerId:'pascal-pons-bitboard',setting:10000,rating:1549},{playerId:'gnome-gnect-velena-rule-engine',setting:1000,rating:1557},{playerId:'gnome-gnect-velena-hybrid',setting:2,rating:1584},{playerId:'gnome-gnect-velena-tactical',setting:4,rating:1592},
  ]},
  {id:'expert',name:{en:'Expert',it:'Esperto'},description:{en:'Experienced challengers',it:'Sfidanti esperti'},members:[
    {playerId:'stratzilla-connect-four',setting:5,rating:1618},{playerId:'petters-mcts',setting:500,rating:1629},{playerId:'kde-kfourinline-humanlike',setting:3,rating:1651},{playerId:'connectlab-control-baseline',setting:2,rating:1670},
  ]},
  {id:'champion',name:{en:'Champion',it:'Campione'},description:{en:'The top of the Arena',it:'Il vertice dell’Arena'},members:[
    {playerId:'markus-thill-alphabeta',setting:10000,rating:1704},{playerId:'connectlab-ensemble',setting:2,rating:1850},{playerId:'markus-thill-td-ntuple',setting:0,rating:2159},
  ]},
];

export function getStrengthLevel(id){const level=strengthLevels.find(item=>item.id===id);if(!level)throw new Error(`Unknown strength level: ${id}`);return level;}

export function selectStrengthMember(levelId,seed,previousPlayerId=''){
  const level=getStrengthLevel(levelId),members=level.members;
  let index=(Number(seed)>>>0)%members.length;
  if(members.length>1&&members[index].playerId===previousPlayerId)index=(index+1)%members.length;
  return members[index];
}
