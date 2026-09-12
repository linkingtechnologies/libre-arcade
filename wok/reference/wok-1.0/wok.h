/*
 * $Id: wok.h,v 1.1.1.1 2001/11/03 02:48:59 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * Wok header file.
 *
 * @version $Revision: 1.1.1.1 $
 */
#define randN(N) (rand()%(N))
#define randNS(N) (rand()&1 ? (rand()%(N)) : -(rand()%(N)))

#define RANK_BASE 20000

extern int rank;
extern int score, hiScore;

extern int status;

#define TITLE 0
#define IN_GAME 1
#define MISS 2
#define GAMEOVER 3

void quitWok();
void initGame();
void addScore(int as);
