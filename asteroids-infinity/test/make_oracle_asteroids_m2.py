"""M2 reference fixture: execute Asteroid.__init__ and Obj.update extracted verbatim
from the supplied 1.2 Python source, under Python 3 + a minimal group-free Obj stub.
This is NOT a native Python 2/Pygame session. PRNG calls are taped so the JS
port can replay the exact values rather than pretending Math.random==Python random.
"""
import hashlib,json,math,random,textwrap
from pathlib import Path
root=Path(__file__).resolve().parents[1]
src=(root/'reference/AsteroidsInfinity-1.2.py').read_text(encoding='utf-8')
# Isolate unedited historical Asteroid class: its collide method is never called.
class_body='class Asteroid(Obj):'+src.split('class Asteroid(Obj):',1)[1].split('class Ship(Obj):',1)[0]
# The historical Obj.update() has no SDL side effects except set_pos_screen;
# provide a no-op on the stub after running the actual method text.
obj_update='    def update(self):'+src.split('    def update(self):',1)[1].split('    def draw(self, surface):',1)[0]
obj_update=obj_update.split('        #self.pos_screen',1)[0] # keep historical update through set_pos_screen
# Original source includes comments before draw; trim strictly after self.set_pos_screen().
obj_update=obj_update.split('        self.set_pos_screen()',1)[0]+'        self.set_pos_screen()\n'
class Obj:
    angle=0
    spin=0
    def __init__(self,pos,speed,groups=[]):
        self.pos=list(pos);self.speed=list(speed)
    def set_pos_screen(self):pass
# exec the original method as a standalone function, attach to stub class.
ns={'playarea':(700,540),'fps':100.0}
exec(textwrap.dedent(obj_update),ns)
Obj.update=ns['update']

class TapeRandom:
    def __init__(self,seed):self.raw=random.Random(seed);self.calls=[]
    def randint(self,a,b):
        result=self.raw.randint(a,b);self.calls.append({'kind':'randint','a':a,'b':b,'value':result});return result
    def uniform(self,a,b):
        result=self.raw.uniform(a,b);self.calls.append({'kind':'uniform','a':a,'b':b,'value':result});return result

def snap(a):
    return {'pos':a.pos[:], 'speed':a.speed[:], 'size':a.size, 'radius':a.radius,
            'angle':a.angle, 'spin':a.spin, 'points':[[x,y] for x,y in a.image_points[0]]}
rng=TapeRandom(20260922)
globals_={'Obj':Obj,'Asteroids':object(),'Collidable':object(),'random':rng,'math':math,'playarea':(700,540)}
exec(class_body,globals_)
asteroid_cls=globals_['Asteroid']
# Parse the actual two-line spawning statement from main, not a rewritten copy.
spawn_stmt='for a in range(level):'+src.split('for a in range(level):',1)[1].split('\n',2)[1]+'\n'
# Captures construction by delegating to EXACT extracted class constructor.
asteroids=[]
def capture_asteroid(*args,**kwargs):
    a=asteroid_cls(*args,**kwargs);asteroids.append(a);return a
exec(spawn_stmt,dict(globals_,level=3,Asteroid=capture_asteroid))
initial=[snap(a) for a in asteroids]
for _ in range(87):
    for a in asteroids:a.update()
final=[snap(a) for a in asteroids]
fixture={'reference':'original 1.2 Asteroid.__init__ + Obj.update, Python3 shim, NOT native Python2',
  'source_sha256':hashlib.sha256((root/'reference/AsteroidsInfinity-1.2.py').read_bytes()).hexdigest(),
  'seed':20260922,'level':3,'ticks':87,'dt':0.01,'calls':rng.calls,'initial':initial,'after_ticks':final}
(root/'test/oracle-asteroids-m2.json').write_text(json.dumps(fixture,indent=2)+'\n',encoding='utf-8',newline='\n')
print('original-source method fixture: asteroids=',len(initial),'RNG calls=',len(rng.calls),'ticks=',fixture['ticks'])
