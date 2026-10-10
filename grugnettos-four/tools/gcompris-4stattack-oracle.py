#!/usr/bin/env python3
"""Independent Python oracle for the preserved Python-2 random-leaf minimax."""
import json, math, random, sys
W,H=7,6
def board_from_moves(moves):
    board=[[0]*H for _ in range(W)]; player=1
    for col in moves:
        for row in range(H-1,-1,-1):
            if board[col][row]==0: board[col][row]=player; break
        player=3-player
    return board,player
def legal(board): return [c for c in range(W) if board[c][0]==0]
def win(board,p):
    for x in range(W):
      for y in range(H):
       if board[x][y]==p:
        for dx,dy in ((1,0),(0,1),(1,1),(1,-1)):
         if all(0<=x+dx*n<W and 0<=y+dy*n<H and board[x+dx*n][y+dy*n]==p for n in range(4)): return True
    return False
def drop(board,c,p):
    for r in range(H-1,-1,-1):
        if board[c][r]==0: board[c][r]=p; return r
def py2div(a,b): return a//b
def search(board,d,to_move,root,opp,maxd,rng,stats):
    stats[0]+=1
    if win(board,opp): return -10000+d
    if win(board,root): return 10000-d
    moves=legal(board)
    if d>=maxd or not moves: return py2div(int(rng.random()*100)-50,d+1)
    values=[]
    for c in moves:
        r=drop(board,c,to_move); values.append(search(board,d+1,3-to_move,root,opp,maxd,rng,stats));board[c][r]=0
    return (max if to_move==root else min)(values)
def choose(moves,depth,seed):
    board,player=board_from_moves(moves);rng=random.Random(seed);stats=[1];best=-100000;candidates=[];scores=[]
    for c in legal(board):
        r=drop(board,c,player);value=search(board,1,3-player,player,3-player,depth,rng,stats);board[c][r]=0;scores.append([c,value])
        if value>best:best=value;candidates=[c]
        elif value==best:candidates.append(c)
    return {'column':candidates[int(rng.random()*len(candidates))],'value':best,'nodes':stats[0],'candidates':len(candidates),'scores':scores}
request=json.load(sys.stdin)
json.dump([choose(x['moves'],x['depth'],x['seed']) for x in request],sys.stdout,separators=(',',':'))
