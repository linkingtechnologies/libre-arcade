#!/usr/bin/env python3
from pathlib import Path
import json, os, subprocess, tempfile, sys

ROOT=Path(__file__).resolve().parents[2]
NATIVE=ROOT/'oracle/native_headless/bin/highmoon-native-headless'
MIRROR=ROOT/'oracle/bin/highmoon-physics-oracle'
REF=ROOT/'reference/HighMoon'

def run(cmd, **kw):
    print('+', ' '.join(map(str,cmd)))
    return subprocess.run(list(map(str,cmd)), check=True, text=True, **kw)

run([sys.executable, ROOT/'oracle/tools/source_guard.py'])
run([ROOT/'oracle/tools/build_headless.sh'])
run([ROOT/'oracle/native_headless/build.sh'])

with tempfile.TemporaryDirectory(prefix='highmoon-oracle-') as td:
    td=Path(td)
    native=td/'native-laser.jsonl'
    env=os.environ.copy(); env['HIGHMOON_ORACLE_JSONL']=str(native)
    run([NATIVE,'--root',REF,'--startup-seed','12345','--galaxy-seed','54321','--objects','6',
         '--mode','laser','--ticks','700','--power','70','--angle-deg','0','--settle'], env=env,
         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    first=None; bodies=[]; steps=0
    with native.open() as f:
        for line in f:
            o=json.loads(line)
            if o.get('event')=='step_begin' and first is None: first=o
            if o.get('event')=='gravity' and o.get('step')==0:
                bodies.append(o)
            if o.get('event')=='step_end': steps+=1
    if first is None or not bodies or steps <= 0:
        raise SystemExit('native trace did not contain expected physics events')

    mirror=td/'mirror-laser.jsonl'
    cmd=[MIRROR,
         '--start',f"{first['position']['x']:.17g},{first['position']['y']:.17g}",
         '--velocity',f"{first['velocity']['x']:.17g},{first['velocity']['y']:.17g}",
         '--ticks',str(steps),'--projectile-roundtrip','--scenario','native-seed54321','--out',mirror]
    for b in bodies:
        cmd.extend(['--body',f"body{b['body_index']},{b['body_x']:.17g},{b['body_y']:.17g},{b['weight']:.17g}"])
    run(cmd)
    run([sys.executable,ROOT/'oracle/tools/compare_jsonl.py',native,mirror])

    # Heavy must follow the same gravitational path for the same launch state.
    heavy=td/'native-heavy.jsonl'
    env['HIGHMOON_ORACLE_JSONL']=str(heavy)
    run([NATIVE,'--root',REF,'--startup-seed','12345','--galaxy-seed','54321','--objects','6',
         '--mode','heavy','--ticks','700','--power','70','--angle-deg','0','--settle'], env=env,
         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    run([sys.executable,ROOT/'oracle/tools/compare_jsonl.py',native,heavy])

print('PASS native-vs-mirror regression suite')
