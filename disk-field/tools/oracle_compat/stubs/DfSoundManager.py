class _SM:
    def isSoundOn(self): return False
    def playThudSound(self,*a,**k): pass
    def playWhiteHoleSound(self,*a,**k): pass
    def playBlackHoleSound(self,*a,**k): pass
_inst=_SM()
def SoundManager(): return _inst
