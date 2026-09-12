/*
 * $Id: board.h,v 1.1.1.1 2001/11/03 02:48:59 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * Score board data.
 *
 * @version $Revision: 1.1.1.1 $
 */

typedef struct {
  float x, y, mx, my;
  int sc, mp;
  int cnt, apCnt;
} Board;

void initBoards();
void addBoard(float x, float y, float mx, float my, 
	      int sc, int mp, int cnt);
void moveBoards();
void drawBoards();
