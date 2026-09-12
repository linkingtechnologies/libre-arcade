/*
 * $Id: ball.c,v 1.3 2001/11/03 05:45:19 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * Handle balls.
 *
 * @version $Revision: 1.3 $
 */
#include "SDL.h"
#include <math.h>
#include <stdlib.h>

#include "wok.h"
#include "screen.h"
#include "sound.h"
#include "ball.h"
#include "pan.h"
#include "board.h"
#include "vector.h"

#define BALL_MAX 96

static Ball ball[BALL_MAX];
static int scoreMulti, smFib, smTime;

void initBalls() {
  int i;
  for ( i=0 ; i<BALL_MAX ; i++ ) {
    ball[i].color = -1;
  }
  scoreMulti = smFib = 1;
  smTime = 0;
}

static int ballIdx = BALL_MAX;

static const float radSize[] = {
  7.0f, 10.0f, 15.0f
};

void addBall(int color, int size, float x, float y, float mx, float my) {
  int i;
  for ( i=0 ; i<BALL_MAX ; i++ ) {
    ballIdx--; if ( ballIdx < 0 ) ballIdx = BALL_MAX-1;
    if ( ball[ballIdx].color == -1 ) break;
  }
  if ( i == BALL_MAX ) return;
  ball[ballIdx].color = color;
  ball[ballIdx].size = size;
  ball[ballIdx].sprPtn = (2-color)*3 + size;
  ball[ballIdx].radius = radSize[size];
  ball[ballIdx].pos.x = x; ball[ballIdx].pos.y = y;
  ball[ballIdx].vel.x = mx; ball[ballIdx].vel.y = my;
}

// Detect the collision of balls.
static void checkBallHit(Ball *ball1, Ball *ball2) {
  float l;
  Vector ft;
  Vector ofs;
  Vector *vel;
  int i;
  ofs.x = ball1->pos.x - ball2->pos.x;
  ofs.y = ball1->pos.y - ball2->pos.y;
  l = ofs.x*ofs.x+ofs.y*ofs.y;
  if ( l <= (ball1->radius+ball2->radius)*(ball1->radius+ball2->radius) ) {
    float cs;
    Vector csft1, csft2;
    vel = &(ball1->vel);
    csft1 = vctGetElement(vel, &ofs);
    vctSub(vel, &csft1);
    vel = &(ball2->vel);
    csft2 = vctGetElement(vel, &ofs);
    vctSub(vel, &csft2);

    vctMul(&csft1, ball1->radius*0.8f/ball2->radius);
    vctMul(&csft2, ball2->radius*0.8f/ball1->radius);

    vctAdd(&(ball2->vel), &csft1);
    vctAdd(&(ball1->vel), &csft2);

    vctMul(&ofs, (ball1->radius+ball2->radius)/sqrt(l)/2);
    vctAdd(&(ball1->pos), &(ball2->pos));
    vctMul(&(ball1->pos), 0.5f);
    ball2->pos = ball1->pos;
    vctSub(&(ball2->pos), &ofs);
    vctAdd(&(ball1->pos), &ofs);
  }
}

// Detect the collision of the pan.
static void checkPanHit(Ball *bl, PanPos *now, PanPos *prv, int bs) {
  Vector vc1, vc2, vc3, vc4;
  switch ( bs ) {
  case 0:
    if ( now->p1.y < prv->p3.y ) {
      vc1 = now->p1; vc3 = prv->p3;
    } else {
      vc3 = now->p1; vc1 = prv->p3;
    }
    if ( now->p2.y < prv->p4.y ) {
      vc2 = now->p2; vc4 = prv->p4;
    } else {
      vc4 = now->p2; vc2 = prv->p4;
    }
    break;
  case 1:
    if ( now->p1.x > prv->p3.x ) {
      vc1 = now->p1; vc3 = prv->p3;
    } else {
      vc3 = now->p1; vc1 = prv->p3;
    }
    if ( now->p2.x > prv->p4.x ) {
      vc2 = now->p2; vc4 = prv->p4;
    } else {
      vc4 = now->p2; vc2 = prv->p4;
    }
    break;
  case 2:
    if ( now->p1.x < prv->p3.x ) {
      vc1 = now->p1; vc3 = prv->p3;
    } else {
      vc3 = now->p1; vc1 = prv->p3;
    }
    if ( now->p2.x < prv->p4.x ) {
      vc2 = now->p2; vc4 = prv->p4;
    } else {
      vc4 = now->p2; vc2 = prv->p4;
    }
    break;
  }
  if ( vctCheckSide(&(bl->pos), &(now->p1), &(now->p2)) <= 0 && 
       (vctCheckSide(&(bl->pos), &(prv->p3), &(prv->p4)) >= 0 ||
	vctCheckSide(&(bl->pos), &(now->p3), &(now->p4)) >= 0) &&
       vctCheckSide(&(bl->pos), &vc2, &vc4) <= 0 && 
       vctCheckSide(&(bl->pos), &vc1, &vc3) >= 0 ) {
    Vector ofs, o1, o2, po1, po2, rv;
    float l1, l2;
    ofs = bl->pos; vctSub(&ofs, &(prv->p1));
    po1 = vctGetElement(&ofs, &(prv->v1)); l1 = vctSize(&po1);
    if ( l1 > now->v1l ) return;
    po2 = vctGetElement(&ofs, &(prv->v2)); l2 = vctSize(&po2);
    if ( l2 > now->v2l ) return;
    bl->pos = now->p1;
    o1 = now->v1;
    vctMul(&o1, l1/now->v1l);
    vctAdd(&(bl->pos), &o1);
    o2 = now->v2;
    if ( ofs.y < 0 ) {
      vctMul(&o2, l2/now->v2l);
      vctAdd(&(bl->pos), &o2);
    }
    
    // add velocity by reflect
    rv = vctGetElement(&(bl->vel), &(now->v2));
    vctMul(&rv, 1.2f);
    vctSub(&(bl->vel), &rv);

    // add velocity by pan moving
    rv = pan.vel;
    vctMul(&rv, -2/(bl->radius*0.5f));
    if ( rv.y > 0 ) rv.y = 0;
    rv.x *= 0.5f;
    vctAdd(&(bl->vel), &rv);
  }      
}

#define MULTI_MAX 9999

static void addBallScore(Ball *bl) {
  int nsmf;
  int bs = (bl->size+3);
  int smLgt = 1, sm;
  addScore(bs*scoreMulti);
  sm = scoreMulti;
  while ( sm > 0 ) {
    sm /= 10;
    smLgt++;
  }
  addBoard(bl->pos.x-smLgt*52, bl->pos.y, 
	   -randN(10)*0.1f-0.1f, -randN(20)*0.1f,
	   bs, scoreMulti, (scoreMulti/100)+randN(10)+10);
  nsmf = scoreMulti; 
  scoreMulti += smFib*0.5f+1;
  if ( scoreMulti > MULTI_MAX ) {
    scoreMulti = MULTI_MAX;
  }
  smFib = nsmf;
  smTime = 20;
}

// A ball movement.

static const float gravityBase[] = {
  0.004f, 0.008f, 0.012f
};
static float gravity[3];

static float missX;

void moveBalls() {
  int i, j;
  Ball* bl;
  
  // change the gravity according to the game rank
  for ( i=0 ; i<3 ; i++ ) {
    gravity[i] = gravityBase[i]*rank/RANK_BASE;
  }

  for ( i=0 ; i<BALL_MAX ; i++ ) {
    if ( ball[i].color == -1 ) continue;
    bl = &(ball[i]);
    bl->vel.y += gravity[bl->color];
    bl->pos.x += bl->vel.x;
    bl->pos.y += bl->vel.y;
    for ( j=i+1 ; j<BALL_MAX ; j++ ) {
      if ( ball[j].color == -1 ) continue;
      checkBallHit(bl, &ball[j]);
    }
    if ( status == MISS ) {
      bl->vel.x += (bl->pos.x-missX)*0.003f;
      bl->vel.y -= 0.3f;
    } else if ( status == IN_GAME ) {
      checkPanHit(bl, &now1, &prv1, 0);
      checkPanHit(bl, &now2, &prv2, 1);
      checkPanHit(bl, &now3, &prv3, 2);
    }

    if ( bl->pos.y < 0 ) {
      bl->vel.x *= 0.99f; bl->vel.y *= 0.99f;
      if ( bl->pos.y < -SCREEN_HEIGHT ) {
	bl->pos.y = -SCREEN_HEIGHT;
	bl->vel.y = 0;
      }
    }
    if ( bl->pos.x < 0 && status == IN_GAME ) {
      bl->vel.x *= -0.8f;
      bl->pos.x = 0;
    }

    // check the right thrown ball
    if ( bl->pos.x > SCREEN_WIDTH*0.9f ) {
      if ( bl->pos.y < 0 ) {
	bl->vel.x *= -0.8f;
	bl->pos.x = SCREEN_WIDTH*0.9f;
      } else {
	if ( status == IN_GAME ) {
	  addBallScore(bl);
	}
	bl->color = -1;
      }
    }
    // check the dropped ball
    if ( status == IN_GAME ) {
      if ( bl->pos.y > SCREEN_HEIGHT*0.75f ) {
	if ( bl->vel.y > 2 ) bl->vel.y *= 0.8f;
	bl->vel.x *= 0.99f; bl->vel.y *= 0.95f;
	if ( bl->pos.y > SCREEN_HEIGHT ) {
	  status = MISS;
	  missX = bl->pos.x;
	  stopMusic();
	  playChunk(2);
	  for ( j=0 ; j<32 ; j++ ) {
	    addBall(0, 0, bl->pos.x+randNS(32), bl->pos.y-randN(32), 
		    randNS(32)*0.1f, randNS(32)*0.1f);
	  }
	}
      }
    } else if ( bl->pos.y > SCREEN_HEIGHT ) {
      bl->color = -1;
    }
  }

  // score multiplier
  if ( smTime > 0 ) {
    smTime--;
    if ( smTime <= 0 ) {
      scoreMulti = smFib = 1;
    }
  }
}

static int lastSm = 0, smy = SCREEN_HEIGHT;

void drawBalls() {
  int i;
  int x;

  // draw score multiplier
  if ( smFib > 1 ) {
    smy = SCREEN_HEIGHT-72;
    drawSprite(NUM_SPRITE_IDX+10, 0, smy);
    drawNum(smFib, 52, smy);
    lastSm = smFib;
  } else {
    if ( smy < SCREEN_HEIGHT ) {
      smy++;
      drawSprite(NUM_SPRITE_IDX+10, 0, smy);
      drawNum(lastSm, 52, smy);
    }
  }

  // draw balls
  for ( i=0 ; i<BALL_MAX ; i++ ) {
    if ( ball[i].color == -1 ) continue;
    drawSprite(ball[i].sprPtn, ball[i].pos.x, ball[i].pos.y);
  }
}
