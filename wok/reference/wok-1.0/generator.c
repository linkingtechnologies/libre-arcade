/*
 * $Id: generator.c,v 1.1.1.1 2001/11/03 02:48:59 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * Ball generators.
 *
 * @version $Revision: 1.1.1.1 $
 */
#include "SDL.h"
#include <stdlib.h>

#include "wok.h"
#include "screen.h"
#include "sound.h"
#include "generator.h"
#include "ball.h"

#define GENERATOR_MAX 4

static Generator generator[GENERATOR_MAX];

#define FIRE 0
#define VOLCANO 1
#define TREE 2
#define BUCKET 3
#define CLOUD 4
#define WATER_TAP 5

void initGenerators() {
  int i;
  for ( i=0 ; i<GENERATOR_MAX ; i++ ) {
    generator[i].cnt = 0;
  }
}

static int generatorIdx = GENERATOR_MAX;

static int getNextGeneratorIdx() {
  int i;
  for ( i=0 ; i<GENERATOR_MAX ; i++ ) {
    generatorIdx--; 
    if ( generatorIdx < 0 ) generatorIdx = GENERATOR_MAX-1;
    if ( generator[generatorIdx].cnt == 0 ) break;
  }
  if ( i == GENERATOR_MAX ) return 0;
  return 1;
}

void addGenerator(int spc) {
  int i;
  if ( !getNextGeneratorIdx() ) return;

  //playChunk(5);

  generator[generatorIdx].spc = spc;
  switch ( spc ) {
  case FIRE:
    generator[generatorIdx].x = randN(SCREEN_WIDTH/3)+SCREEN_WIDTH/6;
    generator[generatorIdx].y = randN(SCREEN_HEIGHT/2)+SCREEN_HEIGHT/4; 
    generator[generatorIdx].apCnt = 0;
    generator[generatorIdx].cnt = randN(120)+120;
    break;
  case VOLCANO:
    generator[generatorIdx].x = randN(SCREEN_WIDTH/4)+SCREEN_WIDTH/5;
    generator[generatorIdx].y = randN(SCREEN_HEIGHT/4)+SCREEN_HEIGHT/2; 
    generator[generatorIdx].apCnt = 0;
    generator[generatorIdx].cnt = randN(150)+200;
    break;
  case TREE:
    for ( i=0 ; i<3 ; i++ ) {
      generator[generatorIdx].spc = spc;
      generator[generatorIdx].x = randN(SCREEN_WIDTH/2)+SCREEN_WIDTH/5;
      generator[generatorIdx].y = randN(SCREEN_HEIGHT/5)+SCREEN_HEIGHT/5; 
      generator[generatorIdx].apCnt = -randN(40)*i;
      generator[generatorIdx].cnt = randN(100)+100;
      if ( !getNextGeneratorIdx() ) return;
    }
    break;
  case BUCKET:
    generator[generatorIdx].x = randN(SCREEN_WIDTH/3)+SCREEN_WIDTH/2;
    generator[generatorIdx].y = 0;
    generator[generatorIdx].apCnt = 0;
    generator[generatorIdx].cnt = randN(50)+200;
    break;
  case CLOUD:
    for ( i=0 ; i<2 ; i++ ) {
      generator[generatorIdx].spc = spc;
      generator[generatorIdx].x = randN(SCREEN_WIDTH/2)+SCREEN_WIDTH/5;
      generator[generatorIdx].y = randN(SCREEN_HEIGHT/4);
      generator[generatorIdx].apCnt = 0;
      generator[generatorIdx].cnt = randN(200)+50;
      if ( !getNextGeneratorIdx() ) return;
    }
    break;
  case WATER_TAP:
    generator[generatorIdx].x = 0;
    generator[generatorIdx].y = randN(SCREEN_HEIGHT/4);
    generator[generatorIdx].apCnt = 0;
    generator[generatorIdx].cnt = randN(250)+100;
    break;
  }
}

void moveGenerators() {
  int i;
  Generator *gn;
  for ( i=0 ; i<GENERATOR_MAX ; i++ ) {
    if ( generator[i].cnt <= 0 ) continue;

    playChunk(0);

    gn = &(generator[i]);
    switch ( gn->spc ) {
    case FIRE:
      if ( randN(20) == 0 ) {
	addBall(0, randN(2), gn->x+48, gn->y, 
		randNS(10)*0.2f, -randN(10)*0.3f-0.3f);
      }
      break;
    case VOLCANO:
      if ( randN(18) == 0 ) {
	addBall(0, randN(3), gn->x+48+randNS(92), gn->y-randNS(48), 
		randNS(10)*0.1f, -randN(10)*0.5f-2);
      }
      break;
    case TREE:
      if ( randN(32) == 0 ) {
	addBall(1, 2, gn->x+48+randNS(128), gn->y+48,
		randNS(30)*0.1f, 1);
      }
      break;
    case BUCKET:
      if ( randN(16) == 0 ) {
	addBall(1, randN(2), gn->x-randN(32), gn->y+80,
		-randNS(30)*0.1f-4, 0);
      }
      break;
    case CLOUD:
      if ( randN(18) == 0 ) {
	addBall(2, randN(3), gn->x+48+randNS(160), gn->y+48, 
		randNS(20)*0.1f, randN(10)*0.3f+1);
      }
      break;
    case WATER_TAP:
      if ( randN(12) == 0 ) {
	addBall(2, 0, gn->x+96, gn->y+90, 
		randNS(30)*0.1f, randN(10)*0.2f+3);
      }
      break;
    }

    if ( gn->cnt == 1 ) {
      gn->apCnt--;
      if ( gn->apCnt <= 0 ) gn->cnt = 0;
    } else {
      if ( gn->apCnt >= 16 ) {
	gn->cnt--;
      } else {
	gn->apCnt++;
      }
    }
  }
}

void drawGenerators() {
  int i;
  Generator *gn;
  for ( i=0 ; i<GENERATOR_MAX ; i++ ) {
    if ( generator[i].cnt <= 0 ) continue;
    gn = &(generator[i]);
    if ( gn->apCnt >= 16 ) {
      drawSprite(GEN_SPRITE_IDX+gn->spc, gn->x+randN(5)-2, gn->y+randN(5)-2);
    } else {
      if ( gn->apCnt >= 0 ) {
	//drawSprite(gn->apCnt/2 + PPL_SPRITE_IDX, 
	//gn->x+randN(9)-4, gn->y+randN(9)-4);
	drawSprite(gn->apCnt/4 + PPL_SPRITE_IDX, 
		   gn->x+randN(9)-4, gn->y+randN(9)-4);
      }
    }
  }
}
