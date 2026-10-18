#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Libre Arcade contributors
# SPDX-License-Identifier: GPL-3.0-or-later
"""A bounded static translation of Lawn Mower's stone collision.

It finds the real bytes of cutStone and fuelSubtract in the two preserved ROMs (the competition ROM v1.1 and the author's own v1.12 build), decodes them
(11 opcodes), writes C for them, compiles it with gcc and compares it, for every fuel value from 0 to 232, with the port's own LawnMowerKernel (run by node):
the fuel left, the camera shake, the low-fuel warning and the stone event. It then does the same with the penalty changed from 77 to 60, in the ROM's operand
(in memory) and in a temporary copy of the port's constant. The sound routines that the original calls are replaced by labelled traps.

This is NOT a recompilation of the game, and it is not NESRecomp: it translates two small routines. See README.md.
"""
import argparse, ctypes, hashlib, json, re, shutil, subprocess, tempfile
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]          # lawn-mower/
OP={0xa9:('LDA_IMM',2),0xa5:('LDA_ZP',2),0x85:('STA_ZP',2),0x38:('SEC',1),0xe5:('SBC_ZP',2),0xb0:('BCS',2),0x90:('BCC',2),0xc9:('CMP_IMM',2),0x20:('JSR',3),0x4c:('JMP',3),0x60:('RTS',1)}

def get_rom(base,ver):
    path=base/'reference'/ver/'Lawn_Mower.nes'
    b=path.read_bytes(); assert len(b)==24592 and b[:4]==b'NES\x1a'
    bank=b[16:16+16384]; hits=[]
    for i in range(len(bank)-14):
        chunk=bank[i:i+14]
        if (chunk[0:2]==bytes.fromhex('a9 01') and chunk[2]==0x85 and chunk[4:6]==bytes.fromhex('a9 4d') and chunk[6]==0x20 and chunk[9:11]==bytes.fromhex('a9 0b') and chunk[11]==0x4c):
            hits.append(i)
    assert len(hits)==1, ('cutStone candidates',hits)
    start=hits[0]
    base_cpu=0x8000 if ver=='competition' else 0xc000
    jsr=(bank[start+7] | bank[start+8]<<8)
    final=(bank[start+12] | bank[start+13]<<8)
    fs=jsr&0x3fff
    assert bank[fs:fs+3] == bytes.fromhex('85 00 a5'), 'expected fuelSubtract prologue'
    # search for the first RTS reachable in the source fuelSubtract block.
    end=bank.index(bytes([0x60]),fs,fs+80)+1
    return {'path':path,'bytes':b,'prg':bank,'start':start+base_cpu,'fuel_sub':jsr,'sound_stone':final,'sound_low':None,'cpu_base':base_cpu,'source_sha256':hashlib.sha256(b).hexdigest(),'stone':bank[start:start+14],'fuel':bank[fs:end]}

def instructions(info,patched_penalty=None):
    prg=bytearray(info['prg'])
    if patched_penalty is not None:
        assert 0<=patched_penalty<=255
        prg[(info['start']-info['cpu_base'])+5]=patched_penalty
    addr=lambda pc:pc&0x3fff
    out={}; todo=[info['start'],info['fuel_sub']]
    # Decode two deliberately bounded control-flow regions, not arbitrary PRG data.
    first=info['start']; last_stone=first+14
    first_fs=info['fuel_sub']; last_fs=first_fs+len(info['fuel'])
    while todo:
        pc=todo.pop()
        if pc in out:continue
        if not(first<=pc<last_stone or first_fs<=pc<last_fs):continue
        offs=addr(pc);opcode=prg[offs]
        if opcode not in OP: raise RuntimeError(f'unknown opcode {opcode:02x} at {pc:04x}')
        mn,size=OP[opcode];arg=prg[offs+1:offs+size]; out[pc]=(mn,list(arg))
        next_pc=pc+size
        if mn in ('BCS','BCC'):
            disp=arg[0]-(256 if arg[0]>=128 else 0)
            todo.extend([next_pc,next_pc+disp])
        elif mn=='JMP':
            pass # external sound trampoline
        elif mn=='RTS':
            pass
        else:todo.append(next_pc)
    assert first in out and first_fs in out
    # Branches and terminal bytes must remain inside the located routines.
    assert all(first<=pc<last_stone or first_fs<=pc<last_fs for pc in out)
    return out,prg

def render_c(info,ins):
    sub=info['fuel_sub'];out=[]
    for pc,(mn,a) in sorted(ins.items()):
        operand=a[0] if len(a)==1 else (a[0]|(a[1]<<8)) if a else None
        nxt=pc+1+len(a)
        if mn=='LDA_IMM':s=f'a={operand}; pc={nxt};'
        elif mn=='LDA_ZP':s=f'a=m[{operand}]; pc={nxt};'
        elif mn=='STA_ZP':s=f'm[{operand}]=a; pc={nxt};'
        elif mn=='SEC':s=f'carry=1; pc={nxt};'
        elif mn=='SBC_ZP':s=f'{{ int v=(int)a-(int)m[{operand}]-(carry?0:1); carry=(v>=0); a=(uint8_t)v; pc={nxt}; }}'
        elif mn=='CMP_IMM':s=f'carry=(a>={operand}); pc={nxt};'
        elif mn in ('BCS','BCC'):
            dest=nxt+operand-(256 if operand>=128 else 0)
            s=f'pc=({"carry" if mn=="BCS" else "!carry"})?{dest}:{nxt};'
        elif mn=='JSR':
            if operand==sub:s=f'if (sp>=3)return -2; ret[sp++]={nxt}; pc={operand};'
            else:s=f'if (a!=8) return -3; low++; pc={nxt}; /* external sfxPlayFuel trap */'
        elif mn=='JMP':s=f'if (a!=11)return -4; stone++; goto done; /* external sfxPlay trap */'
        elif mn=='RTS':s='if(sp<1) return -5; pc=ret[--sp];'
        else:raise AssertionError(mn)
        out.append(f'    case 0x{pc:04x}: {s} break; /* {mn} {" ".join(f"{x:02x}" for x in a)} */')
    return '''// Generated from identified opcode ranges in Shiru's Lawn Mower ROM.
// NOT NESRecomp. External APU/SFX routines are trapped as observable events.
#include <stdint.h>
#include <stdio.h>
typedef struct { int fuel, camera_shake, low_fuel_sfx, stone_sfx; } StoneResult;
int stone_run(unsigned initial, StoneResult *o) {
  uint8_t m[256]={0}, a=0; int carry=0,low=0,stone=0;
  uint16_t ret[3]; int sp=0;
  unsigned pc=0x'''+f'{info["start"]:04x};\n'+'''  m[0xcb]=(uint8_t)initial;
  for(int steps=0;steps<100;steps++) switch(pc) {
'''+ '\n'.join(out)+'''
    default: return -10;
  }
  return -11;
  done:
  o->fuel=m[0xcb]; o->camera_shake=(m[0xba]!=0);
  o->low_fuel_sfx=low; o->stone_sfx=stone;
  return 0;
}
'''

def js_traces(root,penalty=None):
    # build a temporary sibling copy of the actual Claude kernel, never edit the user source
    with tempfile.TemporaryDirectory(prefix='m11_js_') as name:
        d=Path(name); shutil.copytree(root/'public'/'src', d/'src')
        # copy assets not required for constructor; keep imports consistent
        (d/'package.json').write_text('{"type":"module"}\n')
        if penalty is not None:
            f=d/'src'/'constants.js'; original=f.read_text()
            replacement=f'export const STONE_PENALTY = {penalty}; // temporary experiment edit'
            text,n=re.subn(r'export const STONE_PENALTY\s*=\s*[^;]+;[^\n]*',replacement,original)
            assert n==1; f.write_text(text)
        script=d/'run.mjs'
        script.write_text('''import { LawnMowerKernel } from './src/kernel.js';
import { TILE } from './src/constants.js';
for(let v=0;v<=232;v++) {
 const k=new LawnMowerKernel({seed:1}); k.setTile(2,4,TILE.STONE); k.fuel=v;
 const type=k.checkTileAt(2,4); const events=k.drainEvents().map(e=>e.type);
 console.log(JSON.stringify({before:v,after:k.fuel,shake:k.cameraShake,low:events.filter(e=>e==='fuel-low').length,stone:events.filter(e=>e==='stone-hit').length,type}));
}
''')
        proc=subprocess.run(['node',str(script)],capture_output=True,text=True,check=True)
        return [json.loads(x) for x in proc.stdout.splitlines()]

class Result(ctypes.Structure):
    _fields_=[('fuel',ctypes.c_int),('camera_shake',ctypes.c_int),('low_fuel_sfx',ctypes.c_int),('stone_sfx',ctypes.c_int)]

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--project',type=Path,default=ROOT);ap.add_argument('--out',type=Path,default=HERE/'results'); args=ap.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    records=[]
    for ver in ('competition','release-v1.12'):
        info=get_rom(args.project,ver)
        for pen in [None,60]:
            tag=f'{ver}_{"original" if pen is None else "modified60"}'
            ins,bytes_=instructions(info,pen)
            csrc=render_c(info,ins)
            path=args.out/f'{tag}.c';path.write_text(csrc)
            dylib=Path(tempfile.mkdtemp(prefix='lawn_c_'))/f'{tag}.so'   # the library depends on the compiler; it is not kept
            cmd=['gcc','-std=c11','-O2','-fPIC','-shared','-Wall','-Wextra','-o',str(dylib),str(path)]
            cp=subprocess.run(cmd,text=True,capture_output=True,check=True)
            lib=ctypes.CDLL(str(dylib));lib.stone_run.argtypes=[ctypes.c_uint,ctypes.POINTER(Result)];lib.stone_run.restype=ctypes.c_int
            js=js_traces(args.project,pen)
            fails=[];rows=[]
            for v in range(233):
                o=Result();status=lib.stone_run(v,ctypes.byref(o))
                actual=dict(before=v,after=o.fuel,shake=bool(o.camera_shake),low=o.low_fuel_sfx,stone=o.stone_sfx)
                expected={k:js[v][k] for k in actual}
                if status or actual!=expected:fails.append({'status':status,'actual':actual,'expected':expected})
                rows.append(actual)
            (args.out/f'{tag}_trace.json').write_text(json.dumps(rows,indent=1)+'\n')
            records.append({'variant':tag,'rom_sha256':info['source_sha256'],'stone_cpu_address':f'0x{info["start"]:04X}','fuel_sub_cpu_address':f'0x{info["fuel_sub"]:04X}','stone_bytes_original':info['stone'].hex(' '),'stone_bytes_effective':bytes_[((info['start']-info['cpu_base'])):((info['start']-info['cpu_base'])+14)].hex(' '),'penalty_byte_used': (77 if pen is None else pen),'fuel_sub_bytes':info['fuel'].hex(' '),'generated_c_bytes':len(csrc.encode()),'compared_fuel_values':233,'mismatches':fails})
            print(tag,'cases 233','PASS' if not fails else f'FAIL {len(fails)}', 'C bytes',len(csrc))
    (args.out/'results.json').write_text(json.dumps(records,indent=2)+'\n')
    assert all(not r['mismatches'] for r in records), 'nonmatching generated C vs actual JavaScript kernel'
    print('TOTAL: 932/932 cases PASS (two ROM versions x original/modified x 233 fuel values)')
if __name__=='__main__':main()
