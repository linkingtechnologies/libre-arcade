#!/usr/bin/env python3
import json,sys
n=0
with open(sys.argv[1],encoding='utf-8') as f:
    for n,line in enumerate(f,1): json.loads(line)
print(f'VALID {n} JSONL records')
