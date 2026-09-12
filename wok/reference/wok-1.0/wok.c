/*
 * $Id: wok.c,v 1.4 2001/11/10 03:07:06 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * Wok main routine.
 *
 * @version $Revision: 1.4 $
 */
#include "SDL.h"
#include <stdlib.h>
#include <stdio.h>

#include "wok.h"
#include "screen.h"
#include "sound.h"
#include "ball.h"
#include "pan.h"
#include "board.h"

int rank;
int score, hiScore;

static int noSound = 0;

#define WOK_PREF_FILE "wok.prf"
#define DEFAULT_HI_SCORE 1000000

// Initialize and load preference.
static void initWok() {
  FILE *fp;
  if ( NULL == (fp = fopen(WOK_PREF_FILE,"rb")) ) {
    hiScore = DEFAULT_HI_SCORE;
    return;
  }
  hiScore = getw(fp);
  fclose(fp);
  srand(SDL_GetTicks());
}

// Quit and save preference.
void quitWok() {
  FILE *fp;
  if ( !noSound ) closeSound();
  closeSDL();
  SDL_Quit();
  if ( NULL == (fp = fopen(WOK_PREF_FILE,"wb")) ) exit(1);
  putw(hiScore, fp);
  fclose(fp);
  exit(1);
}

static int aimScore;
static int musicChangeScore;
static int ballCnt, generatorCnt;

int status;
static int missCnt;

#define MUSIC_CHANGE_SCORE 1000000

void initGame() {
  initBalls();
  initPan();
  initBoards();
  initGenerators();

  status = IN_GAME;
  score = aimScore = 0; 
  musicChangeScore = MUSIC_CHANGE_SCORE;
  rank = RANK_BASE;
  ballCnt = 16; generatorCnt = 0;
  missCnt = 0;

  playMusic(0);
}

// Score handling.

#define SCORE_MAX 999999999

void addScore(int as) {
  aimScore += as;
  if ( aimScore > SCORE_MAX ) aimScore = SCORE_MAX;
  if ( aimScore > musicChangeScore ) {
    nextMusic();
    while ( aimScore > musicChangeScore ) {
      musicChangeScore += MUSIC_CHANGE_SCORE;
    }
  }
}

static void moveScore() {
  if ( score < aimScore ) {
    score++;
    score += (aimScore-score)*0.05f;
    playChunk(1);
  }
}

// Add balls and ball generators.

static int generatorCntSub[6] = {
  4800, 5600, 6400, 6000, 6500, 7200,
};

static void addBalls() {
  if ( ballCnt <= 0 ) {
    addBall(randN(3), randN(3),
	    randN(SCREEN_WIDTH/2), -randN(16)-32,
	    randNS(8)*0.1f, randN(10)*0.1f);
    ballCnt = RANK_BASE*48/rank;
  }
  ballCnt--;

  generatorCnt += (rank/(RANK_BASE/5));
  if ( randN(generatorCnt) > 7200 ) {
    int spc = randN(6);
    addGenerator(spc);
    generatorCnt -= generatorCntSub[spc];
  }
}

static void move() {
  switch ( status ) {
  case TITLE:
    rank = RANK_BASE; generatorCnt = 0;
    addBalls();
    moveBalls();
    moveTitle();
    break;
  case IN_GAME:
    addBalls();
    moveBoards();
    moveBalls();
    movePan();
    moveGenerators();
    moveScore();
    break;
  case MISS:
    moveBalls();
    moveScore();
    missCnt++; 
    if ( missCnt > 120 ) {
      score = aimScore;
      if ( score > hiScore ) hiScore = score;
      initOver();
    }
    break;
  case GAMEOVER:
    moveOver();
    break;
  }
}

static void draw() {
  switch ( status ) {
  case TITLE:
    drawBalls();
    drawTitle();
    break;
  case IN_GAME:
    drawThrownZone();
    drawBoards();
    drawPan();
    drawNum(score, 0, 0);
    drawBalls();
    drawGenerators();
    break;
  case MISS:
    drawThrownZone();
    drawNum(score, 0, 0);
    drawBalls();
    break;
  case GAMEOVER:
    drawOver();
    break;
  }
}

static void usage(char *argv0) {
  fprintf(stderr, "Usage: %s [-nosound] [-mousespeed num] [-window]\n", argv0);
}

static void parseArgs(int argc, char *argv[]) {
  int i;
  for ( i=1 ; i<argc ; i++ ) {
    if ( (strcmp(argv[i], "-mousespeed") == 0) && argv[i+1] ) {
      i++;
      mouseAccel = (float)atoi(argv[i]) / 10;
      if ( mouseAccel <= 0 || mouseAccel >= 10 ) {
	mouseAccel = DEFAULT_MOUSE_ACCEL;
      }
    } else if ( strcmp(argv[i], "-nosound") == 0 ) {
      noSound = 1;
    } else if ( strcmp(argv[i], "-window") == 0 ) {
      windowMode = 1;
    } else {
      usage(argv[0]);
      exit(1);
    }
  }
  if ( !windowMode ) mouseAccel *= MOUSE_ACCEL_IN_FULL_SCREEN;
}

#define INTERVAL 10

int cnt = 0;

int main(int argc, char *argv[]) {
  int done = 0;
  long prvTickCount = 0;
  int i;

  parseArgs(argc, argv);

  initSDL(windowMode);
  if ( !noSound ) initSound();
  initWok();
  initTitle();

  while ( !done ) {
    long nowTick = SDL_GetTicks();
    int frame = (int)(nowTick-prvTickCount) / INTERVAL;
    if ( frame <= 0 ) {
      frame = 1;
      SDL_Delay(prvTickCount+INTERVAL-nowTick);
      prvTickCount += INTERVAL;
    } else if ( frame > 5 ) {
      frame = 5;
      prvTickCount = nowTick;
    } else {
      prvTickCount += frame*INTERVAL;
    }
    for ( i=0 ; i<frame ; i++ ) {
      move();
    }
    clearScreen();
    draw();
    flipScreen();
    checkMusic();
    rank++;

    { SDL_Event event;
      while ( SDL_PollEvent(&event) ) {
	switch ( event.type ) {
	case SDL_QUIT:
          done = 1;
	  break;
	case SDL_KEYDOWN:
          if ( event.key.keysym.sym == SDLK_ESCAPE ) {
	    if ( status == TITLE ) done = 1;
	    else initTitle();
          }
	  break;
	}
      }
    }
  }
  quitWok();
}
