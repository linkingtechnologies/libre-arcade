import os,re,sys,struct
from pathlib import Path

OP={
'adc':{'imm':0x69,'zp':0x65,'zpx':0x75,'abs':0x6d,'absx':0x7d,'absy':0x79,'indx':0x61,'indy':0x71},
'and':{'imm':0x29,'zp':0x25,'zpx':0x35,'abs':0x2d,'absx':0x3d,'absy':0x39,'indx':0x21,'indy':0x31},
'asl':{'acc':0x0a,'zp':0x06,'zpx':0x16,'abs':0x0e,'absx':0x1e},
'bcc':{'rel':0x90},'bcs':{'rel':0xb0},'beq':{'rel':0xf0},'bmi':{'rel':0x30},'bne':{'rel':0xd0},'bpl':{'rel':0x10},'bvc':{'rel':0x50},'bvs':{'rel':0x70},
'bit':{'zp':0x24,'abs':0x2c},
'brk':{'imp':0x00},'clc':{'imp':0x18},'cld':{'imp':0xd8},'cli':{'imp':0x58},'clv':{'imp':0xb8},
'cmp':{'imm':0xc9,'zp':0xc5,'zpx':0xd5,'abs':0xcd,'absx':0xdd,'absy':0xd9,'indx':0xc1,'indy':0xd1},
'cpx':{'imm':0xe0,'zp':0xe4,'abs':0xec},'cpy':{'imm':0xc0,'zp':0xc4,'abs':0xcc},
'dec':{'zp':0xc6,'zpx':0xd6,'abs':0xce,'absx':0xde},'dex':{'imp':0xca},'dey':{'imp':0x88},
'eor':{'imm':0x49,'zp':0x45,'zpx':0x55,'abs':0x4d,'absx':0x5d,'absy':0x59,'indx':0x41,'indy':0x51},
'inc':{'zp':0xe6,'zpx':0xf6,'abs':0xee,'absx':0xfe},'inx':{'imp':0xe8},'iny':{'imp':0xc8},
'jmp':{'abs':0x4c,'ind':0x6c},'jsr':{'abs':0x20},
'lda':{'imm':0xa9,'zp':0xa5,'zpx':0xb5,'abs':0xad,'absx':0xbd,'absy':0xb9,'indx':0xa1,'indy':0xb1},
'ldx':{'imm':0xa2,'zp':0xa6,'zpy':0xb6,'abs':0xae,'absy':0xbe},
'ldy':{'imm':0xa0,'zp':0xa4,'zpx':0xb4,'abs':0xac,'absx':0xbc},
'lsr':{'acc':0x4a,'zp':0x46,'zpx':0x56,'abs':0x4e,'absx':0x5e},'nop':{'imp':0xea},
'ora':{'imm':0x09,'zp':0x05,'zpx':0x15,'abs':0x0d,'absx':0x1d,'absy':0x19,'indx':0x01,'indy':0x11},
'pha':{'imp':0x48},'php':{'imp':0x08},'pla':{'imp':0x68},'plp':{'imp':0x28},
'rol':{'acc':0x2a,'zp':0x26,'zpx':0x36,'abs':0x2e,'absx':0x3e},'ror':{'acc':0x6a,'zp':0x66,'zpx':0x76,'abs':0x6e,'absx':0x7e},
'rti':{'imp':0x40},'rts':{'imp':0x60},
'sbc':{'imm':0xe9,'zp':0xe5,'zpx':0xf5,'abs':0xed,'absx':0xfd,'absy':0xf9,'indx':0xe1,'indy':0xf1},
'sec':{'imp':0x38},'sed':{'imp':0xf8},'sei':{'imp':0x78},
'sta':{'zp':0x85,'zpx':0x95,'abs':0x8d,'absx':0x9d,'absy':0x99,'indx':0x81,'indy':0x91},
'stx':{'zp':0x86,'zpy':0x96,'abs':0x8e},'sty':{'zp':0x84,'zpx':0x94,'abs':0x8c},
'tax':{'imp':0xaa},'tay':{'imp':0xa8},'tsx':{'imp':0xba},'txa':{'imp':0x8a},'txs':{'imp':0x9a},'tya':{'imp':0x98},
}
BR={'bcc','bcs','beq','bmi','bne','bpl','bvc','bvs'}
DIRS={'.inesprg','.ineschr','.inesmir','.inesmap','.bank','.org','.include','.incbin','.db','.dw','.ifdef','.ifndef','.else','.endif'}

class Asm:
 def __init__(self, root):
  self.root=Path(root)
  self.symbols={}
  self.defined=set()
  self.header={'prg':0,'chr':0,'mir':0,'map':0}
  self.banks={i:bytearray([0xff]*8192) for i in range(128)}
  self.bank=0; self.pc=0; self.scope=''
  self.errors=[]

 def preprocess(self, path, stack=None):
  if stack is None: stack=[]
  path=(self.root/path).resolve() if not Path(path).is_absolute() else Path(path)
  out=[]
  for n,line in enumerate(path.read_text(errors='replace').splitlines(),1):
   code=line.split(';',1)[0].strip()
   m=re.match(r'^\.include\s+["\']([^"\']+)["\']',code,re.I)
   if m:
    out += self.preprocess(Path(m.group(1)),stack+[str(path)])
   else:
    out.append((str(path),n,line))
  return out

 def canon(self,name,scope=None):
  if name.startswith('.'):
   return (scope if scope is not None else self.scope)+'::'+name
  return name

 def eval_expr(self, expr, scope=None, allow_unresolved=False):
  expr=expr.strip()
  expr=re.sub(r'\$([0-9A-Fa-f]+)',lambda m:'0x'+m.group(1),expr)
  expr=re.sub(r'%([01]+)',lambda m:'0b'+m.group(1),expr)
  # C-ish division semantics for positive constants; negatives not used with /
  expr=re.sub(r'(?<!/)/(?!/)', '//', expr)
  # LOW/HIGH, possibly repeated
  for _ in range(5):
   old=expr
   expr=re.sub(r'\bLOW\(([^()]*)\)',r'((\1)&255)',expr,flags=re.I)
   expr=re.sub(r'\bHIGH\(([^()]*)\)',r'(((\1)>>8)&255)',expr,flags=re.I)
   if expr==old: break
  unresolved=[]
  keywords={'and','or','not'}
  def repl(m):
   t=m.group(0)
   if t.lower() in keywords: return t
   # don't touch x in 0x
   if m.start()>0 and expr[m.start()-1]=='0' and t.lower().startswith('x'): return t
   c=self.canon(t,scope)
   if c in self.symbols: return str(self.symbols[c])
   if t in self.symbols: return str(self.symbols[t])
   unresolved.append(c); return '0'
  # identifiers/local labels; avoid hex x fragments via negative lookbehind word is enough then special above
  expr2=re.sub(r'(?<![0-9A-Za-z_])(?:\.[A-Za-z0-9_]+|[A-Za-z_][A-Za-z0-9_]*)',repl,expr)
  if unresolved and not allow_unresolved:
   raise ValueError('unresolved '+','.join(unresolved)+' in '+expr)
  try: return int(eval(expr2,{'__builtins__':{}},{})), unresolved
  except Exception as e: raise ValueError(f'bad expr {expr!r}->{expr2!r}: {e}')

 def split_args(self,s):
  out=[]; cur=''; q=False; depth=0
  for ch in s:
   if ch=='"': q=not q; cur+=ch
   elif ch=='(' and not q: depth+=1; cur+=ch
   elif ch==')' and not q: depth-=1; cur+=ch
   elif ch==',' and not q and depth==0: out.append(cur.strip());cur=''
   else: cur+=ch
  if cur.strip() or s.endswith(','): out.append(cur.strip())
  return out

 def mode(self,mn,operand,scope,passno):
  o=operand.strip()
  if mn in BR: return 'rel',o
  if not o: return 'imp',''
  if o.lower()=='a': return 'acc',''
  if o.startswith('#'): return 'imm',o[1:].strip()
  # NESASM indirect syntax [zp],y / [zp,x]
  m=re.match(r'^\[(.+)\],\s*[Yy]$',o)
  if m: return 'indy',m.group(1).strip()
  m=re.match(r'^\[(.+),\s*[Xx]\]$',o)
  if m: return 'indx',m.group(1).strip()
  m=re.match(r'^\((.+)\)$',o)
  if m and mn=='jmp': return 'ind',m.group(1).strip()
  forcezp=False
  if o.startswith('<'):
   forcezp=True; o=o[1:].strip()
  idx=None
  m=re.match(r'^(.*),\s*([XxYy])$',o)
  if m: o=m.group(1).strip(); idx=m.group(2).lower()
  v,un=self.eval_expr(o,scope,allow_unresolved=(passno==1))
  # NESASM preserves explicit address width: e.g. $000 is absolute, while $00 is ZP.
  explicit_abs = bool(re.search(r'\$[0-9A-Fa-f]{3,}', o)) and not forcezp
  zp=forcezp or ((not explicit_abs) and (not un and 0 <= v <= 0xff))
  cand=[]
  if idx=='x': cand=['zpx' if zp else 'absx','absx','zpx']
  elif idx=='y': cand=['zpy' if zp else 'absy','absy','zpy']
  else: cand=['zp' if zp else 'abs','abs','zp']
  for md in cand:
   if md in OP[mn]: return md,o
  raise ValueError(f'no addressing mode {mn} {operand} candidates {cand}')

 def size(self,mode): return {'imp':1,'acc':1,'imm':2,'zp':2,'zpx':2,'zpy':2,'indx':2,'indy':2,'rel':2,'abs':3,'absx':3,'absy':3,'ind':3}[mode]

 def emit(self,b):
  off=self.pc & 0x1fff
  if off+len(b)>8192: raise ValueError('bank overflow')
  self.banks[self.bank][off:off+len(b)]=bytes(x&255 for x in b)
  self.pc += len(b)

 def process(self, lines, passno):
  self.bank=0; self.pc=0; self.scope=''; cond=[]; active=True
  if passno==2:
   self.banks={i:bytearray([0xff]*8192) for i in range(128)}
  for fn,ln,raw in lines:
   code=raw.split(';',1)[0].strip()
   if not code: continue
   low=code.lower()
   # conditionals must parse even inactive
   if low.startswith('.ifdef ') or low.startswith('.ifndef '):
    parts=code.split(None,1); name=parts[1].strip(); exists=(name in self.defined or name in self.symbols)
    take=exists if parts[0].lower()=='.ifdef' else not exists
    cond.append((active,take,False)); active=active and take; continue
   if low=='.else':
    if not cond: raise ValueError(f'{fn}:{ln} .else without if')
    parent,take,seen=cond[-1]; cond[-1]=(parent,take,True); active=parent and (not take); continue
   if low=='.endif':
    if not cond: raise ValueError(f'{fn}:{ln} .endif without if')
    parent,take,seen=cond.pop(); active=parent; continue
   if not active: continue
   try:
    # directives
    m=re.match(r'^\.(inesprg|ineschr|inesmir|inesmap|bank|org)\s+(.+)$',code,re.I)
    if m:
     d=m.group(1).lower(); v,_=self.eval_expr(m.group(2),self.scope,passno==1)
     if d=='bank': self.bank=v
     elif d=='org': self.pc=v
     else: self.header[{'inesprg':'prg','ineschr':'chr','inesmir':'mir','inesmap':'map'}[d]]=v
     continue
    m=re.match(r'^\.incbin\s+["\']([^"\']+)["\']',code,re.I)
    if m:
     data=(Path(fn).parent/m.group(1)).read_bytes()
     if passno==2:self.emit(data)
     else:self.pc+=len(data)
     continue
    m=re.match(r'^\.(db|dw)\s+(.+)$',code,re.I)
    if m:
     vals=[]
     for arg in self.split_args(m.group(2)):
      if arg.startswith('"') and arg.endswith('"'):
       vals.extend(arg[1:-1].encode('latin1'))
      else:
       if passno==2: v,_=self.eval_expr(arg,self.scope,False)
       else: v=0
       if m.group(1).lower()=='db': vals.append(v&255)
       else: vals.extend([v&255,(v>>8)&255])
     if passno==2:self.emit(vals)
     else:self.pc+=len(vals)
     continue
    # equ
    m=re.match(r'^([A-Za-z_][A-Za-z0-9_]*)\s+equ\s+(.+)$',code,re.I)
    if m:
     v,un=self.eval_expr(m.group(2),self.scope,passno==1)
     if not un or passno==2: self.symbols[m.group(1)]=v
     self.defined.add(m.group(1)); continue
    # optional label then instruction/data? Source uses label alone, check label+instruction uncommon
    first=code.split(None,1)[0]
    if first.lower() not in OP and not first.startswith('.'):
     # standalone symbol/label only in this source
     if len(code.split(None,1))==1:
      name=first; c=self.canon(name,self.scope)
      if passno==1:self.symbols[c]=self.pc
      self.defined.add(name); self.defined.add(c)
      if not name.startswith('.'): self.scope=name
      continue
    if first.startswith('.') and first.lower() not in DIRS:
     # local label standalone
     if len(code.split(None,1))==1:
      c=self.canon(first,self.scope)
      if passno==1:self.symbols[c]=self.pc
      self.defined.add(c); continue
    # instruction
    parts=code.split(None,1); mn=parts[0].lower(); operand=parts[1] if len(parts)>1 else ''
    if mn not in OP: raise ValueError('unknown opcode/directive '+mn)
    md,expr=self.mode(mn,operand,self.scope,passno); sz=self.size(md)
    if passno==1: self.pc+=sz; continue
    v=0
    if expr:
     v,_=self.eval_expr(expr,self.scope,False)
    b=[OP[mn][md]]
    if md in ('imm','zp','zpx','zpy','indx','indy'): b.append(v&255)
    elif md=='rel':
     off=v-(self.pc+2)
     if not -128<=off<=127: raise ValueError(f'branch out of range {mn} {operand} {off}')
     b.append(off&255)
    elif md in ('abs','absx','absy','ind'): b += [v&255,(v>>8)&255]
    self.emit(b)
   except Exception as e:
    raise RuntimeError(f'{fn}:{ln}: {raw}\n  {e}') from e

 def assemble(self,main='game.asm'):
  lines=self.preprocess(Path(main))
  self.process(lines,1)
  self.process(lines,2)
  h=bytearray(b'NES\x1a')+bytes([self.header['prg']&255,self.header['chr']&255])
  flags6=(self.header['mir']&1)|((self.header['map']&0x0f)<<4); flags7=self.header['map']&0xf0
  h+=bytes([flags6,flags7])+bytes(8)
  prg=b''.join(bytes(self.banks[i]) for i in range(self.header['prg']*2))
  chr_=b''.join(bytes(self.banks[self.header['prg']*2+i]) for i in range(self.header['chr']))
  return bytes(h)+prg+chr_

if __name__=='__main__':
 root=sys.argv[1]; out=sys.argv[2]
 a=Asm(root); rom=a.assemble('game.asm'); Path(out).write_bytes(rom)
 print('wrote',out,len(rom),'symbols',len(a.symbols))
