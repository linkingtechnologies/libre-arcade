/*
 * $Id: board.c,v 1.1.1.1 2001/11/03 02:48:59 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * Handle score boards.
 *
 * @version $Revision: 1.1.1.1 $
 */
#include "SDL.h"
#include <stdlib.h>

#include "wok.h"
#include "screen.h"
#include "board.h"

#define BOARD_MAX 6

static Board board[BOARD_MAX];

void initBoards() {
  int i;
  for ( i=0 ; i<BOARD_MAX ; i++ ) {
    board[i].cnt = 0;
  }
}

static int boardIdx = BOARD_MAX;

void addBoard(float x, float y, float mx, float my, 
	      int sc, int mp, int cnt) {
  boardIdx--; if ( boardIdx < 0 ) boardIdx = BOARD_MAX-1;
  board[boardIdx].x = x; board[boardIdx].y = y;
  board[boardIdx].mx = mx; board[boardIdx].my = my;
  board[boardIdx].sc = sc; board[boardIdx].mp = mp;
  board[boardIdx].cnt = cnt;
  board[boardIdx].apCnt = 0;
}

void moveBoards() {
  int i;
  Board *bd;
  for ( i=0 ; i<BOARD_MAX ; i++ ) {
    if ( board[i].cnt <= 0 ) continue;
    bd = &(board[i]);
    bd->x += bd->mx; bd->y += bd->my; 
    if ( bd->cnt == 1 ) {
      bd->apCnt -= 2;
      if ( bd->apCnt <= 0 ) bd->cnt = 0;
    } else {
      if ( bd->apCnt >= 16 ) {
	bd->cnt--;
      } else {
	bd->apCnt++;
      }
    }
  }
}

void drawBoards() {
  int i, x, pc;
  Board *bd;
  for ( i=0 ; i<BOARD_MAX ; i++ ) {
    if ( board[i].cnt <= 0 ) continue;
    bd = &(board[i]);
    if ( bd->apCnt >= 16 ) {
      x = drawNum(bd->sc, bd->x, bd->y);
      drawSprite(NUM_SPRITE_IDX+10, x, bd->y); x += 50;
      drawNum(bd->mp, x, bd->y);
    } else {
      pc = bd->apCnt/2;
      x = drawNumPaper(1, bd->x, bd->y, pc);
      pc--; if ( pc < 0 ) pc = 0;
      x = drawNumPaper(1, x, bd->y, pc);
      pc--; if ( pc < 0 ) pc = 0;
      drawNumPaper(bd->mp, x, bd->y, pc);
    }
  }
}
