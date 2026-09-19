#!/usr/bin/env python3
"""Regenerate public/js/levels.mjs from the preserved 1.01 compatibility source.
The compatibility source is the same minimally adapted source used by the oracle;
physics/level constants are not rewritten here.
"""
import sys, json, random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
COMPAT=ROOT/'tools'/'oracle_compat'
sys.path.insert(0,str(COMPAT/'stubs'))
sys.path.insert(1,str(COMPAT/'v1.01'/'lib'))
import DfLevelData

def num(v): return float(v)
def vec(v): return [float(v[0]),float(v[1])]
def rect(r): return {'x':int(r.x),'y':int(r.y),'w':int(r.width),'h':int(r.height)}
def ser_field(o):
    typ=type(o).__name__
    if typ=='MovingObject': return {'type':typ,'object':ser_field(o.object),'startX':num(o.startX),'endX':num(o.endX),'xVel':num(o.xVel),'startY':num(o.startY),'endY':num(o.endY),'yVel':num(o.yVel),'rotSpeed':num(o.fRotSpeed)}
    d={'type':typ,'strength':num(o.strength),'orientation':num(o.orientation),'fixed':bool(o.bFixed)}
    if hasattr(o,'pos'): d['pos']=vec(o.pos)
    if hasattr(o,'areaRect'): d.update(rect=rect(o.areaRect),fuzzy=bool(o.bFuzzy),vector=vec(o.vector))
    return d
def ser_wall(w):
    typ=type(w).__name__
    if typ=='MovingWall': return {'type':typ,'rect':rect(w),'startX':num(w.startX),'endX':num(w.endX),'xVel':num(w.xVel),'startY':num(w.startY),'endY':num(w.endY),'yVel':num(w.yVel),'fadeIndex':int(w.fadeIndex),'crumble':bool(w.bCrumble),'killer':bool(w.bKiller)}
    return {'type':typ,'rect':rect(w),'fadeIndex':int(w.fadeIndex),'crumble':bool(w.bCrumble),'killer':bool(w.bKiller)}
def ser_hole(h): return {'type':type(h).__name__,'pos':vec(h.pos),'target':vec(h.target),'radius':float(h.radius)}
levels=[]
for i in range(17):
    seed=20070906 if i==6 else 20070908
    random.seed(seed); DfLevelData.createLevel(i); d=DfLevelData.levelList[i]
    levels.append({'index':i,'name':d.get('name') or f'Level {i+1}','oracleSeed':seed,'diskPos':[vec(p) for p in d['diskPos']],'winPos':vec(d['winPos']),'objects':[ser_field(o) for o in d['objectList']],'holes':[ser_hole(h) for h in d['holeList']],'walls':[ser_wall(w) for w in d['wallList']]})
out=ROOT/'public'/'js'/'levels.mjs'
out.write_text('// Generated from Disk Field 1.01 DfLevelData.py via the preserved Python oracle.\n// Do not hand-edit level geometry; regenerate with tools/export_levels.py.\nexport const LEVELS = '+json.dumps(levels,separators=(',',':'))+';\n')
print(out)
