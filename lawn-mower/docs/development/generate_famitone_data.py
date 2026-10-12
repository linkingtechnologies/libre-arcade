from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'reference/source-v1.12/extracted'
FILES=['bgm_instruments.asm','bgm_title.asm','bgm_game.asm','bgm_levelclear.asm','bgm_outoffuel.asm','bgm_welldone.asm','sounds.asm']
base=0x8000
labels={}
ops=[]
addr=base

def ns_label(stem,tok):
    return f'{stem}{tok}' if tok.startswith('.') else tok

for fn in FILES:
    stem=Path(fn).stem
    for n,line in enumerate((SRC/fn).read_text(errors='replace').splitlines(),1):
        s=line.split(';',1)[0].strip()
        if not s: continue
        # labels are bare tokens without whitespace/directive
        if re.fullmatch(r'[A-Za-z_][\w]*|\.[\w]+', s):
            labels[ns_label(stem,s)] = addr
            continue
        m=re.match(r'^(?:[A-Za-z_][\w]*|\.[\w]+)?\s*(\.db|\.dw)\s+(.+)$',s)
        if not m: continue
        directive,rhs=m.groups()
        vals=[x.strip() for x in rhs.split(',')]
        ops.append((addr,directive,vals,stem,fn,n))
        addr += len(vals)*(1 if directive=='.db' else 2)

mem=bytearray(addr-base)

def num(tok):
    if tok.startswith('$'): return int(tok[1:],16)
    if tok.isdigit(): return int(tok)
    return None
for at,directive,vals,stem,fn,n in ops:
    p=at-base
    for tok in vals:
        v=num(tok)
        if v is None:
            key=ns_label(stem,tok)
            if key not in labels:
                raise SystemExit(f'Unresolved {tok} -> {key} at {fn}:{n}')
            v=labels[key]
        if directive=='.db':
            mem[p]=v&0xff; p+=1
        else:
            mem[p]=v&0xff; mem[p+1]=(v>>8)&0xff; p+=2

exports={
 'base':base,
 'labels': {k:v for k,v in labels.items() if k in [
    'bgm_title_module','bgm_game_module','bgm_levelclear_module','bgm_outoffuel_module','bgm_welldone_module','sounds']},
 'sfx': {f'sfx{i}':labels[f'sounds.sfx{i}'] for i in range(14)},
 'memory': list(mem),
}
out=ROOT/'src/famitone-data.js'
out.write_text('// Generated from Shiru FamiTone/FamiTracker exports in /reference. Do not hand-edit.\n'
               f'export const FAMITONE_BASE = 0x{base:04x};\n'
               f'export const FAMITONE_LABELS = {json.dumps(exports["labels"],indent=2)};\n'
               f'export const SFX_LABELS = {json.dumps(exports["sfx"],indent=2)};\n'
               f'export const FAMITONE_MEMORY = new Uint8Array({json.dumps(exports["memory"])});\n')
manifest=ROOT/'audit/FAMITONE_EXPORT.json'
manifest.write_text(json.dumps({k:v for k,v in exports.items() if k!='memory'}|{'size':len(mem)},indent=2))
print('generated',out,'bytes',len(mem),'range',hex(base),hex(addr-1))
print(json.dumps(exports['labels'],indent=2))
