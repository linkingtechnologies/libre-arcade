// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

export const CONFIG = Object.freeze({
  version:'1.0.5', gridWidth:30, gridHeight:30, scoreToWin:1000, moneyAtStart:100, waterPercent:50,
  moneyPerCommercialPerSecond:1, accelerationPerHouse:5, maxAcceleration:50, maxBelowZeroSeconds:120,
  buildings:{
    missileSilo:{id:101,name:'Missile Silo',w:1,h:1,cost:10,energy:-1,build:10,production:30,produces:'missile',cellTypes:[4]},
    shieldGenerator:{id:102,name:'Shield Generator',w:1,h:1,cost:40,energy:-1,build:20,production:60,produces:'shield',cellTypes:[5]},
    powerPlant:{id:103,name:'Power Plant',w:2,h:1,cost:20,energy:10,build:20,production:0,produces:null,specialBuildTiming:true,cellTypes:[6,7]},
    airField:{id:104,name:'Air Field',w:1,h:3,cost:60,energy:-1,build:30,production:60,produces:'aircraft',cellTypes:[8,9,10]},
    laboratory:{id:105,name:'Laboratory',w:2,h:1,cost:90,energy:-1,build:30,production:30,produces:'spy',cellTypes:[11,12]},
    factory:{id:106,name:'Factory',w:2,h:2,cost:40,energy:-1,build:30,production:45,produces:'mortar',cellTypes:[13,14,15,16]},
    house:{id:107,name:'House',w:1,h:1,cost:100,energy:-1,build:10,production:0,produces:null,cellTypes:[17]},
    commercial:{id:108,name:'Commercial',w:1,h:1,cost:50,energy:-1,build:20,production:0,produces:null,specialPositiveAccelerationTiming:true,cellTypes:[27]},
    nukeSilo:{id:109,name:'Nuke Silo',w:3,h:3,cost:160,energy:-5,build:60,production:60,produces:'nuke',cellTypes:[18,19,20,21,22,23,24,25,26]}
  },
  weapons:{
    missile:{id:201,name:'Missile',w:1,h:1}, shield:{id:202,name:'Shield',w:2,h:2}, aircraft:{id:203,name:'Aircraft',w:2,h:3},
    mortar:{id:204,name:'Mortar',w:2,h:2}, nuke:{id:205,name:'Nuke',w:4,h:4}, spy:{id:206,name:'Spy',w:3,h:3}
  }
});
export const BUILDING_BY_ID = new Map(Object.values(CONFIG.buildings).map(v=>[v.id,v]));
export const WEAPON_BY_ID = new Map(Object.values(CONFIG.weapons).map(v=>[v.id,v]));
