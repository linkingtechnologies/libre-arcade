"""Minimal pygame compatibility layer for Disk Field's headless physics oracle.
Only pygame.Rect and a silent mixer are implemented.
Coordinates are integer-backed, matching pygame.Rect's historical role.
"""

class Rect:
    def __init__(self, *args):
        if len(args) == 1 and hasattr(args[0], 'x'):
            o=args[0]; self.x=int(o.x); self.y=int(o.y); self.width=int(o.width); self.height=int(o.height)
        elif len(args) == 4:
            self.x=int(args[0]); self.y=int(args[1]); self.width=int(args[2]); self.height=int(args[3])
        else:
            raise TypeError('Rect expects Rect or x,y,w,h')
    @property
    def left(self): return self.x
    @left.setter
    def left(self,v): self.x=int(v)
    @property
    def right(self): return self.x+self.width
    @right.setter
    def right(self,v): self.x=int(v)-self.width
    @property
    def top(self): return self.y
    @top.setter
    def top(self,v): self.y=int(v)
    @property
    def bottom(self): return self.y+self.height
    @bottom.setter
    def bottom(self,v): self.y=int(v)-self.height
    @property
    def centerx(self): return int(self.x+self.width/2)
    @property
    def centery(self): return int(self.y+self.height/2)
    @property
    def center(self): return (self.centerx,self.centery)
    @property
    def topleft(self): return (self.left,self.top)
    @property
    def topright(self): return (self.right,self.top)
    @property
    def bottomleft(self): return (self.left,self.bottom)
    @property
    def bottomright(self): return (self.right,self.bottom)
    def move(self, dx, dy):
        return Rect(self.x+int(dx), self.y+int(dy), self.width, self.height)
    def move_ip(self, dx, dy):
        self.x += int(dx); self.y += int(dy)
    def collidepoint(self, p):
        px,py=p
        l,r=sorted((self.left,self.right)); t,b=sorted((self.top,self.bottom))
        return l <= px < r and t <= py < b

class _Mixer:
    def find_channel(self): return None
mixer=_Mixer()
