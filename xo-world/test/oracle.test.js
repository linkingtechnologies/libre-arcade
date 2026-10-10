'use strict';
const {XOWorldEngine}=require('../src/xoworld-engine');
function game(p){const g=new XOWorldEngine(()=>0.5);g.reset();g.potez=p;return g;}
function setup(g,s){if(!s)return;for(const e of s.split(',')){const [i,v]=e.split(':').map(Number);g.t[0][i]=v;}}
function anyX(g){for(let i=0;i<100;i++)if(g.t[0][i]===1)return [i%10,Math.trunc(i/10)];return [0,0];}
const cases=[
['O-01','opening upper',1,'',4,2,35],['O-02','opening lower',1,'',4,7,63],['O-03','cpu immediate horiz',6,'42:2,43:2,44:2,45:2',0,0,41],['O-04','block human horiz',6,'42:1,43:1,44:1,45:1',0,0,41],['O-05','cpu immediate vert',6,'14:2,24:2,34:2,44:2',0,0,4],['O-06','block human diag',6,'22:1,33:1,44:1,55:1',0,0,11],['O-07','X_X bridge',2,'32:1,34:1',0,0,33],['O-08','cross block',4,'22:1,24:1,42:1,44:1',0,0,33],
['O-09','human open4',8,'2:2,3:2,4:1,13:2,25:1,29:2,31:1,36:1,48:1,51:1,53:2,61:1,62:1,63:2,77:2',null,null,41],
['O-10','cpu open4',8,'5:1,14:1,15:2,29:1,30:2,33:2,42:2,44:1,45:2,52:1,54:1,61:2,69:2,89:1,95:1',null,null,24],
['O-11','cpu make o4c',7,'0:1,12:1,19:2,40:1,46:1,52:1,54:2,74:2,75:2,80:1,85:2,93:2,95:1',null,null,73],
['O-12','human box',6,'5:1,10:2,23:1,27:2,32:2,45:1,54:1,55:1,57:2,79:1,90:2',null,null,44],
['O-13','cpu c4+o3',9,'2:2,5:2,6:2,14:1,17:1,20:1,28:2,37:2,43:1,56:1,66:1,67:1,69:2,78:1,80:1,90:2,94:2',null,null,4],
['O-14','human c4+o3',10,'4:2,7:1,21:1,23:1,30:2,33:1,35:2,42:1,52:1,55:2,58:2,59:2,60:1,71:2,74:2,82:2,84:1,91:1,99:1',null,null,24],
['O-15','close human c4',6,'1:2,2:1,26:2,34:2,42:1,47:1,51:2,57:1,67:1,77:2,86:1',null,null,27],
['O-16','human double-o3',10,'2:2,10:1,11:2,12:1,13:1,23:2,26:2,50:2,54:1,56:1,59:2,60:1,70:1,73:1,79:1,82:1,83:2,88:2,96:2',null,null,55],
['O-17','cpu double-o3',8,'1:1,14:1,26:2,27:2,31:1,35:2,38:2,45:2,60:1,61:2,76:2,82:1,85:1,92:1,95:1',null,null,25],
['O-18','human serie',10,'1:1,12:1,14:2,16:2,21:1,32:2,33:2,34:1,36:1,49:2,50:1,51:2,61:2,65:2,66:1,75:1,78:1,80:2,85:1',null,null,45],
['O-19','human double-c4',10,'12:2,26:1,28:2,36:2,38:2,42:2,45:1,48:1,51:2,56:1,58:1,59:1,65:2,66:1,79:2,84:1,88:2,94:1,97:1',null,null,57],
['O-20','cpu serie',8,'9:1,20:2,21:1,26:1,31:2,32:1,34:1,41:2,42:2,45:2,54:2,59:1,80:2,83:1,98:1',null,null,44],
['O-21','cpu double-c4',10,'18:2,25:1,35:1,36:1,42:1,46:1,50:2,51:1,59:2,63:1,68:2,77:2,78:2,85:2,87:2,89:2,91:1,92:1,97:1',null,null,86],
['O-22','serie depth cap',11,'2:1,5:2,9:2,14:2,15:2,23:1,27:1,43:1,44:2,45:2,51:1,55:1,64:1,70:2,71:2,75:1,85:1,86:2,87:1,91:2,92:1',null,null,65]
];
let pass=0,fail=0;
for(const [id,label,p,b,x0,y0,exp] of cases){const g=game(p);setup(g,b);let x=x0,y=y0;if(x===null)[x,y]=anyX(g);const got=g.igraj(x,y);const ok=got===exp;if(ok)pass++;else fail++;console.log(`${id} ${label.padEnd(22)} p=${String(p).padStart(2)} got=${String(got).padStart(3)} exp=${String(exp).padStart(3)} depth=${g.maxDepthObserved} ${ok?'PASS':'FAIL'}`)}
console.log(`TOTAL pass=${pass} fail=${fail}`);if(fail)process.exit(1);
