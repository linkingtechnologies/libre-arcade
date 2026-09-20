#!/usr/bin/env python3
from pathlib import Path
import hashlib, re, sys
ROOT=Path(__file__).resolve().parents[2]
const=(ROOT/'reference/HighMoon/src/constants.hpp').read_text(errors='strict')
gal=(ROOT/'reference/HighMoon/src/galaxy.cpp').read_text(errors='strict')
checks=[
    ('shoot interval', 'const int SHOOT_INTERVAL \t= 30;' in const or re.search(r'const int SHOOT_INTERVAL\s*=\s*30\s*;',const)),
    ('gravity distance', 'double distance = vec_PlanetPos.distance(position);' in gal),
    ('gravity law', 'vec_toPlanet = vec_toPlanet.newLength( objects[i]->get_Weight()/distance );' in gal),
    ('sum gravity', 'vec_toPlanets = vec_toPlanets+vec_toPlanet;' in gal),
    ('velocity update', 'direction += vec_toPlanets;' in gal),
    ('position update', 'position += direction.newLength( direction.getLength() * SHOOT_INTERVAL / 1000 );' in gal),
]
for name,ok in checks:
    print(('OK   ' if ok else 'FAIL ')+name)
if not all(ok for _,ok in checks): sys.exit(1)
start=gal.index('void Galaxy::calculate_nextPos')
end=gal.index('\nbool Galaxy::animate()',start)
chunk=gal[start:end].encode()
print('calculate_nextPos_sha256='+hashlib.sha256(chunk).hexdigest())
print('vector_2.cpp_sha256='+hashlib.sha256((ROOT/'reference/HighMoon/src/vector_2.cpp').read_bytes()).hexdigest())
