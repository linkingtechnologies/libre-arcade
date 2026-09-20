/* Lossless semantic translation of upstream src/game/desktop/playfields.xml. */
window.COMET_PLAYFIELD = {
  name: 'default',
  bumpers: [
    {id:1,x:.25,y:1.10,r:.03}, {id:2,x:.45,y:1.10,r:.03}, {id:3,x:.35,y:1.05,r:.03}
  ],
  slingshots: [
    {id:4,x:.07,y:.355,a:{x:.12,y:-.09},b:{x:0,y:.10}},
    {id:5,x:.65,y:.355,a:{x:0,y:.10},b:{x:-.12,y:-.09}},
    {id:9,x:.35,y:.54,a:{x:0,y:.08},b:{x:-.08,y:0}},
    {id:10,x:.35,y:.54,a:{x:.08,y:0},b:{x:0,y:.08}}
  ],
  obstacles: [
    {id:6,x:.65,y:1.0,v:[{x:0,y:0},{x:0,y:.15},{x:-.12,y:-.09}]},
    {id:7,x:.07,y:1.0,v:[{x:0,y:0},{x:.12,y:-.09},{x:0,y:.15}]},
    {id:8,x:.35,y:.5,v:[{x:.08,y:.04},{x:-.08,y:.04},{x:0,y:-.04}]}
  ],
  scores: {1:20,2:20,3:20,4:5,5:5}
};
