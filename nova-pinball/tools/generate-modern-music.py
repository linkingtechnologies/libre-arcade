#!/usr/bin/env python3
# SPDX-License-Identifier: CC0-1.0
"""Generate the optional modern Nova Pinball background music.

Two arrangements are clean-room regenerations/adaptations of the CC0 musical
ideas documented by manuel-palacio/brickstorm's generate-music.sh:
  - Dreamy Orbit: C-Am-F-G, layered bass/pad/pentatonic melody.
  - Arcade Pulse: C-G-Am-F, pulsing bass/pad/arcade melody.
Source: https://github.com/manuel-palacio/brickstorm/blob/main/scripts/generate-music.sh
Upstream CREDITS declares the generated music loops CC0.

Wormhole Drive is a new composition made specifically for this restoration.
It is also dedicated to the public domain under CC0 1.0.

No samples, fonts, original Nova Pinball music, or external audio material are
used. Tracks are synthesized from mathematical oscillators/noise only.
"""
from pathlib import Path
import math, subprocess, tempfile
import numpy as np
from scipy.io import wavfile

SR=44100
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'music-modern'
OUT.mkdir(parents=True, exist_ok=True)

NOTES={
'C2':65.406,'D2':73.416,'E2':82.407,'F2':87.307,'G2':97.999,'A2':110.0,'B2':123.471,
'C3':130.813,'D3':146.832,'E3':164.814,'F3':174.614,'G3':195.998,'A3':220.0,'B3':246.942,
'C4':261.626,'D4':293.665,'E4':329.628,'F4':349.228,'G4':391.995,'A4':440.0,'B4':493.883,
'C5':523.251,'D5':587.330,'E5':659.255,'F5':698.456,'G5':783.991,'A5':880.0,'B5':987.767,
'E6':1318.51,
}

def osc(freq,n,kind='sine',phase=0.0):
    t=np.arange(n)/SR
    p=2*np.pi*freq*t+phase
    if kind=='sine': return np.sin(p)
    if kind=='triangle': return 2/np.pi*np.arcsin(np.sin(p))
    if kind=='square': return np.sign(np.sin(p))
    if kind=='saw':
        # modest band-limited additive saw
        out=np.zeros(n)
        maxh=max(1,min(10,int((SR/2)//max(freq,1))))
        for h in range(1,maxh+1): out += np.sin(p*h)/h
        return out*0.72
    raise ValueError(kind)

def env(n,a=.01,r=.08,sustain=.85):
    e=np.ones(n)*sustain
    aa=min(n,max(1,int(a*SR))); rr=min(n-aa,max(1,int(r*SR)))
    e[:aa]=np.linspace(0,sustain,aa)
    if rr>0:e[-rr:]=np.linspace(sustain,0,rr)
    return e

def add_note(buf,start,dur,freq,amp=.1,kind='sine',attack=.01,release=.08,pan=0.0):
    i=int(start*SR); n=max(1,int(dur*SR)); j=min(len(buf),i+n)
    if j<=i:return
    n=j-i
    x=osc(freq,n,kind)*env(n,attack,release)*amp
    # constant-power-ish simple pan
    l=math.sqrt((1-pan)/2); r=math.sqrt((1+pan)/2)
    buf[i:j,0]+=x*l;buf[i:j,1]+=x*r

def add_chord(buf,start,dur,notes,amp=.055,kind='triangle',pan_spread=.22):
    N=len(notes)
    for k,note in enumerate(notes):
        pan=0 if N==1 else (-pan_spread + 2*pan_spread*k/(N-1))
        add_note(buf,start,dur,NOTES[note],amp,kind,.10,.28,pan)

def add_kick(buf,start,amp=.11):
    i=int(start*SR); n=int(.22*SR); j=min(len(buf),i+n); n=j-i
    if n<=0:return
    t=np.arange(n)/SR
    f=42+(175-42)*np.exp(-t*24)
    phase=2*np.pi*np.cumsum(f)/SR
    x=np.sin(phase)*np.exp(-t/0.09)*amp
    buf[i:j]+=x[:,None]*0.707

def add_hat(buf,start,amp=.018,seed=0):
    i=int(start*SR);n=int(.05*SR);j=min(len(buf),i+n);n=j-i
    if n<=0:return
    rng=np.random.default_rng(seed)
    x=rng.standard_normal(n)
    # differentiate to emphasize high frequency
    x=np.r_[0,np.diff(x)]
    x*=np.exp(-np.arange(n)/SR/.015)*amp
    buf[i:j,0]+=x*.55;buf[i:j,1]+=x*.45

def softclip(x): return np.tanh(x*1.15)/np.tanh(1.15)

def normalize(buf,peak=.88):
    buf=softclip(buf)
    p=np.max(np.abs(buf)) or 1
    return (buf/p*peak).astype(np.float32)

def make_dreamy():
    length=32.;b=np.zeros((int(length*SR),2),float)
    progression=[('C2',('C4','E4','G4')),('A2',('A3','C4','E4')),('F2',('F3','A3','C4')),('G2',('G3','B3','D4'))]
    mel=[('C5','E5','G5','E5'),('A4','C5','E5','C5'),('F4','A4','C5','A4'),('G4','B4','D5','B4')]
    for cycle in range(4):
        base=cycle*8
        for c,(bass,ch) in enumerate(progression):
            st=base+c*2;add_note(b,st,1.95,NOTES[bass],.075,'sine',.04,.25)
            add_chord(b,st,1.95,ch,.045,'triangle')
            for q,nm in enumerate(mel[c]):add_note(b,st+q*.5,.47,NOTES[nm],.040,'sine',.015,.12,(-.18 if q%2==0 else .18))
    return normalize(b)

def make_arcade():
    length=32.;b=np.zeros((int(length*SR),2),float)
    progression=[('C3',('C4','E4','G4')),('G2',('G3','B3','D4')),('A2',('A3','C4','E4')),('F2',('F3','A3','C4'))]
    mel=[('C5','E5','G5','E5'),('D5','G5','B4','D5'),('C5','E5','A5','E5'),('F5','A5','C5','A5')]
    for cycle in range(4):
        base=cycle*8
        for c,(bass,ch) in enumerate(progression):
            st=base+c*2;add_chord(b,st,1.95,ch,.04,'triangle')
            for q in range(4):
                add_note(b,st+q*.5,.34,NOTES[bass],.070,'square',.004,.15,(-.1 if q%2==0 else .1));add_kick(b,st+q*.5,.055)
                add_hat(b,st+q*.5+.25,.010,seed=1000+cycle*40+c*8+q)
            for q,nm in enumerate(mel[c]):add_note(b,st+q*.5,.42,NOTES[nm],.045,'triangle',.008,.09,(.18 if q%2==0 else -.18))
    return normalize(b)

def make_wormhole():
    length=32.;b=np.zeros((int(length*SR),2),float)
    progression=[('E2',('E3','G3','B3')),('C2',('C3','E3','G3')),('G2',('G3','B3','D4')),('D2',('D3','F3','A3'))]
    arp=[('E4','G4','B4','E5','B4','G4','E4','B4'),('C4','E4','G4','C5','G4','E4','C4','G4'),('G4','B4','D5','G5','D5','B4','G4','D5'),('D4','F4','A4','D5','A4','F4','D4','A4')]
    for cycle in range(4):
        base=cycle*8
        for c,(bass,ch) in enumerate(progression):
            st=base+c*2
            add_note(b,st,1.96,NOTES[bass],.085,'saw',.035,.23)
            add_chord(b,st,1.96,ch,.032,'sine',.34)
            for q,nm in enumerate(arp[c]):
                add_note(b,st+q*.25,.22,NOTES[nm],.038,'triangle',.004,.06,math.sin(q)*.34)
                if q%2==0:add_hat(b,st+q*.25+.125,.008,seed=2000+cycle*100+c*10+q)
            add_kick(b,st,.065);add_kick(b,st+1,.05)
    return normalize(b)

def write_ogg(name,arr):
    with tempfile.TemporaryDirectory() as td:
        wav=Path(td)/'tmp.wav'; wavfile.write(wav,SR,(arr*32767).astype(np.int16))
        out=OUT/name
        subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(wav),'-af','loudnorm=I=-18:TP=-1.5:LRA=7','-c:a','libvorbis','-q:a','4',str(out)],check=True)
        print(out)

write_ogg('dreamy-orbit.ogg',make_dreamy())
write_ogg('arcade-pulse.ogg',make_arcade())
write_ogg('wormhole-drive.ogg',make_wormhole())
