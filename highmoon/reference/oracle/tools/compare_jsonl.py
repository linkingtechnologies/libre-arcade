#!/usr/bin/env python3
import json, sys

def relevant(path):
    out=[]
    with open(path,encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            o=json.loads(line)
            if o.get('event') in {'step_begin','gravity','step_end'}:
                o.pop('body_name',None)
                out.append(o)
    return out

def compare(a,b):
    aa,bb=relevant(a),relevant(b)
    if len(aa)!=len(bb):
        print(f'FAIL event_count {len(aa)} != {len(bb)}'); return 1
    for i,(x,y) in enumerate(zip(aa,bb)):
        if x!=y:
            print(f'FAIL event {i}')
            print('A',json.dumps(x,sort_keys=True))
            print('B',json.dumps(y,sort_keys=True))
            return 1
    print(f'PASS {len(aa)} physics events match exactly')
    return 0
if len(sys.argv)!=3:
    print('usage: compare_jsonl.py A.jsonl B.jsonl',file=sys.stderr); sys.exit(2)
sys.exit(compare(sys.argv[1],sys.argv[2]))
