#!/usr/bin/env python3
"""Independent NumPy/HDF5 inference oracle for the preserved Keras model."""
import json, sys
from pathlib import Path
import h5py
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
H5=ROOT/'reference/zeta36-connect4-alpha-zero/original/data/model/model_best_weight.h5'
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'test/zeta36-oracle.json'
f=h5py.File(H5,'r')
def get(n):return np.asarray(f[n],dtype=np.float32)
def conv(x,n,size=3):
 k=get(f'conv2d_{n}/conv2d_{n}_4/kernel:0');b=get(f'conv2d_{n}/conv2d_{n}_4/bias:0');pad=size//2;xp=np.pad(x,((0,0),(pad,pad),(pad,pad)));o=np.empty((k.shape[3],6,7),np.float32)
 for y in range(6):
  for z in range(7):o[:,y,z]=np.tensordot(xp[:,y:y+size,z:z+size],k,axes=([0,1,2],[2,0,1]))+b
 return o
def bn(x,n):
 p=f'batch_normalization_{n}/batch_normalization_{n}_4/';g=get(p+'gamma:0');b=get(p+'beta:0');m=get(p+'moving_mean:0');v=get(p+'moving_variance:0');return g[:,None,None]*(x-m[:,None,None])/np.sqrt(v[:,None,None]+np.float32(.001))+b[:,None,None]
def relu(x):return np.maximum(x,0)
def dense(x,name):return x@get(f'{name}/{name}_4/kernel:0')+get(f'{name}/{name}_4/bias:0')
def predict(board,player):
 x=np.zeros((2,6,7),np.float32)
 for y in range(6):
  for c in range(7):
   v=board[c][5-y]
   if v==player:x[0,y,c]=1
   elif v:x[1,y,c]=1
 x=relu(bn(conv(x,1),1))
 for a,b in ((2,3),(4,5)):x=relu(x+bn(conv(relu(bn(conv(x,a),a)),b),b))
 p=relu(bn(conv(x,6,1),6)).reshape(-1);p=dense(p,'policy_out');p=np.exp(p-np.max(p));p=p/np.sum(p)
 v=relu(bn(conv(x,7,1),7)).reshape(-1);v=relu(dense(v,'dense_1'));v=np.tanh(dense(v,'value_out'))[0]
 return {'policy':[float(q) for q in p],'value':float(v)}
def position(seq):
 b=[[0]*6 for _ in range(7)];p=1
 for c in seq:
  for y in range(5,-1,-1):
   if b[c][y]==0:b[c][y]=p;break
  p=3-p
 return b,p
seqs=[[],[3],[3,2],[3,3,2,2,1,1]]
OUT.write_text(json.dumps([{'moves':s,**predict(*position(s))} for s in seqs],indent=2)+'\n',encoding='utf-8',newline='\n')
f.close()
