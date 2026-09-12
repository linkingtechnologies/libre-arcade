#!/usr/bin/env python3
"""Generate deterministic parity vectors using CPython's MT19937 random() stream
with Python 2.7 randrange/shuffle semantics.

The game source uses only small randint ranges, so Python 2.7 randrange takes
int(random()*width), and shuffle likewise uses the float stream. Python 3's
Random(seed).random() is identical for integer seeds, making it a convenient
independent oracle when paired with these explicit 2.7 helpers.
"""
import json
import random
from pathlib import Path

W = H = 10
TILES = 6

def randint27(r, a, b):
    return a + int(r.random() * (b - a + 1))

def shuffle27(r, values):
    for i in range(len(values) - 1, 0, -1):
        j = int(r.random() * (i + 1))
        values[i], values[j] = values[j], values[i]

def new_board(r):
    return [[randint27(r, 0, TILES - 1) for _ in range(W)] for _ in range(H)]

def get(board, x, y):
    return board[y][x]

def original_move(board, r):
    def tcx(x, y, tile, case):
        return all(case[j] == (get(board, x+j, y) == tile) for j in range(len(case)))
    def tcxd(x, y, tile, case):
        for j, expected in enumerate(case):
            if expected != (get(board, x+j, y) == tile): return False
            if not expected and get(board, x+j, y+1) != tile: return False
        return True
    def tcxu(x, y, tile, case):
        for j, expected in enumerate(case):
            if expected != (get(board, x+j, y) == tile): return False
            if not expected and get(board, x+j, y-1) != tile: return False
        return True
    def tcy(x, y, tile, case):
        return all(case[j] == (get(board, x, y+j) == tile) for j in range(len(case)))
    def tcyr(x, y, tile, case):
        for j, expected in enumerate(case):
            if expected != (get(board, x, y+j) == tile): return False
            if not expected and get(board, x+1, y+j) != tile: return False
        return True
    def tcyl(x, y, tile, case):
        for j, expected in enumerate(case):
            if expected != (get(board, x, y+j) == tile): return False
            if not expected and get(board, x-1, y+j) != tile: return False
        return True

    moves = []
    combo = False
    for tile in range(TILES):
        for y in range(H):
            for x in range(W-4):
                if tcx(x,y,tile,(1,0,1,1,1)): moves.append([[x,y],[x+1,y]]); combo=True
                if tcx(x,y,tile,(1,1,1,0,1)): moves.append([[x+3,y],[x+4,y]]); combo=True
        for y in range(H):
            for x in range(W-3):
                if tcx(x,y,tile,(1,0,1,1)): moves.append([[x,y],[x+1,y]])
                if tcx(x,y,tile,(1,1,0,1)): moves.append([[x+2,y],[x+3,y]])
        for y in range(1,H):
            for x in range(W-2):
                if tcxu(x,y,tile,(0,1,1)): moves.append([[x,y],[x,y-1]])
                if tcxu(x,y,tile,(1,0,1)): moves.append([[x+1,y],[x+1,y-1]])
                if tcxu(x,y,tile,(1,1,0)): moves.append([[x+2,y],[x+2,y-1]])
        for y in range(H-1):
            for x in range(W-2):
                if tcxd(x,y,tile,(0,1,1)): moves.append([[x,y],[x,y+1]])
                if tcxd(x,y,tile,(1,0,1)): moves.append([[x+1,y],[x+1,y+1]])
                if tcxd(x,y,tile,(1,1,0)): moves.append([[x+2,y],[x+2,y+1]])
        for x in range(W):
            for y in range(H-4):
                if tcy(x,y,tile,(1,0,1,1,1)): moves.append([[x,y],[x,y+1]]); combo=True
                if tcy(x,y,tile,(1,1,1,0,1)): moves.append([[x,y+3],[x,y+4]]); combo=True
        for x in range(W):
            for y in range(H-3):
                if tcy(x,y,tile,(1,0,1,1)): moves.append([[x,y],[x,y+1]])
                if tcy(x,y,tile,(1,1,0,1)): moves.append([[x,y+2],[x,y+3]])
        for x in range(W-1):
            for y in range(H-2):
                if tcyr(x,y,tile,(0,1,1)): moves.append([[x,y],[x+1,y]])
                if tcyr(x,y,tile,(1,0,1)): moves.append([[x,y+1],[x+1,y+1]])
                if tcyr(x,y,tile,(1,1,0)): moves.append([[x,y+2],[x+1,y+2]])
        for x in range(1,W):
            for y in range(H-2):
                if tcyl(x,y,tile,(0,1,1)): moves.append([[x,y],[x-1,y]])
                if tcyl(x,y,tile,(1,0,1)): moves.append([[x,y+1],[x-1,y+1]])
                if tcyl(x,y,tile,(1,1,0)): moves.append([[x,y+2],[x-1,y+2]])
        if tile in (0,1) and moves: break
        if combo and moves: break
    if not moves: return []
    shuffle27(r, moves)
    return moves[0]

def gravity_fill(board, r):
    # Reproduce the final state of the upstream repeated-swap gravity loop.
    for x in range(W):
        kept = [board[y][x] for y in range(H-1,-1,-1) if board[y][x] is not None]
        y = H-1
        for tile in kept:
            board[y][x] = tile; y -= 1
        while y >= 0:
            board[y][x] = None; y -= 1
    for y in range(H):
        for x in range(W):
            if board[y][x] is None:
                board[y][x] = randint27(r,0,TILES-1)
    return board

def can_use(p, asset):
    costs=(10,30,20,10,5)
    return p['score'][asset+1] > 0 and p['score'][0] >= costs[asset]

def choose_asset(current, enemy, r):
    if current['shield'] < 45 and can_use(current,0): return 0
    asset = None
    if current['score'][0] > 90 or enemy['shield'] < 25:
        possible=[0]
        if can_use(current,4): possible.extend([4]*4)
        if can_use(current,3): possible.extend([3]*3)
        if can_use(current,2): possible.extend([2]*2)
        if can_use(current,1): possible.append(1)
        while True:
            shuffle27(r, possible)
            if possible[0] == 0: break
            if can_use(current,possible[0]): asset=possible[0]; break
    else:
        possible=[0,0,0,0]
        if can_use(current,4): possible.extend([4]*3)
        if can_use(current,3): possible.extend([3]*2)
        shuffle27(r,possible)
        if possible[0] > 0 and can_use(current,possible[0]): asset=possible[0]
    return asset

def attack_rolls(r):
    ranges={1:(15,15),2:(10,15),3:(10,5),4:(5,5)}
    out=[]
    for asset in (1,2,3,4):
        base, span=ranges[asset]
        out.append({'asset':asset,'damage':base+randint27(r,0,span),'jitter':randint27(r,-10,10)})
    return out

def player(shield, score): return {'shield':shield,'score':score}

vectors={}
for seed in (0,1,2,7,42,123,999,65535,4294967295):
    r=random.Random(seed)
    board=new_board(r)
    move=original_move(board,r)
    vectors[str(seed)]={'board':board,'move':move}

# Independent gravity vectors start from fresh streams.
gravity={}
for seed in (3,17,123,2048):
    r=random.Random(seed); board=new_board(r)
    for x,y in ((0,9),(0,7),(4,4),(9,0),(9,1)): board[y][x]=None
    gravity[str(seed)] = gravity_fill(board,r)

asset_cases=[]
scenarios=[
    ('repair', player(44,[10,1,0,0,0,0]), player(100,[0]*6)),
    ('normal', player(80,[40,0,0,0,1,2]), player(80,[0]*6)),
    ('aggressive', player(80,[100,1,1,1,1,1]), player(20,[0]*6)),
]
for seed in (5,19,123,777):
    for name,cur,enemy in scenarios:
        r=random.Random(seed)
        asset_cases.append({'seed':seed,'scenario':name,'asset':choose_asset(cur,enemy,r)})

roll_vectors={}
for seed in (1,123,98765):
    roll_vectors[str(seed)] = attack_rolls(random.Random(seed))

out={'initial_and_ai':vectors,'gravity':gravity,'asset_choice':asset_cases,'attack_rolls':roll_vectors}
Path('test/fixtures/python27-oracle.json').write_text(json.dumps(out, indent=2, sort_keys=True)+'\n')
