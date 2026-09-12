/*
 * $Id: pan.c,v 1.2 2001/11/03 03:45:26 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * Handle wok(pan).
 *
 * @version $Revision: 1.2 $
 */
#include "SDL.h"
#include <math.h>
#include <stdlib.h>

#include "wok.h"
#include "screen.h"
#include "pan.h"
#include "ball.h"
#include "vector.h"

Pan pan;
PanPos now1, now2, now3;
PanPos prv1, prv2, prv3;

void initPan() {
  pan.prvPos.x = pan.pos.x = 80; 
  pan.prvPos.y = pan.pos.y = 60;
  pan.deg = 0;
}

#define PI 3.1415f

void movePan() {
  int mx, my;
  float ps1, pc1, ps2, pc2, ps3, pc3, ps4, pc4;
  pan.prvPos.x = pan.pos.x; pan.prvPos.y = pan.pos.y;
  getMouseState(&mx, &my);
  pan.pos.x = mx; pan.pos.y = my;
  pan.vel = pan.prvPos;
  vctSub(&(pan.vel), &(pan.pos));
  pan.deg -= pan.vel.x*0.005f; pan.deg *= 0.92f;

  prv1 = now1; prv2 = now2; prv3 = now3;
  ps1 = sin(pan.deg+PI*0.25f); pc1 = cos(pan.deg+PI*0.25f);
  ps2 = sin(pan.deg+PI*0.75f); pc2 = cos(pan.deg+PI*0.75f);
  ps3 = sin(pan.deg+PI*1.25f); pc3 = cos(pan.deg+PI*1.25f);
  ps4 = sin(pan.deg+PI*1.75f); pc4 = cos(pan.deg+PI*1.75f);
  now1.pc1.x = now1.p1.x = now1.p3.x = pan.pos.x + cos(pan.deg+PI)*PAN_WIDTH;
  now1.pc1.y = now1.p1.y = now1.p3.y = pan.pos.y + sin(pan.deg+PI)*PAN_WIDTH;
  now1.pc2.x = now1.p2.x = now1.p4.x = pan.pos.x + cos(pan.deg)*PAN_WIDTH;
  now1.pc2.y = now1.p2.y = now1.p4.y = pan.pos.y + sin(pan.deg)*PAN_WIDTH;
  now1.p1.x += pc3*((PAN_THICK+BALL_RADIUS)*1.4f);
  now1.p1.y += ps3*((PAN_THICK+BALL_RADIUS)*1.4f);
  now1.p2.x += pc4*((PAN_THICK+BALL_RADIUS)*1.4f);
  now1.p2.y += ps4*((PAN_THICK+BALL_RADIUS)*1.4f);
  now1.p3.x += pc2*((PAN_THICK+BALL_RADIUS)*1.4f);
  now1.p3.y += ps2*((PAN_THICK+BALL_RADIUS)*1.4f);
  now1.p4.x += pc1*((PAN_THICK+BALL_RADIUS)*1.4f);
  now1.p4.y += ps1*((PAN_THICK+BALL_RADIUS)*1.4f);
  prv1.v1 = prv1.p2; vctSub(&(prv1.v1), &(prv1.p1));
  prv1.v2 = prv1.p1; vctSub(&(prv1.v2), &(prv1.p3));
  now1.v1 = now1.p2; vctSub(&(now1.v1), &(now1.p1));
  now1.v2 = now1.p1; vctSub(&(now1.v2), &(now1.p3));
  now1.v1l = vctSize(&(now1.v1));
  now1.v2l = vctSize(&(now1.v2));

  now2.pc1.x = now2.p2.x = now2.p4.x = now1.p1.x;
  now2.pc1.y = now2.p2.y = now2.p4.y = now1.p1.y;
  now2.pc2.x = now2.p1.x = now2.p3.x = now2.p2.x + cos(pan.deg+PI*1.5f)*PAN_HEIGHT;
  now2.pc2.y = now2.p1.y = now2.p3.y = now2.p2.y + sin(pan.deg+PI*1.5f)*PAN_HEIGHT;
  now2.p1.x += pc4*((PAN_THICK+BALL_RADIUS)*1.4f);
  now2.p1.y += ps4*((PAN_THICK+BALL_RADIUS)*1.4f);
  now2.p2.x += pc1*((PAN_THICK+BALL_RADIUS)*1.4f);
  now2.p2.y += ps1*((PAN_THICK+BALL_RADIUS)*1.4f);
  now2.p3.x += pc3*((PAN_THICK+BALL_RADIUS)*1.4f);
  now2.p3.y += ps3*((PAN_THICK+BALL_RADIUS)*1.4f);
  now2.p4.x += pc2*((PAN_THICK+BALL_RADIUS)*1.4f);
  now2.p4.y += ps2*((PAN_THICK+BALL_RADIUS)*1.4f);
  prv2.v1 = prv2.p2; vctSub(&(prv2.v1), &(prv2.p1));
  prv2.v2 = prv2.p1; vctSub(&(prv2.v2), &(prv2.p3));
  now2.v1 = now2.p2; vctSub(&(now2.v1), &(now2.p1));
  now2.v2 = now2.p1; vctSub(&(now2.v2), &(now2.p3));
  now2.v1l = vctSize(&(now2.v1));
  now2.v2l = vctSize(&(now2.v2));

  now3.pc1.x = now3.p1.x = now3.p3.x = now1.p2.x;
  now3.pc1.y = now3.p1.y = now3.p3.y = now1.p2.y;
  now3.pc2.x = now3.p2.x = now3.p4.x = now3.p1.x + cos(pan.deg+PI*1.5f)*PAN_HEIGHT;
  now3.pc2.y = now3.p2.y = now3.p4.y = now3.p1.y + sin(pan.deg+PI*1.5f)*PAN_HEIGHT;
  now3.p1.x += pc2*((PAN_THICK+BALL_RADIUS)*1.4f);
  now3.p1.y += ps2*((PAN_THICK+BALL_RADIUS)*1.4f);
  now3.p2.x += pc3*((PAN_THICK+BALL_RADIUS)*1.4f);
  now3.p2.y += ps3*((PAN_THICK+BALL_RADIUS)*1.4f);
  now3.p3.x += pc1*((PAN_THICK+BALL_RADIUS)*1.4f);
  now3.p3.y += ps1*((PAN_THICK+BALL_RADIUS)*1.4f);
  now3.p4.x += pc4*((PAN_THICK+BALL_RADIUS)*1.4f);
  now3.p4.y += ps4*((PAN_THICK+BALL_RADIUS)*1.4f);
  prv3.v1 = prv3.p2; vctSub(&(prv3.v1), &(prv3.p1));
  prv3.v2 = prv3.p1; vctSub(&(prv3.v2), &(prv3.p3));
  now3.v1 = now3.p2; vctSub(&(now3.v1), &(now3.p1));
  now3.v2 = now3.p1; vctSub(&(now3.v2), &(now3.p3));
  now3.v1l = vctSize(&(now3.v1));
  now3.v2l = vctSize(&(now3.v2));
}

void drawPan() {
  int i;
  float x, y, mx, my;

  x = now1.pc1.x; y = now1.pc1.y;
  mx = (now1.pc2.x-x)/5; my = (now1.pc2.y-y)/5;
  x -= mx; y -= my;
  for ( i=0 ; i<8 ; i++, x+=mx, y+=my ) {
    drawSprite(PAN_SPRITE_IDX, x, y);
  }
  x = now2.pc1.x; y = now2.pc1.y;
  mx = (now2.pc2.x-x)*0.7f; my = (now2.pc2.y-y)*0.7f;
  for ( i=0 ; i<3 ; i++, x+=mx, y+=my ) {
    drawSprite(PAN_SPRITE_IDX+1, x, y);
  }
  x = now3.pc1.x; y = now3.pc1.y;
  mx = (now3.pc2.x-x)*0.7f; my = (now3.pc2.y-y)*0.7f;
  for ( i=0 ; i<3 ; i++, x+=mx, y+=my ) {
    drawSprite(PAN_SPRITE_IDX+1, x, y);
  }
}
