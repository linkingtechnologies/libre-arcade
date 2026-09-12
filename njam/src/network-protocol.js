/*
 * Njam 1.21 SDL_net wire protocol, preserved independently of transport.
 * New web-port code: GPL-3.0-or-later.
 * Reference: Source/njamnet.cpp and network branches in njamgame.cpp.
 */
import { MAPW, MAPH, MAPSIZE, GHOSTMAX } from './game.js';

export const NJAM_NET_PORT=5547;
export const CID_SIZE=4;
export const MAP_PACKET_SIZE=MAPSIZE; // 28 * 24 = 672
export const CLIENT_PACKET_SIZE=16;
export const HOST_PACKET_SIZE=16+GHOSTMAX*5; // 56

const N='N'.charCodeAt(0), J='J'.charCodeAt(0);
function u8(v){return Number(v)&255;}
function need(bytes,size,label){if(!(bytes instanceof Uint8Array)||bytes.length<size)throw new Error(`${label}: expected at least ${size} bytes`);}

export function encodeCID(localA,localB){
  return Uint8Array.of(N,J,localA?1:0,localB?1:0);
}
export function decodeCID(bytes){
  need(bytes,CID_SIZE,'CID');
  if(bytes[0]!==N)throw new Error('CID: invalid Njam marker');
  return {markerN:bytes[0]===N,markerJ:bytes[1]===J,playing:[!!bytes[2],!!bytes[3]]};
}

function writePlayer(out,offset,p={}){
  out[offset+0]=u8(p.rotate??0);out[offset+1]=u8(p.x??0);out[offset+2]=u8(p.y??0);
  out[offset+3]=u8(p.xo??0);out[offset+4]=u8(p.yo??0);out[offset+5]=u8(2+(p.vx??0));out[offset+6]=u8(2+(p.vy??0));
}
function readPlayer(bytes,offset){
  return {rotate:bytes[offset],x:bytes[offset+1],y:bytes[offset+2],xo:bytes[offset+3],yo:bytes[offset+4],vx:bytes[offset+5]-2,vy:bytes[offset+6]-2};
}

export function encodeHostFrame(players,ghosts,{exit=false}={}){
  const out=new Uint8Array(HOST_PACKET_SIZE);out[0]=N;out[1]=exit?1:0;
  for(let i=0;i<2;i++)writePlayer(out,2+i*7,players?.[i]);
  for(let i=0;i<GHOSTMAX;i++){
    const g=ghosts?.[i]??{},o=16+i*5;
    out[o]=u8(g.x??0);out[o+1]=u8(g.y??0);out[o+2]=u8(g.xo??0);out[o+3]=u8(g.yo??0);out[o+4]=u8(g.delay??0);
  }
  return out;
}
export function decodeHostFrame(bytes){
  need(bytes,HOST_PACKET_SIZE,'host frame');if(bytes[0]!==N)throw new Error('host frame: invalid Njam marker');
  const ghosts=[];for(let i=0;i<GHOSTMAX;i++){const o=16+i*5;ghosts.push({x:bytes[o],y:bytes[o+1],xo:bytes[o+2],yo:bytes[o+3],delay:bytes[o+4]});}
  return {exit:bytes[1]===1,players:[readPlayer(bytes,2),readPlayer(bytes,9)],ghosts};
}

export function encodeClientFrame(players,{exit=false}={}){
  const out=new Uint8Array(CLIENT_PACKET_SIZE);out[0]=N;out[1]=exit?1:0;
  for(let i=0;i<2;i++)writePlayer(out,2+i*7,players?.[i]);
  return out;
}
export function decodeClientFrame(bytes){
  need(bytes,CLIENT_PACKET_SIZE,'client frame');if(bytes[0]!==N)throw new Error('client frame: invalid Njam marker');
  return {exit:bytes[1]===1,players:[readPlayer(bytes,2),readPlayer(bytes,9)]};
}

// The native map packet is a direct byte dump of m_Tiles[MAPS][x][y], therefore x-major.
export function encodeRuntimeMap(rowMajor){
  need(rowMajor,MAPSIZE,'runtime map');const out=new Uint8Array(MAPSIZE);
  for(let x=0;x<MAPW;x++)for(let y=0;y<MAPH;y++)out[x*MAPH+y]=rowMajor[y*MAPW+x];
  return out;
}
export function decodeRuntimeMap(bytes){
  need(bytes,MAP_PACKET_SIZE,'map packet');const out=new Uint8Array(MAPSIZE);
  for(let x=0;x<MAPW;x++)for(let y=0;y<MAPH;y++)out[y*MAPW+x]=bytes[x*MAPH+y];
  return out;
}
